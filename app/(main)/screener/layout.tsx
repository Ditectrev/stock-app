import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/site-seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Stock Screener",
  description:
    "Filter US stocks by valuation, growth, dividends, volume, and custom presets. Find momentum, value, and small-cap ideas with a free stock screener.",
  path: "/screener",
});

export default function ScreenerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
