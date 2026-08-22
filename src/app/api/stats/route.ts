import { NextResponse } from "next/server";
import { getAllProperties } from "@/lib/repo";

/**
 * How much is in here, as two numbers.
 *
 * The doorway at layhama.com has an admin page that shows all four sites at
 * once, and it needed a way to ask this one how full it is. There was no
 * public list endpoint here to count — the listings are read on the server and
 * rendered — so this is that one number, and only that.
 *
 * Public on purpose: the count is on the home page already. It reads through
 * the same cache as the pages, so asking costs no Firestore read of its own.
 */
export const revalidate = 3600;

export async function GET(): Promise<NextResponse> {
  const properties = await getAllProperties();
  const cities = new Set(properties.map((p) => p.city).filter(Boolean));

  return NextResponse.json(
    {
      site: "homes",
      items: properties.length,
      cities: cities.size,
      label: { ku: "خانووبەرە", ar: "عقارات", en: "properties" },
    },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400",
        // The doorway is a different origin, and this is the one thing here
        // it is allowed to ask for.
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
