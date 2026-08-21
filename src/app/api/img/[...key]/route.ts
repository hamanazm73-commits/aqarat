import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

/**
 * Serves a listing photograph out of the bucket.
 *
 * Through here rather than straight from R2, which means the bucket never has
 * to be public. The free r2.dev address is rate-limited and documented as
 * development-only, and a custom domain on it would need this site's DNS moved
 * to Cloudflare — this needs neither, and keeps the bucket's address off the
 * page entirely.
 *
 * Fetched over the S3 API and handed to Vercel's CDN with an immutable year:
 * keys are unique per upload, so a cached image can never be stale.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> },
): Promise<NextResponse> {
  const { key } = await params;
  const Key = key.map((k) => decodeURIComponent(k)).join("/");

  const Bucket = process.env.S3_BUCKET;
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!Bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    return new NextResponse("storage not configured", { status: 500 });
  }

  try {
    const s3 = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
    const obj = await s3.send(new GetObjectCommand({ Bucket, Key }));
    const body = await obj.Body?.transformToByteArray();
    if (!body) return new NextResponse("not found", { status: 404 });

    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": obj.ContentType || "image/webp",
        "Content-Length": String(body.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("not found", { status: 404 });
  }
}
