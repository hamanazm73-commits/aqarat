import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

/** Validated shape of an inbound inquiry. */
const InquirySchema = z.object({
  propertyId: z.string().min(1).max(120),
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .min(6)
    .max(20)
    .regex(/^[+]?[0-9\s-]+$/, "invalid phone"),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

/** Tiny in-memory rate limiter (per IP). Good enough for a single instance;
 *  swap for Redis/Upstash in production. */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = InquirySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const inquiry = {
    ...parsed.data,
    createdAt: new Date().toISOString(),
  };

  // When Firebase Admin is configured, persist here. For now we log so the
  // form works end-to-end without a backend.
  //   await saveInquiry(inquiry);
  console.log("[inquiry]", inquiry);

  return NextResponse.json({ ok: true }, { status: 201 });
}
