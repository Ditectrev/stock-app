"use client";

import Link from "next/link";
import type { AIPredictionReport, PricingTier } from "@/types";
import { AI_PREDICTION_SECTIONS } from "@/lib/ai-prediction";
import { ConfidenceInfoTooltip } from "@/components/ConfidenceInfoTooltip";
import { getAiSubscriptionGateMessage } from "@/lib/ai-subscription-ux";
import { isMissingByokApiKeyMessage } from "@/lib/missing-byok-api-key";

interface AIPredictionPanelProps {
  prediction: AIPredictionReport | null;
  loading: boolean;
  locked: boolean;
  error?: string | null;
  pricingTier?: PricingTier | null;
}

function RecommendationBadge({
  recommendation,
}: {
  recommendation?: AIPredictionReport["recommendation"];
}) {
  const recommendationValue = recommendation ?? "hold";
  const styles =
    recommendationValue === "buy"
      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
      : recommendationValue === "sell"
        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles}`}
    >
      {recommendationValue.toUpperCase()}
    </span>
  );
}

function FactorList({
  title,
  items,
  variant = "default",
}: {
  title: string;
  items: string[];
  variant?: "default" | "risk";
}) {
  if (items.length === 0) return null;

  const headingClass =
    variant === "risk"
      ? "font-medium text-amber-800 dark:text-amber-200 mb-1"
      : "font-medium text-gray-900 dark:text-gray-100 mb-1";

  return (
    <div>
      <h3 className={headingClass}>{title}</h3>
      <ul className="space-y-1 text-gray-600 dark:text-gray-300">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}

export function AIPredictionPanel({
  prediction,
  loading,
  locked,
  error,
  pricingTier,
}: AIPredictionPanelProps) {
  const factors = prediction?.factors;
  const symbolSpecific = prediction?.symbolSpecific;

  return (
    <section className="mt-6">
      <div className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
        <div
          className={locked ? "blur-sm select-none pointer-events-none" : ""}
        >
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              AI Prediction
            </h2>
            {prediction && (
              <div className="flex items-center gap-2">
                <RecommendationBadge
                  recommendation={prediction.recommendation}
                />
                <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    Confidence {Math.round(prediction.confidence * 100)}%
                  </span>
                  <ConfidenceInfoTooltip variant="prediction" />
                </span>
              </div>
            )}
          </div>

          {loading && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Generating AI prediction...
            </p>
          )}

          {!loading && prediction && (
            <div className="space-y-4 text-sm">
              <p className="text-gray-700 dark:text-gray-200">
                {prediction.summary}
              </p>

              {AI_PREDICTION_SECTIONS.map((section) => (
                <FactorList
                  key={section.id}
                  title={section.label}
                  items={factors?.[section.id] ?? []}
                  variant={section.id === "risks" ? "risk" : "default"}
                />
              ))}

              {symbolSpecific && symbolSpecific.bullets.length > 0 && (
                <FactorList
                  title={symbolSpecific.title}
                  items={symbolSpecific.bullets}
                />
              )}
            </div>
          )}

          {!loading && !prediction && !locked && error && (
            <div
              className={`rounded-md border px-3 py-3 text-sm ${
                isMissingByokApiKeyMessage(error)
                  ? "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-600 dark:bg-blue-950/50 dark:text-blue-100"
                  : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200"
              }`}
            >
              <p className="font-medium">{error}</p>
              {isMissingByokApiKeyMessage(error) && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs opacity-90">
                    Add your API key on the Profile page under API keys, then
                    pick the same provider as your explanation model.
                  </p>
                  <a
                    href="/profile"
                    className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Open profile
                  </a>
                </div>
              )}
            </div>
          )}

          {!loading && !prediction && !locked && !error && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No AI prediction returned yet. Try another symbol or refresh.
            </p>
          )}
        </div>

        {locked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-white/70 px-6 text-center dark:bg-gray-900/70">
            <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">
              {getAiSubscriptionGateMessage(pricingTier ?? undefined)}
            </p>
            <Link
              href="/pricing"
              className="mt-3 inline-flex items-center rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
            >
              Upgrade to unlock
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
