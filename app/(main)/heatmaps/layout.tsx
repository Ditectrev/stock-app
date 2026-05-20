import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/site-seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Stock, ETF & Crypto Heatmaps",
  description:
    "Visual heatmaps for stocks, ETFs, and crypto. Scan market breadth, sector color maps, and top movers at a glance.",
  path: "/heatmaps",
});

export default function HeatmapsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
