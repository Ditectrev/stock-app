import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lightweight-charts", "swr", "react-github-btn"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  async redirects() {
    return [
      {
        source: "/vs/:slug",
        destination: "/compare/:slug",
        permanent: true,
      },
      {
        source: "/openstock-alternative",
        destination: "/compare/openstock",
        permanent: true,
      },
      {
        source: "/openstock-alternative-free",
        destination: "/compare/openstock",
        permanent: true,
      },
      {
        source: "/finviz-alternative",
        destination: "/compare/finviz",
        permanent: true,
      },
      {
        source: "/yahoo-finance-alternative",
        destination: "/compare/yahoo-finance",
        permanent: true,
      },
      {
        source: "/tradingview-alternative",
        destination: "/compare/tradingview",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*.(ico|svg|png|jpg|jpeg|gif|webp|avif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

const analyzeBundleEnabled = process.env.ANALYZE === "true";

const withAnalyzer = withBundleAnalyzer({
  enabled: analyzeBundleEnabled,
});

export default withAnalyzer(nextConfig);
