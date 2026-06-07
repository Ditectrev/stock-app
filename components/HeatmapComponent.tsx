"use client";

/**
 * HeatmapComponent
 * Renders market data in a responsive grid of color-coded tiles.
 * Green tiles indicate positive performance, red tiles indicate negative,
 * with color intensity varying by magnitude.
 *
 * Requirements: 25.3, 25.4, 25.5, 25.6, 25.12, 25.13, 25.14, 25.15, 25.16, 25.17, 25.18, 25.19
 */

import { DNA_CAPTION, DNA_HEATMAP_CELL } from "@/lib/design-dna";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/lib/theme-context";
import { HeatmapData } from "@/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  getHeatmapFillColor,
  getHeatmapNeutralLegendColor,
  getHeatmapTextClass,
} from "@/lib/heatmap-colors";
import {
  HOME_CHIP,
  HOME_LEGEND_DIVIDER,
  HOME_LEGEND_TEXT,
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
        <p className={`text-center ${DNA_CAPTION}`}>
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
            className={`${HOME_CHIP} ${homeChipClasses(
              timePeriod === period
            )} transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-1`}
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
              className={`${HOME_CHIP} ${homeChipClasses(
                sortField === field
              )} transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-1`}
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
          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-1`}
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
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        data-testid="heatmap-grid"
      >
        {processedData.map((item) => {
          const bgColor = getHeatmapFillColor(item.changePercent, isDark);
          const textColor = getHeatmapTextClass(item.changePercent, isDark);
          const isHovered = hoveredSymbol === item.symbol;
          const detailLines = [
            item.name,
            item.sector ? `Sector: ${item.sector}` : null,
            item.marketCap != null
              ? `Mkt Cap: ${formatMarketCap(item.marketCap)}`
              : null,
            `Value: ${formatValue(item.value)}`,
          ].filter(Boolean);

          return (
            <div
              key={item.symbol}
              className={`relative flex min-h-[70px] cursor-pointer flex-col rounded-lg p-2 transition-colors duration-150 hover:ring-2 hover:ring-stone-900/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-1 dark:hover:ring-stone-100/25 sm:min-h-[80px] sm:p-3 md:min-h-[90px] lg:min-h-[100px] lg:p-4 ${textColor}`}
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
              <div className="flex w-full items-start justify-between gap-2">
                <span
                  className={`${DNA_HEATMAP_CELL} min-w-0 truncate`}
                  data-testid={`heatmap-symbol-${item.symbol}`}
                >
                  {item.symbol}
                </span>
                <span
                  className={`${DNA_CAPTION} shrink-0 font-medium`}
                  data-testid={`heatmap-change-${item.symbol}`}
                >
                  {formatPercent(item.changePercent)}
                </span>
              </div>
              {isHovered && detailLines.length > 0 && (
                <div
                  className="mt-2 w-full space-y-0.5 text-xs leading-snug opacity-90"
                  role="tooltip"
                  data-testid={`heatmap-tooltip-${item.symbol}`}
                >
                  {detailLines.map((line) => (
                    <div key={line} className="truncate">
                      {line}
                    </div>
                  ))}
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
              getHeatmapNeutralLegendColor(isDark),
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
