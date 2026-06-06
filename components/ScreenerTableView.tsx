"use client";

/**
 * ScreenerTableView Component
 * Displays screener results in a sortable, paginated table with valuation color-coding.
 *
 * Requirements: 26.9, 26.16, 26.18, 26.19, 26.21, 26.22
 */

import { DNA_BODY, DNA_CAPTION } from "@/lib/design-dna";
import { useState, useMemo, useCallback, useEffect } from "react";
import type { ScreenerResult } from "@/types";
import {
  MARKET_DOWN_BADGE,
  MARKET_NEUTRAL_BADGE,
  MARKET_UP_BADGE,
  marketChangeTextClass,
  marketValuationRowAccent,
  marketValuationRowBg,
} from "@/lib/market-semantics";
import { HOME_SECONDARY_BUTTON } from "@/lib/home-ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScreenerTableViewProps {
  results: ScreenerResult[];
  onSymbolClick?: (symbol: string) => void;
}

type SortField = keyof Pick<
  ScreenerResult,
  | "symbol"
  | "name"
  | "price"
  | "changePercent"
  | "volume"
  | "marketCap"
  | "peRatio"
  | "sector"
  | "valuationContext"
>;

type SortDirection = "asc" | "desc";

interface SortState {
  field: SortField;
  direction: SortDirection;
}

const PAGE_SIZE = 50;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatVolume(volume: number): string {
  return volume.toLocaleString("en-US");
}

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(1)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(1)}M`;
  if (cap >= 1e3) return `$${(cap / 1e3).toFixed(1)}K`;
  return `$${cap.toFixed(0)}`;
}

function formatChangePercent(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

function compareValues(
  a: ScreenerResult,
  b: ScreenerResult,
  field: SortField,
  direction: SortDirection
): number {
  const aVal = a[field];
  const bVal = b[field];

  // Handle undefined (optional fields like peRatio)
  if (aVal == null && bVal == null) return 0;
  if (aVal == null) return direction === "asc" ? 1 : -1;
  if (bVal == null) return direction === "asc" ? -1 : 1;

  let cmp: number;
  if (typeof aVal === "string" && typeof bVal === "string") {
    cmp = aVal.localeCompare(bVal);
  } else {
    cmp = (aVal as number) - (bVal as number);
  }

  return direction === "asc" ? cmp : -cmp;
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const COLUMNS: { field: SortField; label: string }[] = [
  { field: "symbol", label: "Symbol" },
  { field: "name", label: "Name" },
  { field: "price", label: "Price" },
  { field: "changePercent", label: "Change %" },
  { field: "volume", label: "Volume" },
  { field: "marketCap", label: "Market Cap" },
  { field: "peRatio", label: "P/E" },
  { field: "sector", label: "Sector" },
  { field: "valuationContext", label: "Valuation" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScreenerTableView({
  results,
  onSymbolClick,
}: ScreenerTableViewProps) {
  const [sort, setSort] = useState<SortState>({
    field: "symbol",
    direction: "asc",
  });
  const [page, setPage] = useState(0);

  const handleSort = useCallback((field: SortField) => {
    setSort((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
    setPage(0);
  }, []);

  const sorted = useMemo(
    () =>
      [...results].sort((a, b) =>
        compareValues(a, b, sort.field, sort.direction)
      ),
    [results, sort]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when results change
  useEffect(() => {
    setPage(0);
  }, [results]);

  if (results.length === 0) {
    return (
      <div
        className={`rounded-xl border border-stone-200 bg-stone-50 p-8 text-center dark:border-stone-700 dark:bg-stone-950 ${DNA_CAPTION}`}
      >
        No results
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50 shadow-sm dark:border-stone-700 dark:bg-stone-950">
      <div className="overflow-x-auto">
        <table
          className={`w-full min-w-[720px] ${DNA_BODY}`}
          aria-label="Screener results"
        >
          <thead>
            <tr className="border-b border-stone-200 bg-stone-100 dark:border-stone-700 dark:bg-stone-900">
              {COLUMNS.map((col) => (
                <th
                  key={col.field}
                  className={`cursor-pointer select-none px-3 py-2 text-left font-medium text-stone-900 transition-colors hover:bg-stone-200 dark:text-stone-100 dark:hover:bg-stone-800 md:px-4 md:py-3 lg:px-5`}
                  onClick={() => handleSort(col.field)}
                  aria-sort={
                    sort.field === col.field
                      ? sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sort.field === col.field && (
                      <span aria-hidden="true">
                        {sort.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row) => {
              const rowBg = marketValuationRowBg(row.valuationContext);
              const rowAccent = marketValuationRowAccent(row.valuationContext);

              return (
                <tr
                  key={row.symbol}
                  className={`cursor-pointer border-b border-stone-200 text-stone-800 transition-colors hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-100 dark:hover:bg-stone-900 ${rowBg} ${rowAccent}`}
                  onClick={() => onSymbolClick?.(row.symbol)}
                  data-testid={`row-${row.symbol}`}
                >
                  <td className="px-3 py-2 font-medium">{row.symbol}</td>
                  <td className={`max-w-[200px] truncate px-3 py-2`}>
                    {row.name}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {formatPrice(row.price)}
                  </td>
                  <td
                    className={`px-3 py-2 font-medium tabular-nums ${
                      row.changePercent === 0
                        ? "text-stone-600 dark:text-stone-300"
                        : marketChangeTextClass(row.changePercent)
                    }`}
                  >
                    {formatChangePercent(row.changePercent)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {formatVolume(row.volume)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {formatMarketCap(row.marketCap)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {row.peRatio != null ? row.peRatio.toFixed(1) : "—"}
                  </td>
                  <td className="px-3 py-2">{row.sector}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.valuationContext === "overpriced"
                          ? MARKET_DOWN_BADGE
                          : row.valuationContext === "underpriced"
                            ? MARKET_UP_BADGE
                            : MARKET_NEUTRAL_BADGE
                      }`}
                    >
                      {row.valuationContext}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sorted.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t border-stone-200 px-3 py-3 sm:px-4 dark:border-stone-700">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className={`${HOME_SECONDARY_BUTTON} min-h-[44px] disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Previous
          </button>
          <span className={`${DNA_BODY}`}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className={`${HOME_SECONDARY_BUTTON} min-h-[44px] disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
