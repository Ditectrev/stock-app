import type { MetadataRoute } from "next";
import { comparisonSitemapPaths } from "@/lib/compare-competitors";
import { getSiteUrl, PUBLIC_ROUTES } from "@/lib/site-seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  const appRoutes = PUBLIC_ROUTES.map((route) => ({
    url: new URL(route.path, siteUrl).toString(),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const compareRoutes = comparisonSitemapPaths().map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified,
    changeFrequency: "weekly" as const,
    priority: path === "/compare" ? 0.8 : 0.75,
  }));

  return [...appRoutes, ...compareRoutes];
}
