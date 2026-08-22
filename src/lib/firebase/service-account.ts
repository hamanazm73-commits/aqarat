import { createSign } from "node:crypto";

/**
 * Read Firestore as the project itself, without firebase-admin.
 *
 * Every route here verifies tokens over Google's REST APIs rather than through
 * firebase-admin, because its auth subpath crashed on Vercel's runtime. That
 * left one thing impossible: reading a document the security rules deny to
 * clients. Which is exactly what `accessLinks` needs — the seller-link
 * documents hold credentials and should not be readable from a browser at all.
 *
 * A service account is the missing piece, and it does not need the SDK. Sign a
 * JWT with the account's private key, trade it at Google's token endpoint for
 * an access token, and call the Firestore REST API with that. Three steps, no
 * dependency, and it runs where the SDK would not.
 *
 * FIREBASE_SERVICE_ACCOUNT holds the JSON that Firebase Console hands out
 * under Project settings → Service accounts → Generate new private key. Mark
 * it Sensitive in Vercel: it is full read and write over the whole project,
 * and rules do not apply to it.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/datastore";

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

function readServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw) as ServiceAccount;
    if (!sa.client_email || !sa.private_key) return null;
    // Pasting JSON into a dashboard turns real newlines into \n. Both shapes
    // arrive in practice, so accept either.
    sa.private_key = sa.private_key.replace(/\\n/g, "\n");
    return sa;
  } catch {
    return null;
  }
}

const b64url = (input: string | Buffer) =>
  Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/**
 * The access token, kept until shortly before it expires.
 *
 * Google issues these for an hour. Minting one costs a round trip and an RSA
 * signature, and a link redemption is not worth either when the last token is
 * still good. Module scope, so it lives as long as the warm instance does.
 */
let cached: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string | null> {
  const now = Date.now();
  // A minute of margin: a token that expires mid-request is a failure that
  // looks like a broken link.
  if (cached && cached.expiresAt - 60_000 > now) return cached.token;

  const sa = readServiceAccount();
  if (!sa) return null;

  const iat = Math.floor(now / 1000);
  const claim = {
    iss: sa.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat,
    exp: iat + 3600,
  };
  const header = { alg: "RS256", typ: "JWT" };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;

  let signature: string;
  try {
    const signer = createSign("RSA-SHA256");
    signer.update(unsigned);
    signature = b64url(signer.sign(sa.private_key));
  } catch {
    // A malformed key: worth failing loudly in the log rather than looking
    // like every link has expired.
    console.error("[service-account] could not sign — check the private key");
    return null;
  }

  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${unsigned}.${signature}`,
      }),
    });
    if (!res.ok) {
      console.error("[service-account] token exchange failed:", res.status);
      return null;
    }
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    cached = {
      token: data.access_token,
      expiresAt: now + (data.expires_in ?? 3600) * 1000,
    };
    return cached.token;
  } catch {
    return null;
  }
}

/** Whether the server can read at all — used to answer 501 rather than 404. */
export function serviceAccountConfigured(): boolean {
  return readServiceAccount() !== null;
}

/**
 * One document, as the project, with rules bypassed.
 *
 * Returns null for "no such document" and for any failure — the caller cannot
 * act differently on the difference, and a route that says which is a route
 * that tells a stranger whether a token exists.
 */
export async function adminGetDoc<T>(path: string): Promise<T | null> {
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const token = await accessToken();
  if (!project || !token) return null;

  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/${path}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return null;
    const doc = (await res.json()) as { fields?: Record<string, unknown> };
    if (!doc.fields) return null;
    return fromFirestore(doc.fields) as T;
  } catch {
    return null;
  }
}

/**
 * Firestore's REST shape back into plain values.
 *
 * The SDK does this invisibly; over REST every field arrives wrapped in its
 * type — `{ stringValue: "..." }`. Only the types these documents actually
 * hold are unwrapped; anything else comes back undefined rather than as the
 * wrapper, which would be worse than missing.
 */
function fromFirestore(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, wrapped] of Object.entries(fields)) {
    const v = wrapped as Record<string, unknown>;
    if (typeof v?.stringValue === "string") out[key] = v.stringValue;
    else if (typeof v?.booleanValue === "boolean") out[key] = v.booleanValue;
    else if (typeof v?.integerValue === "string") out[key] = Number(v.integerValue);
    else if (typeof v?.doubleValue === "number") out[key] = v.doubleValue;
  }
  return out;
}
