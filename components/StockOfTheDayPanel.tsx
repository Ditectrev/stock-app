"use client";

import { DNA_BODY, DNA_BODY_SECONDARY, DNA_CAPTION, DNA_EYEBROW, DNA_SUBHEADING } from "@/lib/design-dna";
import type { PricingTier, StockOfTheDay, StockOfTheDayResult } from "@/types";
import { getAiSubscriptionGateMessage } from "@/lib/ai-subscription-ux";
import { ConfidenceInfoTooltip } from "@/components/ConfidenceInfoTooltip";
import { InsightPanel, InsightPanelHeader } from "@/components/InsightPanel";
import { SubscriptionGate } from "@/components/ProductShell";
import { AiFeatureErrorNotice } from "@/components/AiFeatureErrorNotice";
import { MARKET_DOWN_TEXT, MARKET_UP_TEXT } from "@/lib/market-semantics";
import { HOME_INSTRUMENT_PANEL, HOME_PRIMARY_BUTTON } from "@/lib/home-ui";

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
      className={`${DNA_EYEBROW} font-bold ${
        isBuy ? MARKET_UP_TEXT : MARKET_DOWN_TEXT
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
      className={`rounded-lg border border-stone-200 border-l-4 bg-stone-100 p-4 dark:border-stone-700 dark:bg-stone-800 ${borderClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={DNA_EYEBROW}>{title}</p>
          <p className={`mt-1 ${DNA_SUBHEADING}`}>
            <span className="tabular-nums">{pick.symbol}</span>
            <span className={`font-normal ${DNA_CAPTION}`}>
              {" "}
              · {pick.name}
            </span>
          </p>
        </div>
        <StanceLabel recommendation={pick.recommendation} />
      </div>
      <p className={`mt-2 flex items-center ${DNA_CAPTION}`}>
        <span>Confidence {Math.round(pick.confidence * 100)}%</span>
        <ConfidenceInfoTooltip variant="stockOfTheDay" />
      </p>
      <p className={`mt-3 ${DNA_BODY}`}>{pick.rationale.join(" ")}</p>
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
      data-testid="stock-of-the-day-panel"
    >
      {showLockedGateOnly ? (
        <SubscriptionGate
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
                      <p className={`${DNA_CAPTION}`}>
                        Generated{" "}
                        {new Date(item.generatedAt).toLocaleDateString()}
                      </p>
                    ) : undefined
                  }
                />
              </div>
            )}

            {loading && (
              <p className={`${DNA_BODY_SECONDARY}`}>
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
              <AiFeatureErrorNotice
                error={error}
                title="Stock of the day unavailable"
                defaultTone="warning"
              />
            )}

            {!loading && !item && !locked && !error && (
              <p className={`${DNA_BODY_SECONDARY}`}>
                No stock-of-the-day result yet. Refresh to try again.
              </p>
            )}
          </div>

          {showLockedOverlay && (
            <SubscriptionGate
              title={!showTitle ? "Daily AI stock ideas" : "Stock of the day"}
              message={gateMessage}
              ctaHref="/pricing"
              ctaLabel="View AI plans"
              align="center"
              overlay
              buttonClassName={HOME_PRIMARY_BUTTON}
            />
          )}
        </>
      )}
    </div>
  );

  return <InsightPanel embedded={embedded}>{shell}</InsightPanel>;
}
