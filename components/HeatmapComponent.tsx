"use client";

/**
 * HeatmapComponent
 * Renders market data in a responsive grid of color-coded tiles.
 * Green tiles indicate positive performance, red tiles indicate negative,
 * with color intensity varying by magnitude.
 *
 * Requirements: 25.3, 25.4, 25.5, 25.6, 25.12, 25.13, 25.14, 25.15, 25.16, 25.17, 25.18, 25.19
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/lib/theme-context";
import { HeatmapData } from "@/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  HOME_CHIP,
  HOME_LEGEND_DIVIDER,
  HOME_LEGEND_TEXT,
  HOME_MUTED_TEXT,
  HOME_SUBTLE_TEXT,
  homeChipClasses,
} from "@/lib/home-ui";

export type HeatmapTimePeriod =
  | "1D"
  | "1W"
  | "1M"
  | "3M"
  | "1Y"
  | "5Y"
  | "YTD"
  | "MAX";
export type HeatmapSortField = "changePercent" | "marketCap" | "name";
export type HeatmapSortDirection = "asc" | "desc";

const HEATMAP_TIME_PERIODS: HeatmapTimePeriod[] = [
  "1D",
  "1W",
  "1M",
  "3M",
  "1Y",
  "5Y",
  "YTD",
  "MAX",
];

export interface HeatmapComponentProps {
  /** Array of heatmap data items to display as tiles */
  data: HeatmapData[];
  /** Whether data is currently loading */
  loading?: boolean;
  /** Callback when a tile is clicked */
  onTileClick?: (item: HeatmapData) => void;
  /** Currently selected time period */
  timePeriod?: HeatmapTimePeriod;
  /** Callback when time period changes */
  onTimePeriodChange?: (period: HeatmapTimePeriod) => void;
  /** Current sort field */
  sortField?: HeatmapSortField;
  /** Current sort direction */
  sortDirection?: HeatmapSortDirection;
  /** Callback when sort changes */
  onSortChange?: (
    field: HeatmapSortField,
    direction: HeatmapSortDirection
  ) => void;
  /** Filter to show only tiles from this sector */
  sectorFilter?: string;
  /** Callback when sector filter changes */
  onSectorFilterChange?: (sector: string) => void;
  /** Auto-refresh interval in milliseconds (0 or undefined = disabled) */
  refreshInterval?: number;
  /** Callback invoked at each refresh interval for the parent to re-fetch data */
  onRefresh?: () => void;
}

/**
 * Returns a background color string based on changePercent.
 * Green for positive, red for negative, intensity scales with magnitude.
 */
function getTileColor(changePercent: number, isDark: boolean): string {
  const clamped = Math.min(Math.abs(changePercent), 10);
  // Intensity from 0.15 (near zero) to 0.9 (at ±10% or beyond)
  const intensity = 0.15 + (clamped / 10) * 0.75;

  if (changePercent === 0) {
    return isDark ? "rgba(107,114,128,0.3)" : "rgba(156,163,175,0.3)";
  }
  if (changePercent > 0) {
    return `rgba(34,197,94,${intensity})`;
  }
  return `rgba(239,68,68,${intensity})`;
}

function formatPercent(pct: number): string {
  if (pct == null || isNaN(pct)) return "N/A";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function formatMarketCap(cap: number): string {
  if (cap == null || isNaN(cap)) return "N/A";
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${cap.toLocaleString()}`;
}

function formatValue(val: number): string {
  return val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function HeatmapComponent({
  data,
  loading = false,
  onTileClick,
  timePeriod = "1D",
  onTimePeriodChange,
  sortField = "changePercent",
  sortDirection = "desc",
  onSortChange,
  sectorFilter,
  onSectorFilterChange,
  refreshInterval = 0,
  onRefresh,
}: HeatmapComponentProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-refresh: call onRefresh at the configured interval
  useEffect(() => {
    if (refreshInterval > 0 && onRefresh) {
      intervalRef.current = setInterval(onRefresh, refreshInterval);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshInterval, onRefresh]);

  const sectors = useMemo(() => {
    const unique = new Set<string>();
    for (const item of data) {
      if (item.sector) unique.add(item.sector);
    }
    return Array.from(unique).sort();
  }, [data]);

  const processedData = useMemo(() => {
    let items = data;

    // Filter by sector
    if (sectorFilter) {
      items = items.filter((item) => item.sector === sectorFilter);
    }

    // Sort
    const sorted = [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "changePercent":
          cmp = a.changePercent - b.changePercent;
          break;
        case "marketCap":
          cmp = (a.marketCap ?? 0) - (b.marketCap ?? 0);
          break;
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [data, sectorFilter, sortField, sortDirection]);

  function handleSortClick(field: HeatmapSortField) {
    if (!onSortChange) return;
    if (field === sortField) {
      onSortChange(field, sortDirection === "asc" ? "desc" : "asc");
    } else {
      onSortChange(field, "desc");
    }
  }

  // --- Loading state ---
  if (loading) {
    return (
      <div className="py-8" data-testid="heatmap-loading">
        <LoadingSpinner className="py-8" />
      </div>
    );
  }

  // --- Empty state ---
  if (!data || data.length === 0) {
    return (
      <div className="py-8" data-testid="heatmap-empty">
        <p className={`text-center ${HOME_SUBTLE_TEXT}`}>
          No heatmap data available.
        </p>
      </div>
    );
  }

  return (
    <div
      className="border-t border-stone-200 pt-4 sm:pt-6 dark:border-stone-700"
      data-testid="heatmap"
      role="region"
      aria-label="Market heatmap"
    >
      {/* Time period selector */}
      <div
        className="flex gap-1 mb-3 sm:mb-4 flex-wrap"
        data-testid="heatmap-period-selector"
        role="group"
        aria-label="Heatmap time period"
      >
        {HEATMAP_TIME_PERIODS.map((period) => (
          <button
            key={period}
            data-testid={`heatmap-period-${period}`}
            className={`${HOME_CHIP} ${homeChipClasses(timePeriod === period)}`}
            aria-pressed={timePeriod === period}
            onClick={() => onTimePeriodChange?.(period)}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Sort & filter controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div
          className="flex gap-1 flex-wrap"
          data-testid="heatmap-sort-controls"
          role="group"
          aria-label="Heatmap sort options"
        >
          {(
            [
              ["changePercent", "Performance"],
              ["marketCap", "Market Cap"],
              ["name", "Name"],
            ] as const
          ).map(([field, label]) => (
            <button
              key={field}
              data-testid={`heatmap-sort-${field}`}
              className={`${HOME_CHIP} ${homeChipClasses(sortField === field)}`}
              aria-pressed={sortField === field}
              onClick={() => handleSortClick(field)}
            >
              {label}
              {sortField === field && (sortDirection === "asc" ? " ↑" : " ↓")}
            </button>
          ))}
        </div>

        <select
          data-testid="heatmap-sector-filter"
          className={`${HOME_CHIP} border ${homeChipClasses(false)} ${
            isDark ? "border-stone-600" : "border-stone-200"
          }`}
          value={sectorFilter ?? ""}
          onChange={(e) => onSectorFilterChange?.(e.target.value)}
          aria-label="Filter by sector"
        >
          <option value="">All Sectors</option>
          {sectors.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </div>

      {/* Tile grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 sm:gap-2 lg:gap-3"
        data-testid="heatmap-grid"
      >
        {processedData.map((item) => {
          const bgColor = getTileColor(item.changePercent, isDark);
          const textColor =
            item.changePercent === 0 ? HOME_MUTED_TEXT : "text-white";

          return (
            <div
              key={item.symbol}
              className={`rounded-lg p-2 sm:p-3 md:p-3 lg:p-4 flex flex-col items-center justify-center min-h-[70px] sm:min-h-[80px] md:min-h-[90px] lg:min-h-[100px] transition-transform hover:scale-105 active:scale-95 cursor-pointer ${textColor}`}
              style={{ backgroundColor: bgColor }}
              data-testid={`heatmap-tile-${item.symbol}`}
              aria-label={`${item.symbol}: ${formatPercent(item.changePercent)}`}
              role="button"
              tabIndex={0}
              onMouseEnter={() => setHoveredSymbol(item.symbol)}
              onMouseLeave={() => setHoveredSymbol(null)}
              onClick={() => onTileClick?.(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onTileClick?.(item);
                }
              }}
            >
              <span
                className="text-sm font-bold truncate max-w-full"
                data-testid={`heatmap-symbol-${item.symbol}`}
              >
                {item.symbol}
              </span>
              <span
                className="text-xs font-medium mt-1"
                data-testid={`heatmap-change-${item.symbol}`}
              >
                {formatPercent(item.changePercent)}
              </span>
              {hoveredSymbol === item.symbol && (
                <div
                  className="mt-1 w-full rounded border border-stone-600 bg-stone-900 px-2 py-1 text-center text-xs text-stone-100 dark:border-stone-500 dark:bg-stone-800 dark:text-stone-100"
                  data-testid={`heatmap-tooltip-${item.symbol}`}
                >
                  <div className="font-medium truncate">{item.name}</div>
                  {item.sector && <div>Sector: {item.sector}</div>}
                  {item.marketCap != null && (
                    <div>Mkt Cap: {formatMarketCap(item.marketCap)}</div>
                  )}
                  <div>Value: {formatValue(item.value)}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        className={HOME_LEGEND_DIVIDER}
        data-testid="heatmap-legend"
        aria-label="Heatmap color legend"
      >
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className={HOME_LEGEND_TEXT}>Strong decline</span>
          {/* Gradient swatches from deep red → neutral → deep green */}
          <div className="flex gap-0.5">
            {[
              "rgba(239,68,68,0.9)",
              "rgba(239,68,68,0.6)",
              "rgba(239,68,68,0.3)",
              isDark ? "rgba(120,113,108,0.35)" : "rgba(168,162,158,0.35)",
              "rgba(34,197,94,0.3)",
              "rgba(34,197,94,0.6)",
              "rgba(34,197,94,0.9)",
            ].map((color, i) => (
              <div
                key={i}
                className="w-6 h-4 rounded-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span className={HOME_LEGEND_TEXT}>Strong gain</span>
        </div>
      </div>
    </div>
  );
}
