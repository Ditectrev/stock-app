"use client";

/**
 * SymbolHeader Component
 * Displays symbol name and current price with change indicators
 *
 * Requirements: 2.4, 4.3
 */

import { SymbolData } from "@/types";
import { useTheme } from "@/lib/theme-context";

export interface SymbolHeaderProps {
  symbolData: SymbolData;
}

export function SymbolHeader({ symbolData }: SymbolHeaderProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const isPositive = symbolData.change >= 0;
  const changeColor = isPositive
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";

  return (
    <div
      className={`rounded-xl border p-4 sm:p-6 ${
        isDark
          ? "border-stone-700 bg-stone-800/60"
          : "border-stone-200/90 bg-white/90"
      }`}
      aria-label={`${symbolData.symbol} - ${symbolData.name}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        {/* Symbol and Name */}
        <div>
          <p
            className={`text-[0.65rem] font-semibold uppercase tracking-[0.16em] ${
              isDark ? "text-stone-400" : "text-stone-500"
            }`}
          >
            Symbol snapshot
          </p>
          <h1
            className={`text-2xl sm:text-3xl font-bold ${
              isDark ? "text-stone-100" : "text-stone-900"
            }`}
          >
            {symbolData.symbol}
          </h1>
          <p
            className={`text-base sm:text-lg ${
              isDark ? "text-stone-300" : "text-stone-600"
            }`}
          >
            {symbolData.name}
          </p>
        </div>

        {/* Price and Change */}
        <div
          className="text-left sm:text-right"
          aria-live="polite"
          aria-atomic="true"
        >
          <div
            className={`text-2xl sm:text-3xl font-bold ${
              isDark ? "text-stone-100" : "text-stone-900"
            }`}
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
          <div
            className={`text-sm ${isDark ? "text-stone-400" : "text-stone-500"}`}
          >
            Last updated: {new Date(symbolData.lastUpdated).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
