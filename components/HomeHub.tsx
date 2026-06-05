"use client";

import {
  DNA_BODY,
  DNA_BODY_ON_INVERSE,
  DNA_CAPTION,
  DNA_LABEL_STRONG,
} from "@/lib/design-dna";
import Link from "next/link";
import type { ReactNode } from "react";
import { SearchBar } from "@/components/SearchBar";
import {
  HOME_EXPLORE_CARD_TITLE,
  HOME_HERO,
  HOME_HERO_LEAD,
  HOME_MARKETING_STACK,
  HOME_SECTION_LABEL,
} from "@/lib/home-ui";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site-seo";

const EXPLORE_LINKS = [
  {
    id: "sectors",
    label: "Sectors",
    href: "/sectors",
    description: "Compare sector performance",
    featured: true,
    icon: (
      <svg
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3 13h2v8H3zm6-4h2v12H9zm6-3h2v15h-2zm6-4h2v19h-2z"
        />
      </svg>
    ),
  },
  {
    id: "heatmaps",
    label: "Heatmaps",
    href: "/heatmaps",
    description: "Visual market overview",
    featured: false,
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
        />
      </svg>
    ),
  },
  {
    id: "screener",
    label: "Screener",
    href: "/screener",
    description: "Filter and find assets",
    featured: false,
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
        />
      </svg>
    ),
  },
  {
    id: "calendars",
    label: "Calendars",
    href: "/calendars",
    description: "Earnings, dividends & IPOs",
    featured: false,
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
] as const;

const SECTION_LABEL_CLASS = HOME_SECTION_LABEL;

export interface HomeHubProps {
  onSymbolSelect: (symbol: string) => void;
  fearGreed: ReactNode;
  worldMarkets: ReactNode;
  stockOfTheDay: ReactNode;
}

function ExploreArrow({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex text-lg leading-none transition-transform group-hover:translate-x-0.5 ${className ?? ""}`}
      aria-hidden="true"
    >
      →
    </span>
  );
}

export function HomeHub({
  onSymbolSelect,
  fearGreed,
  worldMarkets,
  stockOfTheDay,
}: HomeHubProps) {
  const featured = EXPLORE_LINKS.find((link) => link.featured)!;
  const secondary = EXPLORE_LINKS.filter((link) => !link.featured);

  return (
    <div id="section-home" className={HOME_MARKETING_STACK}>
      <header
        data-testid="home-dashboard-hero"
        className="border-l-2 border-stone-900 pl-5 dark:border-stone-100 sm:pl-6 lg:max-w-4xl"
      >
        <p className={SECTION_LABEL_CLASS}>Market dashboard</p>
        <h1 className={`mt-2 ${HOME_HERO}`}>{SITE_NAME}</h1>
        <p className={`mt-3 ${HOME_HERO_LEAD}`}>
          {SITE_TAGLINE}. Search a ticker for charts, fundamentals, and optional
          AI stance — or browse tools below.
        </p>
        <div className="mt-6 max-w-md" role="search" aria-label="Symbol lookup">
          <SearchBar
            placeholder="Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
            onSelect={onSymbolSelect}
            className="w-full"
          />
        </div>
      </header>

      <section aria-labelledby="home-explore-heading">
        <p id="home-explore-heading" className={`mb-4 ${SECTION_LABEL_CLASS}`}>
          Explore
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-3">
          <Link
            href={featured.href}
            className="group relative flex min-h-[11rem] flex-col justify-between rounded-2xl border border-stone-900 bg-stone-900 p-6 text-stone-50 transition-shadow hover:shadow-lg dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900 sm:min-h-[12rem] sm:col-span-2 lg:row-span-3 lg:min-h-0"
          >
            <span className="text-stone-400 dark:text-stone-500">
              {featured.icon}
            </span>
            <div>
              <p className={DNA_CAPTION}>Start here</p>
              <p className={`mt-1 ${HOME_EXPLORE_CARD_TITLE}`}>
                {featured.label}
              </p>
              <p className={`mt-2 max-w-sm ${DNA_BODY_ON_INVERSE}`}>
                {featured.description}
              </p>
            </div>
            <ExploreArrow className="absolute right-6 top-6" />
          </Link>

          {secondary.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className="group flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-4 transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-stone-500"
            >
              <span className="mt-0.5 flex-shrink-0 rounded-md bg-stone-100 p-2 text-stone-700 dark:bg-stone-900 dark:text-stone-200">
                {link.icon}
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="flex items-center justify-between gap-2">
                  <span className={DNA_LABEL_STRONG}>{link.label}</span>
                  <ExploreArrow className={DNA_CAPTION} />
                </span>
                <span className={`mt-0.5 block ${DNA_BODY}`}>
                  {link.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="home-pulse-heading" className="space-y-5">
        <p id="home-pulse-heading" className={SECTION_LABEL_CLASS}>
          Market pulse
        </p>
        {fearGreed}
        {worldMarkets}
      </section>

      <section aria-labelledby="home-ai-heading" data-testid="home-ai-outlook">
        <p
          id="home-ai-heading"
          className={`mb-4 sm:mb-6 ${SECTION_LABEL_CLASS}`}
        >
          AI outlook
        </p>
        {stockOfTheDay}
      </section>
    </div>
  );
}
