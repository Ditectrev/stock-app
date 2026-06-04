"use client";

/**
 * MatrixHeatmap
 * Renders data in a matrix format where rows represent symbols/sectors
 * and columns represent time periods or metrics. Cells are color-coded
 * based on return values or metric values.
 *
 * Requirements: 25.1, 25.10, 25.11
 */

import { DNA_BODY, DNA_CAPTION } from "@/lib/design-dna";
import { useMemo, useState } from "react";
import { useTheme } from "@/lib/theme-context";
import { HeatmapData } from "@/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  getHeatmapFillColor,
  getHeatmapNeutralLegendColor,
  getHeatmapTextClass,
} from "@/lib/heatmap-colors";
import { HOME_INSTRUMENT_PANEL, HOME_LEGEND_DIVIDER, HOME_LEGEND_TEXT } from "@/lib/home-ui";

export interface MatrixColumn {
  /** Unique key for this column */
  key: string;
  /** Display label for the column header */
  label: string;
}

export interface MatrixRow {
  /** Unique key for this row (e.g. symbol or sector name) */
  key: string;
  /** Display label for the row header */
  label: string;
}

export interface MatrixCellData {
  /** Row key */
  rowKey: string;
  /** Column key */
  colKey: string;
  /** Numeric value for color coding */
  value: number;
  /** Optional display label override */
  displayValue?: string;
}

export interface MatrixHeatmapProps {
  /** Row definitions (symbols or sectors) */
  rows: MatrixRow[];
  /** Column definitions (time periods or metrics) */
  columns: MatrixColumn[];
  /** Cell data keyed by rowKey and colKey */
  cells: MatrixCellData[];
  /** Whether data is currently loading */
  loading?: boolean;
  /** Callback when a cell is clicked */
  onCellClick?: (cell: MatrixCellData) => void;
  /** Optional HeatmapData array for compatibility with base HeatmapComponent patterns */
  data?: HeatmapData[];
}

function formatCellValue(value: number): string {
  if (value == null || isNaN(value)) return "N/A";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function MatrixHeatmap({
  rows,
  columns,
  cells,
  loading = false,
  onCellClick,
}: MatrixHeatmapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  /** Build a lookup map: "rowKey:colKey" → MatrixCellData */
  const cellMap = useMemo(() => {
    const map = new Map<string, MatrixCellData>();
    for (const cell of cells) {
      map.set(`${cell.rowKey}:${cell.colKey}`, cell);
    }
    return map;
  }, [cells]);

  // --- Loading state ---
  if (loading) {
    return (
      <div
        className={HOME_INSTRUMENT_PANEL}
        data-testid="matrix-heatmap-loading"
      >
        <LoadingSpinner className="py-8" />
      </div>
    );
  }

  // --- Empty state ---
  if (rows.length === 0 || columns.length === 0) {
    return (
      <div className={HOME_INSTRUMENT_PANEL} data-testid="matrix-heatmap-empty">
        <p className={`text-center ${DNA_CAPTION}`}>
          No matrix data available.
        </p>
      </div>
    );
  }

  return (
    <div
      className={HOME_INSTRUMENT_PANEL}
      data-testid="matrix-heatmap"
      role="region"
      aria-label="Matrix heatmap"
    >
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse"
          data-testid="matrix-heatmap-table"
          role="grid"
          aria-label="Matrix heatmap grid"
        >
          <thead>
            <tr>
              {/* Top-left corner cell */}
              <th
                className={`px-3 py-2 text-left text-xs font-medium ${DNA_CAPTION}`}
              />
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2 text-center text-xs font-medium ${DNA_CAPTION}`}
                  data-testid={`matrix-col-header-${col.key}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} data-testid={`matrix-row-${row.key}`}>
                <td
                  className={`px-3 py-2 text-xs font-medium whitespace-nowrap ${DNA_BODY}`}
                  data-testid={`matrix-row-header-${row.key}`}
                >
                  {row.label}
                </td>
                {columns.map((col) => {
                  const cellKey = `${row.key}:${col.key}`;
                  const cell = cellMap.get(cellKey);
                  const value = cell?.value ?? 0;
                  const bgColor = getHeatmapFillColor(value, isDark);
                  const isHovered = hoveredCell === cellKey;
                  const textColor = getHeatmapTextClass(value, isDark);

                  return (
                    <td
                      key={col.key}
                      className={`px-3 py-2 text-center text-xs font-medium cursor-pointer transition-transform ${textColor} ${
                        isHovered
                          ? "ring-2 ring-stone-500 dark:ring-stone-400"
                          : ""
                      }`}
                      style={{ backgroundColor: bgColor }}
                      data-testid={`matrix-cell-${row.key}-${col.key}`}
                      aria-label={`${row.label} ${col.label}: ${formatCellValue(value)}`}
                      role="gridcell"
                      tabIndex={0}
                      onMouseEnter={() => setHoveredCell(cellKey)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => {
                        if (cell) onCellClick?.(cell);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (cell) onCellClick?.(cell);
                        }
                      }}
                    >
                      {cell?.displayValue ?? formatCellValue(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div
        className={HOME_LEGEND_DIVIDER}
        data-testid="matrix-heatmap-legend"
        aria-label="Matrix heatmap color legend"
      >
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className={HOME_LEGEND_TEXT}>Strong decline</span>
          <div className="flex gap-0.5">
            {[
              "rgba(239,68,68,0.9)",
              "rgba(239,68,68,0.6)",
              "rgba(239,68,68,0.3)",
              getHeatmapNeutralLegendColor(isDark),
              "rgba(34,197,94,0.3)",
              "rgba(34,197,94,0.6)",
              "rgba(34,197,94,0.9)",
            ].map((color, i) => (
              <div
                key={i}
                className="w-6 h-4 rounded-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span className={HOME_LEGEND_TEXT}>Strong gain</span>
        </div>
      </div>
    </div>
  );
}
