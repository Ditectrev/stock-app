"use client";

/**
 * StockHeatmap
 * Displays stock performance data in a TradingView-style heatmap, grouped by sector.
 * Wraps HeatmapComponent with stock-specific data fetching and sector filtering.
 *
 * Requirements: 25.1, 25.9
 */

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { HeatmapData, StockData } from "@/types";
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

export interface StockHeatmapProps {
  /** Auto-refresh interval in milliseconds (0 = disabled) */
  refreshInterval?: number;
  /** Callback when a stock tile is clicked */
  onStockClick?: (symbol: string) => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

/** Convert StockData[] to HeatmapData[] */
function toHeatmapData(stocks: StockData[]): HeatmapData[] {
  return stocks.map((stock) => ({
    symbol: stock.symbol,
    name: stock.name,
    value: stock.price,
    changePercent: stock.changePercent,
    sector: stock.sector,
    marketCap: stock.marketCap,
  }));
}

export function StockHeatmap({
  refreshInterval = 0,
  onStockClick,
}: StockHeatmapProps) {
  const [timePeriod, setTimePeriod] = useState<HeatmapTimePeriod>("1D");
  const [sortField, setSortField] = useState<HeatmapSortField>("changePercent");
  const [sortDirection, setSortDirection] =
    useState<HeatmapSortDirection>("desc");
  const [sectorFilter, setSectorFilter] = useState<string>("");

  const apiUrl = `/api/market/stocks?period=${PERIOD_PARAM[timePeriod]}`;

  const {
    data: response,
    error,
    mutate,
  } = useSWR(apiUrl, fetcher, {
    refreshInterval: refreshInterval > 0 ? refreshInterval : 0,
    revalidateOnFocus: false,
  });

  const loading = !response && !error;
  const stockData: StockData[] = useMemo(
    () => (response?.success ? response.data : []),
    [response]
  );
  const heatmapData = useMemo(() => toHeatmapData(stockData), [stockData]);

  const sectors = useMemo(() => {
    const unique = new Set<string>();
    for (const stock of stockData) {
      if (stock.sector) unique.add(stock.sector);
    }
    return Array.from(unique).sort();
  }, [stockData]);

  const handleTileClick = useCallback(
    (item: HeatmapData) => {
      onStockClick?.(item.symbol);
    },
    [onStockClick]
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
      <div className={HOME_INSTRUMENT_PANEL} data-testid="stock-heatmap-error">
        <p className="text-center text-red-600 dark:text-red-400">
          Failed to load stock data. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="stock-heatmap">
      {/* Sector filter tabs */}
      {sectors.length > 0 && (
        <div
          className="flex gap-1 mb-4 flex-wrap"
          data-testid="stock-sector-filter"
          role="group"
          aria-label="Stock sector filter"
        >
          <button
            className={`${HOME_CHIP_SM} ${homeChipClasses(sectorFilter === "")}`}
            aria-pressed={sectorFilter === ""}
            onClick={() => setSectorFilter("")}
            data-testid="stock-sector-all"
          >
            All
          </button>
          {sectors.map((sector) => (
            <button
              key={sector}
              className={`${HOME_CHIP_SM} ${homeChipClasses(sectorFilter === sector)}`}
              aria-pressed={sectorFilter === sector}
              onClick={() => setSectorFilter(sector)}
              data-testid={`stock-sector-${sector.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {sector}
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
        sectorFilter={sectorFilter || undefined}
        onSectorFilterChange={(val) => setSectorFilter(val)}
        refreshInterval={refreshInterval}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
