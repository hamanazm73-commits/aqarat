import type { MetadataRoute } from "next";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://homeskurdistan.com";

export default function robots(): MetadataRoute.Robots {
  return {
    // /hq is the dashboard. /admin only redirects to the homepage, but keep
    // it listed so the old path is never crawled either.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/hq", "/admin"] },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
