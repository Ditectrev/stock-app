import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/profile"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
