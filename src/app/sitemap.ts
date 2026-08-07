import type { MetadataRoute } from "next";
import { getAllProperties, getEnabledCities } from "@/lib/repo";
import { PROPERTY_TYPE_KEYS } from "@/lib/constants";
import type { Purpose } from "@/lib/types";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://homeskurdistan.com";

/** Re-read the listings hourly. A sitemap built once at deploy time would
 *  freeze on whatever happened to be for sale that day. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/properties`, changeFrequency: "daily", priority: 0.9 },
  ];

  // The filtered pages people actually search for — "houses for sale in
  // Erbil" is a query, and /properties?type=house&purpose=sale&city=erbil is
  // already the page that answers it. Nothing links to most of these, so
  // without the sitemap a crawler would never reach them.
  const PURPOSES: Purpose[] = ["sale", "rent"];
  let facets: MetadataRoute.Sitemap = [];
  try {
    const cities = await getEnabledCities();
    const urls = new Set<string>();
    for (const purpose of PURPOSES) {
      urls.add(`purpose=${purpose}`);
      for (const city of cities) {
        urls.add(`city=${city}`);
        urls.add(`purpose=${purpose}&city=${city}`);
      }
      for (const type of PROPERTY_TYPE_KEYS) {
        urls.add(`type=${type}&purpose=${purpose}`);
      }
    }
    // Next writes these straight into the XML without escaping anything, and
    // a bare & in a <loc> makes the document malformed — which costs the
    // whole sitemap, not just the one URL. Escaping it here is what keeps a
    // two-facet link legal.
    facets = [...urls].map((qs) => ({
      url: `${BASE}/properties?${qs.replace(/&/g, "&amp;")}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    /* the listings below still carry the site */
  }

  // The real listings, not the seed. getAllProperties reads Firestore, drops
  // hidden ones, and falls back to the seed by itself if the read fails.
  // Pointing at the seed here meant Google only ever saw twelve demo houses
  // and none of the properties actually for sale.
  let listings: MetadataRoute.Sitemap = [];
  try {
    listings = (await getAllProperties()).map((p) => ({
      url: `${BASE}/properties/${encodeURIComponent(p.id)}`,
      lastModified: new Date(p.createdAt),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    // A sitemap of the two static pages still beats a 500.
  }

  return [...staticRoutes, ...facets, ...listings];
}
