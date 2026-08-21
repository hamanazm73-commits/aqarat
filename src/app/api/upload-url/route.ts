import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";

/**
 * A one-time address the browser can send a video straight to.
 *
 * Photographs go through /api/upload, which is simpler and needs nothing
 * configured on the bucket. Video cannot: a function request body is capped at
 * 4.5MB and a clip off a phone is many times that, so anything real was
 * refused before it started.
 *
 * Shrinking it in the browser first is not an answer either. Video needs a
 * transcoder, which means shipping ffmpeg — around 25MB to download and minutes
 * of work on the phone that is already waiting. A photograph can be redrawn on
 * a canvas the browser already has; a video cannot.
 *
 * So the file skips this server. We sign a PUT, the browser sends the bytes to
 * R2 itself, and no limit here applies.
 *
 * **This needs CORS on the bucket** — the browser is writing across an origin.
 * Without it the request fails with nothing but "Failed to fetch", which is all
 * a blocked cross-origin request ever says, and the shops site lost an evening
 * to exactly that. The rule is in the repo README; if video uploads fail with
 * no message, that is the first thing to check.
 */

async function allowed(idToken: string): Promise<boolean> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const owner = (process.env.NEXT_PUBLIC_OWNER_EMAIL || "").toLowerCase();
  if (!apiKey || !idToken) return false;

  let email: string | undefined;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      },
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { users?: { email?: string }[] };
    email = data.users?.[0]?.email?.toLowerCase();
  } catch {
    return false;
  }
  if (!email) return false;
  if (owner && email === owner) return true;
  if (!project) return false;

  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/roles/${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${idToken}` } },
    );
    if (!res.ok) return false;
    const doc = (await res.json()) as {
      fields?: { enabled?: { booleanValue?: boolean } };
    };
    return doc.fields?.enabled?.booleanValue === true;
  } catch {
    return false;
  }
}

const EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-m4v": "m4v",
};

/** Generous, but not a film. A walk round a house is well inside this. */
const MAX_BYTES = 200 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await allowed(request.headers.get("x-id-token") || ""))) {
    return NextResponse.json({ error: "not-allowed" }, { status: 403 });
  }

  let contentType: unknown, size: unknown;
  try {
    ({ contentType, size } = (await request.json()) as {
      contentType?: unknown;
      size?: unknown;
    });
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }

  if (typeof contentType !== "string" || !EXT[contentType]) {
    return NextResponse.json({ error: "unsupported-type" }, { status: 400 });
  }
  if (typeof size !== "number" || size <= 0) {
    return NextResponse.json({ error: "bad-size" }, { status: 400 });
  }
  if (size > MAX_BYTES) {
    return NextResponse.json({ error: "too-large" }, { status: 413 });
  }

  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    return NextResponse.json({ error: "storage-not-configured" }, { status: 501 });
  }

  const key = `properties/${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${EXT[contentType]}`;

  try {
    const s3 = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });
    // Fifteen minutes: long enough for a big clip on a slow connection, short
    // enough that a URL copied out of the network tab is no use tomorrow.
    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
      { expiresIn: 900 },
    );
    // The address the page will play it from, not the bucket's own.
    return NextResponse.json({ uploadUrl, url: `/api/img/${key}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: "sign-failed", message }, { status: 502 });
  }
}
