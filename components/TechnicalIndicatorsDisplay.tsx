"use client";

/**
 * TechnicalIndicatorsDisplay Component
 * Signal readout layout: sentiment strip + vertical indicator ledger.
 *
 * Requirements: 5.1, 5.3, 5.4, 5.5, 5.6
 */

import { TechnicalIndicators } from "@/types";
import { useTheme } from "@/lib/theme-context";
import { useState } from "react";
import { SymbolTabShell, SymbolTabSkeleton } from "@/components/SymbolTabShell";
import {
  SYMBOL_DIVIDER,
  SYMBOL_HELP_BUTTON,
  SYMBOL_MUTED_TEXT,
  SYMBOL_PANEL_TITLE,
  SYMBOL_TOOLTIP_SURFACE,
} from "@/lib/symbol-ui";

export interface TechnicalIndicatorsDisplayProps {
  indicators: TechnicalIndicators | null | undefined;
}

type Signal = "overpriced" | "underpriced" | "fair";

interface IndicatorRowData {
  name: string;
  shortName: string;
  tooltip: string;
  signal: Signal;
  values: { label: string; value: string }[];
}

const SIGNAL_LABELS: Record<Signal, string> = {
  overpriced: "Overpriced",
  underpriced: "Underpriced",
  fair: "Fairly Priced",
};

const SENTIMENT_LABELS: Record<Signal, string> = {
  overpriced: "Overall: Appears Overpriced",
  underpriced: "Overall: Appears Underpriced",
  fair: "Overall: Appears Fairly Priced",
};

function getSignalAccent(signal: Signal, isDark: boolean) {
  switch (signal) {
    case "overpriced":
      return {
        border: isDark ? "border-red-500/70" : "border-red-500",
        badge: isDark ? "bg-red-950/50 text-red-300" : "bg-red-50 text-red-700",
        text: isDark ? "text-red-300" : "text-red-700",
      };
    case "underpriced":
      return {
        border: isDark ? "border-green-500/70" : "border-green-600",
        badge: isDark
          ? "bg-green-950/50 text-green-300"
          : "bg-green-50 text-green-700",
        text: isDark ? "text-green-300" : "text-green-700",
      };
    default:
      return {
        border: isDark ? "border-stone-500" : "border-stone-400",
        badge: isDark
          ? "bg-stone-800 text-stone-300"
          : "bg-stone-100 text-stone-700",
        text: isDark ? "text-stone-300" : "text-stone-700",
      };
  }
}

function buildIndicatorRows(
  indicators: TechnicalIndicators
): IndicatorRowData[] {
  return [
    {
      name: "RSI (Relative Strength Index)",
      shortName: "RSI",
      tooltip:
        "RSI measures the speed and magnitude of recent price changes on a scale of 0 to 100. Values above 70 may suggest the asset is overpriced, while values below 30 may suggest it is underpriced.",
      signal: indicators.rsi.signal,
      values: [{ label: "RSI", value: indicators.rsi.value.toFixed(2) }],
    },
    {
      name: "MACD",
      shortName: "MACD",
      tooltip:
        "Moving Average Convergence Divergence tracks the relationship between two moving averages of price. A positive histogram may suggest upward momentum, while a negative histogram may suggest downward momentum.",
      signal: indicators.macd.trend,
      values: [
        { label: "MACD", value: indicators.macd.value.toFixed(4) },
        { label: "Signal", value: indicators.macd.signal.toFixed(4) },
        { label: "Histogram", value: indicators.macd.histogram.toFixed(4) },
      ],
    },
    {
      name: "Moving Averages",
      shortName: "Moving averages",
      tooltip:
        "Moving averages smooth out price data over a period. When the 50-day average is above the 200-day average, it may suggest an upward trend. When below, it may suggest a downward trend.",
      signal: indicators.movingAverages.signal,
      values: [
        { label: "MA 50", value: indicators.movingAverages.ma50.toFixed(2) },
        { label: "MA 200", value: indicators.movingAverages.ma200.toFixed(2) },
      ],
    },
    {
      name: "Bollinger Bands",
      shortName: "Bollinger",
      tooltip:
        "Bollinger Bands consist of a middle band (moving average) with upper and lower bands based on standard deviation. Prices near the upper band may indicate the asset is overpriced, while prices near the lower band may indicate it is underpriced.",
      signal: indicators.bollingerBands.signal,
      values: [
        { label: "Upper", value: indicators.bollingerBands.upper.toFixed(2) },
        { label: "Middle", value: indicators.bollingerBands.middle.toFixed(2) },
        { label: "Lower", value: indicators.bollingerBands.lower.toFixed(2) },
      ],
    },
  ];
}

export function TechnicalIndicatorsDisplay({
  indicators,
}: TechnicalIndicatorsDisplayProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (!indicators) {
    return (
      <SymbolTabShell
        eyebrow="Market signals"
        title="Technical Indicators"
        ariaLabel="Technical Indicators"
      >
        <SymbolTabSkeleton blocks={4} />
      </SymbolTabShell>
    );
  }

  const rows = buildIndicatorRows(indicators);
  const sentiment = getSignalAccent(indicators.overallSentiment, isDark);

  return (
    <SymbolTabShell
      eyebrow="Market signals"
      title="Technical Indicators"
      ariaLabel="Technical Indicators"
    >
      <div
        data-testid="sentiment-gauge"
        className={`mb-6 flex flex-col gap-3 border-l-4 py-3 pl-4 sm:flex-row sm:items-center sm:justify-between ${sentiment.border}`}
      >
        <p
          className={`text-sm font-semibold sm:text-base ${SYMBOL_PANEL_TITLE}`}
        >
          {SENTIMENT_LABELS[indicators.overallSentiment]}
        </p>
        <span
          className={`inline-flex w-fit rounded-md px-3 py-1 text-xs font-medium sm:text-sm ${sentiment.badge}`}
        >
          {SIGNAL_LABELS[indicators.overallSentiment]}
        </span>
      </div>

      <ul role="list">
        {rows.map((row) => (
          <IndicatorRow key={row.name} row={row} isDark={isDark} />
        ))}
      </ul>
    </SymbolTabShell>
  );
}

function IndicatorRow({
  row,
  isDark,
}: {
  row: IndicatorRowData;
  isDark: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const accent = getSignalAccent(row.signal, isDark);

  return (
    <li
      className={`flex flex-col gap-3 border-stone-200 py-4 first:pt-0 last:pb-0 dark:border-stone-700 sm:flex-row sm:items-start sm:justify-between ${SYMBOL_DIVIDER} border-b last:border-b-0`}
    >
      <div className="min-w-0 flex-1">
        <div className="relative flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              isDark ? "text-stone-100" : "text-stone-900"
            }`}
          >
            {row.name}
          </span>
          <button
            type="button"
            className={SYMBOL_HELP_BUTTON}
            aria-label={`More info about ${row.name}`}
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
              {row.tooltip}
            </div>
          )}
        </div>
        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
          {row.values.map((v) => (
            <div key={v.label} className="flex items-baseline gap-2">
              <dt className={`text-xs ${SYMBOL_MUTED_TEXT}`}>{v.label}</dt>
              <dd
                className={`font-mono text-sm font-semibold tabular-nums ${
                  isDark ? "text-stone-100" : "text-stone-900"
                }`}
              >
                {v.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <span
        className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${accent.badge}`}
      >
        {SIGNAL_LABELS[row.signal]}
      </span>
    </li>
  );
}
