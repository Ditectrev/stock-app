"use client";

/**
 * SymbolHeader Component
 * Displays symbol name and current price with change indicators
 *
 * Requirements: 2.4, 4.3
 */

import { DNA_CAPTION, DNA_DISPLAY } from "@/lib/design-dna";
import { SymbolData } from "@/types";
import { marketChangeTextClass } from "@/lib/market-semantics";
import {
  SYMBOL_CHANGE_LINE,
  SYMBOL_INSTRUMENT_PANEL,
  SYMBOL_SECTION_LABEL,
  SYMBOL_SUBTITLE,
} from "@/lib/symbol-ui";

export interface SymbolHeaderProps {
  symbolData: SymbolData;
}

export function SymbolHeader({ symbolData }: SymbolHeaderProps) {
  const isPositive = symbolData.change >= 0;
  const changeColor = marketChangeTextClass(symbolData.change);

  return (
    <div
      className={SYMBOL_INSTRUMENT_PANEL}
      aria-label={`${symbolData.symbol} - ${symbolData.name}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <p className={SYMBOL_SECTION_LABEL}>Symbol snapshot</p>
          <h1 className={DNA_DISPLAY}>{symbolData.symbol}</h1>
          <p className={SYMBOL_SUBTITLE}>{symbolData.name}</p>
        </div>

        <div
          className="text-left sm:text-right"
          aria-live="polite"
          aria-atomic="true"
        >
          <div
            className={DNA_DISPLAY}
            aria-label={`Current price: $${symbolData.price.toFixed(2)}`}
          >
            ${symbolData.price.toFixed(2)}
          </div>
          <div
            className={`${SYMBOL_CHANGE_LINE} ${changeColor}`}
            aria-label={`Change: ${isPositive ? "+" : ""}${symbolData.change.toFixed(2)} (${isPositive ? "+" : ""}${symbolData.changePercent.toFixed(2)}%)`}
          >
            {isPositive ? "+" : ""}
            {symbolData.change.toFixed(2)} ({isPositive ? "+" : ""}
            {symbolData.changePercent.toFixed(2)}%)
          </div>
          <div className={DNA_CAPTION}>
            Last updated: {new Date(symbolData.lastUpdated).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
