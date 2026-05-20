import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/site-seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Sector Performance",
  description:
    "Track sector performance across the market with live returns, leaders, and laggards to spot rotation and risk-on vs risk-off trends.",
  path: "/sectors",
});

export default function SectorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
