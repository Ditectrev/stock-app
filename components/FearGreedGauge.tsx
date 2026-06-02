"use client";

/**
 * FearGreedGauge Component
 * Displays the CNN Fear & Greed Index with a semi-circle gauge visualization,
 * current value, label, historical timeline, and explanatory tooltip.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/theme-context";
import { FearGreedData } from "@/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { MARKET_UI_COPY } from "@/lib/market-ui-copy";
import {
  HOME_INSTRUMENT_PANEL,
  HOME_MUTED_TEXT,
  HOME_PANEL_TITLE,
  HOME_RANGE_BUTTON_ACTIVE,
  HOME_RANGE_BUTTON_IDLE,
  HOME_SUBTLE_TEXT,
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

/** Map a 0-100 value to a color */
function getColor(value: number): string {
  if (value <= 25) return "#dc2626";
  if (value <= 45) return "#f97316";
  if (value <= 55) return "#eab308";
  if (value <= 75) return "#84cc16";
  return "#22c55e";
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
  const color = getColor(value);

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

  // Range boundaries (angles in radians, left-to-right)
  const ranges = [
    { from: Math.PI, to: Math.PI * 0.75, color: "#dc2626" }, // Extreme Fear 0-25
    { from: Math.PI * 0.75, to: Math.PI * 0.55, color: "#f97316" }, // Fear 25-45
    { from: Math.PI * 0.55, to: Math.PI * 0.45, color: "#eab308" }, // Neutral 45-55
    { from: Math.PI * 0.45, to: Math.PI * 0.25, color: "#84cc16" }, // Greed 55-75
    { from: Math.PI * 0.25, to: 0, color: "#22c55e" }, // Extreme Greed 75-100
  ];

  // Needle tip
  const needleLen = r - 10;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy - needleLen * Math.sin(needleAngle);

  const chartStroke = isDark ? "#a8a29e" : "#57534e";

  return (
    <div className={HOME_INSTRUMENT_PANEL} data-testid="fear-greed-gauge">
      <div className="flex items-start justify-between gap-3 mb-4 sm:mb-5">
        <div>
          <h3 className={HOME_PANEL_TITLE}>Fear &amp; Greed Index</h3>
          <p className={`mt-1 text-sm ${HOME_MUTED_TEXT}`}>
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
            className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 text-xs font-semibold text-stone-700 transition-colors hover:border-stone-500 dark:border-stone-600 dark:text-stone-200 dark:hover:border-stone-400"
          >
            ?
          </button>
          {showTooltip && (
            <div
              role="tooltip"
              className="absolute right-0 top-9 z-10 w-64 rounded-lg border border-stone-200 bg-stone-900 p-3 text-sm text-stone-100 shadow-lg dark:border-stone-600"
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
                    stroke={isDark ? "#a8a29e" : "#78716c"}
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
                    fill={isDark ? "#a8a29e" : "#78716c"}
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
            <p
              className={`text-[0.65rem] font-semibold uppercase tracking-[0.18em] ${HOME_SUBTLE_TEXT}`}
            >
              Today
            </p>
            <span
              className="text-4xl font-bold tabular-nums sm:text-5xl"
              style={{ color }}
              data-testid="fear-greed-value"
            >
              {Math.round(value)}
            </span>
            <p
              className="mt-1 text-sm font-medium text-stone-700 dark:text-stone-300"
              data-testid="fear-greed-label"
            >
              {label}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
              {[
                { label: "Extreme Fear", color: "#dc2626" },
                { label: "Fear", color: "#f97316" },
                { label: "Neutral", color: "#eab308" },
                { label: "Greed", color: "#84cc16" },
                { label: "Extreme Greed", color: "#22c55e" },
              ].map((rangeItem) => (
                <span
                  key={rangeItem.label}
                  className={`inline-flex items-center gap-1 text-[0.65rem] ${HOME_SUBTLE_TEXT}`}
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
              <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                Historical timeline
              </h4>
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
                viewBox={`0 0 ${Math.max(data.history.length * 4, 100)} 100`}
                className="w-full h-full"
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
                    // Snap X to the data point's position
                    const snapX =
                      (clamped / Math.max(data.history.length - 1, 1)) *
                      rect.width;
                    // Snap Y to the data value (0 at bottom, 100 at top)
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
                <rect x="0" y="0" width="100%" height="25" fill="#22c55e20" />
                <rect x="0" y="25" width="100%" height="20" fill="#84cc1620" />
                <rect x="0" y="45" width="100%" height="10" fill="#eab30820" />
                <rect x="0" y="55" width="100%" height="20" fill="#f9731620" />
                <rect x="0" y="75" width="100%" height="25" fill="#dc262620" />

                {/* Line chart */}
                <polyline
                  fill="none"
                  stroke={chartStroke}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                  points={data.history
                    .map((h, i) => {
                      const x =
                        (i / Math.max(data.history.length - 1, 1)) *
                        Math.max(data.history.length * 4, 100);
                      const y = 100 - h.value;
                      return `${x},${y}`;
                    })
                    .join(" ")}
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
                  <span style={{ color: getColor(hoveredPoint.value) }}>
                    {hoveredPoint.value}
                  </span>{" "}
                  ({getLabel(hoveredPoint.value)})
                </div>
              )}

              <div className="pointer-events-none absolute left-0 top-0 flex h-full flex-col justify-between">
                <span className={`text-[10px] ${HOME_SUBTLE_TEXT}`}>100</span>
                <span className={`text-[10px] ${HOME_SUBTLE_TEXT}`}>0</span>
              </div>
            </div>
            <div className="mt-1 flex justify-between">
              <span className={`text-[10px] ${HOME_SUBTLE_TEXT}`}>
                {new Date(data.history[0].date).toLocaleDateString()}
              </span>
              <span className={`text-[10px] ${HOME_SUBTLE_TEXT}`}>
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
