"use client";

/**
 * ETFHeatmap
 * Displays ETF performance data in a heatmap, grouped by category.
 * Wraps HeatmapComponent with ETF-specific data fetching and category filtering.
 *
 * Requirements: 25.1, 25.7
 */

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import {
  HOME_CHIP_SM,
  HOME_INSTRUMENT_PANEL,
  homeChipClasses,
} from "@/lib/home-ui";
import { HeatmapData, ETFData } from "@/types";
import {
  HeatmapComponent,
  HeatmapTimePeriod,
  HeatmapSortField,
  HeatmapSortDirection,
} from "./HeatmapComponent";

export interface ETFHeatmapProps {
  /** Auto-refresh interval in milliseconds (0 = disabled) */
  refreshInterval?: number;
  /** Callback when an ETF tile is clicked */
  onETFClick?: (symbol: string) => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/** Map HeatmapTimePeriod to API query param */
const PERIOD_PARAM: Record<HeatmapTimePeriod, string> = {
  "1D": "1D",
  "1W": "1W",
  "1M": "1M",
  "3M": "3M",
  "1Y": "1Y",
  "5Y": "5Y",
  YTD: "YTD",
  MAX: "MAX",
};

/** Convert ETFData[] to HeatmapData[] */
function toHeatmapData(etfs: ETFData[]): HeatmapData[] {
  return etfs.map((etf) => ({
    symbol: etf.symbol,
    name: etf.name,
    value: etf.price,
    changePercent: etf.changePercent,
    category: etf.category,
    sector: etf.category,
    marketCap: etf.marketCap,
  }));
}

export function ETFHeatmap({
  refreshInterval = 0,
  onETFClick,
}: ETFHeatmapProps) {
  const [timePeriod, setTimePeriod] = useState<HeatmapTimePeriod>("1D");
  const [sortField, setSortField] = useState<HeatmapSortField>("changePercent");
  const [sortDirection, setSortDirection] =
    useState<HeatmapSortDirection>("desc");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const apiUrl = `/api/market/etfs?period=${PERIOD_PARAM[timePeriod]}`;

  const {
    data: response,
    error,
    mutate,
  } = useSWR(apiUrl, fetcher, {
    refreshInterval: refreshInterval > 0 ? refreshInterval : 0,
    revalidateOnFocus: false,
  });

  const loading = !response && !error;
  const etfData: ETFData[] = useMemo(
    () => (response?.success ? response.data : []),
    [response]
  );
  const heatmapData = useMemo(() => toHeatmapData(etfData), [etfData]);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    for (const etf of etfData) {
      if (etf.category) unique.add(etf.category);
    }
    return Array.from(unique).sort();
  }, [etfData]);

  const handleTileClick = useCallback(
    (item: HeatmapData) => {
      onETFClick?.(item.symbol);
    },
    [onETFClick]
  );

  const handleSortChange = useCallback(
    (field: HeatmapSortField, direction: HeatmapSortDirection) => {
      setSortField(field);
      setSortDirection(direction);
    },
    []
  );

  const handleRefresh = useCallback(() => {
    mutate();
  }, [mutate]);

  if (error && !response) {
    return (
      <div className={HOME_INSTRUMENT_PANEL} data-testid="etf-heatmap-error">
        <p className="text-center text-red-600 dark:text-red-400">
          Failed to load ETF data. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="etf-heatmap">
      {/* Category filter tabs */}
      {categories.length > 0 && (
        <div
          className="flex gap-1 mb-4 flex-wrap"
          data-testid="etf-category-filter"
          role="group"
          aria-label="ETF category filter"
        >
          <button
            className={`${HOME_CHIP_SM} ${homeChipClasses(categoryFilter === "")}`}
            aria-pressed={categoryFilter === ""}
            onClick={() => setCategoryFilter("")}
            data-testid="etf-category-all"
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${HOME_CHIP_SM} ${homeChipClasses(categoryFilter === cat)}`}
              aria-pressed={categoryFilter === cat}
              onClick={() => setCategoryFilter(cat)}
              data-testid={`etf-category-${cat.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <HeatmapComponent
        data={heatmapData}
        loading={loading}
        onTileClick={handleTileClick}
        timePeriod={timePeriod}
        onTimePeriodChange={setTimePeriod}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        sectorFilter={categoryFilter || undefined}
        onSectorFilterChange={(val) => setCategoryFilter(val)}
        refreshInterval={refreshInterval}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
