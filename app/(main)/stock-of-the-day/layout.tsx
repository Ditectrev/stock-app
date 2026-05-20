import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/site-seo";

export const metadata: Metadata = buildPageMetadata({
  title: "AI Stock of the Day",
  description:
    "Daily AI-ranked stock ideas: one buy and one sell pick validated with live quotes, technicals, and analyst data. Optional local Ollama or cloud AI.",
  path: "/stock-of-the-day",
});

export default function StockOfTheDayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
