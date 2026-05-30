"use client";

/**
 * SeasonalHeatmap Component
 * Calendar-grid seasonality view inside instrument panel.
 *
 * Requirements: 7.1, 7.3, 7.4
 */

import { SeasonalData } from "@/types";
import { useTheme } from "@/lib/theme-context";
import { useState } from "react";
import {
  aggregateSeasonalData,
  getReturnForCell,
  getMonthLabel,
} from "@/lib/seasonal-utils";
import { SymbolTabShell, SymbolTabSkeleton } from "@/components/SymbolTabShell";
import { SYMBOL_DIVIDER, SYMBOL_SUBTLE_TEXT } from "@/lib/symbol-ui";

export interface SeasonalHeatmapProps {
  data: SeasonalData | null | undefined;
}

interface HoveredCell {
  year: number;
  month: number;
  value: number;
}

function getCellColor(value: number | undefined, isDark: boolean): string {
  if (value === undefined) {
    return isDark ? "bg-stone-700" : "bg-stone-100";
  }

  const abs = Math.abs(value);

  if (value > 0) {
    if (abs >= 5) return isDark ? "bg-green-600" : "bg-green-500";
    if (abs >= 2) return isDark ? "bg-green-700" : "bg-green-400";
    return isDark ? "bg-green-800" : "bg-green-200";
  }

  if (value < 0) {
    if (abs >= 5) return isDark ? "bg-red-600" : "bg-red-500";
    if (abs >= 2) return isDark ? "bg-red-700" : "bg-red-400";
    return isDark ? "bg-red-800" : "bg-red-200";
  }

  return isDark ? "bg-stone-600" : "bg-stone-200";
}

function getCellTextColor(value: number | undefined, isDark: boolean): string {
  if (value === undefined) {
    return isDark ? "text-stone-300" : "text-stone-600";
  }
  const abs = Math.abs(value);
  if (abs >= 2) return "text-white";
  return isDark ? "text-stone-200" : "text-stone-800";
}

export function SeasonalHeatmap({ data }: SeasonalHeatmapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [hovered, setHovered] = useState<HoveredCell | null>(null);

  const { monthlyReturns, averageByMonth, years } = aggregateSeasonalData(data);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  if (!data) {
    return (
      <SymbolTabShell
        eyebrow="Seasonality"
        title="Seasonal Patterns"
        ariaLabel="Seasonal Patterns"
      >
        <SymbolTabSkeleton blocks={3} blockClassName="h-10" />
      </SymbolTabShell>
    );
  }

  if (years.length === 0) {
    return (
      <SymbolTabShell
        eyebrow="Seasonality"
        title="Seasonal Patterns"
        ariaLabel="Seasonal Patterns"
      >
        <p className={`text-sm ${SYMBOL_SUBTLE_TEXT}`}>
          No seasonal data available.
        </p>
      </SymbolTabShell>
    );
  }

  return (
    <SymbolTabShell
      eyebrow="Seasonality"
      title="Seasonal Patterns"
      ariaLabel="Seasonal returns heatmap by month and year"
    >
      <div className="-mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0">
        <table
          className="w-full border-collapse text-xs md:text-sm"
          role="grid"
          aria-label="Seasonal returns heatmap by month and year"
        >
          <thead>
            <tr>
              <th
                className={`px-2 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wider ${SYMBOL_SUBTLE_TEXT}`}
              >
                Year
              </th>
              {months.map((m) => (
                <th
                  key={m}
                  className={`px-1 py-2 text-center text-[0.65rem] font-semibold uppercase tracking-wider ${SYMBOL_SUBTLE_TEXT}`}
                >
                  {getMonthLabel(m)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map((year) => (
              <tr key={year}>
                <td
                  className={`px-2 py-1 text-sm font-medium ${
                    isDark ? "text-stone-300" : "text-stone-700"
                  }`}
                >
                  {year}
                </td>
                {months.map((month) => {
                  const value = getReturnForCell(monthlyReturns, year, month);
                  const isHovered =
                    hovered?.year === year && hovered?.month === month;

                  return (
                    <td
                      key={month}
                      className="px-0.5 py-0.5"
                      onMouseEnter={() =>
                        value !== undefined
                          ? setHovered({ year, month, value })
                          : setHovered(null)
                      }
                      onMouseLeave={() => setHovered(null)}
                    >
                      <div
                        className={`relative rounded px-1.5 py-1.5 text-center transition-all sm:px-2 ${getCellColor(
                          value,
                          isDark
                        )} ${getCellTextColor(value, isDark)} ${
                          isHovered
                            ? "ring-2 ring-stone-500 ring-offset-1 dark:ring-stone-400"
                            : ""
                        }`}
                      >
                        {value !== undefined ? `${value.toFixed(1)}%` : "—"}

                        {isHovered && value !== undefined && (
                          <div
                            className={`absolute z-20 w-40 rounded-lg border p-2 text-xs shadow-lg ${
                              isDark
                                ? "border-stone-600 bg-stone-900 text-stone-200"
                                : "border-stone-200 bg-white text-stone-700"
                            }`}
                            style={{
                              bottom: "calc(100% + 4px)",
                              left: "50%",
                              transform: "translateX(-50%)",
                            }}
                          >
                            <div className="font-semibold">
                              {getMonthLabel(month)} {year}
                            </div>
                            <div>
                              Return:{" "}
                              <span
                                className={
                                  value >= 0
                                    ? isDark
                                      ? "text-green-400"
                                      : "text-green-600"
                                    : isDark
                                      ? "text-red-400"
                                      : "text-red-600"
                                }
                              >
                                {value >= 0 ? "+" : ""}
                                {value.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}

            <tr className={`border-t-2 ${SYMBOL_DIVIDER}`}>
              <td
                className={`px-2 py-1 text-sm font-semibold ${
                  isDark ? "text-stone-200" : "text-stone-800"
                }`}
              >
                Avg
              </td>
              {months.map((month) => {
                const avg = averageByMonth[month];
                return (
                  <td key={month} className="px-0.5 py-0.5">
                    <div
                      className={`rounded px-1.5 py-1.5 text-center text-sm font-semibold sm:px-2 ${getCellColor(
                        avg,
                        isDark
                      )} ${getCellTextColor(avg, isDark)}`}
                    >
                      {avg !== undefined ? `${avg.toFixed(1)}%` : "—"}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs sm:gap-4">
        <span className={SYMBOL_SUBTLE_TEXT}>Legend:</span>
        <div className="flex items-center gap-1">
          <div
            className={`h-3.5 w-3.5 rounded ${isDark ? "bg-green-600" : "bg-green-500"}`}
          />
          <span className={SYMBOL_SUBTLE_TEXT}>Strong positive</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className={`h-3.5 w-3.5 rounded ${isDark ? "bg-green-800" : "bg-green-200"}`}
          />
          <span className={SYMBOL_SUBTLE_TEXT}>Mild positive</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className={`h-3.5 w-3.5 rounded ${isDark ? "bg-red-800" : "bg-red-200"}`}
          />
          <span className={SYMBOL_SUBTLE_TEXT}>Mild negative</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className={`h-3.5 w-3.5 rounded ${isDark ? "bg-red-600" : "bg-red-500"}`}
          />
          <span className={SYMBOL_SUBTLE_TEXT}>Strong negative</span>
        </div>
      </div>

      <p className={`mt-4 text-xs italic ${SYMBOL_SUBTLE_TEXT}`}>
        Past seasonality does not guarantee future performance
      </p>
    </SymbolTabShell>
  );
}
