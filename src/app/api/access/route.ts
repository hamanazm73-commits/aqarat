import { NextResponse } from "next/server";
import { rateLimit, clientIp, tooMany } from "@/lib/rate-limit";
import { adminGetDoc, serviceAccountConfigured } from "@/lib/firebase/service-account";

export const runtime = "nodejs";

/**
 * Redeem a seller link.
 *
 * The browser used to read `accessLinks/{token}` straight out of Firestore,
 * because the rule said `allow get: if true`. That document holds the
 * throwaway account's address and its password in plain text, so anyone who
 * ever saw the URL — forwarded, screenshotted, pasted into a chat — could read
 * a working password out of it, forever, with no server in the way and nothing
 * counting the attempts.
 *
 * The token still is the secret; that part of the design is sound and the
 * links already sent keep working, because the token in them does not change.
 * What changes is who reads the document. This route reads it as the project
 * and hands back only what the browser needs to sign in, which lets the rule
 * close to `allow get: if false`.
 *
 * The hotels site has worked this way from the beginning. This is the same
 * shape, down to the ten a minute.
 */

const MIN_TOKEN = 20;
const MAX_TOKEN = 200;

type StoredLink = {
  email?: string;
  password?: string;
  name?: string;
};

export async function POST(req: Request): Promise<Response> {
  /*
   * Ten a minute per address.
   *
   * A person opening their own link does it once. Anything doing it ten times
   * a minute is walking through tokens, and while the space is far too large
   * to walk through, a counter costs nothing and turns a silent grind into
   * something that shows up.
   */
  const gate = rateLimit(`access:${clientIp(req)}`, { limit: 10, windowMs: 60_000 });
  if (!gate.ok) return tooMany(gate.resetAt);

  let token: unknown;
  try {
    ({ token } = (await req.json()) as { token?: unknown });
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }

  /*
   * A token is the document id, so it has to be one path segment and nothing
   * clever. A slash would walk out of the collection and read something else
   * entirely — as the project, with rules bypassed.
   */
  if (
    typeof token !== "string" ||
    token.length < MIN_TOKEN ||
    token.length > MAX_TOKEN ||
    !/^[A-Za-z0-9_-]+$/.test(token)
  ) {
    return NextResponse.json({ error: "bad-token" }, { status: 400 });
  }

  /*
   * The config check sits after the input check, not before it.
   *
   * A malformed request is a malformed request whether or not this server can
   * read anything, and putting the key check first made the guard above
   * untestable — every probe came back 501 and the 400s could not be seen.
   */
  if (!serviceAccountConfigured()) {
    // Told apart from a bad token on purpose: this one is our fault, and
    // somebody should see it in the log rather than tell a seller their link
    // is broken.
    console.error("[access] FIREBASE_SERVICE_ACCOUNT is not set");
    return NextResponse.json({ error: "not-configured" }, { status: 501 });
  }

  const link = await adminGetDoc<StoredLink>(`accessLinks/${token}`);
  if (!link?.email || !link.password) {
    return NextResponse.json({ error: "no-such-link" }, { status: 404 });
  }

  // The credentials and nothing else. The document also carries the seller's
  // name and phone number for the admin list, which the browser signing in has
  // no use for.
  return NextResponse.json({ email: link.email, password: link.password });
}
