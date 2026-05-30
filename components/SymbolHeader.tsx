"use client";

/**
 * SymbolHeader Component
 * Displays symbol name and current price with change indicators
 *
 * Requirements: 2.4, 4.3
 */

import { SymbolData } from "@/types";
import {
  SYMBOL_INSTRUMENT_PANEL,
  SYMBOL_MUTED_TEXT,
  SYMBOL_SECTION_LABEL,
  SYMBOL_SUBTLE_TEXT,
} from "@/lib/symbol-ui";

export interface SymbolHeaderProps {
  symbolData: SymbolData;
}

export function SymbolHeader({ symbolData }: SymbolHeaderProps) {
  const isPositive = symbolData.change >= 0;
  const changeColor = isPositive
    ? "text-green-700 dark:text-green-400"
    : "text-red-700 dark:text-red-400";

  return (
    <div
      className={SYMBOL_INSTRUMENT_PANEL}
      aria-label={`${symbolData.symbol} - ${symbolData.name}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <p className={SYMBOL_SECTION_LABEL}>Symbol snapshot</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50">
            {symbolData.symbol}
          </h1>
          <p className={`text-base sm:text-lg ${SYMBOL_MUTED_TEXT}`}>
            {symbolData.name}
          </p>
        </div>

        <div
          className="text-left sm:text-right"
          aria-live="polite"
          aria-atomic="true"
        >
          <div
            className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50"
            aria-label={`Current price: $${symbolData.price.toFixed(2)}`}
          >
            ${symbolData.price.toFixed(2)}
          </div>
          <div
            className={`text-base sm:text-lg font-semibold ${changeColor}`}
            aria-label={`Change: ${isPositive ? "+" : ""}${symbolData.change.toFixed(2)} (${isPositive ? "+" : ""}${symbolData.changePercent.toFixed(2)}%)`}
          >
            {isPositive ? "+" : ""}
            {symbolData.change.toFixed(2)} ({isPositive ? "+" : ""}
            {symbolData.changePercent.toFixed(2)}%)
          </div>
          <div className={`text-sm ${SYMBOL_SUBTLE_TEXT}`}>
            Last updated: {new Date(symbolData.lastUpdated).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
