import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { notifyInquiry, notifyInquiryTelegram } from "@/lib/notify";
import { SITE_URL } from "@/lib/seo";

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
  /** Carried for the notification only — never stored. The listing page knows
      the title; the id on its own tells the reader nothing. */
  propertyTitle: z.string().trim().max(200).optional(),
  /** Set when the form has already written the inquiry to Firestore, so this
      request is asking for the notification and nothing else. */
  notifyOnly: z.boolean().optional(),
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

  const { propertyId, name, phone, message, propertyTitle, notifyOnly } =
    parsed.data;

  // In production the form writes the inquiry to Firestore itself and then
  // calls here with notifyOnly, so this endpoint only stores in local dev —
  // where Firebase is unconfigured and the log is the whole record.
  if (!notifyOnly) {
    console.log("[inquiry]", {
      propertyId,
      name,
      phone,
      message,
      createdAt: new Date().toISOString(),
    });
  }

  // Tell the office. Both are best-effort and never throw, but we await so a
  // frozen serverless instance doesn't kill the send after we've responded.
  const notice = {
    propertyId,
    name,
    phone,
    message,
    propertyTitle,
    siteUrl: SITE_URL,
  };
  await Promise.allSettled([
    notifyInquiry(notice),
    notifyInquiryTelegram(notice),
  ]);

  return NextResponse.json({ ok: true }, { status: 201 });
}
