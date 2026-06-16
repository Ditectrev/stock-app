"use client";

/**
 * ChartWithIndicators Component
 * Combines ChartComponent with TechnicalIndicatorOverlay
 * Provides a complete charting solution with toggleable indicators
 *
 * Requirements: 4.2, 5.1, 5.2, 11.2, 11.3, 11.4, 11.5
 */

import { useState, useCallback } from "react";
import { ChartComponent } from "./ChartComponent";
import { TechnicalIndicatorOverlay } from "./TechnicalIndicatorOverlay";
import { PriceData, TimeRange, ChartType, ChartIndicator } from "@/types";

export interface ChartWithIndicatorsProps {
  data: PriceData[];
  type?: ChartType;
  initialTimeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  responsive?: boolean;
  height?: number;
}

/**
 * Complete chart component with integrated technical indicators
 */
export function ChartWithIndicators({
  data,
  type = "area",
  initialTimeRange = "1M",
  onTimeRangeChange,
  responsive = true,
  height = 400,
}: ChartWithIndicatorsProps) {
  const [indicators, setIndicators] = useState<ChartIndicator[]>([]);

  // Handle indicator changes from overlay
  const handleIndicatorsChange = useCallback(
    (newIndicators: ChartIndicator[]) => {
      setIndicators(newIndicators);
    },
    []
  );

  return (
    <div
      className="chart-with-indicators space-y-4"
      role="region"
      aria-label="Price chart with technical indicators"
    >
      {/* Technical Indicator Controls */}
      <TechnicalIndicatorOverlay onIndicatorsChange={handleIndicatorsChange} />

      {/* Chart */}
      <ChartComponent
        data={data}
        type={type}
        initialTimeRange={initialTimeRange}
        indicators={indicators}
        onTimeRangeChange={onTimeRangeChange}
        responsive={responsive}
        height={height}
      />
    </div>
  );
}
