import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  buildPageMetadata,
  DEFAULT_DESCRIPTION,
  SITE_NAME,
} from "@/lib/site-seo";
import { HomePageClient } from "./home-page-client";

type HomePageProps = {
  searchParams: Promise<{ symbol?: string }>;
};

export async function generateMetadata({
  searchParams,
}: HomePageProps): Promise<Metadata> {
  const { symbol } = await searchParams;
  const ticker = symbol?.trim().toUpperCase();

  if (ticker) {
    return buildPageMetadata({
      title: `${ticker} Stock Quote, Chart & AI Prediction`,
      description: `Analyze ${ticker} with live price, interactive charts, technical indicators (RSI, MACD, Bollinger Bands), financials, analyst forecasts, and AI prediction on ${SITE_NAME}.`,
      path: `/?symbol=${encodeURIComponent(ticker)}`,
    });
  }

  return buildPageMetadata({
    title: "Stock Charts, Screeners & AI Analysis",
    description: DEFAULT_DESCRIPTION,
    path: "/",
  });
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" message="Loading..." />
        </div>
      }
    >
      <HomePageClient />
    </Suspense>
  );
}
