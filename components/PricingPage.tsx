"use client";

/**
 * PricingPage component
 * Displays all five pricing tiers in a comparison format.
 * Requirements: 22.1, 22.2, 22.3, 22.4
 */

import {
  DNA_BADGE,
  DNA_BADGE_POPULAR,
  DNA_BODY,
  DNA_BODY_ON_INVERSE,
  DNA_BODY_SECONDARY,
  DNA_BUTTON_LABEL,
  DNA_CAPTION,
  DNA_DISPLAY,
  DNA_EYEBROW,
  DNA_HEADING,
  DNA_PRICE,
  DNA_PRICE_SUFFIX,
  DNA_SUBHEADING,
} from "@/lib/design-dna";
import { useState } from "react";
import { PricingTier, PricingTierInfo } from "@/types";
import { HOME_DISABLED_BUTTON } from "@/lib/home-ui";

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
  const titleClass = featured
    ? "text-stone-100 dark:text-stone-900"
    : "text-stone-900 dark:text-stone-50";
  const descriptionClass = featured ? DNA_BODY_ON_INVERSE : DNA_BODY;
  const featureTextClass = featured
    ? "font-sans text-base leading-relaxed text-stone-200 dark:text-stone-700"
    : `font-sans ${DNA_BODY}`;
  const priceMutedClass = featured
    ? "text-stone-300 dark:text-stone-600"
    : "text-stone-600 dark:text-stone-400";
  const priceNumeralClass = featured
    ? "text-stone-100 dark:text-stone-900"
    : "text-stone-900 dark:text-stone-50";
  const dividerClass = featured
    ? "border-stone-700/60 dark:border-stone-300/60"
    : "border-stone-200 dark:border-stone-700";

  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl border p-6 transition-shadow sm:p-7
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
          <span className={`${DNA_BADGE_POPULAR} ${DNA_BADGE}`}>
            Most Popular
          </span>
        </div>
      )}

      <div
        className={
          featured
            ? "flex flex-1 flex-col gap-6 lg:flex-row lg:items-start lg:gap-10"
            : "flex flex-1 flex-col"
        }
      >
        <div
          className={
            featured ? "lg:min-w-[16rem] lg:flex-1" : "flex flex-1 flex-col"
          }
        >
          <div className="pr-24">
            <h3 className={`font-sans ${DNA_SUBHEADING} ${titleClass}`}>
              {tier.name}
            </h3>
            <p className={`mt-2 font-sans ${descriptionClass}`}>
              {tier.description}
            </p>
          </div>

          <div
            className={`mt-6 border-t pt-6 ${dividerClass} ${
              featured ? "lg:mt-8" : ""
            }`}
          >
            {isFree ? (
              <div>
                <p className={`font-sans ${DNA_PRICE} ${priceNumeralClass}`}>
                  Included
                </p>
                <p
                  className={`mt-1 font-sans ${DNA_CAPTION} ${priceMutedClass}`}
                >
                  No monthly charge
                </p>
              </div>
            ) : (
              <p className="font-sans leading-none">
                <span className={`${DNA_PRICE} ${priceNumeralClass}`}>
                  €{tier.price}
                </span>
                <span className={`ml-2 ${DNA_PRICE_SUFFIX} ${priceMutedClass}`}>
                  / mo
                </span>
              </p>
            )}
          </div>

          <button
            onClick={() => onSelect(tier.tier)}
            disabled={isCurrentTier}
            className={`mt-4 w-full whitespace-nowrap rounded-lg px-4 py-2.5 text-center ${DNA_BUTTON_LABEL} transition-colors
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
        </div>

        <ul
          className={`space-y-2.5 ${
            featured
              ? "flex-1 border-t pt-6 lg:mt-0 lg:border-t-0 lg:pt-0"
              : "mt-6 flex-1 border-t pt-6"
          } ${dividerClass}`}
          aria-label={`${tier.name} features`}
        >
          {visibleFeatures.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              {FEATURE_MARK}
              <span className={featureTextClass}>{feature}</span>
            </li>
          ))}
          {hiddenCount > 0 && (
            <li
              className={`pl-6 font-sans ${featured ? DNA_BODY_ON_INVERSE : DNA_BODY_SECONDARY}`}
            >
              +{hiddenCount} more plan details
            </li>
          )}
        </ul>
      </div>
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
            <p className={`mt-2 ${DNA_BODY}`}>
              Free and Local AI fit research-first users. BYOK is best for
              provider flexibility. Ditectrev AI removes setup with hosted
              infrastructure.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <p className={DNA_EYEBROW}>Quick compare</p>
            <div className={`mt-3 space-y-3 ${DNA_BODY}`}>
              {COMPARE_CAPABILITIES.map(({ label, needle }) => (
                <div
                  key={label}
                  className="border-t border-stone-200 pt-3 first:border-t-0 first:pt-0 dark:border-stone-700"
                >
                  <p className={DNA_EYEBROW}>{label}</p>
                  <p className={`mt-1 leading-relaxed ${DNA_CAPTION}`}>
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
          className={`mt-8 text-center ${DNA_BODY}`}
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
