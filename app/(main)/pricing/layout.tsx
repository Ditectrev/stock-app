import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/site-seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Pricing & AI Plans",
  description:
    "Compare Free, Ads-free, Local AI (Ollama), Bring Your Own Key, and Hosted AI plans. Upgrade for stock screeners, AI predictions, and ad-free market analysis.",
  path: "/pricing",
});

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
