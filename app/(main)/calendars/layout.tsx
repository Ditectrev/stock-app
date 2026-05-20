import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/site-seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Economic, Earnings & Dividend Calendars",
  description:
    "Economic calendar with country flags and importance filters, plus earnings, dividend, and IPO calendars for upcoming market-moving events.",
  path: "/calendars",
});

export default function CalendarsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
