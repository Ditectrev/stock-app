"use client";

import Link from "next/link";
import type { PricingTier, StockOfTheDay, StockOfTheDayResult } from "@/types";
import { getAiSubscriptionGateMessage } from "@/lib/ai-subscription-ux";
import { ConfidenceInfoTooltip } from "@/components/ConfidenceInfoTooltip";
import {
  InsightPanel,
  InsightPanelGate,
  InsightPanelHeader,
} from "@/components/InsightPanel";
import { HOME_INSTRUMENT_PANEL, HOME_PRIMARY_BUTTON } from "@/lib/home-ui";
import { isMissingByokApiKeyMessage } from "@/lib/missing-byok-api-key";

interface StockOfTheDayPanelProps {
  item: StockOfTheDayResult | null;
  loading: boolean;
  locked: boolean;
  error?: string | null;
  pricingTier?: PricingTier | null;
  /** When true, omits outer section spacing (used inside HomeHub). */
  embedded?: boolean;
  /** When false, skips the in-panel title (HomeHub provides "AI outlook"). */
  showTitle?: boolean;
}

function StanceLabel({
  recommendation,
}: {
  recommendation: StockOfTheDay["recommendation"];
}) {
  const isBuy = recommendation === "buy";
  return (
    <span
      className={`text-[0.65rem] font-bold uppercase tracking-[0.16em] ${
        isBuy
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-rose-700 dark:text-rose-400"
      }`}
    >
      {recommendation}
    </span>
  );
}

function PickCard({
  title,
  pick,
  variant,
}: {
  title: string;
  pick: StockOfTheDay;
  variant: "buy" | "sell";
}) {
  const borderClass =
    variant === "buy"
      ? "border-l-emerald-600 dark:border-l-emerald-500"
      : "border-l-rose-600 dark:border-l-rose-500";

  return (
    <article
      className={`rounded-lg border border-stone-200/90 border-l-4 bg-stone-50/50 p-4 dark:border-stone-700 dark:bg-stone-900/40 ${borderClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
            {title}
          </p>
          <p className="mt-1 font-semibold text-stone-900 dark:text-stone-100">
            <span className="tabular-nums">{pick.symbol}</span>
            <span className="font-normal text-stone-500 dark:text-stone-400">
              {" "}
              · {pick.name}
            </span>
          </p>
        </div>
        <StanceLabel recommendation={pick.recommendation} />
      </div>
      <p className="mt-2 flex items-center text-xs text-stone-500 dark:text-stone-400">
        <span>Confidence {Math.round(pick.confidence * 100)}%</span>
        <ConfidenceInfoTooltip variant="stockOfTheDay" />
      </p>
      <ol className="mt-3 space-y-2 text-sm text-stone-600 dark:text-stone-300">
        {pick.rationale.map((reason, index) => (
          <li key={reason} className="flex gap-2">
            <span className="flex-shrink-0 tabular-nums text-stone-400 dark:text-stone-500">
              {index + 1}.
            </span>
            <span>{reason}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}

export function StockOfTheDayPanel({
  item,
  loading,
  locked,
  error,
  pricingTier,
  embedded = false,
  showTitle = true,
}: StockOfTheDayPanelProps) {
  const showLockedOverlay = locked && Boolean(item);
  const showLockedGateOnly = locked && !item && !loading;
  const gateMessage = getAiSubscriptionGateMessage(pricingTier ?? undefined);

  const shell = (
    <div
      className={`relative ${HOME_INSTRUMENT_PANEL} ${showLockedGateOnly ? "" : "min-h-[8rem]"}`}
    >
      {showLockedGateOnly ? (
        <InsightPanelGate
          title={!showTitle ? "Daily AI stock ideas" : undefined}
          message={gateMessage}
          ctaHref="/pricing"
          ctaLabel="View AI plans"
          buttonClassName={HOME_PRIMARY_BUTTON}
        />
      ) : (
        <>
          <div
            className={
              showLockedOverlay ? "blur-sm select-none pointer-events-none" : ""
            }
          >
            {(showTitle || item) && (
              <div className="text-stone-900 dark:text-stone-100">
                <InsightPanelHeader
                  title={showTitle ? "Daily AI stock ideas" : undefined}
                  subtitle={
                    showTitle
                      ? "One buy and one sell candidate from your configured model."
                      : undefined
                  }
                  right={
                    item ? (
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        Generated{" "}
                        {new Date(item.generatedAt).toLocaleDateString()}
                      </p>
                    ) : undefined
                  }
                />
              </div>
            )}

            {loading && (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Computing today&apos;s picks...
              </p>
            )}

            {!loading && item && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <div className="lg:col-span-3">
                  <PickCard title="Idea to buy" pick={item.buy} variant="buy" />
                </div>
                <div className="lg:col-span-2">
                  <PickCard
                    title="Idea to sell"
                    pick={item.sell}
                    variant="sell"
                  />
                </div>
              </div>
            )}

            {!loading && !item && !locked && error && (
              <div
                className={`rounded-lg border px-3 py-3 text-sm ${
                  isMissingByokApiKeyMessage(error)
                    ? "border-stone-300 bg-stone-100 text-stone-900 dark:border-stone-600 dark:bg-stone-900/80 dark:text-stone-100"
                    : "border-amber-300/80 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                }`}
              >
                <p className="font-medium">{error}</p>
                {isMissingByokApiKeyMessage(error) && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs opacity-90">
                      Add your API key on the Profile page under API keys, then
                      pick the same provider as your explanation model.
                    </p>
                    <Link href="/profile" className={HOME_PRIMARY_BUTTON}>
                      Open profile
                    </Link>
                  </div>
                )}
              </div>
            )}

            {!loading && !item && !locked && !error && (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                No stock-of-the-day result yet. Refresh to try again.
              </p>
            )}
          </div>

          {showLockedOverlay && (
            <div className="absolute inset-0 rounded-xl bg-stone-100/90 text-stone-900 dark:bg-stone-950/90 dark:text-stone-50">
              <InsightPanelGate
                message={gateMessage}
                ctaHref="/pricing"
                ctaLabel="View AI plans"
                align="center"
                overlay
                buttonClassName={HOME_PRIMARY_BUTTON}
              />
            </div>
          )}
        </>
      )}
    </div>
  );

  return <InsightPanel embedded={embedded}>{shell}</InsightPanel>;
}
