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
import { AccountNotice } from "@/components/AccountNotice";
import { marketChangeBadgeClass } from "@/lib/market-semantics";
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
  const styles = marketChangeBadgeClass(recommendationValue);

  return (
    <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${styles}`}>
      {recommendationValue.toUpperCase()}
    </span>
  );
}

type FactorId = (typeof AI_PREDICTION_SECTIONS)[number]["id"];

const MAX_FACTOR_BULLETS = 2;
const MAX_SYMBOL_BULLETS = 3;

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
              {items.slice(0, MAX_FACTOR_BULLETS).map((item, index) => (
                <li key={`${section!.id}-${index}`} className="flex gap-2">
                  <span aria-hidden="true" className="mt-1 text-xs">
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {items.length > MAX_FACTOR_BULLETS && (
              <p className={`mt-1 text-xs ${HOME_SUBTLE_TEXT}`}>
                +{items.length - MAX_FACTOR_BULLETS} more points in this section
              </p>
            )}
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

function isHostedSetupMessage(error: string): boolean {
  const normalized = error.toLowerCase();
  return (
    normalized.includes("hosted ai is not configured") ||
    normalized.includes("ai_provider") ||
    normalized.includes("ai_api_key")
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
                  Building your AI prediction...
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
                    <div className="rounded-lg border border-stone-200 bg-stone-100 p-3 dark:border-stone-700 dark:bg-stone-800">
                      <p className="mb-1 text-sm font-semibold text-stone-900 dark:text-stone-100">
                        {symbolSpecific.title}
                      </p>
                      <ul className={`space-y-1 text-sm ${HOME_MUTED_TEXT}`}>
                        {symbolSpecific.bullets
                          .slice(0, MAX_SYMBOL_BULLETS)
                          .map((item, index) => (
                            <li
                              key={`${symbolSpecific.title}-${index}`}
                              className="flex gap-2"
                            >
                              <span aria-hidden="true">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                      </ul>
                      {symbolSpecific.bullets.length > MAX_SYMBOL_BULLETS && (
                        <p className={`mt-1 text-xs ${HOME_SUBTLE_TEXT}`}>
                          +{symbolSpecific.bullets.length - MAX_SYMBOL_BULLETS}{" "}
                          more symbol-specific notes
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!loading && !prediction && !locked && error && (
                <AccountNotice
                  tone={isHostedSetupMessage(error) ? "warning" : "error"}
                  title={
                    isHostedSetupMessage(error)
                      ? "Ditectrev AI configuration needed"
                      : "AI prediction unavailable"
                  }
                >
                  <span>{error}</span>
                  {isMissingByokApiKeyMessage(error) && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs">
                        Add your key in Profile → API keys, then select the same
                        provider as your explanations model.
                      </p>
                      <Link href="/profile" className={HOME_PRIMARY_BUTTON}>
                        Open profile
                      </Link>
                    </div>
                  )}
                  {isHostedSetupMessage(error) && (
                    <p className="mt-2 text-xs">
                      If you are on the Ditectrev AI plan, ask support to verify
                      deployment env setup for this region.
                    </p>
                  )}
                </AccountNotice>
              )}

              {!loading && !prediction && !locked && !error && (
                <p className={`text-sm ${HOME_SUBTLE_TEXT}`}>
                  No prediction yet. Try another symbol or refresh this panel.
                </p>
              )}
            </div>

            {showLockedOverlay && (
              <div className="absolute inset-0 rounded-xl bg-white text-stone-900 dark:bg-stone-950 dark:text-stone-100">
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
