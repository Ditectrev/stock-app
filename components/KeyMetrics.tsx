"use client";

/**
 * KeyMetrics Component
 * Horizontal metric strip for overview tab.
 *
 * Requirements: 4.4, 4.5
 */

import { SymbolData } from "@/types";
import { useState } from "react";
import {
  SYMBOL_HELP_BUTTON,
  SYMBOL_INSTRUMENT_PANEL,
  SYMBOL_MUTED_TEXT,
  SYMBOL_METRIC,
  SYMBOL_PANEL_TITLE,
  SYMBOL_SECTION_LABEL,
  SYMBOL_TOOLTIP_SURFACE,
} from "@/lib/symbol-ui";

export interface KeyMetricsProps {
  symbolData: SymbolData;
}

interface Metric {
  label: string;
  value: string;
  tooltip: string;
}

export function KeyMetrics({ symbolData }: KeyMetricsProps) {
  const formatMarketCap = (value: number): string => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  };

  const formatVolume = (value: number): string => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toFixed(0);
  };

  const metrics: Metric[] = [
    {
      label: "Market Cap",
      value: formatMarketCap(symbolData.marketCap),
      tooltip:
        "Market Capitalization is the total value of all outstanding shares. It's calculated by multiplying the current stock price by the total number of shares. This metric helps investors understand the company's size and compare it to others.",
    },
    {
      label: "Volume",
      value: formatVolume(symbolData.volume),
      tooltip:
        "Volume represents the total number of shares traded during a given period. Higher volume typically indicates more interest in the stock and can suggest stronger price movements. It's a key indicator of liquidity.",
    },
    {
      label: "52-Week High",
      value: `$${symbolData.fiftyTwoWeekHigh.toFixed(2)}`,
      tooltip:
        "The highest price the stock has reached in the past 52 weeks (one year). This helps investors understand the stock's recent peak performance and can indicate resistance levels.",
    },
    {
      label: "52-Week Low",
      value: `$${symbolData.fiftyTwoWeekLow.toFixed(2)}`,
      tooltip:
        "The lowest price the stock has reached in the past 52 weeks (one year). This helps investors understand the stock's recent bottom and can indicate support levels.",
    },
    {
      label: "52-Week Range",
      value: `$${symbolData.fiftyTwoWeekLow.toFixed(2)} - $${symbolData.fiftyTwoWeekHigh.toFixed(2)}`,
      tooltip:
        "The range between the lowest and highest prices over the past year. This shows the stock's volatility and price movement over time. A wider range indicates higher volatility.",
    },
  ];

  return (
    <div className={SYMBOL_INSTRUMENT_PANEL} aria-label="Key metrics">
      <p className={SYMBOL_SECTION_LABEL}>At a glance</p>
      <h2 className={`mt-1 mb-4 ${SYMBOL_PANEL_TITLE}`}>Key Metrics</h2>
      <ul
        className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-y-0 lg:flex lg:divide-x lg:divide-y-0 border-stone-200 dark:border-stone-700"
        role="list"
      >
        {metrics.map((metric, index) => (
          <MetricStripItem
            key={metric.label}
            metric={metric}
            isLast={index === metrics.length - 1}
          />
        ))}
      </ul>
    </div>
  );
}

function MetricStripItem({
  metric,
  isLast,
}: {
  metric: Metric;
  isLast: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <li
      className={`flex flex-1 py-3 sm:px-4 sm:py-0 lg:px-5 ${
        !isLast
          ? "border-stone-200 dark:border-stone-700 sm:border-b lg:border-b-0 lg:border-r"
          : ""
      }`}
    >
      <div
        className="relative flex flex-1 flex-col gap-1"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-medium ${SYMBOL_MUTED_TEXT}`}>
            {metric.label}
          </span>
          <button
            type="button"
            aria-label={`More info about ${metric.label}`}
            className={SYMBOL_HELP_BUTTON}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
          >
            ?
          </button>
        </div>
        <span className={SYMBOL_METRIC}>{metric.value}</span>
        {showTooltip && (
          <div
            role="tooltip"
            className={SYMBOL_TOOLTIP_SURFACE}
            style={{
              top: "100%",
              left: 0,
              marginTop: "8px",
              zIndex: 10,
            }}
          >
            <div className="relative">{metric.tooltip}</div>
          </div>
        )}
      </div>
    </li>
  );
}
