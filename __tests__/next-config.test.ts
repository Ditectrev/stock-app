import { describe, it, expect } from "vitest";

describe("next.config.ts - static asset optimization", () => {
  it("should configure modern image formats (AVIF and WebP)", async () => {
    const { default: nextConfig } = await import("../next.config");
    expect(nextConfig.images?.formats).toEqual(["image/avif", "image/webp"]);
  });

  it("should configure device sizes for responsive images", async () => {
    const { default: nextConfig } = await import("../next.config");
    expect(nextConfig.images?.deviceSizes).toBeDefined();
    expect(nextConfig.images?.deviceSizes?.length).toBeGreaterThan(0);
  });

  it("should configure image sizes for fixed-width images", async () => {
    const { default: nextConfig } = await import("../next.config");
    expect(nextConfig.images?.imageSizes).toBeDefined();
    expect(nextConfig.images?.imageSizes?.length).toBeGreaterThan(0);
  });

  it("should set a minimum cache TTL for optimized images", async () => {
    const { default: nextConfig } = await import("../next.config");
    expect(nextConfig.images?.minimumCacheTTL).toBeGreaterThanOrEqual(
      60 * 60 * 24
    );
  });

  it("should define cache headers via the headers() function", async () => {
    const { default: nextConfig } = await import("../next.config");
    expect(nextConfig.headers).toBeDefined();
    expect(typeof nextConfig.headers).toBe("function");

    const headers = await nextConfig.headers!();
    expect(Array.isArray(headers)).toBe(true);
    expect(headers.length).toBeGreaterThan(0);
  });

  it("should set immutable cache for _next/static assets", async () => {
    const { default: nextConfig } = await import("../next.config");
    const headers = await nextConfig.headers!();

    const staticRule = headers.find((h) => h.source.includes("_next/static"));
    expect(staticRule).toBeDefined();

    const cacheHeader = staticRule!.headers.find(
      (h) => h.key === "Cache-Control"
    );
    expect(cacheHeader).toBeDefined();
    expect(cacheHeader!.value).toContain("immutable");
    expect(cacheHeader!.value).toContain("max-age=31536000");
  });

  it("should redirect /vs/:slug and alternative URLs to /compare", async () => {
    const { default: nextConfig } = await import("../next.config");
    expect(nextConfig.redirects).toBeDefined();
    const redirects = await nextConfig.redirects!();
    expect(redirects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "/vs/:slug",
          destination: "/compare/:slug",
          permanent: true,
        }),
        expect.objectContaining({
          source: "/openstock-alternative",
          destination: "/compare/openstock",
          permanent: true,
        }),
        expect.objectContaining({
          source: "/finviz-alternative",
          destination: "/compare/finviz",
          permanent: true,
        }),
      ])
    );
  });

  it("should set cache headers for image file extensions", async () => {
    const { default: nextConfig } = await import("../next.config");
    const headers = await nextConfig.headers!();

    const imageRule = headers.find(
      (h) => h.source.includes("webp") || h.source.includes("avif")
    );
    expect(imageRule).toBeDefined();

    const cacheHeader = imageRule!.headers.find(
      (h) => h.key === "Cache-Control"
    );
    expect(cacheHeader).toBeDefined();
    expect(cacheHeader!.value).toContain("max-age=");
  });
});
