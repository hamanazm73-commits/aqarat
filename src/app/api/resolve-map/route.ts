import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Turn a short Google Maps link into the long one that has the coordinates in
 * it.
 *
 * The form asks the seller to share a place from Google Maps, and on a phone
 * the share button gives out `https://maps.app.goo.gl/xxxx` — nothing else.
 * That address carries no latitude or longitude at all; it is a lookup key,
 * and only Google can say what it points at. So every seller sharing the
 * normal way pasted a link the form could not read and was told the location
 * could not be worked out, which is why nobody could set one.
 *
 * The browser cannot follow it either — it is another origin. Here there is no
 * such rule: we ask, Google redirects, and the address it redirects to is the
 * long form with `!3d`/`!4d` in it.
 */

/**
 * Every hop has to be Google.
 *
 * A redirect follower that goes anywhere is a way to make this server fetch
 * whatever somebody names, including addresses on the inside of the network
 * that are not reachable from outside. Checking the destination of each hop
 * rather than only the first keeps that shut: Google may forward to Google,
 * and to nothing else.
 */
const ALLOWED_HOSTS = new Set([
  "maps.app.goo.gl",
  "goo.gl",
  "maps.google.com",
  "www.google.com",
  "google.com",
  "g.co",
]);

function googleHost(raw: string): URL | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase();
  if (ALLOWED_HOSTS.has(host)) return u;
  // maps.google.iq, google.co.uk and the rest of the country domains.
  if (/^(maps\.|www\.)?google\.[a-z.]{2,6}$/.test(host)) return u;
  return null;
}

export async function POST(req: Request): Promise<NextResponse> {
  let url: unknown;
  try {
    ({ url } = (await req.json()) as { url?: unknown });
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }
  if (typeof url !== "string" || !googleHost(url)) {
    return NextResponse.json({ error: "not-a-maps-link" }, { status: 400 });
  }

  let current = url;
  // Five is more than Google uses and stops a loop dead.
  for (let hop = 0; hop < 5; hop++) {
    let res: Response;
    try {
      res = await fetch(current, {
        redirect: "manual",
        // Without a browser-ish agent the short link answers with a consent
        // page instead of the redirect.
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        },
      });
    } catch {
      return NextResponse.json({ error: "unreachable" }, { status: 502 });
    }

    const next = res.headers.get("location");
    if (!next) {
      // A short link that never redirected and answered 404 has expired or
      // was mistyped. Saying so beats "could not work out the location",
      // which sends the seller off checking a link that is fine in itself.
      if (hop === 0 && res.status >= 400) {
        return NextResponse.json({ error: "dead-link" }, { status: 404 });
      }
      // No further redirect: this is as far as it goes.
      return NextResponse.json({ url: current });
    }
    const resolved = new URL(next, current).toString();
    if (!googleHost(resolved)) {
      return NextResponse.json({ error: "left-google" }, { status: 400 });
    }
    current = resolved;
  }

  return NextResponse.json({ url: current });
}
