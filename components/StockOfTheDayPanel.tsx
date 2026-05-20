"use client";

import Link from "next/link";
import type { PricingTier, StockOfTheDay, StockOfTheDayResult } from "@/types";
import { getAiSubscriptionGateMessage } from "@/lib/ai-subscription-ux";
import { ConfidenceInfoTooltip } from "@/components/ConfidenceInfoTooltip";
import { isMissingByokApiKeyMessage } from "@/lib/missing-byok-api-key";

interface StockOfTheDayPanelProps {
  item: StockOfTheDayResult | null;
  loading: boolean;
  locked: boolean;
  error?: string | null;
  /** When locked, used to explain which upgrade path applies. */
  pricingTier?: PricingTier | null;
}

export function StockOfTheDayPanel({
  item,
  loading,
  locked,
  error,
  pricingTier,
}: StockOfTheDayPanelProps) {
  const renderPick = (title: string, pick: StockOfTheDay) => (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
            {pick.symbol} - {pick.name}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold uppercase ${
            pick.recommendation === "buy"
              ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
              : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
          }`}
        >
          {pick.recommendation}
        </span>
      </div>
      <p className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
        <span>Confidence {Math.round(pick.confidence * 100)}%</span>
        <ConfidenceInfoTooltip variant="stockOfTheDay" />
      </p>
      <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
        {pick.rationale.map((reason) => (
          <li key={reason}>- {reason}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <section className="mt-6 sm:mt-8 lg:mt-10">
      <div className="p-4 sm:p-6 rounded-lg shadow-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 relative overflow-hidden">
        <div
          className={locked ? "blur-sm select-none pointer-events-none" : ""}
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              AI stock ideas of the day
            </h2>
            {item && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Generated {new Date(item.generatedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {loading && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Computing today&apos;s top pick...
            </p>
          )}

          {!loading && item && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {renderPick("Stock of the day to buy", item.buy)}
              {renderPick("Stock of the day to sell", item.sell)}
            </div>
          )}

          {!loading && !item && !locked && error && (
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

          {!loading && !item && !locked && !error && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No stock-of-the-day result yet. Refresh to try again.
            </p>
          )}
        </div>

        {locked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-gray-900/70 px-6 text-center">
            <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">
              {getAiSubscriptionGateMessage(pricingTier ?? undefined)}
            </p>
            <Link
              href="/pricing"
              className="mt-3 inline-flex items-center rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
            >
              View AI plans
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
