"use client";

/**
 * TechnicalIndicatorOverlay Component
 * Provides toggleable technical indicator overlays for charts
 * Supports Moving Averages, RSI, MACD, and Bollinger Bands
 *
 * Requirements: 5.1, 5.2
 */

import { DNA_BODY, DNA_CAPTION } from "@/lib/design-dna";
import { MARKET_CHART_OVERLAY_COLORS_LIGHT } from "@/lib/market-semantics";
import { useState, useCallback } from "react";
import { ChartIndicator, PriceData } from "@/types";
import {
  HOME_CALLOUT,
  HOME_INPUT_SM,
  HOME_INSTRUMENT_PANEL,
  HOME_RANGE_BUTTON_ACTIVE,
} from "@/lib/home-ui";

export interface TechnicalIndicatorOverlayProps {
  onIndicatorsChange: (indicators: ChartIndicator[]) => void;
  initialIndicators?: ChartIndicator[];
}

/**
 * Default indicator configurations
 */
const DEFAULT_INDICATORS: ChartIndicator[] = [
  {
    type: "MA",
    period: 50,
    color: MARKET_CHART_OVERLAY_COLORS_LIGHT[0],
    visible: false,
  },
  {
    type: "MA",
    period: 200,
    color: MARKET_CHART_OVERLAY_COLORS_LIGHT[1],
    visible: false,
  },
  {
    type: "EMA",
    period: 20,
    color: MARKET_CHART_OVERLAY_COLORS_LIGHT[2],
    visible: false,
  },
  {
    type: "RSI",
    period: 14,
    color: MARKET_CHART_OVERLAY_COLORS_LIGHT[3],
    visible: false,
  },
  {
    type: "MACD",
    color: MARKET_CHART_OVERLAY_COLORS_LIGHT[4],
    visible: false,
  },
  {
    type: "BB",
    period: 20,
    color: MARKET_CHART_OVERLAY_COLORS_LIGHT[5],
    visible: false,
  },
];

/**
 * TechnicalIndicatorOverlay component for managing chart indicators
 */
export function TechnicalIndicatorOverlay({
  onIndicatorsChange,
  initialIndicators = DEFAULT_INDICATORS,
}: TechnicalIndicatorOverlayProps) {
  const [indicators, setIndicators] =
    useState<ChartIndicator[]>(initialIndicators);
  const [isExpanded, setIsExpanded] = useState(false);

  // Toggle indicator visibility
  const toggleIndicator = useCallback(
    (index: number) => {
      const newIndicators = [...indicators];
      newIndicators[index] = {
        ...newIndicators[index],
        visible: !newIndicators[index].visible,
      };
      setIndicators(newIndicators);
      onIndicatorsChange(newIndicators);
    },
    [indicators, onIndicatorsChange]
  );

  // Update indicator period
  const updateIndicatorPeriod = useCallback(
    (index: number, period: number) => {
      const newIndicators = [...indicators];
      newIndicators[index] = {
        ...newIndicators[index],
        period,
      };
      setIndicators(newIndicators);
      onIndicatorsChange(newIndicators);
    },
    [indicators, onIndicatorsChange]
  );

  // Get indicator display name
  const getIndicatorName = (indicator: ChartIndicator): string => {
    switch (indicator.type) {
      case "MA":
        return `MA(${indicator.period || 50})`;
      case "EMA":
        return `EMA(${indicator.period || 20})`;
      case "RSI":
        return `RSI(${indicator.period || 14})`;
      case "MACD":
        return "MACD";
      case "BB":
        return `Bollinger Bands(${indicator.period || 20})`;
      default:
        return indicator.type;
    }
  };

  // Get indicator description
  const getIndicatorDescription = (indicator: ChartIndicator): string => {
    switch (indicator.type) {
      case "MA":
        return "Simple Moving Average - Smooths price data by averaging prices over a period. Helps identify trend direction.";
      case "EMA":
        return "Exponential Moving Average - Similar to MA but gives more weight to recent prices. More responsive to price changes.";
      case "RSI":
        return "Relative Strength Index (0-100) - Measures momentum. Above 70 = potentially overbought, below 30 = potentially oversold.";
      case "MACD":
        return "Moving Average Convergence Divergence - Shows trend changes and momentum. Crossovers signal potential buy/sell opportunities.";
      case "BB":
        return "Bollinger Bands - Shows volatility. Price near upper band = high, near lower band = low. Bands widen with volatility.";
      default:
        return "";
    }
  };

  const activeCount = indicators.filter((i) => i.visible).length;

  return (
    <div
      className={`technical-indicator-overlay shadow-sm ${HOME_INSTRUMENT_PANEL}`}
    >
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between p-3 transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${DNA_BODY}`}>
            Technical Indicators
          </span>
          {activeCount > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${HOME_RANGE_BUTTON_ACTIVE}`}
            >
              {activeCount} active
            </span>
          )}
        </div>
        <svg
          className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""} ${DNA_CAPTION}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* Indicator List */}
      {isExpanded && (
        <div className="border-t border-stone-200 dark:border-stone-700">
          <div className="space-y-3 p-3">
            {indicators.map((indicator, index) => (
              <div key={index} className="flex items-start gap-3">
                <label className="group flex flex-1 cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    checked={indicator.visible}
                    onChange={() => toggleIndicator(index)}
                    className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-800 focus:ring-2 focus:ring-stone-600 dark:border-stone-600 dark:bg-stone-800 dark:focus:ring-stone-400"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-medium transition-colors ${DNA_BODY} group-hover:text-stone-900 dark:group-hover:text-stone-50`}
                      >
                        {getIndicatorName(indicator)}
                      </span>
                      <span
                        className="h-3 w-3 rounded-full border border-stone-300 dark:border-stone-600"
                        style={{ backgroundColor: indicator.color }}
                      />
                    </div>
                    <p className={`mt-0.5 ${DNA_CAPTION}`}>
                      {getIndicatorDescription(indicator)}
                    </p>
                  </div>
                </label>

                {indicator.period && indicator.visible && (
                  <input
                    type="number"
                    value={indicator.period}
                    onChange={(e) =>
                      updateIndicatorPeriod(index, parseInt(e.target.value))
                    }
                    min="1"
                    max="200"
                    className={`w-16 ${HOME_INPUT_SM}`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className={`border-t px-3 py-2 text-xs ${HOME_CALLOUT}`}>
            <p className="mb-2">
              💡 <strong>Quick Guide:</strong>
            </p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>
                <strong>MA/EMA:</strong> Lines on chart show average price
                trends
              </li>
              <li>
                <strong>RSI:</strong> Bottom panel (0-100). &gt;70 = overbought,
                &lt;30 = oversold
              </li>
              <li>
                <strong>MACD:</strong> Bottom panel. Line crossovers signal
                momentum shifts
              </li>
              <li>
                <strong>Bollinger Bands:</strong> 3 lines on chart. Price
                touching bands = potential reversal
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Calculate technical indicators from price data
 * These functions can be used to compute indicator values
 */

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(
  data: PriceData[],
  period: number
): Array<{ timestamp: Date; value: number }> {
  const result: Array<{ timestamp: Date; value: number }> = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const avg = slice.reduce((sum, d) => sum + d.close, 0) / period;
    result.push({
      timestamp: data[i].timestamp,
      value: avg,
    });
  }

  return result;
}

/**
 * Calculate Exponential Moving Average
 */
export function calculateEMA(
  data: PriceData[],
  period: number
): Array<{ timestamp: Date; value: number }> {
  const result: Array<{ timestamp: Date; value: number }> = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA for first value
  let ema = data.slice(0, period).reduce((sum, d) => sum + d.close, 0) / period;
  result.push({ timestamp: data[period - 1].timestamp, value: ema });

  // Calculate EMA for remaining values
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
    result.push({ timestamp: data[i].timestamp, value: ema });
  }

  return result;
}

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(
  data: PriceData[],
  period: number = 14
): Array<{ timestamp: Date; value: number }> {
  const result: Array<{ timestamp: Date; value: number }> = [];

  if (data.length < period + 1) return result;

  let gains = 0;
  let losses = 0;

  // Calculate initial average gain and loss
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Calculate RSI for each point
  for (let i = period; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    result.push({ timestamp: data[i].timestamp, value: rsi });
  }

  return result;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(data: PriceData[]): Array<{
  timestamp: Date;
  macd: number;
  signal: number;
  histogram: number;
}> {
  const result: Array<{
    timestamp: Date;
    macd: number;
    signal: number;
    histogram: number;
  }> = [];

  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);

  // Calculate MACD line
  const macdLine: Array<{ timestamp: Date; value: number }> = [];
  for (let i = 0; i < Math.min(ema12.length, ema26.length); i++) {
    macdLine.push({
      timestamp: ema12[i].timestamp,
      value: ema12[i].value - ema26[i].value,
    });
  }

  // Calculate signal line (9-period EMA of MACD)
  const signalMultiplier = 2 / (9 + 1);
  let signal = macdLine.slice(0, 9).reduce((sum, d) => sum + d.value, 0) / 9;

  for (let i = 8; i < macdLine.length; i++) {
    if (i === 8) {
      result.push({
        timestamp: macdLine[i].timestamp,
        macd: macdLine[i].value,
        signal,
        histogram: macdLine[i].value - signal,
      });
    } else {
      signal = (macdLine[i].value - signal) * signalMultiplier + signal;
      result.push({
        timestamp: macdLine[i].timestamp,
        macd: macdLine[i].value,
        signal,
        histogram: macdLine[i].value - signal,
      });
    }
  }

  return result;
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(
  data: PriceData[],
  period: number = 20,
  stdDev: number = 2
): Array<{
  timestamp: Date;
  upper: number;
  middle: number;
  lower: number;
}> {
  const result: Array<{
    timestamp: Date;
    upper: number;
    middle: number;
    lower: number;
  }> = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const closes = slice.map((d) => d.close);

    // Calculate middle band (SMA)
    const middle = closes.reduce((sum, val) => sum + val, 0) / period;

    // Calculate standard deviation
    const variance =
      closes.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) / period;
    const sd = Math.sqrt(variance);

    // Calculate upper and lower bands
    const upper = middle + stdDev * sd;
    const lower = middle - stdDev * sd;

    result.push({
      timestamp: data[i].timestamp,
      upper,
      middle,
      lower,
    });
  }

  return result;
}
