"use client";

/**
 * WorldMarkets Component
 * Displays major market indices grouped by region (Americas, Asia-Pacific, Europe)
 * with current values, percentage changes, and color-coded performance.
 * Auto-refreshes at configurable intervals.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.5
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { MarketIndex } from "@/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { HOME_INSTRUMENT_PANEL, HOME_PANEL_TITLE } from "@/lib/home-ui";

type Region = "Americas" | "Europe" | "Asia-Pacific";

const REGIONS: ReadonlyArray<{
  id: Region;
  label: string;
  gridClass: string;
}> = [
  { id: "Americas", label: "Americas", gridClass: "lg:col-span-6" },
  { id: "Europe", label: "Europe", gridClass: "lg:col-span-3" },
  {
    id: "Asia-Pacific",
    label: "Asia-Pacific",
    gridClass: "lg:col-span-3",
  },
];

const DEFAULT_REFRESH_INTERVAL = 60_000; // 60 seconds

export interface WorldMarketsProps {
  /** Pre-loaded data (skips initial fetch when provided) */
  data?: MarketIndex[];
  /** Auto-refresh interval in milliseconds. Set to 0 to disable. Defaults to 60000. */
  refreshInterval?: number;
}

function formatValue(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}`;
}

export function WorldMarkets({
  data: externalData,
  refreshInterval = DEFAULT_REFRESH_INTERVAL,
}: WorldMarketsProps) {
  const [data, setData] = useState<MarketIndex[] | null>(externalData ?? null);
  const [loading, setLoading] = useState(!externalData);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/market/world-markets");
      if (!res.ok) throw new Error("Failed to fetch world markets data");
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Unknown error");
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + auto-refresh
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

  // Group indices by region
  const grouped: Record<Region, MarketIndex[]> = {
    Americas: [],
    "Asia-Pacific": [],
    Europe: [],
  };

  if (data) {
    for (const idx of data) {
      const bucket = grouped[idx.region];
      if (bucket) {
        bucket.push(idx);
      } else {
        grouped.Americas.push(idx);
      }
    }
  }

  // --- Loading state ---
  if (loading) {
    return (
      <div
        className={HOME_INSTRUMENT_PANEL}
        data-testid="world-markets-loading"
      >
        <LoadingSpinner className="py-8" message="Loading world markets..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={HOME_INSTRUMENT_PANEL} data-testid="world-markets-error">
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

  return (
    <div
      className={HOME_INSTRUMENT_PANEL}
      data-testid="world-markets"
      role="region"
      aria-label="World Markets"
    >
      <h3 className={`mb-4 sm:mb-5 ${HOME_PANEL_TITLE}`}>World Markets</h3>
      <p className="-mt-2 mb-4 text-sm text-stone-500 dark:text-stone-400">
        Major indices by region — refreshed every minute.
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-12 lg:gap-6">
        {REGIONS.map((region) => {
          const indices = grouped[region.id];
          if (indices.length === 0) return null;

          return (
            <div
              key={region.id}
              className={region.gridClass}
              data-testid={`region-${region.id}`}
              role="region"
              aria-label={`${region.label} markets`}
            >
              <h4 className="mb-3 border-b border-stone-200 pb-2 text-xs font-semibold uppercase tracking-[0.15em] text-stone-500 dark:border-stone-700 dark:text-stone-400">
                {region.label}
                {region.id === "Americas" && (
                  <span className="ml-2 normal-case tracking-normal text-stone-400 dark:text-stone-500">
                    · primary session
                  </span>
                )}
              </h4>

              <ul className="space-y-1">
                {indices.map((idx) => {
                  const isPositive = idx.changePercent >= 0;
                  const colorClass = isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400";

                  return (
                    <li
                      key={idx.symbol}
                      className="flex min-h-[44px] items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-stone-100/80 dark:hover:bg-stone-900/50 sm:py-1.5"
                      data-testid={`index-${idx.symbol}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                          {idx.name}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {idx.symbol}
                        </p>
                      </div>

                      <div className="text-right ml-3 flex-shrink-0">
                        <p
                          className="text-sm font-medium tabular-nums text-stone-900 dark:text-stone-100"
                          data-testid={`value-${idx.symbol}`}
                        >
                          {formatValue(idx.value)}
                        </p>
                        <p
                          className={`text-xs font-medium ${colorClass}`}
                          data-testid={`change-${idx.symbol}`}
                        >
                          {formatChange(idx.change)} (
                          {formatPercent(idx.changePercent)})
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
