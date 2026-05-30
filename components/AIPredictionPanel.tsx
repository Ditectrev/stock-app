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
import {
  HOME_CALLOUT,
  HOME_FACTOR_GROUP,
  HOME_INSTRUMENT_PANEL,
  HOME_MUTED_TEXT,
  HOME_PRIMARY_BUTTON,
  HOME_SUBTLE_TEXT,
} from "@/lib/home-ui";

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
        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";

  return (
    <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${styles}`}>
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
      : HOME_FACTOR_GROUP;

  const headingClass =
    tone === "risk"
      ? "mb-2 text-sm font-semibold text-amber-900 dark:text-amber-200"
      : `mb-2 text-sm font-semibold text-stone-900 dark:text-stone-100`;

  return (
    <div className={shellClass}>
      <h3 className={headingClass}>{title}</h3>

      <div className="space-y-3">
        {entries.map(({ section, items }) => (
          <div key={section!.id}>
            <p
              className={`text-xs font-medium uppercase tracking-wide ${HOME_SUBTLE_TEXT}`}
            >
              {section!.label}
            </p>
            <ul className={`mt-1 space-y-1 text-sm ${HOME_MUTED_TEXT}`}>
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
      buttonClassName={HOME_PRIMARY_BUTTON}
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
      <div className={`relative ${HOME_INSTRUMENT_PANEL}`}>
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
                      <span
                        className={`flex items-center text-xs ${HOME_SUBTLE_TEXT}`}
                      >
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
                <p className={`text-sm ${HOME_SUBTLE_TEXT}`}>
                  Generating AI prediction...
                </p>
              )}

              {!loading && prediction && (
                <div className="space-y-4">
                  <div className={`${HOME_CALLOUT} text-sm`}>
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
                    <div className="rounded-lg border border-stone-200/90 bg-stone-50/70 p-3 dark:border-stone-700 dark:bg-stone-900/30">
                      <p className="mb-1 text-sm font-semibold text-stone-900 dark:text-stone-100">
                        {symbolSpecific.title}
                      </p>
                      <ul className={`space-y-1 text-sm ${HOME_MUTED_TEXT}`}>
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
                  className={`rounded-lg border px-3 py-3 text-sm ${
                    isMissingByokApiKeyMessage(error)
                      ? "border-stone-300 bg-stone-50 text-stone-900 dark:border-stone-600 dark:bg-stone-900/40 dark:text-stone-100"
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
                      <Link href="/profile" className={HOME_PRIMARY_BUTTON}>
                        Open profile
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {!loading && !prediction && !locked && !error && (
                <p className={`text-sm ${HOME_SUBTLE_TEXT}`}>
                  No AI prediction returned yet. Try another symbol or refresh.
                </p>
              )}
            </div>

            {showLockedOverlay && (
              <div className="absolute inset-0 rounded-xl bg-white/75 text-stone-900 backdrop-blur-[1px] dark:bg-stone-950/80 dark:text-stone-100">
                <InsightPanelGate
                  message={gateMessage}
                  ctaHref="/pricing"
                  ctaLabel="Upgrade to unlock"
                  align="center"
                  overlay
                  buttonClassName={HOME_PRIMARY_BUTTON}
                />
              </div>
            )}
          </>
        )}
      </div>
    </InsightPanel>
  );
}
