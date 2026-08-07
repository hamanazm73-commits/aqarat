import type { MetadataRoute } from "next";
import { getAllProperties } from "@/lib/repo";

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

  return [...staticRoutes, ...listings];
}
