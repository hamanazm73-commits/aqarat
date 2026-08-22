import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { rateLimit, clientIp, tooMany } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Forget the cached listings, now.
 *
 * The public site reads the whole collection at most once an hour, because
 * re-reading it once a minute costs 1440 × however many listings there are
 * against a free tier of 50,000 reads a day — a ceiling the office reaches at
 * about 35 listings.
 *
 * An hour is only tolerable if adding a house does not mean waiting an hour to
 * see it. So the dashboard calls this on save and the next visitor gets a
 * fresh read. The interval becomes a floor for changes made outside the
 * dashboard rather than the wait for ordinary work.
 *
 * Signed in only. Clearing a cache is not destructive, but it is a free way to
 * make this server re-read the database, and that is worth a session and a
 * ceiling.
 */

async function signedIn(idToken: string): Promise<boolean> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey || !idToken) return false;
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
    return !!data.users?.[0]?.email;
  } catch {
    return false;
  }
}

export async function POST(req: Request): Promise<Response> {
  const gate = rateLimit(`revalidate:${clientIp(req)}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!gate.ok) return tooMany(gate.resetAt);

  if (!(await signedIn(req.headers.get("x-id-token") || ""))) {
    return NextResponse.json({ error: "not-allowed" }, { status: 403 });
  }

  /*
   * Two arguments in Next 16, and the one-argument form is deprecated.
   *
   * "max" marks the tag stale and serves the old page once while the fresh one
   * is built behind it. The alternative that blocks — updateTag — is Server
   * Actions only, and this is a route handler. One stale view costs nothing
   * here: the office lands back on /hq after saving, not on the public page.
   */
  revalidateTag("properties", "max");
  return NextResponse.json({ ok: true });
}
