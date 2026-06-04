"use client";

/**
 * ScreenerHub Component
 * Composes AssetScreener, ScreenerPresets, ScreenerTableView, and
 * ScreenerHeatmapView together. Provides a toggle between "Table" and
 * "Heatmap" view modes with shared results state.
 *
 * Requirements: 26.10, 26.11, 26.12, 26.13, 26.15, 26.17, 26.23, 26.25
 */

import {
  DNA_BODY,
  DNA_CAPTION,
  DNA_EYEBROW,
  DNA_SUBHEADING,
} from "@/lib/design-dna";
import { useState, useCallback, useEffect, useRef } from "react";
import type { ScreenerFilter, ScreenerPreset, ScreenerResult } from "@/types";
import {
  HOME_INSTRUMENT_PANEL,
  HOME_SEGMENTED_NAV,
  homeSegmentedTabClasses,
} from "@/lib/home-ui";
import { useTheme } from "@/lib/theme-context";
import { AssetScreener } from "./AssetScreener";
import { ScreenerPresets } from "./ScreenerPresets";
import { ScreenerTableView } from "./ScreenerTableView";
import { ScreenerHeatmapView } from "./ScreenerHeatmapView";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScreenerViewMode = "table" | "heatmap";

export interface ScreenerHubProps {
  onSymbolClick?: (symbol: string) => void;
  /** Auto-refresh interval in milliseconds (0 or undefined = disabled). Default: 60000 */
  refreshInterval?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "screener-filters";
const DEFAULT_REFRESH_INTERVAL = 60_000; // 60 seconds

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScreenerHub({
  onSymbolClick,
  refreshInterval,
}: ScreenerHubProps) {
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [viewMode, setViewMode] = useState<ScreenerViewMode>("table");
  const [currentFilters, setCurrentFilters] = useState<ScreenerFilter[]>([]);
  const [presetFilters, setPresetFilters] = useState<
    ScreenerFilter[] | undefined
  >(undefined);

  // Ref to track latest filters for auto-refresh without re-creating interval
  const filtersRef = useRef<ScreenerFilter[]>([]);

  // Restore persisted filters from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPresetFilters(parsed as ScreenerFilter[]);
          setCurrentFilters(parsed as ScreenerFilter[]);
        }
      }
    } catch {
      // Gracefully handle missing/invalid data or private browsing
    }
  }, []);

  const handleResultsChange = useCallback((newResults: ScreenerResult[]) => {
    setResults(newResults);
  }, []);

  const handleFiltersChange = useCallback((filters: ScreenerFilter[]) => {
    setCurrentFilters(filters);
    filtersRef.current = filters;

    // Persist to localStorage
    try {
      if (filters.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
      }
    } catch {
      // Gracefully handle storage errors (private browsing, quota exceeded)
    }
  }, []);

  const handlePresetSelect = useCallback(async (preset: ScreenerPreset) => {
    // Set initialFilters so AssetScreener populates its UI
    setPresetFilters(preset.filters);

    // Also fire a search using the preset id
    try {
      const res = await fetch("/api/screener/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset: preset.id }),
      });

      if (res.ok) {
        const json = await res.json();
        const data: ScreenerResult[] = json.data ?? [];
        setResults(data);
        setCurrentFilters(preset.filters);
      }
    } catch {
      // Silently fail — user can still apply filters manually
    }
  }, []);

  // Auto-refresh: re-fetch results at a configurable interval (Req 26.25)
  const interval =
    refreshInterval !== undefined ? refreshInterval : DEFAULT_REFRESH_INTERVAL;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (interval <= 0) return;

    const id = setInterval(async () => {
      const filters = filtersRef.current;
      if (filters.length === 0) return;

      try {
        const res = await fetch("/api/screener/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filters }),
        });

        if (res.ok) {
          const json = await res.json();
          const data: ScreenerResult[] = json.data ?? [];
          setResults(data);
        }
      } catch {
        // Silently fail on auto-refresh errors
      }
    }, interval);

    return () => clearInterval(id);
  }, [interval]);

  return (
    <div className={HOME_INSTRUMENT_PANEL} data-testid="screener-hub">
      <header className="mb-4 sm:mb-6" data-testid="screener-hub-header">
        <p className={DNA_EYEBROW}>Discovery</p>
        <h2 className={`mt-1 ${DNA_SUBHEADING}`}>Screener</h2>
        <p className={`mt-1 ${DNA_BODY}`}>
          Build a thesis with filters on the left, then inspect results in a
          table or heatmap canvas.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.9fr]">
        <aside className="space-y-4 rounded-xl border border-stone-200 bg-stone-100 p-3 dark:border-stone-700 dark:bg-stone-800">
          <AssetScreener
            onResultsChange={handleResultsChange}
            onFiltersChange={handleFiltersChange}
            initialFilters={presetFilters}
          />

          <ScreenerPresets
            currentFilters={currentFilters}
            onPresetSelect={handlePresetSelect}
          />
        </aside>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={DNA_EYEBROW}>Results canvas</p>
              <p className={`mt-1 ${DNA_CAPTION}`}>
                {results.length} match{results.length === 1 ? "" : "es"}
              </p>
            </div>
            <div
              className={`${HOME_SEGMENTED_NAV} w-fit`}
              role="tablist"
              aria-label="Screener view mode"
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "table"}
                onClick={() => setViewMode("table")}
                className={homeSegmentedTabClasses(
                  viewMode === "table",
                  isDark
                )}
                data-testid="view-toggle-table"
              >
                Table
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "heatmap"}
                onClick={() => setViewMode("heatmap")}
                className={homeSegmentedTabClasses(
                  viewMode === "heatmap",
                  isDark
                )}
                data-testid="view-toggle-heatmap"
              >
                Heatmap
              </button>
            </div>
          </div>

          <div role="tabpanel">
            {viewMode === "table" ? (
              <ScreenerTableView
                results={results}
                onSymbolClick={onSymbolClick}
              />
            ) : (
              <ScreenerHeatmapView
                results={results}
                onSymbolClick={onSymbolClick}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
