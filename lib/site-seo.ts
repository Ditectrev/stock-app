import type { Metadata } from "next";

/** Public marketing name (search results & social cards). */
export const SITE_NAME = "The Open Stock";

/** Short label used in the UI nav. */
export const SITE_SHORT_NAME = "The Open Stock";

export const SITE_TAGLINE =
  "Free stock charts, screeners, calendars & AI market analysis";

export const DEFAULT_DESCRIPTION =
  "The Open Stock (theopenstock.com): free stock charts, screeners, economic & earnings calendars, sector heatmaps, Fear & Greed, analyst targets, and optional Ollama AI. Independent—not other OpenStock-named apps; a free OpenStock-style alternative for DIY investors.";

export const SITE_KEYWORDS = [
  "stock market",
  "stock charts",
  "stock screener",
  "technical analysis",
  "RSI",
  "MACD",
  "Bollinger Bands",
  "economic calendar",
  "earnings calendar",
  "sector performance",
  "stock heatmap",
  "Fear and Greed Index",
  "analyst forecasts",
  "open source stock app",
  "free stock analysis",
  "AI stock prediction",
  "Ollama stock analysis",
  "long term investing",
  "OpenStock alternative",
  "OpenStock alternative free",
  "openstock alternative",
  "free stock tracker OpenStock",
  "open source stock tracker like OpenStock",
  "OpenStock style stock app",
];

const DEFAULT_SITE_URL = "https://theopenstock.com";

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    DEFAULT_SITE_URL;
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/$/, "");
  }
  return `https://${raw.replace(/\/$/, "")}`;
}

export type PageMetadataInput = {
  title: string;
  description: string;
  path?: string;
  /** Omit on pages that should not be indexed (e.g. profile). */
  noIndex?: boolean;
};

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const siteUrl = getSiteUrl();
  const canonicalPath = input.path ?? "/";
  const canonical = new URL(canonicalPath, siteUrl).toString();
  const ogTitle =
    input.title === SITE_NAME || input.title.includes(SITE_NAME)
      ? input.title
      : `${input.title} | ${SITE_NAME}`;

  return {
    title: input.title,
    description: input.description,
    keywords: SITE_KEYWORDS,
    alternates: { canonical },
    robots: input.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: canonical,
      siteName: SITE_NAME,
      title: ogTitle,
      description: input.description,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: input.description,
    },
  };
}

export function buildRootMetadata(): Metadata {
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${SITE_NAME} — ${SITE_TAGLINE}`,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    keywords: SITE_KEYWORDS,
    applicationName: SITE_NAME,
    authors: [{ name: "Ditectrev", url: "https://github.com/Ditectrev" }],
    creator: "Ditectrev",
    publisher: SITE_NAME,
    category: "finance",
    alternates: {
      canonical: "/",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteUrl,
      siteName: SITE_NAME,
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: DEFAULT_DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: DEFAULT_DESCRIPTION,
    },
    other: {
      "theme-color": "#0a0a0a",
    },
  };
}

export function buildWebSiteJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        inLanguage: "en-US",
        publisher: { "@id": `${siteUrl}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: SITE_NAME,
        url: siteUrl,
        sameAs: ["https://github.com/Ditectrev/Open-Source-Stock-Application"],
      },
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#app`,
        name: SITE_NAME,
        url: siteUrl,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description: DEFAULT_DESCRIPTION,
      },
    ],
  };
}

export const PUBLIC_ROUTES = [
  { path: "/", priority: 1, changeFrequency: "daily" as const },
  { path: "/sectors", priority: 0.85, changeFrequency: "daily" as const },
  { path: "/calendars", priority: 0.85, changeFrequency: "daily" as const },
  { path: "/heatmaps", priority: 0.85, changeFrequency: "daily" as const },
  { path: "/screener", priority: 0.9, changeFrequency: "daily" as const },
  {
    path: "/stock-of-the-day",
    priority: 0.9,
    changeFrequency: "daily" as const,
  },
  { path: "/pricing", priority: 0.7, changeFrequency: "weekly" as const },
];
