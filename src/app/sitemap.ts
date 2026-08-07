import type { MetadataRoute } from "next";
import { getAllProperties, getEnabledCities } from "@/lib/repo";
import { PROPERTY_TYPE_KEYS } from "@/lib/constants";
import { LOCALES, type Locale, type Purpose } from "@/lib/types";
import { urlFor, languageAlternates } from "@/lib/seo";

/** Re-read the listings hourly. A sitemap built once at deploy time would
 *  freeze on whatever happened to be for sale that day. */
export const revalidate = 3600;

/**
 * Next writes these URLs straight into the XML without escaping anything, and
 * a bare `&` in a `<loc>` makes the whole document malformed — which costs the
 * entire sitemap, not just the one URL that contained it.
 */
const xml = (u: string) => u.replace(/&/g, "&amp;");

/**
 * One entry per page per language, each declaring the other two.
 *
 * `alternates.languages` is what stops Google reading three near-identical
 * sites and keeping only one of them. Without it the Arabic and English pages
 * compete with the Kurdish original instead of serving different readers.
 */
function entry(
  path: string,
  rest: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">,
): MetadataRoute.Sitemap {
  const languages = languageAlternates(path);
  return LOCALES.map((locale: Locale) => ({
    url: xml(urlFor(locale, path)),
    alternates: {
      languages: Object.fromEntries(
        Object.entries(languages).map(([k, v]) => [k, xml(v)]),
      ),
    },
    ...rest,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const out: MetadataRoute.Sitemap = [
    ...entry("/", { changeFrequency: "daily", priority: 1 }),
    ...entry("/properties", { changeFrequency: "daily", priority: 0.9 }),
  ];

  // The filtered pages people actually search for — "houses for sale in
  // Erbil" is a query, and /properties?type=house&purpose=sale&city=erbil is
  // already the page that answers it. Nothing links to most of these, so
  // without the sitemap a crawler would never reach them.
  const PURPOSES: Purpose[] = ["sale", "rent"];
  try {
    const cities = await getEnabledCities();
    const facets = new Set<string>();
    for (const purpose of PURPOSES) {
      facets.add(`purpose=${purpose}`);
      for (const city of cities) {
        facets.add(`city=${city}`);
        facets.add(`purpose=${purpose}&city=${city}`);
      }
      for (const type of PROPERTY_TYPE_KEYS) {
        facets.add(`type=${type}&purpose=${purpose}`);
      }
    }
    for (const qs of facets) {
      out.push(
        ...entry(`/properties?${qs}`, {
          changeFrequency: "weekly",
          priority: 0.6,
        }),
      );
    }
  } catch {
    /* the listings below still carry the site */
  }

  // The real listings, not the seed. getAllProperties reads Firestore, drops
  // hidden ones, and falls back to the seed by itself if the read fails.
  try {
    for (const p of await getAllProperties()) {
      out.push(
        ...entry(`/properties/${encodeURIComponent(p.id)}`, {
          lastModified: new Date(p.createdAt),
          changeFrequency: "weekly",
          priority: 0.7,
        }),
      );
    }
  } catch {
    // A sitemap of the static pages still beats a 500.
  }

  return out;
}
