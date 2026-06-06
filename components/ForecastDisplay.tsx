"use client";

/**
 * ForecastDisplay Component
 * Analyst desk layout: featured price band, ratings column, forecast tables.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { ForecastData } from "@/types";
import { useTheme } from "@/lib/theme-context";
import { useState } from "react";
import { SymbolTabShell, SymbolTabSkeleton } from "@/components/SymbolTabShell";
import {
  forecastRatingBarClass,
  marketChangeBgClass,
  marketChangeTextClass,
} from "@/lib/market-semantics";
import {
  SYMBOL_DIVIDER,
  SYMBOL_HELP_BUTTON,
  SYMBOL_MUTED_TEXT,
  SYMBOL_LABEL,
  SYMBOL_METRIC,
  SYMBOL_METRIC_EMPHASIS,
  SYMBOL_SECTION_TITLE,
  SYMBOL_SUBTLE_TEXT,
  SYMBOL_TOOLTIP_SURFACE,
} from "@/lib/symbol-ui";

export interface ForecastDisplayProps {
  forecast: ForecastData | null | undefined;
}

interface TooltipTriggerProps {
  label: string;
  tooltip: string;
}

const FORECAST_TOOLTIPS: Record<string, string> = {
  priceTargets:
    "Analyst price targets represent the range of prices that analysts expect the stock to reach. The low, average, and high values show the spread of analyst opinions.",
  analystRatings:
    "Analyst ratings show the distribution of recommendations from financial analysts covering this stock, ranging from Strong Buy to Strong Sell.",
  eps: "Earnings Per Share (EPS) forecasts compare analyst estimates with actual reported earnings. A positive surprise means the company earned more than expected.",
  revenue:
    "Revenue forecasts compare analyst estimates with actual reported revenue. Comparing actuals to estimates helps gauge company performance against expectations.",
};

const RATING_LABELS = [
  "Strong Buy",
  "Buy",
  "Hold",
  "Sell",
  "Strong Sell",
] as const;
const RATING_KEYS: Array<keyof ForecastData["analystRatings"]> = [
  "strongBuy",
  "buy",
  "hold",
  "sell",
  "strongSell",
];

function SectionLabel({ label, tooltip }: TooltipTriggerProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative flex items-center gap-2">
      <h3 className={SYMBOL_SECTION_TITLE}>{label}</h3>
      <button
        type="button"
        className={SYMBOL_HELP_BUTTON}
        aria-label={`More info about ${label}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
      >
        ?
      </button>
      {showTooltip && (
        <div
          role="tooltip"
          className={SYMBOL_TOOLTIP_SURFACE}
          style={{ top: "calc(100% + 6px)", left: 0 }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }
  if (Math.abs(value) >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  return `$${value.toFixed(2)}`;
}

function SurpriseIndicator({
  surprise,
  surprisePercent,
}: {
  surprise: number;
  surprisePercent?: number;
}) {
  const isBeat = surprise > 0;
  const colorClass = marketChangeTextClass(surprise);
  const bgClass = marketChangeBgClass(surprise);
  const label = isBeat ? "Beat" : "Missed";
  const icon = isBeat ? "▲" : "▼";

  return (
    <span
      data-testid={isBeat ? "earnings-beat" : "earnings-miss"}
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${colorClass} ${bgClass}`}
    >
      {icon} {label}
      {surprisePercent !== undefined &&
        ` (${surprisePercent > 0 ? "+" : ""}${surprisePercent.toFixed(2)}%)`}
    </span>
  );
}

function PriceTargetRange({
  low,
  average,
  high,
  isDark,
}: {
  low: number;
  average: number;
  high: number;
  isDark: boolean;
}) {
  const range = high - low;
  const avgPosition = range > 0 ? ((average - low) / range) * 100 : 50;

  return (
    <div className="mt-4">
      <div className="mb-1 flex justify-between text-xs">
        <span className={SYMBOL_SUBTLE_TEXT}>Low: ${low.toFixed(2)}</span>
        <span
          className={`font-medium ${isDark ? "text-stone-200" : "text-stone-800"}`}
        >
          Avg: ${average.toFixed(2)}
        </span>
        <span className={SYMBOL_SUBTLE_TEXT}>High: ${high.toFixed(2)}</span>
      </div>
      <div
        data-testid="price-target-range"
        className={`relative h-3 rounded-full ${isDark ? "bg-stone-700" : "bg-stone-200"}`}
      >
        <div
          className={`absolute h-3 w-full rounded-full ${isDark ? "bg-stone-600" : "bg-stone-300"}`}
        />
        <div
          data-testid="price-target-marker"
          className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 shadow ${
            isDark
              ? "border-stone-800 bg-stone-100"
              : "border-white bg-stone-900"
          }`}
          style={{
            left: `${avgPosition}%`,
            transform: `translateX(-50%) translateY(-50%)`,
          }}
        />
      </div>
    </div>
  );
}

export function ForecastDisplay({ forecast }: ForecastDisplayProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (!forecast) {
    return (
      <SymbolTabShell
        eyebrow="Street view"
        title="Forecast Data"
        ariaLabel="Forecast Data"
      >
        <SymbolTabSkeleton blocks={4} />
      </SymbolTabShell>
    );
  }

  const totalRatings = RATING_KEYS.reduce(
    (sum, key) => sum + forecast.analystRatings[key],
    0
  );

  return (
    <SymbolTabShell
      eyebrow="Street view"
      title="Forecast Data"
      ariaLabel="Forecast Data"
    >
      {/* Featured price target band */}
      <section
        className={`rounded-lg border p-4 sm:p-5 ${SYMBOL_DIVIDER} bg-stone-100 dark:bg-stone-800`}
      >
        <SectionLabel
          label="Price Targets"
          tooltip={FORECAST_TOOLTIPS.priceTargets}
        />
        <div className="mt-4 grid grid-cols-3 gap-4 text-center sm:gap-6">
          <div>
            <p className={`text-xs ${SYMBOL_SUBTLE_TEXT}`}>Low</p>
            <p className={`mt-1 ${SYMBOL_METRIC}`}>
              ${forecast.priceTargets.low.toFixed(2)}
            </p>
          </div>
          <div>
            <p className={`text-xs ${SYMBOL_SUBTLE_TEXT}`}>Average</p>
            <p className={`mt-1 ${SYMBOL_METRIC_EMPHASIS}`}>
              ${forecast.priceTargets.average.toFixed(2)}
            </p>
          </div>
          <div>
            <p className={`text-xs ${SYMBOL_SUBTLE_TEXT}`}>High</p>
            <p className={`mt-1 ${SYMBOL_METRIC}`}>
              ${forecast.priceTargets.high.toFixed(2)}
            </p>
          </div>
        </div>
        <PriceTargetRange
          low={forecast.priceTargets.low}
          average={forecast.priceTargets.average}
          high={forecast.priceTargets.high}
          isDark={isDark}
        />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Ratings — narrow column */}
        <section className="lg:col-span-4">
          <SectionLabel
            label="Analyst Ratings"
            tooltip={FORECAST_TOOLTIPS.analystRatings}
          />
          <div className="mt-3 space-y-2">
            {RATING_LABELS.map((label, index) => {
              const count = forecast.analystRatings[RATING_KEYS[index]];
              const pct = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
              return (
                <div key={label} className="flex items-center gap-2">
                  <span
                    className={`w-20 shrink-0 text-xs ${SYMBOL_MUTED_TEXT}`}
                  >
                    {label}
                  </span>
                  <div
                    className={`h-3 flex-1 overflow-hidden rounded-full ${
                      isDark ? "bg-stone-700" : "bg-stone-200"
                    }`}
                  >
                    <div
                      className={`h-full rounded-full ${forecastRatingBarClass(index, isDark)}`}
                      style={{
                        width: `${pct}%`,
                        minWidth: count > 0 ? "0.625rem" : undefined,
                      }}
                    />
                  </div>
                  <span
                    className={`w-6 text-right font-mono text-xs tabular-nums ${SYMBOL_MUTED_TEXT}`}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* EPS — wider column, table rows */}
        <section className="lg:col-span-8">
          <SectionLabel label="EPS Forecasts" tooltip={FORECAST_TOOLTIPS.eps} />
          <div
            className={`mt-3 overflow-hidden rounded-lg border ${SYMBOL_DIVIDER}`}
          >
            {forecast.epsForecasts.map((eps, i) => (
              <div
                key={eps.quarter}
                className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-4 ${
                  i > 0 ? `border-t ${SYMBOL_DIVIDER}` : ""
                }`}
              >
                <span className={SYMBOL_LABEL}>{eps.quarter}</span>
                <div className="flex items-center gap-3">
                  <div className="text-right text-xs">
                    <div className={SYMBOL_SUBTLE_TEXT}>
                      Est: ${eps.estimate.toFixed(2)}
                    </div>
                    {eps.actual !== undefined && (
                      <div
                        className={`font-semibold ${
                          isDark ? "text-stone-100" : "text-stone-900"
                        }`}
                      >
                        Act: ${eps.actual.toFixed(2)}
                      </div>
                    )}
                  </div>
                  {eps.surprise !== undefined && eps.surprise !== 0 && (
                    <SurpriseIndicator
                      surprise={eps.surprise}
                      surprisePercent={eps.surprisePercent}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Revenue — full-width ledger */}
      <section className="mt-6">
        <SectionLabel
          label="Revenue Forecasts"
          tooltip={FORECAST_TOOLTIPS.revenue}
        />
        <div
          className={`mt-3 overflow-hidden rounded-lg border ${SYMBOL_DIVIDER}`}
        >
          {forecast.revenueForecasts.map((rev, i) => {
            const hasActual = rev.actual !== undefined;
            const surprise = hasActual ? rev.actual! - rev.estimate : undefined;
            return (
              <div
                key={rev.quarter}
                className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-4 ${
                  i > 0 ? `border-t ${SYMBOL_DIVIDER}` : ""
                }`}
              >
                <span className={SYMBOL_LABEL}>{rev.quarter}</span>
                <div className="flex items-center gap-3">
                  <div className="text-right text-xs">
                    <div className={SYMBOL_SUBTLE_TEXT}>
                      Est: {formatCurrency(rev.estimate)}
                    </div>
                    {hasActual && (
                      <div
                        className={`font-semibold ${
                          isDark ? "text-stone-100" : "text-stone-900"
                        }`}
                      >
                        Act: {formatCurrency(rev.actual!)}
                      </div>
                    )}
                  </div>
                  {surprise !== undefined && surprise !== 0 && (
                    <SurpriseIndicator surprise={surprise} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </SymbolTabShell>
  );
}
