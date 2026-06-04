"use client";

/**
 * FearGreedGauge Component
 * Displays the CNN Fear & Greed Index with a semi-circle gauge visualization,
 * current value, label, historical timeline, and explanatory tooltip.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import {
  DNA_BODY,
  DNA_CAPTION,
  DNA_EYEBROW,
  DNA_GAUGE_VALUE,
  DNA_HEADING,
  DNA_HELP_BUTTON,
  DNA_SUBHEADING,
  DNA_TOOLTIP_INVERSE,
} from "@/lib/design-dna";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/theme-context";
import { FearGreedData } from "@/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import {
  MARKET_SENTIMENT_HISTORY_BANDS,
  marketSentimentGaugeArcSegments,
  marketSentimentGaugeChartStroke,
  marketSentimentGaugeColor,
  marketSentimentGaugeTickColor,
  marketSentimentLegendRanges,
} from "@/lib/market-semantics";
import { MARKET_UI_COPY } from "@/lib/market-ui-copy";
import {
  HOME_INSTRUMENT_PANEL,
  HOME_RANGE_BUTTON_ACTIVE,
  HOME_RANGE_BUTTON_IDLE,
} from "@/lib/home-ui";

export interface FearGreedGaugeProps {
  data?: FearGreedData;
}

/** Map a 0-100 value to a label */
function getLabel(value: number): FearGreedData["label"] {
  if (value <= 25) return "Extreme Fear";
  if (value <= 45) return "Fear";
  if (value <= 55) return "Neutral";
  if (value <= 75) return "Greed";
  return "Extreme Greed";
}

const TOOLTIP_TEXT =
  "The Fear & Greed Index measures market sentiment on a 0-100 scale using seven indicators including market momentum, stock price strength, stock price breadth, put/call options, junk bond demand, market volatility, and safe haven demand.";

export function FearGreedGauge({ data: externalData }: FearGreedGaugeProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [data, setData] = useState<FearGreedData | null>(externalData ?? null);
  const [loading, setLoading] = useState(!externalData);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [historyRange, setHistoryRange] = useState<
    "1W" | "1M" | "3M" | "1Y" | "5Y" | "YTD" | "Max"
  >("1M");

  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    value: number;
    date: Date;
  } | null>(null);

  const fetchData = useCallback(async (limit: number = 30) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/market/fear-greed?limit=${limit}`);
      if (!res.ok) throw new Error(MARKET_UI_COPY.load.fearGreed);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Unknown error");
      setData(json.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : MARKET_UI_COPY.load.fearGreed
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (externalData) {
      setData(externalData);
      setLoading(false);
      return;
    }
    const limits: Record<string, number> = {
      "1W": 7,
      "1M": 30,
      "3M": 90,
      "1Y": 365,
      "5Y": 1825,
      YTD: -1,
      Max: 0,
    };
    fetchData(
      historyRange === "YTD"
        ? Math.ceil(
            (Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) /
              86400000
          )
        : limits[historyRange]
    );
  }, [externalData, fetchData, historyRange]);

  // --- Loading state ---
  if (loading) {
    return (
      <div className={HOME_INSTRUMENT_PANEL} data-testid="fear-greed-loading">
        <LoadingSpinner className="py-8" message="Loading Fear & Greed..." />
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className={HOME_INSTRUMENT_PANEL} data-testid="fear-greed-error">
        <ErrorMessage type="api" message={error} onRetry={() => fetchData()} />
      </div>
    );
  }

  if (!data) return null;

  const value = Math.max(0, Math.min(100, data.value));
  const label = data.label ?? getLabel(value);
  const color = marketSentimentGaugeColor(value, isDark);

  // Gauge geometry – semi-circle from π to 0 (left to right)
  const cx = 150;
  const cy = 130;
  const r = 100;
  const needleAngle = Math.PI - (value / 100) * Math.PI;

  // Arc helper
  const arcPath = (from: number, to: number, radius: number) => {
    const x1 = cx + radius * Math.cos(from);
    const y1 = cy - radius * Math.sin(from);
    const x2 = cx + radius * Math.cos(to);
    const y2 = cy - radius * Math.sin(to);
    const largeArc = from - to > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const ranges = marketSentimentGaugeArcSegments(isDark);
  const tickColor = marketSentimentGaugeTickColor(isDark);

  // Needle tip
  const needleLen = r - 10;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy - needleLen * Math.sin(needleAngle);

  const chartStroke = marketSentimentGaugeChartStroke(isDark);

  return (
    <div className={HOME_INSTRUMENT_PANEL} data-testid="fear-greed-gauge">
      <div className="flex items-start justify-between gap-3 mb-4 sm:mb-5">
        <div>
          <h3 className={DNA_HEADING}>Fear &amp; Greed Index</h3>
          <p className={`mt-1 ${DNA_BODY}`}>
            CNN sentiment gauge — 0 is extreme fear, 100 is extreme greed.
          </p>
        </div>
        <div
          className="relative flex-shrink-0"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <button
            type="button"
            aria-label="What is the Fear and Greed Index?"
            className={DNA_HELP_BUTTON}
          >
            ?
          </button>
          {showTooltip && (
            <div
              role="tooltip"
              className={`right-0 top-9 ${DNA_TOOLTIP_INVERSE}`}
            >
              {TOOLTIP_TEXT}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,17rem)_1fr] lg:gap-8">
        <div className="flex flex-col sm:flex-row lg:flex-col sm:items-end lg:items-start gap-4">
          <div className="flex-shrink-0">
            <svg
              viewBox="0 0 300 160"
              className="h-auto w-full max-w-[17rem]"
              aria-label={`Fear and Greed gauge showing ${value} - ${label}`}
              role="img"
            >
              {ranges.map((seg, i) => (
                <path
                  key={i}
                  d={arcPath(seg.from, seg.to, r)}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={18}
                  strokeLinecap="butt"
                />
              ))}

              {[0, 25, 50, 75, 100].map((tick) => {
                const a = Math.PI - (tick / 100) * Math.PI;
                const inner = r - 14;
                const outer = r + 14;
                return (
                  <line
                    key={tick}
                    x1={cx + inner * Math.cos(a)}
                    y1={cy - inner * Math.sin(a)}
                    x2={cx + outer * Math.cos(a)}
                    y2={cy - outer * Math.sin(a)}
                    stroke={tickColor}
                    strokeWidth={2}
                  />
                );
              })}

              {[0, 25, 50, 75, 100].map((tick) => {
                const a = Math.PI - (tick / 100) * Math.PI;
                const labelR = r + 26;
                return (
                  <text
                    key={tick}
                    x={cx + labelR * Math.cos(a)}
                    y={cy - labelR * Math.sin(a) + 4}
                    textAnchor="middle"
                    fontSize="10"
                    fill={tickColor}
                  >
                    {tick}
                  </text>
                );
              })}

              <line
                x1={cx}
                y1={cy}
                x2={nx}
                y2={ny}
                stroke={color}
                strokeWidth={3}
                strokeLinecap="round"
              />
              <circle cx={cx} cy={cy} r={5} fill={color} />
            </svg>
          </div>

          <div className="text-left pb-1">
            <p className={DNA_EYEBROW}>Today</p>
            <span
              className={DNA_GAUGE_VALUE}
              style={{ color }}
              data-testid="fear-greed-value"
            >
              {Math.round(value)}
            </span>
            <p className={`mt-1 ${DNA_CAPTION}`} data-testid="fear-greed-label">
              {label}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
              {marketSentimentLegendRanges(isDark).map((rangeItem) => (
                <span
                  key={rangeItem.label}
                  className={`inline-flex items-center gap-1 ${DNA_CAPTION}`}
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: rangeItem.color }}
                  />
                  {rangeItem.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {data.history && data.history.length > 0 && (
          <div data-testid="fear-greed-history" className="min-w-0">
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h4 className={DNA_SUBHEADING}>Historical timeline</h4>
              {!externalData && (
                <div
                  className="flex flex-wrap gap-1"
                  data-testid="fear-greed-range-selector"
                >
                  {(["1W", "1M", "3M", "1Y", "5Y", "YTD", "Max"] as const).map(
                    (range) => (
                      <button
                        key={range}
                        type="button"
                        onClick={() => setHistoryRange(range)}
                        className={`flex min-h-[32px] min-w-[32px] items-center justify-center rounded px-2 py-1 text-xs font-medium transition-colors ${
                          historyRange === range
                            ? HOME_RANGE_BUTTON_ACTIVE
                            : HOME_RANGE_BUTTON_IDLE
                        }`}
                      >
                        {range}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
            <div className="relative h-52 sm:h-64 lg:h-full lg:min-h-[16rem]">
              <svg
                viewBox="0 0 100 100"
                className="h-full w-full"
                preserveAspectRatio="none"
                aria-label="Fear and Greed historical timeline"
                role="img"
                onMouseLeave={() => setHoveredPoint(null)}
                onMouseMove={(e) => {
                  const svg = e.currentTarget;
                  const rect = svg.getBoundingClientRect();
                  const relX = (e.clientX - rect.left) / rect.width;
                  const idx = Math.round(relX * (data.history.length - 1));
                  const clamped = Math.max(
                    0,
                    Math.min(data.history.length - 1, idx)
                  );
                  const point = data.history[clamped];
                  if (point) {
                    const snapX =
                      (clamped / Math.max(data.history.length - 1, 1)) *
                      rect.width;
                    const snapY = ((100 - point.value) / 100) * rect.height;
                    setHoveredPoint({
                      x: snapX,
                      y: snapY,
                      value: point.value,
                      date: new Date(point.date),
                    });
                  }
                }}
              >
                {/* Background bands (top = 100/Extreme Greed, bottom = 0/Extreme Fear) */}
                {MARKET_SENTIMENT_HISTORY_BANDS.map((band) => (
                  <rect
                    key={band.y}
                    x="0"
                    y={band.y}
                    width="100"
                    height={band.height}
                    fill={band.fill}
                  />
                ))}

                {/* Line chart (0–100 viewBox; duplicate point when only one sample) */}
                <polyline
                  fill="none"
                  stroke={chartStroke}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                  points={(() => {
                    const history = data.history;
                    const lastIndex = Math.max(history.length - 1, 1);
                    const coords = history.map((h, i) => {
                      const x = (i / lastIndex) * 100;
                      const y = 100 - h.value;
                      return `${x},${y}`;
                    });
                    if (history.length === 1) {
                      coords.push(coords[0]!);
                    }
                    return coords.join(" ");
                  })()}
                />
              </svg>

              {/* Hover crosshair lines */}
              {hoveredPoint && (
                <>
                  <div
                    className="pointer-events-none absolute top-0 h-full w-px bg-stone-400 dark:bg-stone-500"
                    style={{ left: hoveredPoint.x }}
                  />
                  <div
                    className="pointer-events-none absolute left-0 w-full h-px bg-stone-400 dark:bg-stone-500"
                    style={{ top: hoveredPoint.y }}
                  />
                </>
              )}

              {hoveredPoint && (
                <div
                  className="pointer-events-none absolute z-10 whitespace-nowrap rounded border border-stone-700 bg-stone-900 px-2 py-1 text-xs text-stone-100 shadow-lg"
                  style={{
                    left: Math.min(hoveredPoint.x, 200),
                    top: Math.max(hoveredPoint.y - 32, 0),
                  }}
                  data-testid="fear-greed-chart-tooltip"
                >
                  {hoveredPoint.date.toLocaleDateString()} —{" "}
                  <span
                    style={{
                      color: marketSentimentGaugeColor(
                        hoveredPoint.value,
                        isDark
                      ),
                    }}
                  >
                    {hoveredPoint.value}
                  </span>{" "}
                  ({getLabel(hoveredPoint.value)})
                </div>
              )}

              <div className="pointer-events-none absolute left-0 top-0 flex h-full flex-col justify-between">
                <span
                  className={`text-[10px] text-stone-600 dark:text-stone-300`}
                >
                  100
                </span>
                <span
                  className={`text-[10px] text-stone-600 dark:text-stone-300`}
                >
                  0
                </span>
              </div>
            </div>
            <div className="mt-1 flex justify-between">
              <span
                className={`text-[10px] text-stone-600 dark:text-stone-300`}
              >
                {new Date(data.history[0].date).toLocaleDateString()}
              </span>
              <span
                className={`text-[10px] text-stone-600 dark:text-stone-300`}
              >
                {new Date(
                  data.history[data.history.length - 1].date
                ).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
