import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

/**
 * Takes a listing photograph and puts it in the bucket.
 *
 * This site used to upload straight to Firebase Storage with `uploadBytes`,
 * and it is the only one of the four that did — the hotels and shops sites
 * both write to the shared R2 bucket through a route like this one. Firebase
 * Storage needs the paid plan to exist at all, and when the bucket is not
 * there the SDK does not fail: it retries for a couple of minutes and the
 * seller watches a spinner that never resolves. That is what "slow uploads"
 * turned out to be.
 *
 * One bucket for the family, split by key prefix: `properties/` here,
 * `shops/` on the shops site, hotel media alongside. Same credentials, same
 * route shape, one thing to keep working instead of two.
 */

/**
 * Who is allowed to add a photograph.
 *
 * The Storage rules this replaces let in the owner, anyone with an admin
 * role, and any enabled seller — a seller uploads photographs of their own
 * listing, so the boundary cannot simply be the owner. Both checks go over
 * the REST APIs rather than firebase-admin, whose auth subpath crashes on
 * Vercel's serverless runtime.
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

  // A role document exists and is enabled — the same test firestore.rules
  // makes, asked of the same collection.
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

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  const contentType = (request.headers.get("content-type") || "").split(";")[0];
  if (!ALLOWED.has(contentType)) {
    return NextResponse.json({ error: "unsupported-type" }, { status: 400 });
  }
  if (!(await allowed(request.headers.get("x-id-token") || ""))) {
    return NextResponse.json({ error: "not-allowed" }, { status: 403 });
  }

  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    return NextResponse.json({ error: "storage-not-configured" }, { status: 501 });
  }

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength === 0) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }
  // The browser redraws these to 1600px before sending, which lands around
  // 150KB — nowhere near the 4.5MB a function body may carry.
  if (bytes.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "too-large" }, { status: 413 });
  }

  const ext =
    contentType === "image/png"
      ? "png"
      : contentType === "image/webp"
        ? "webp"
        : "jpg";
  const key = `properties/${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  try {
    // forcePathStyle: R2 is addressed as endpoint/bucket/key. Left to itself
    // the SDK folds the bucket into the hostname, which is a second thing
    // that has to be right for no benefit here.
    const s3 = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: bytes,
        ContentType: contentType,
      }),
    );
  } catch (err) {
    // The bucket's own words, so a rejected key or a wrong permission says
    // which it was instead of arriving as an unexplained failure.
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: "bucket-refused", message }, { status: 502 });
  }

  /*
   * A path this site serves, not a key.
   *
   * Listings already hold absolute URLs — every photograph uploaded before
   * today is a Firebase download URL sitting in the same `images` array. A
   * bare key would need every reader taught to tell the two apart; a path
   * does not, and the old URLs keep working untouched.
   */
  return NextResponse.json({ url: `/api/img/${key}` });
}
