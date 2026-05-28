"use client";

/**
 * PricingPage component
 * Displays all five pricing tiers in a comparison format.
 * Requirements: 22.1, 22.2, 22.3, 22.4
 */

import { useState } from "react";
import { PricingTier, PricingTierInfo } from "@/types";

const CHECK_ICON = (
  <svg
    className="w-4 h-4 text-green-500 flex-shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

interface PricingCardProps {
  tier: PricingTierInfo;
  isPopular?: boolean;
  onSelect: (tier: PricingTier) => void;
  isCurrentTier?: boolean;
  featured?: boolean;
}

function PricingCard({
  tier,
  isPopular,
  onSelect,
  isCurrentTier,
  featured,
}: PricingCardProps) {
  const isFree = tier.price === 0;

  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl border p-6 transition-shadow
        ${
          isPopular
            ? "border-stone-900 shadow-lg shadow-stone-400/20 dark:border-stone-100 dark:shadow-stone-900/40"
            : "border-stone-200 dark:border-stone-700"
        }
        ${
          featured
            ? "bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900"
            : "bg-white dark:bg-stone-900"
        }`}
    >
      {isPopular && (
        <div className="absolute right-4 top-4">
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-900 dark:bg-stone-900 dark:text-stone-100">
            Most Popular
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 pr-24">
        <h3
          className={`h-[3.5rem] text-lg font-bold ${
            featured
              ? "text-stone-100 dark:text-stone-900"
              : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {tier.name}
        </h3>
        <p
          className={`mt-1 h-[5.5rem] overflow-hidden text-sm ${
            featured
              ? "text-stone-300 dark:text-stone-600"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {tier.description}
        </p>
      </div>

      {/* Price */}
      <div className="mb-6 h-[3.5rem]">
        {isFree ? (
          <span
            className={`text-4xl font-extrabold ${
              featured
                ? "text-stone-100 dark:text-stone-900"
                : "text-gray-900 dark:text-gray-100"
            }`}
          >
            Free
          </span>
        ) : (
          <div className="flex items-end gap-1">
            <span
              className={`text-4xl font-extrabold ${
                featured
                  ? "text-stone-100 dark:text-stone-900"
                  : "text-gray-900 dark:text-gray-100"
              }`}
            >
              €{tier.price}
            </span>
            <span
              className={`mb-1 text-sm ${
                featured
                  ? "text-stone-300 dark:text-stone-600"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              / mo
            </span>
          </div>
        )}
      </div>

      {/* CTA button */}
      <button
        onClick={() => onSelect(tier.tier)}
        disabled={isCurrentTier}
        className={`mb-6 w-full whitespace-nowrap rounded-lg px-4 py-2.5 text-center text-sm font-semibold leading-none tracking-normal transition-colors
          ${
            isCurrentTier
              ? "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-default"
              : featured
                ? "bg-stone-100 text-stone-900 hover:bg-stone-200 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800"
                : "bg-stone-900 hover:bg-stone-700 text-stone-100 dark:bg-stone-100 dark:hover:bg-stone-300 dark:text-stone-900"
          }`}
        aria-label={
          isCurrentTier
            ? `Current plan: ${tier.name}`
            : `Get started with ${tier.name}`
        }
      >
        {isCurrentTier ? "Current" : isFree ? "Start" : "Subscribe"}
      </button>

      {/* Feature list */}
      <ul className="space-y-2.5 flex-1" aria-label={`${tier.name} features`}>
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            {CHECK_ICON}
            <span
              className={`text-sm ${
                featured
                  ? "text-stone-200 dark:text-stone-700"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface PricingPageProps {
  tiers: PricingTierInfo[];
  currentTier?: PricingTier;
  onSelectTier?: (tier: PricingTier) => void;
}

export function PricingPage({
  tiers,
  currentTier,
  onSelectTier,
}: PricingPageProps) {
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const featuredTier = tiers.find((tier) => tier.tier === "ADS_FREE");
  const secondaryTiers = tiers.filter((tier) => tier.tier !== "ADS_FREE");

  const handleSelect = (tier: PricingTier) => {
    setSelectedTier(tier);
    onSelectTier?.(tier);
  };

  return (
    <section
      className="py-12 px-4 max-w-7xl mx-auto"
      aria-labelledby="pricing-heading"
    >
      {/* Header */}
      <div className="mb-10 max-w-3xl lg:mb-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
          Pricing
        </p>
        <h2
          id="pricing-heading"
          className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-4xl"
        >
          Simple, transparent pricing
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-gray-500 dark:text-gray-400">
          Start free. Upgrade when you need AI features or an ad-free
          experience.
        </p>
      </div>

      {/* Tier cards */}
      <div className="space-y-6">
        {featuredTier && (
          <div className="grid grid-cols-1">
            <PricingCard
              tier={featuredTier}
              featured
              isPopular
              isCurrentTier={currentTier === featuredTier.tier}
              onSelect={handleSelect}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {secondaryTiers.map((tier) => (
            <PricingCard
              key={tier.tier}
              tier={tier}
              isCurrentTier={currentTier === tier.tier}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>

      {/* Confirmation feedback */}
      {selectedTier && selectedTier !== currentTier && (
        <p
          className="mt-8 text-center text-sm text-blue-600 dark:text-blue-400"
          role="status"
          aria-live="polite"
        >
          You selected{" "}
          <strong>{tiers.find((t) => t.tier === selectedTier)?.name}</strong>.
          Complete checkout to activate.
        </p>
      )}
    </section>
  );
}
