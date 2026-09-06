import type { Metadata } from "next";
import { CompareHub } from "@/components/CompareHub";
import { JsonLd } from "@/components/JsonLd";
import { buildCompareHubJsonLd } from "@/lib/compare-json-ld";
import { buildPageMetadata } from "@/lib/site-seo";

export const metadata: Metadata = buildPageMetadata({
  title: "The Open Stock vs Finviz, TradingView, Yahoo Finance",
  description:
    "Compare The Open Stock with Finviz, TradingView, Yahoo Finance, OpenStock, Koyfin, and other research tools. Free screener, heatmaps, calendars, and optional local AI.",
  path: "/compare",
  keywords: [
    "finviz alternative",
    "tradingview alternative",
    "yahoo finance alternative",
    "openstock alternative",
    "free stock screener",
  ],
});

export default function ComparePage() {
  return (
    <>
      <JsonLd data={buildCompareHubJsonLd()} />
      <CompareHub />
    </>
  );
}
