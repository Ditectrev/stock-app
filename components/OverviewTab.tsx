"use client";

/**
 * OverviewTab Component
 * Displays price chart, current price, change, and key metrics
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { SymbolData, PriceData, TimeRange } from "@/types";
import { ChartComponent } from "@/components/ChartComponent";
import { KeyMetrics } from "@/components/KeyMetrics";
import { useTheme } from "@/lib/theme-context";

export interface OverviewTabProps {
  symbolData: SymbolData;
  historicalData: PriceData[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

export function OverviewTab({
  symbolData,
  historicalData,
  timeRange,
  onTimeRangeChange,
}: OverviewTabProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const isPositive = symbolData.change >= 0;
  const changeColor = isPositive
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
  const changeBgColor = isPositive
    ? "bg-green-50 dark:bg-green-900/20"
    : "bg-red-50 dark:bg-red-900/20";

  return (
    <div className="space-y-6" role="tabpanel" aria-label="Overview">
      {/* Current Price Card */}
      <div
        className={`rounded-xl border p-4 sm:p-6 lg:p-8 ${
          isDark
            ? "border-stone-700 bg-stone-800/60"
            : "border-stone-200/90 bg-white/90"
        }`}
        aria-label="Current price information"
      >
        <p
          className={`mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] ${
            isDark ? "text-stone-400" : "text-stone-500"
          }`}
        >
          Live pricing
        </p>
        <h2
          className={`text-lg font-semibold mb-3 sm:mb-4 ${
            isDark ? "text-stone-100" : "text-stone-900"
          }`}
        >
          Current Price
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
          <div>
            <div
              className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${
                isDark ? "text-stone-100" : "text-stone-900"
              }`}
            >
              ${symbolData.price.toFixed(2)}
            </div>
            <div
              className={`text-lg sm:text-xl font-semibold mt-1 sm:mt-2 ${changeColor}`}
            >
              {isPositive ? "+" : ""}
              {symbolData.change.toFixed(2)} ({isPositive ? "+" : ""}
              {symbolData.changePercent.toFixed(2)}%)
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg ${changeBgColor}`}>
            <span className={`text-sm font-medium ${changeColor}`}>
              {isPositive ? "▲" : "▼"}{" "}
              {Math.abs(symbolData.changePercent).toFixed(2)}% Today
            </span>
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <div
        className={`rounded-xl border p-4 sm:p-6 lg:p-8 ${
          isDark
            ? "border-stone-700 bg-stone-800/60"
            : "border-stone-200/90 bg-white/90"
        }`}
      >
        <p
          className={`mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] ${
            isDark ? "text-stone-400" : "text-stone-500"
          }`}
        >
          Trend
        </p>
        <h2
          className={`text-lg font-semibold mb-3 sm:mb-4 ${
            isDark ? "text-stone-100" : "text-stone-900"
          }`}
        >
          Price Chart
        </h2>
        <div className="h-[300px] md:h-[380px] lg:h-[420px] xl:h-[500px]">
          <ChartComponent
            data={historicalData}
            type="area"
            initialTimeRange={timeRange}
            onTimeRangeChange={onTimeRangeChange}
            responsive={true}
            height={300}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <KeyMetrics symbolData={symbolData} />
    </div>
  );
}
