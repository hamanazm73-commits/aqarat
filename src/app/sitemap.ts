import type { MetadataRoute } from "next";
import { SEED_PROPERTIES } from "@/lib/data";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://aqarat-iraq.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/properties`, changeFrequency: "daily", priority: 0.9 },
  ];

  const listings: MetadataRoute.Sitemap = SEED_PROPERTIES.filter(
    (p) => !p.hidden,
  ).map((p) => ({
    url: `${BASE}/properties/${p.id}`,
    lastModified: new Date(p.createdAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...listings];
}
