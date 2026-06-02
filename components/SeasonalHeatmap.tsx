"use client";

/**
 * SeasonalHeatmap Component
 * Month-average strip + year×month grid in instrument panels.
 *
 * Requirements: 7.1, 7.3, 7.4
 */

import { SeasonalData } from "@/types";
import { useTheme } from "@/lib/theme-context";
import { useState, type ReactNode } from "react";
import {
  aggregateSeasonalData,
  getReturnForCell,
  getMonthLabel,
} from "@/lib/seasonal-utils";
import {
  marketChangeTextClass,
  seasonalHeatmapCellClass,
  seasonalHeatmapTextClass,
  seasonalLegendSwatchClass,
} from "@/lib/market-semantics";
import { SymbolTabSkeleton } from "@/components/SymbolTabShell";
import {
  SYMBOL_DIVIDER,
  SYMBOL_INSTRUMENT_PANEL,
  SYMBOL_PANEL_TITLE,
  SYMBOL_SECTION_LABEL,
  SYMBOL_SUBTLE_TEXT,
} from "@/lib/symbol-ui";

export interface SeasonalHeatmapProps {
  data: SeasonalData | null | undefined;
}

interface HoveredCell {
  year: number;
  month: number;
  value: number;
}

function SeasonalPanel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={`${SYMBOL_INSTRUMENT_PANEL} !p-0 overflow-hidden`}>
      <div
        className={`border-b border-stone-200 px-4 py-2 text-xs font-medium dark:border-stone-700 ${SYMBOL_SECTION_LABEL}`}
      >
        {label}
      </div>
      <div className="p-2 sm:p-4">{children}</div>
    </div>
  );
}

export function SeasonalHeatmap({ data }: SeasonalHeatmapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [hovered, setHovered] = useState<HoveredCell | null>(null);

  const { monthlyReturns, averageByMonth, years } = aggregateSeasonalData(data);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  if (!data) {
    return (
      <div className="space-y-5" role="tabpanel" aria-label="Seasonal Patterns">
        <SeasonalHeader />
        <SymbolTabSkeleton blocks={3} blockClassName="h-10" />
      </div>
    );
  }

  if (years.length === 0) {
    return (
      <div className="space-y-5" role="tabpanel" aria-label="Seasonal Patterns">
        <SeasonalHeader />
        <p className={`text-sm ${SYMBOL_SUBTLE_TEXT}`}>
          No seasonal data available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5" role="tabpanel" aria-label="Seasonal Patterns">
      <SeasonalHeader />

      <SeasonalPanel label="Typical month (average)">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-12">
          {months.map((month) => {
            const avg = averageByMonth[month];
            return (
              <div key={month} className="text-center">
                <div
                  className={`rounded px-1 py-2 text-xs font-semibold sm:text-sm ${seasonalHeatmapCellClass(
                    avg,
                    isDark
                  )} ${seasonalHeatmapTextClass(avg, isDark)}`}
                >
                  {avg !== undefined ? `${avg.toFixed(1)}%` : "—"}
                </div>
                <span
                  className={`mt-1 block text-[10px] uppercase tracking-wide ${SYMBOL_SUBTLE_TEXT}`}
                >
                  {getMonthLabel(month)}
                </span>
              </div>
            );
          })}
        </div>
      </SeasonalPanel>

      <SeasonalPanel label="Year × month">
        <div className="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:px-0">
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
                          className={`relative rounded px-1.5 py-1.5 text-center transition-all sm:px-2 ${seasonalHeatmapCellClass(
                            value,
                            isDark
                          )} ${seasonalHeatmapTextClass(value, isDark)} ${
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
                                <span className={marketChangeTextClass(value)}>
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
                        className={`rounded px-1.5 py-1.5 text-center text-sm font-semibold sm:px-2 ${seasonalHeatmapCellClass(
                          avg,
                          isDark
                        )} ${seasonalHeatmapTextClass(avg, isDark)}`}
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
      </SeasonalPanel>

      <div className="flex flex-wrap items-center gap-3 text-xs sm:gap-4">
        <span className={SYMBOL_SUBTLE_TEXT}>Legend:</span>
        <div className="flex items-center gap-1">
          <div
            className={`h-3.5 w-3.5 rounded ${seasonalLegendSwatchClass("strongUp", isDark)}`}
          />
          <span className={SYMBOL_SUBTLE_TEXT}>Strong positive</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className={`h-3.5 w-3.5 rounded ${seasonalLegendSwatchClass("mildUp", isDark)}`}
          />
          <span className={SYMBOL_SUBTLE_TEXT}>Mild positive</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className={`h-3.5 w-3.5 rounded ${seasonalLegendSwatchClass("mildDown", isDark)}`}
          />
          <span className={SYMBOL_SUBTLE_TEXT}>Mild negative</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className={`h-3.5 w-3.5 rounded ${seasonalLegendSwatchClass("strongDown", isDark)}`}
          />
          <span className={SYMBOL_SUBTLE_TEXT}>Strong negative</span>
        </div>
      </div>

      <p className={`text-xs italic ${SYMBOL_SUBTLE_TEXT}`}>
        Past seasonality does not guarantee future performance
      </p>
    </div>
  );
}

function SeasonalHeader() {
  return (
    <header>
      <p className={SYMBOL_SECTION_LABEL}>Seasonality</p>
      <h2 className={SYMBOL_PANEL_TITLE}>Monthly return patterns</h2>
      <p className={`mt-1 text-sm ${SYMBOL_SUBTLE_TEXT}`}>
        How this symbol tends to perform by calendar month across years.
      </p>
    </header>
  );
}
