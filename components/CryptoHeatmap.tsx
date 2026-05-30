"use client";

/**
 * CryptoHeatmap
 * Displays cryptocurrency performance data in a heatmap, grouped by category.
 * Wraps HeatmapComponent with crypto-specific data fetching and category filtering.
 *
 * Requirements: 25.1, 25.8
 */

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { HeatmapData, CryptoData } from "@/types";
import {
  HOME_CHIP_SM,
  HOME_INSTRUMENT_PANEL,
  homeChipClasses,
} from "@/lib/home-ui";
import {
  HeatmapComponent,
  HeatmapTimePeriod,
  HeatmapSortField,
  HeatmapSortDirection,
} from "./HeatmapComponent";

export interface CryptoHeatmapProps {
  /** Auto-refresh interval in milliseconds (0 = disabled) */
  refreshInterval?: number;
  /** Callback when a crypto tile is clicked */
  onCryptoClick?: (symbol: string) => void;
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

/** Convert CryptoData[] to HeatmapData[] */
function toHeatmapData(cryptos: CryptoData[]): HeatmapData[] {
  return cryptos.map((crypto) => ({
    symbol: crypto.symbol,
    name: crypto.name,
    value: crypto.price,
    changePercent: crypto.changePercent,
    category: crypto.category,
    sector: crypto.category,
    marketCap: crypto.marketCap,
  }));
}

export function CryptoHeatmap({
  refreshInterval = 0,
  onCryptoClick,
}: CryptoHeatmapProps) {
  const [timePeriod, setTimePeriod] = useState<HeatmapTimePeriod>("1D");
  const [sortField, setSortField] = useState<HeatmapSortField>("changePercent");
  const [sortDirection, setSortDirection] =
    useState<HeatmapSortDirection>("desc");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const apiUrl = `/api/market/crypto?period=${PERIOD_PARAM[timePeriod]}`;

  const {
    data: response,
    error,
    mutate,
  } = useSWR(apiUrl, fetcher, {
    refreshInterval: refreshInterval > 0 ? refreshInterval : 0,
    revalidateOnFocus: false,
  });

  const loading = !response && !error;
  const cryptoData: CryptoData[] = useMemo(
    () => (response?.success ? response.data : []),
    [response]
  );
  const heatmapData = useMemo(() => toHeatmapData(cryptoData), [cryptoData]);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    for (const crypto of cryptoData) {
      if (crypto.category) unique.add(crypto.category);
    }
    return Array.from(unique).sort();
  }, [cryptoData]);

  const handleTileClick = useCallback(
    (item: HeatmapData) => {
      onCryptoClick?.(item.symbol);
    },
    [onCryptoClick]
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
      <div className={HOME_INSTRUMENT_PANEL} data-testid="crypto-heatmap-error">
        <p className="text-center text-red-600 dark:text-red-400">
          Failed to load crypto data. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="crypto-heatmap">
      {/* Category filter tabs */}
      {categories.length > 0 && (
        <div
          className="flex gap-1 mb-4 flex-wrap"
          data-testid="crypto-category-filter"
          role="group"
          aria-label="Crypto category filter"
        >
          <button
            className={`${HOME_CHIP_SM} ${homeChipClasses(categoryFilter === "")}`}
            aria-pressed={categoryFilter === ""}
            onClick={() => setCategoryFilter("")}
            data-testid="crypto-category-all"
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${HOME_CHIP_SM} ${homeChipClasses(categoryFilter === cat)}`}
              aria-pressed={categoryFilter === cat}
              onClick={() => setCategoryFilter(cat)}
              data-testid={`crypto-category-${cat.toLowerCase().replace(/\s+/g, "-")}`}
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
