"use client";

/**
 * SectorHub Component
 * Displays all 11 market sectors with performance metrics, color coding,
 * comparison view, time period selection, sorting, tooltips, and auto-refresh.
 *
 * Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 23.7, 23.8, 23.9, 23.10, 23.11, 23.12
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@/lib/theme-context";
import { SectorData } from "@/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import {
  marketChangeTextClass,
  marketPerformanceBarClass,
  marketPerformanceBarTrackClass,
} from "@/lib/market-semantics";
import { MARKET_UI_COPY } from "@/lib/market-ui-copy";
import {
  HOME_CHIP,
  HOME_INSTRUMENT_PANEL,
  HOME_PANEL_TITLE,
  HOME_SECTION_LABEL,
  homeChipClasses,
} from "@/lib/home-ui";

type TimePeriod = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y" | "YTD" | "Max";
type SortField = "sector" | "changePercent";
type SortDirection = "asc" | "desc";

const SECTOR_DESCRIPTIONS: Record<string, string> = {
  Technology:
    "Companies in software, hardware, semiconductors, and IT services.",
  Financial:
    "Banks, insurance companies, asset managers, and financial exchanges.",
  "Consumer Discretionary":
    "Non-essential goods and services: retail, automotive, apparel, and entertainment.",
  Communication:
    "Telecom providers, media companies, and interactive entertainment.",
  Healthcare:
    "Pharmaceuticals, biotech, medical devices, and healthcare providers.",
  Industrials:
    "Aerospace, defense, construction, machinery, and transportation.",
  "Consumer Staples":
    "Essential products: food, beverages, household goods, and personal care.",
  Energy: "Oil, gas, coal, and renewable energy companies.",
  Materials: "Chemicals, metals, mining, paper, and construction materials.",
  "Real Estate": "REITs, property developers, and real estate services.",
  Utilities: "Electric, gas, water utilities, and independent power producers.",
};

const DEFAULT_REFRESH_INTERVAL = 60_000;

export interface SectorHubProps {
  data?: SectorData[];
  refreshInterval?: number;
}

function formatPercent(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function SectorHub({
  data: externalData,
  refreshInterval = DEFAULT_REFRESH_INTERVAL,
}: SectorHubProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [data, setData] = useState<SectorData[] | null>(externalData ?? null);
  const [loading, setLoading] = useState(!externalData);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("1D");
  const [sortField, setSortField] = useState<SortField>("changePercent");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/market/sectors?period=${timePeriod}`);
      if (!res.ok) throw new Error(MARKET_UI_COPY.load.sectorHub);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Unknown error");
      setData(json.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : MARKET_UI_COPY.load.sectorHub
      );
    } finally {
      setLoading(false);
    }
  }, [timePeriod]);

  useEffect(() => {
    if (externalData) {
      setData(externalData);
      setLoading(false);
      return;
    }

    fetchData();

    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchData, refreshInterval);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [externalData, fetchData, refreshInterval]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "changePercent" ? "desc" : "asc");
    }
  };

  const toggleSectorComparison = (sector: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sector)
        ? prev.filter((s) => s !== sector)
        : [...prev, sector]
    );
  };

  const sortedData = data
    ? [...data].sort((a, b) => {
        const mul = sortDirection === "asc" ? 1 : -1;
        if (sortField === "sector")
          return mul * a.sector.localeCompare(b.sector);
        return mul * (a.changePercent - b.changePercent);
      })
    : [];

  const comparisonData =
    selectedSectors.length > 0
      ? sortedData.filter((s) => selectedSectors.includes(s.sector))
      : null;

  // --- Loading ---
  if (loading) {
    return (
      <div className={HOME_INSTRUMENT_PANEL} data-testid="sector-hub-loading">
        <LoadingSpinner className="py-8" />
      </div>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <div className={HOME_INSTRUMENT_PANEL} data-testid="sector-hub-error">
        <ErrorMessage
          type="api"
          message={error}
          onRetry={() => {
            setLoading(true);
            fetchData();
          }}
        />
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  const maxAbsChange = Math.max(
    ...data.map((s) => Math.abs(s.changePercent)),
    0.01
  );

  return (
    <div
      className={HOME_INSTRUMENT_PANEL}
      data-testid="sector-hub"
      role="region"
      aria-label="Sectors Hub"
    >
      <header className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={HOME_SECTION_LABEL}>Market structure</p>
          <h2 className={`mt-1 ${HOME_PANEL_TITLE}`}>Sectors</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSort("changePercent")}
            className={`text-xs px-3 py-2 rounded min-h-[36px] ${homeChipClasses(sortField === "changePercent")}`}
            data-testid="sort-performance"
            aria-label={`Sort by performance ${sortDirection === "asc" ? "ascending" : "descending"}`}
          >
            Performance{" "}
            {sortField === "changePercent"
              ? sortDirection === "asc"
                ? "↑"
                : "↓"
              : ""}
          </button>
          <button
            onClick={() => handleSort("sector")}
            className={`text-xs px-3 py-2 rounded min-h-[36px] ${homeChipClasses(sortField === "sector")}`}
            data-testid="sort-name"
            aria-label={`Sort by name ${sortDirection === "asc" ? "ascending" : "descending"}`}
          >
            Name{" "}
            {sortField === "sector"
              ? sortDirection === "asc"
                ? "↑"
                : "↓"
              : ""}
          </button>
        </div>
      </header>

      {/* Time period selector */}
      <div
        className="flex gap-1 mb-3 sm:mb-4 flex-wrap"
        data-testid="time-period-selector"
      >
        {(
          ["1D", "1W", "1M", "3M", "1Y", "5Y", "YTD", "Max"] as TimePeriod[]
        ).map((period) => (
          <button
            key={period}
            onClick={() => setTimePeriod(period)}
            className={`${HOME_CHIP} ${homeChipClasses(timePeriod === period)}`}
            data-testid={`period-${period}`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Sector grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4"
        data-testid="sector-grid"
      >
        {sortedData.map((sector) => {
          const isPositive = sector.changePercent >= 0;
          const colorClass = marketChangeTextClass(isPositive ? 1 : -1);
          const barWidth = Math.min(
            (Math.abs(sector.changePercent) / maxAbsChange) * 100,
            100
          );
          const barColor = marketPerformanceBarTrackClass(isPositive);
          const isSelected = selectedSectors.includes(sector.sector);
          const isHovered = hoveredSector === sector.sector;

          return (
            <div
              key={sector.sector}
              className={`relative min-h-[44px] cursor-pointer rounded-lg p-3 transition-all ${
                isSelected
                  ? "bg-stone-100 ring-2 ring-stone-500 dark:bg-stone-700"
                  : "bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700"
              }`}
              data-testid={`sector-${sector.sector.replace(/\s+/g, "-")}`}
              onClick={() => toggleSectorComparison(sector.sector)}
              onMouseEnter={() => setHoveredSector(sector.sector)}
              onMouseLeave={() => setHoveredSector(null)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  toggleSectorComparison(sector.sector);
              }}
              aria-pressed={isSelected}
              aria-label={`${sector.sector}: ${formatPercent(sector.changePercent)}`}
            >
              {/* Strength bar */}
              <div
                className={`absolute bottom-0 left-0 h-1 rounded-b-lg ${barColor}`}
                style={{ width: `${barWidth}%` }}
                data-testid={`strength-bar-${sector.sector.replace(/\s+/g, "-")}`}
              />

              <div className="flex items-center justify-between">
                <p
                  className={`text-sm font-medium ${isDark ? "text-stone-100" : "text-stone-900"}`}
                >
                  {sector.sector}
                </p>
                <p
                  className={`text-sm font-semibold ${colorClass}`}
                  data-testid={`change-${sector.sector.replace(/\s+/g, "-")}`}
                >
                  {formatPercent(sector.changePercent)}
                </p>
              </div>

              {/* Tooltip on hover */}
              {isHovered && SECTOR_DESCRIPTIONS[sector.sector] && (
                <div
                  className={`mt-2 text-xs ${isDark ? "text-stone-300" : "text-stone-600"}`}
                  role="tooltip"
                  data-testid={`tooltip-${sector.sector.replace(/\s+/g, "-")}`}
                >
                  {SECTOR_DESCRIPTIONS[sector.sector]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comparison view */}
      {comparisonData && comparisonData.length > 0 && (
        <div className="mt-6" data-testid="comparison-view">
          <div className="flex items-center justify-between mb-3">
            <h4
              className={`text-sm font-semibold ${isDark ? "text-stone-200" : "text-stone-700"}`}
            >
              Sector Comparison
            </h4>
            <button
              onClick={() => setSelectedSectors([])}
              className={`text-xs text-stone-600 hover:underline dark:text-stone-300`}
              data-testid="clear-comparison"
            >
              Clear
            </button>
          </div>
          <div className="space-y-2">
            {comparisonData.map((sector) => {
              const isPositive = sector.changePercent >= 0;
              const barWidth = Math.min(
                (Math.abs(sector.changePercent) / maxAbsChange) * 100,
                100
              );
              return (
                <div key={sector.sector} className="flex items-center gap-3">
                  <span
                    className={`w-40 truncate text-xs ${isDark ? "text-stone-300" : "text-stone-700"}`}
                  >
                    {sector.sector}
                  </span>
                  <div
                    className={`h-4 flex-1 rounded ${isDark ? "bg-stone-700" : "bg-stone-100"}`}
                  >
                    <div
                      className={`h-full rounded ${marketPerformanceBarClass(isPositive)}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium w-16 text-right ${marketChangeTextClass(isPositive ? 1 : -1)}`}
                  >
                    {formatPercent(sector.changePercent)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
