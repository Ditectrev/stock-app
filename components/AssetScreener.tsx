"use client";

/**
 * AssetScreener Component
 * Provides a filter panel for searching and filtering assets by multiple criteria.
 * Supports valuation, growth, dividend, sector, market cap, and volume filters.
 *
 * Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.7, 26.14, 26.24
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import type { ScreenerFilter, ScreenerResult } from "@/types";
import { ErrorMessage } from "@/components/ErrorMessage";
import { MARKET_UI_COPY } from "@/lib/market-ui-copy";
import {
  HOME_INPUT_SM,
  HOME_MUTED_TEXT,
  HOME_PRIMARY_BUTTON,
  HOME_SECONDARY_BUTTON,
  HOME_SECTION_LABEL,
  HOME_SUBTLE_TEXT,
  HOME_TOOLTIP_POPOVER,
  homeChipClasses,
} from "@/lib/home-ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RangeFilterState {
  min: string;
  max: string;
}

interface FilterState {
  peRatio: RangeFilterState;
  pbRatio: RangeFilterState;
  pegRatio: RangeFilterState;
  revenueGrowth: RangeFilterState;
  earningsGrowth: RangeFilterState;
  dividendYield: RangeFilterState;
  payoutRatio: RangeFilterState;
  sectors: string[];
  marketCap: string[];
  minVolume: string;
}

export interface AssetScreenerProps {
  onResultsChange?: (results: ScreenerResult[]) => void;
  onFiltersChange?: (filters: ScreenerFilter[]) => void;
  initialFilters?: ScreenerFilter[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SECTORS = [
  "Technology",
  "Financial",
  "Consumer Discretionary",
  "Communication",
  "Healthcare",
  "Industrials",
  "Consumer Staples",
  "Energy",
  "Materials",
  "Real Estate",
  "Utilities",
] as const;

const MARKET_CAP_OPTIONS = [
  { label: "Small Cap (< $2B)", value: "small" },
  { label: "Mid Cap ($2B - $10B)", value: "mid" },
  { label: "Large Cap (> $10B)", value: "large" },
] as const;

const TOOLTIPS: Record<string, string> = {
  peRatio:
    "Price-to-Earnings ratio compares a company's stock price to its earnings per share. A lower P/E may indicate undervaluation.",
  pbRatio:
    "Price-to-Book ratio compares a company's market value to its book value. Values below 1 may suggest undervaluation.",
  pegRatio:
    "Price/Earnings-to-Growth ratio factors in expected earnings growth. A PEG below 1 may indicate the stock is undervalued relative to growth.",
  revenueGrowth:
    "Year-over-year percentage change in total revenue. Higher values indicate faster top-line growth.",
  earningsGrowth:
    "Year-over-year percentage change in net earnings. Higher values indicate improving profitability.",
  dividendYield:
    "Annual dividend payment as a percentage of the stock price. Higher yields provide more income per dollar invested.",
  payoutRatio:
    "Percentage of earnings paid out as dividends. A lower ratio suggests the dividend is more sustainable.",
  sector: "Filter by industry sector to focus on specific areas of the market.",
  marketCap:
    "Market capitalization is the total market value of a company's outstanding shares. Small Cap < $2B, Mid Cap $2B–$10B, Large Cap > $10B.",
  volume:
    "Minimum average daily trading volume. Higher volume indicates better liquidity and easier entry/exit.",
};

const EMPTY_RANGE: RangeFilterState = { min: "", max: "" };

const INITIAL_FILTER_STATE: FilterState = {
  peRatio: { ...EMPTY_RANGE },
  pbRatio: { ...EMPTY_RANGE },
  pegRatio: { ...EMPTY_RANGE },
  revenueGrowth: { ...EMPTY_RANGE },
  earningsGrowth: { ...EMPTY_RANGE },
  dividendYield: { ...EMPTY_RANGE },
  payoutRatio: { ...EMPTY_RANGE },
  sectors: [],
  marketCap: [],
  minVolume: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildFilters(state: FilterState): ScreenerFilter[] {
  const filters: ScreenerFilter[] = [];

  // Range-based numeric filters
  const rangeFields: {
    key: keyof FilterState;
    field: string;
    label: string;
  }[] = [
    { key: "peRatio", field: "peRatio", label: "P/E Ratio" },
    { key: "pbRatio", field: "pbRatio", label: "P/B Ratio" },
    { key: "pegRatio", field: "pegRatio", label: "PEG Ratio" },
    { key: "revenueGrowth", field: "revenueGrowth", label: "Revenue Growth" },
    {
      key: "earningsGrowth",
      field: "earningsGrowth",
      label: "Earnings Growth",
    },
    {
      key: "dividendYield",
      field: "dividendYield",
      label: "Dividend Yield",
    },
    { key: "payoutRatio", field: "payoutRatio", label: "Payout Ratio" },
  ];

  for (const { key, field, label } of rangeFields) {
    const range = state[key] as RangeFilterState;
    const hasMin = range.min !== "";
    const hasMax = range.max !== "";

    if (hasMin && hasMax) {
      filters.push({
        field,
        operator: "between",
        value: [Number(range.min), Number(range.max)],
        label: `${label} ${range.min}–${range.max}`,
      });
    } else if (hasMin) {
      filters.push({
        field,
        operator: "gte",
        value: Number(range.min),
        label: `${label} >= ${range.min}`,
      });
    } else if (hasMax) {
      filters.push({
        field,
        operator: "lte",
        value: Number(range.max),
        label: `${label} <= ${range.max}`,
      });
    }
  }

  // Sector filter
  if (state.sectors.length > 0) {
    filters.push({
      field: "sector",
      operator: "in",
      value: state.sectors,
      label: `Sector: ${state.sectors.join(", ")}`,
    });
  }

  // Market cap filter
  if (state.marketCap.length > 0) {
    for (const cap of state.marketCap) {
      if (cap === "small") {
        filters.push({
          field: "marketCap",
          operator: "lt",
          value: 2_000_000_000,
          label: "Market Cap < $2B",
        });
      } else if (cap === "mid") {
        filters.push({
          field: "marketCap",
          operator: "between",
          value: [2_000_000_000, 10_000_000_000],
          label: "Market Cap $2B–$10B",
        });
      } else if (cap === "large") {
        filters.push({
          field: "marketCap",
          operator: "gte",
          value: 10_000_000_000,
          label: "Market Cap > $10B",
        });
      }
    }
  }

  // Volume filter
  if (state.minVolume !== "") {
    filters.push({
      field: "volume",
      operator: "gte",
      value: Number(state.minVolume),
      label: `Volume >= ${Number(state.minVolume).toLocaleString()}`,
    });
  }

  return filters;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Tooltip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex">
      <button
        type="button"
        className="cursor-help rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-stone-400 dark:focus-visible:ring-offset-stone-900"
        aria-label="More info"
      >
        <svg
          className={`h-4 w-4 ${HOME_SUBTLE_TEXT}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
          />
        </svg>
      </button>
      <span
        role="tooltip"
        className={`${HOME_TOOLTIP_POPOVER} opacity-0 group-hover:opacity-100 group-focus-within:opacity-100`}
      >
        {text}
      </span>
    </span>
  );
}

function SectionLabel({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip?: string;
}) {
  return (
    <label
      className={`flex items-center text-sm font-medium ${HOME_MUTED_TEXT}`}
    >
      {children}
      {tooltip && <Tooltip text={tooltip} />}
    </label>
  );
}

function RangeInput({
  label,
  tooltip,
  value,
  onChange,
}: {
  label: string;
  tooltip: string;
  value: RangeFilterState;
  onChange: (v: RangeFilterState) => void;
}) {
  return (
    <div className="space-y-1">
      <SectionLabel tooltip={tooltip}>{label}</SectionLabel>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Min"
          aria-label={`${label} minimum`}
          value={value.min}
          onChange={(e) => onChange({ ...value, min: e.target.value })}
          className={HOME_INPUT_SM}
        />
        <span className={`text-xs ${HOME_SUBTLE_TEXT}`}>–</span>
        <input
          type="number"
          placeholder="Max"
          aria-label={`${label} maximum`}
          value={value.max}
          onChange={(e) => onChange({ ...value, max: e.target.value })}
          className={HOME_INPUT_SM}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AssetScreener({
  onResultsChange,
  onFiltersChange,
  initialFilters,
}: AssetScreenerProps) {
  const [filterState, setFilterState] =
    useState<FilterState>(INITIAL_FILTER_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState<number | null>(null);

  // Populate filter state from initialFilters when they change
  useEffect(() => {
    if (!initialFilters || initialFilters.length === 0) return;

    const next: FilterState = {
      ...INITIAL_FILTER_STATE,
      sectors: [],
      marketCap: [],
    };

    for (const f of initialFilters) {
      // Range-based numeric fields
      const rangeKeys: Record<string, keyof FilterState> = {
        peRatio: "peRatio",
        pbRatio: "pbRatio",
        pegRatio: "pegRatio",
        revenueGrowth: "revenueGrowth",
        earningsGrowth: "earningsGrowth",
        dividendYield: "dividendYield",
        payoutRatio: "payoutRatio",
      };

      if (rangeKeys[f.field]) {
        const key = rangeKeys[f.field] as keyof FilterState;
        if (f.operator === "between" && Array.isArray(f.value)) {
          (next[key] as RangeFilterState) = {
            min: String(f.value[0]),
            max: String(f.value[1]),
          };
        } else if (f.operator === "gte" || f.operator === "gt") {
          (next[key] as RangeFilterState) = {
            ...(next[key] as RangeFilterState),
            min: String(f.value),
          };
        } else if (f.operator === "lte" || f.operator === "lt") {
          (next[key] as RangeFilterState) = {
            ...(next[key] as RangeFilterState),
            max: String(f.value),
          };
        }
      } else if (
        f.field === "sector" &&
        f.operator === "in" &&
        Array.isArray(f.value)
      ) {
        next.sectors = f.value as string[];
      } else if (f.field === "marketCap") {
        if (f.operator === "lt" && f.value === 2_000_000_000) {
          next.marketCap = [...next.marketCap, "small"];
        } else if (f.operator === "between" && Array.isArray(f.value)) {
          next.marketCap = [...next.marketCap, "mid"];
        } else if (f.operator === "gte" && f.value === 10_000_000_000) {
          next.marketCap = [...next.marketCap, "large"];
        }
      } else if (
        f.field === "volume" &&
        (f.operator === "gte" || f.operator === "gt")
      ) {
        next.minVolume = String(f.value);
      }
    }

    setFilterState(next);
  }, [initialFilters]);

  // Derive active filters from state
  const activeFilters = useMemo(() => buildFilters(filterState), [filterState]);

  // ------ handlers ------

  const updateRange = useCallback(
    (key: keyof FilterState) => (value: RangeFilterState) => {
      setFilterState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleSector = useCallback((sector: string) => {
    setFilterState((prev) => {
      const exists = prev.sectors.includes(sector);
      return {
        ...prev,
        sectors: exists
          ? prev.sectors.filter((s) => s !== sector)
          : [...prev.sectors, sector],
      };
    });
  }, []);

  const toggleMarketCap = useCallback((cap: string) => {
    setFilterState((prev) => {
      const exists = prev.marketCap.includes(cap);
      return {
        ...prev,
        marketCap: exists
          ? prev.marketCap.filter((c) => c !== cap)
          : [...prev.marketCap, cap],
      };
    });
  }, []);

  const handleApply = useCallback(async () => {
    const filters = buildFilters(filterState);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/screener/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters }),
      });

      if (!res.ok) {
        throw new Error(MARKET_UI_COPY.load.screenerResults);
      }

      const json = await res.json();
      const data: ScreenerResult[] = json.data ?? [];
      setResultCount(data.length);
      onResultsChange?.(data);
      onFiltersChange?.(filters);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : MARKET_UI_COPY.load.screenerResults
      );
    } finally {
      setLoading(false);
    }
  }, [filterState, onResultsChange, onFiltersChange]);

  const handleClear = useCallback(() => {
    setFilterState({ ...INITIAL_FILTER_STATE });
    setResultCount(null);
    setError(null);
    onResultsChange?.([]);
    onFiltersChange?.([]);
  }, [onResultsChange, onFiltersChange]);

  // ------ render ------

  return (
    <div className="border-t border-stone-200 pt-4 dark:border-stone-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* ---- Valuation Metrics ---- */}
        <fieldset className="space-y-3">
          <legend
            className={`mb-1 text-sm font-semibold ${HOME_SECTION_LABEL}`}
          >
            Valuation Metrics
          </legend>
          <RangeInput
            label="P/E Ratio"
            tooltip={TOOLTIPS.peRatio}
            value={filterState.peRatio}
            onChange={updateRange("peRatio")}
          />
          <RangeInput
            label="P/B Ratio"
            tooltip={TOOLTIPS.pbRatio}
            value={filterState.pbRatio}
            onChange={updateRange("pbRatio")}
          />
          <RangeInput
            label="PEG Ratio"
            tooltip={TOOLTIPS.pegRatio}
            value={filterState.pegRatio}
            onChange={updateRange("pegRatio")}
          />
        </fieldset>

        {/* ---- Growth Metrics ---- */}
        <fieldset className="space-y-3">
          <legend
            className={`mb-1 text-sm font-semibold ${HOME_SECTION_LABEL}`}
          >
            Growth Metrics
          </legend>
          <RangeInput
            label="Revenue Growth (%)"
            tooltip={TOOLTIPS.revenueGrowth}
            value={filterState.revenueGrowth}
            onChange={updateRange("revenueGrowth")}
          />
          <RangeInput
            label="Earnings Growth (%)"
            tooltip={TOOLTIPS.earningsGrowth}
            value={filterState.earningsGrowth}
            onChange={updateRange("earningsGrowth")}
          />
        </fieldset>

        {/* ---- Dividend Metrics ---- */}
        <fieldset className="space-y-3">
          <legend
            className={`mb-1 text-sm font-semibold ${HOME_SECTION_LABEL}`}
          >
            Dividend Metrics
          </legend>
          <RangeInput
            label="Dividend Yield (%)"
            tooltip={TOOLTIPS.dividendYield}
            value={filterState.dividendYield}
            onChange={updateRange("dividendYield")}
          />
          <RangeInput
            label="Payout Ratio (%)"
            tooltip={TOOLTIPS.payoutRatio}
            value={filterState.payoutRatio}
            onChange={updateRange("payoutRatio")}
          />
        </fieldset>

        {/* ---- Sector ---- */}
        <fieldset className="space-y-2">
          <legend
            className={`mb-1 flex items-center text-sm font-semibold ${HOME_SECTION_LABEL}`}
          >
            Sector
            <Tooltip text={TOOLTIPS.sector} />
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {SECTORS.map((sector) => {
              const selected = filterState.sectors.includes(sector);
              return (
                <button
                  key={sector}
                  type="button"
                  onClick={() => toggleSector(sector)}
                  aria-pressed={selected}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${homeChipClasses(selected)}`}
                >
                  {sector}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* ---- Market Cap ---- */}
        <fieldset className="space-y-2">
          <legend
            className={`mb-1 flex items-center text-sm font-semibold ${HOME_SECTION_LABEL}`}
          >
            Market Cap
            <Tooltip text={TOOLTIPS.marketCap} />
          </legend>
          <div className="flex flex-wrap gap-2">
            {MARKET_CAP_OPTIONS.map((opt) => {
              const selected = filterState.marketCap.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleMarketCap(opt.value)}
                  aria-pressed={selected}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${homeChipClasses(selected)}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* ---- Volume / Liquidity ---- */}
        <fieldset className="space-y-2">
          <legend
            className={`mb-1 flex items-center text-sm font-semibold ${HOME_SECTION_LABEL}`}
          >
            Volume &amp; Liquidity
            <Tooltip text={TOOLTIPS.volume} />
          </legend>
          <div className="space-y-1">
            <SectionLabel>Minimum Volume</SectionLabel>
            <input
              type="number"
              placeholder="e.g. 1000000"
              aria-label="Minimum volume"
              value={filterState.minVolume}
              onChange={(e) =>
                setFilterState((prev) => ({
                  ...prev,
                  minVolume: e.target.value,
                }))
              }
              className={HOME_INPUT_SM}
            />
          </div>
        </fieldset>
      </div>

      {/* ---- Actions & Result Count ---- */}
      <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleApply}
          disabled={loading}
          className={`${HOME_PRIMARY_BUTTON} min-h-[44px] disabled:opacity-50`}
        >
          {loading ? "Searching…" : "Apply Filters"}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className={`${HOME_SECONDARY_BUTTON} min-h-[44px]`}
        >
          Clear All
        </button>

        {resultCount !== null && (
          <span className={`text-sm ${HOME_MUTED_TEXT}`}>
            {resultCount} {resultCount === 1 ? "asset" : "assets"} found
          </span>
        )}

        {activeFilters.length > 0 && (
          <span className={`text-xs ${HOME_SUBTLE_TEXT}`}>
            ({activeFilters.length}{" "}
            {activeFilters.length === 1 ? "filter" : "filters"} active)
          </span>
        )}
      </div>

      {/* ---- Error ---- */}
      {error && (
        <div className="mt-4">
          <ErrorMessage type="api" message={error} onRetry={handleApply} />
        </div>
      )}
    </div>
  );
}
