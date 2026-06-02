"use client";

/**
 * OverviewTab Component
 * Chart-first overview with key metrics (price lives in SymbolHeader).
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { SymbolData, PriceData, TimeRange } from "@/types";
import { ChartComponent } from "@/components/ChartComponent";
import { KeyMetrics } from "@/components/KeyMetrics";
import {
  SYMBOL_INSTRUMENT_PANEL,
  SYMBOL_PANEL_TITLE,
  SYMBOL_SECTION_LABEL,
  SYMBOL_SUBTLE_TEXT,
} from "@/lib/symbol-ui";

export interface OverviewTabProps {
  symbolData: SymbolData;
  historicalData: PriceData[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

export function OverviewTab({
  symbolData,
  historicalData,
  timeRange,
  onTimeRangeChange,
}: OverviewTabProps) {
  return (
    <div className="space-y-6" role="tabpanel" aria-label="Overview">
      <div className={`${SYMBOL_INSTRUMENT_PANEL} lg:p-8`}>
        <p className={`mb-2 ${SYMBOL_SECTION_LABEL}`}>Price trend</p>
        <h2 className={`mb-2 sm:mb-3 ${SYMBOL_PANEL_TITLE}`}>Chart</h2>
        <p className={`mb-3 text-sm sm:mb-4 ${SYMBOL_SUBTLE_TEXT}`}>
          Adjust the range to compare price action. Headline price is in the
          symbol header.
        </p>
        <div className="h-[300px] md:h-[380px] lg:h-[420px] xl:h-[500px]">
          <ChartComponent
            data={historicalData}
            type="area"
            initialTimeRange={timeRange}
            onTimeRangeChange={onTimeRangeChange}
            responsive={true}
            height={300}
          />
        </div>
      </div>

      <KeyMetrics symbolData={symbolData} />
    </div>
  );
}
