"use client";

/**
 * PricingPage component
 * Displays all five pricing tiers in a comparison format.
 * Requirements: 22.1, 22.2, 22.3, 22.4
 */

import { useState } from "react";
import { PricingTier, PricingTierInfo } from "@/types";
import {
  DNA_BODY,
  DNA_DISPLAY,
  DNA_EYEBROW,
  DNA_HEADING,
  DNA_PRICE,
  DNA_SUBHEADING,
} from "@/lib/design-dna";
import {
  HOME_DISABLED_BUTTON,
  HOME_MUTED_TEXT,
  HOME_SUBTLE_TEXT,
} from "@/lib/home-ui";

const FEATURE_MARK = (
  <span
    className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-stone-500 dark:bg-stone-400"
    aria-hidden="true"
  />
);

const COMPARE_CAPABILITIES = [
  { label: "AI explanations", needle: "ai metric explanations" },
  { label: "Chart analysis", needle: "ai chart analysis" },
  { label: "Bring your own keys", needle: "api q&a" },
  { label: "No ads", needle: "ads-free" },
] as const;

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
  const visibleFeatures = tier.features.slice(0, 5);
  const hiddenCount = Math.max(
    0,
    tier.features.length - visibleFeatures.length
  );

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
          className={`h-[3.5rem] ${DNA_SUBHEADING} ${
            featured
              ? "text-stone-100 dark:text-stone-900"
              : "text-stone-900 dark:text-stone-50"
          }`}
        >
          {tier.name}
        </h3>
        <p
          className={`mt-1 h-[5.5rem] overflow-hidden text-sm ${
            featured ? "text-stone-300 dark:text-stone-600" : HOME_SUBTLE_TEXT
          }`}
        >
          {tier.description}
        </p>
      </div>

      {/* Price */}
      <div className="mb-6 h-[3.5rem]">
        {isFree ? (
          <span
            className={`${DNA_PRICE} ${
              featured ? "text-stone-100 dark:text-stone-900" : ""
            }`}
          >
            Free
          </span>
        ) : (
          <div className="flex items-end gap-1">
            <span
              className={`${DNA_PRICE} ${
                featured ? "text-stone-100 dark:text-stone-900" : ""
              }`}
            >
              €{tier.price}
            </span>
            <span
              className={`mb-1 text-sm ${
                featured
                  ? "text-stone-300 dark:text-stone-600"
                  : HOME_SUBTLE_TEXT
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
              ? HOME_DISABLED_BUTTON
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
        {visibleFeatures.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            {FEATURE_MARK}
            <span
              className={`text-sm ${
                featured
                  ? "text-stone-200 dark:text-stone-700"
                  : HOME_MUTED_TEXT
              }`}
            >
              {feature}
            </span>
          </li>
        ))}
        {hiddenCount > 0 && (
          <li
            className={`pl-6 text-xs ${featured ? "text-stone-300 dark:text-stone-700" : HOME_SUBTLE_TEXT}`}
          >
            +{hiddenCount} more plan details
          </li>
        )}
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
  const planOrder = ["FREE", "LOCAL", "BYOK", "HOSTED_AI"] as const;
  const orderedTiers = planOrder
    .map((id) => tiers.find((tier) => tier.tier === id))
    .filter((tier): tier is PricingTierInfo => Boolean(tier));

  const handleSelect = (tier: PricingTier) => {
    setSelectedTier(tier);
    onSelectTier?.(tier);
  };

  const hasFeature = (tier: PricingTierInfo, needle: string) =>
    tier.features.some((feature) => feature.toLowerCase().includes(needle));

  return (
    <section
      className="py-12 px-4 max-w-7xl mx-auto"
      aria-labelledby="pricing-heading"
    >
      {/* Header */}
      <div className="mb-10 max-w-3xl lg:mb-12">
        <p className={DNA_EYEBROW}>Pricing</p>
        <h2 id="pricing-heading" className={`mt-2 ${DNA_DISPLAY}`}>
          Simple, transparent pricing
        </h2>
        <p className={`mt-3 max-w-2xl ${DNA_BODY}`}>
          Start free. Upgrade when you need AI features or an ad-free
          experience.
        </p>
      </div>

      {/* Tier cards */}
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_1.85fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <p className={DNA_EYEBROW}>Plan guide</p>
            <h3 className={`mt-2 ${DNA_HEADING}`}>
              Pick your workflow, not just a price
            </h3>
            <p className={`mt-2 text-sm ${HOME_MUTED_TEXT}`}>
              Free and Local AI fit research-first users. BYOK is best for
              provider flexibility. Ditectrev AI removes setup with hosted
              infrastructure.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <p
              className={`text-xs font-semibold uppercase tracking-[0.18em] ${HOME_SUBTLE_TEXT}`}
            >
              Quick compare
            </p>
            <div className="mt-3 space-y-3 text-sm">
              {COMPARE_CAPABILITIES.map(({ label, needle }) => (
                <div
                  key={label}
                  className="border-t border-stone-200 pt-3 first:border-t-0 first:pt-0 dark:border-stone-700"
                >
                  <p className={`font-medium ${HOME_MUTED_TEXT}`}>{label}</p>
                  <p
                    className={`mt-1 text-xs leading-relaxed ${HOME_SUBTLE_TEXT}`}
                  >
                    {orderedTiers
                      .map((tier) =>
                        hasFeature(tier, needle)
                          ? `${tier.name}: included`
                          : `${tier.name}: not included`
                      )
                      .join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

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
          className={`mt-8 text-center text-sm ${HOME_MUTED_TEXT}`}
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
