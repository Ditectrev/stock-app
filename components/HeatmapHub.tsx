"use client";

/**
 * HeatmapHub Component
 * Wraps HeatmapNavigation with the active heatmap panel.
 *
 * Requirements: 25.2
 */

import { DNA_EYEBROW, DNA_SUBHEADING } from "@/lib/design-dna";
import { useState } from "react";
import { HeatmapNavigation, HeatmapType } from "@/components/HeatmapNavigation";
import { ETFHeatmap } from "@/components/ETFHeatmap";
import { CryptoHeatmap } from "@/components/CryptoHeatmap";
import { StockHeatmap } from "@/components/StockHeatmap";
import { HOME_INSTRUMENT_PANEL } from "@/lib/home-ui";

export interface HeatmapHubProps {
  defaultHeatmap?: HeatmapType;
  refreshInterval?: number;
  onSymbolClick?: (symbol: string) => void;
}

export function HeatmapHub({
  defaultHeatmap = "etf",
  refreshInterval = 60000,
  onSymbolClick,
}: HeatmapHubProps) {
  const [activeHeatmap, setActiveHeatmap] =
    useState<HeatmapType>(defaultHeatmap);

  return (
    <div className={HOME_INSTRUMENT_PANEL} data-testid="heatmap-hub">
      <header className="mb-4 sm:mb-6" data-testid="heatmap-hub-header">
        <p className={DNA_EYEBROW}>Market breadth</p>
        <h2 className={`mt-1 ${DNA_SUBHEADING}`}>Heatmaps</h2>
      </header>
      <HeatmapNavigation
        activeHeatmap={activeHeatmap}
        onHeatmapChange={setActiveHeatmap}
      />
      <div className="mt-4" id={`heatmap-panel-${activeHeatmap}`}>
        {activeHeatmap === "etf" && (
          <ETFHeatmap
            refreshInterval={refreshInterval}
            onETFClick={onSymbolClick}
          />
        )}
        {activeHeatmap === "crypto" && (
          <CryptoHeatmap
            refreshInterval={refreshInterval}
            onCryptoClick={onSymbolClick}
          />
        )}
        {activeHeatmap === "stock" && (
          <StockHeatmap
            refreshInterval={refreshInterval}
            onStockClick={onSymbolClick}
          />
        )}
      </div>
    </div>
  );
}
