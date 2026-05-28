"use client";

import Link from "next/link";
import type { AIPredictionReport, PricingTier } from "@/types";
import { AI_PREDICTION_SECTIONS } from "@/lib/ai-prediction";
import { ConfidenceInfoTooltip } from "@/components/ConfidenceInfoTooltip";
import {
  InsightPanel,
  InsightPanelGate,
  InsightPanelHeader,
} from "@/components/InsightPanel";
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
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      {recommendationValue.toUpperCase()}
    </span>
  );
}

type FactorId = (typeof AI_PREDICTION_SECTIONS)[number]["id"];

const FACTOR_GROUPS: ReadonlyArray<{
  title: string;
  sectionIds: FactorId[];
  tone?: "default" | "risk";
}> = [
  { title: "Market setup", sectionIds: ["technical", "valuation"] },
  {
    title: "Macro context",
    sectionIds: ["sentiment", "macro", "globalMarkets"],
  },
  { title: "Risk watch", sectionIds: ["risks"], tone: "risk" },
];

function FactorGroup({
  title,
  sectionIds,
  factors,
  tone = "default",
}: {
  title: string;
  sectionIds: FactorId[];
  factors: AIPredictionReport["factors"] | undefined;
  tone?: "default" | "risk";
}) {
  const entries = sectionIds
    .map((id) => ({
      section: AI_PREDICTION_SECTIONS.find((x) => x.id === id),
      items: factors?.[id] ?? [],
    }))
    .filter((entry) => entry.section && entry.items.length > 0);

  if (entries.length === 0) return null;

  const shellClass =
    tone === "risk"
      ? "rounded-lg border border-amber-200/80 bg-amber-50/70 p-3 dark:border-amber-900/80 dark:bg-amber-950/30"
      : "rounded-lg border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-900/30";

  const headingClass =
    tone === "risk"
      ? "mb-2 text-sm font-semibold text-amber-900 dark:text-amber-200"
      : "mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100";

  return (
    <div className={shellClass}>
      <h3 className={headingClass}>{title}</h3>

      <div className="space-y-3">
        {entries.map(({ section, items }) => (
          <div key={section!.id}>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {section!.label}
            </p>
            <ul className="mt-1 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {items.map((item, index) => (
                <li key={`${section!.id}-${index}`} className="flex gap-2">
                  <span aria-hidden="true" className="mt-1 text-xs">
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function LockedGate({ pricingTier }: { pricingTier?: PricingTier | null }) {
  return (
    <InsightPanelGate
      title="AI Prediction"
      message={getAiSubscriptionGateMessage(pricingTier ?? undefined)}
      ctaHref="/pricing"
      ctaLabel="Upgrade to unlock"
      buttonClassName="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
    />
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
  const showLockedOverlay = locked && Boolean(prediction);
  const showLockedGateOnly = locked && !prediction && !loading;
  const gateMessage = getAiSubscriptionGateMessage(pricingTier ?? undefined);

  return (
    <InsightPanel>
      <div className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
        {showLockedGateOnly ? (
          <LockedGate pricingTier={pricingTier} />
        ) : (
          <>
            <div
              className={
                showLockedOverlay
                  ? "blur-sm select-none pointer-events-none"
                  : ""
              }
            >
              <InsightPanelHeader
                title="AI Prediction"
                right={
                  prediction ? (
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
                  ) : undefined
                }
              />

              {loading && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Generating AI prediction...
                </p>
              )}

              {!loading && prediction && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-200">
                    {prediction.summary}
                  </div>

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                    {FACTOR_GROUPS.map((group) => (
                      <FactorGroup
                        key={group.title}
                        title={group.title}
                        sectionIds={group.sectionIds}
                        factors={factors}
                        tone={group.tone}
                      />
                    ))}
                  </div>

                  {symbolSpecific && symbolSpecific.bullets.length > 0 && (
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50/70 p-3 dark:border-indigo-900/80 dark:bg-indigo-950/30">
                      <p className="mb-1 text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                        {symbolSpecific.title}
                      </p>
                      <ul className="space-y-1 text-sm text-indigo-900/90 dark:text-indigo-200/90">
                        {symbolSpecific.bullets.map((item, index) => (
                          <li
                            key={`${symbolSpecific.title}-${index}`}
                            className="flex gap-2"
                          >
                            <span aria-hidden="true">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
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
                        Add your API key on the Profile page under API keys,
                        then pick the same provider as your explanation model.
                      </p>
                      <Link
                        href="/profile"
                        className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        Open profile
                      </Link>
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

            {showLockedOverlay && (
              <div className="absolute inset-0 rounded-lg bg-white/75 text-gray-900 dark:bg-gray-900/80 dark:text-gray-100">
                <InsightPanelGate
                  message={gateMessage}
                  ctaHref="/pricing"
                  ctaLabel="Upgrade to unlock"
                  align="center"
                  overlay
                  buttonClassName="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                />
              </div>
            )}
          </>
        )}
      </div>
    </InsightPanel>
  );
}
