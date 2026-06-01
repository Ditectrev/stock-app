"use client";

/**
 * ScreenerHeatmapView Component
 * Displays screener results using the existing HeatmapComponent.
 * Converts ScreenerResult[] to HeatmapData[] for visualization.
 *
 * Note: Mini charts per asset (Req 26.11, 26.17) are not yet available
 * because screener results lack per-asset historical data. The HeatmapComponent
 * tiles already show symbol and change % as a visual representation.
 *
 * Requirements: 26.10, 26.11, 26.17
 */

import { useCallback, useMemo } from "react";
import type { ScreenerResult } from "@/types";
import type { HeatmapData } from "@/types";
import { HOME_INSTRUMENT_PANEL, HOME_SUBTLE_TEXT } from "@/lib/home-ui";
import { HeatmapComponent } from "./HeatmapComponent";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScreenerHeatmapViewProps {
  results: ScreenerResult[];
  onSymbolClick?: (symbol: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toHeatmapData(results: ScreenerResult[]): HeatmapData[] {
  return results.map((r) => ({
    symbol: r.symbol,
    name: r.name,
    value: r.price,
    changePercent: r.changePercent,
    sector: r.sector,
    marketCap: r.marketCap,
  }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScreenerHeatmapView({
  results,
  onSymbolClick,
}: ScreenerHeatmapViewProps) {
  const heatmapData = useMemo(() => toHeatmapData(results), [results]);

  const handleTileClick = useCallback(
    (item: HeatmapData) => {
      onSymbolClick?.(item.symbol);
    },
    [onSymbolClick]
  );

  if (results.length === 0) {
    return (
      <div
        className={`${HOME_INSTRUMENT_PANEL} p-8 text-center ${HOME_SUBTLE_TEXT}`}
        data-testid="screener-heatmap-empty"
      >
        No results
      </div>
    );
  }

  return (
    <div
      data-testid="screener-heatmap-view"
      role="region"
      aria-label="Screener heatmap results"
    >
      {/* Placeholder: mini charts per asset will be added when historical data is available in screener results */}
      <HeatmapComponent data={heatmapData} onTileClick={handleTileClick} />
    </div>
  );
}
