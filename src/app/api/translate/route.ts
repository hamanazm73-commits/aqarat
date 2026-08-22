import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { rateLimit, clientIp, tooMany } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Fill in the two languages the seller did not write.
 *
 * Every listing wants a title and a description in Kurdish, Arabic and
 * English, and a seller has one of those and no patience for the other two.
 * Left to itself the form got a Kurdish title pasted into all three boxes,
 * which is worse than an empty box: a buyer reading Arabic is shown Kurdish
 * and told it is Arabic.
 *
 * So: they write one, this writes the other two. It translates and nothing
 * else — no embellishing a plain listing into an advertisement, no inventing a
 * detail the seller did not give.
 */

const Out = z.object({
  ku: z.string().describe("Kurdish Sorani, in Arabic script."),
  ar: z.string().describe("Arabic, as spoken in Iraq."),
  en: z.string().describe("English."),
});

const SYSTEM = `You translate short property listings for a Kurdish estate agency.

You are given one text and the language it is in. Return the same text in all
three languages: Kurdish Sorani (ku), Arabic (ar), English (en). The one you
were given comes back unchanged.

Rules:
- Translate, do not sell. If the seller wrote "house for sale", that is what it
  says in all three — not "stunning family home in a sought-after location".
- Invent nothing. No size, no district, no condition that was not written.
- Keep numbers, and keep a name a name: a district or a person is transliterated,
  not translated into something meaningful.
- These are written by hand on a phone and are often misspelled. Read through
  the spelling to what was meant.
- Kurdish is Sorani in Arabic script. Arabic is what an Iraqi would write.`;

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic();
  return client;
}

/** Only somebody signed in can reach this; it costs money per call. */
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
  /*
   * Before the key check, because the point is the bill.
   *
   * Signing in is the only thing standing between this route and the account
   * at Anthropic, and one enabled seller with a stuck form can spend all
   * night. A title and a description per listing is two calls; thirty a
   * minute is a seller filing more listings than anyone files.
   */
  const gate = rateLimit(`translate:${clientIp(req)}`, { limit: 30, windowMs: 60_000 });
  if (!gate.ok) return tooMany(gate.resetAt);

  const anthropic = getClient();
  // Not configured is not an error: the seller can still type all three by
  // hand, exactly as before this existed.
  if (!anthropic) {
    return NextResponse.json({ error: "not-configured" }, { status: 501 });
  }
  if (!(await signedIn(req.headers.get("x-id-token") || ""))) {
    return NextResponse.json({ error: "not-allowed" }, { status: 403 });
  }

  let text: unknown, from: unknown;
  try {
    ({ text, from } = (await req.json()) as { text?: unknown; from?: unknown });
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }
  if (typeof text !== "string" || typeof from !== "string") {
    return NextResponse.json({ error: "bad-input" }, { status: 400 });
  }
  const source = text.trim().slice(0, 2000);
  if (source.length < 2) {
    return NextResponse.json({ error: "too-short" }, { status: 400 });
  }

  const lang =
    from === "ku" ? "Kurdish Sorani" : from === "ar" ? "Arabic" : "English";

  try {
    const response = await anthropic.messages.parse({
      model: "claude-opus-5",
      max_tokens: 2048,
      // A short listing line, not a piece of reasoning. The seller is waiting
      // with the form open.
      output_config: { effort: "low", format: zodOutputFormat(Out) },
      system: SYSTEM,
      messages: [
        { role: "user", content: `Language: ${lang}\n\nText:\n${source}` },
      ],
    });

    const parsed = response.parsed_output;
    if (!parsed) {
      console.error("[translate] no parsed output, stop:", response.stop_reason);
      return NextResponse.json({ error: "unparsed" }, { status: 502 });
    }
    // Whatever the seller wrote is returned exactly as they wrote it — a
    // translation of the source back into the source is still a rewrite.
    return NextResponse.json({ ...parsed, [from]: source });
  } catch (err) {
    console.error("[translate] failed:", err);
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}
