import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    // /hq is the dashboard. /admin only redirects to the homepage, but keep
    // it listed so the old path is never crawled either.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/hq", "/admin"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
