/**
 * A ceiling on how often one caller may reach a route.
 *
 * Three routes here answer without a session or cost money per call, and none
 * of them had a limit: `/api/resolve-map` makes this server fetch a URL on
 * request, `/api/translate` spends money at Anthropic, and `/api/upload-url`
 * signs a key that accepts 200MB. Twelve requests in a row to the first two
 * came back twelve times without complaint.
 *
 * In memory, and therefore per instance. Vercel runs several and a determined
 * caller spread across them gets a multiple of the limit — this is a brake on
 * a script left in a loop and on a bill running away overnight, not a defence
 * against somebody trying. Anything stronger needs a shared store, which is a
 * dependency and a bill of its own, and is worth reaching for when there is
 * enough traffic to justify one.
 *
 * The shops site solves this inline in its own AI route and the hotels site
 * has a module like this one. This is the hotels shape, so the two read alike.
 */

type Hit = { count: number; resetAt: number };

const HITS = new Map<string, Hit>();

/** Stop the map growing without bound on an instance that stays warm. */
function sweep(now: number) {
  if (HITS.size < 500) return;
  for (const [k, v] of HITS) if (v.resetAt <= now) HITS.delete(k);
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { ok: boolean; resetAt: number } {
  const now = Date.now();
  sweep(now);

  const hit = HITS.get(key);
  if (!hit || hit.resetAt <= now) {
    const resetAt = now + windowMs;
    HITS.set(key, { count: 1, resetAt });
    return { ok: true, resetAt };
  }

  hit.count += 1;
  return { ok: hit.count <= limit, resetAt: hit.resetAt };
}

/**
 * Who is asking.
 *
 * The first entry in `x-forwarded-for` is the client as the platform saw it;
 * the rest are proxies. A caller can send the header themselves, but on Vercel
 * the platform overwrites it, so the value that arrives here is the one it
 * observed.
 */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0].trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** The 429 every limited route returns, so they answer alike. */
export function tooMany(resetAt: number): Response {
  const seconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return new Response(JSON.stringify({ error: "rate-limited" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(seconds),
    },
  });
}
