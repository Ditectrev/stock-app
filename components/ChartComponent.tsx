"use client";

/**
 * ChartComponent
 * Main chart component with support for multiple chart types, time ranges,
 * interactive features, and technical indicators
 *
 * Requirements: 4.2, 11.2, 11.3, 11.4, 11.5
 */

import { useState, useEffect, useCallback } from "react";
import { ChartWrapper, IChartApi } from "./ChartWrapper";
import { PriceData, TimeRange, ChartType, ChartIndicator } from "@/types";
import { useTheme } from "@/lib/theme-context";
import { homeChipClasses } from "@/lib/home-ui";
import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateEMA,
} from "./TechnicalIndicatorOverlay";
import {
  ISeriesApi,
  LineData,
  CandlestickData,
  HistogramData,
  CandlestickSeries,
  AreaSeries,
  LineSeries,
  HistogramSeries,
  Time,
} from "lightweight-charts";

export interface ChartComponentProps {
  data: PriceData[];
  type?: ChartType;
  initialTimeRange?: TimeRange;
  indicators?: ChartIndicator[];
  onTimeRangeChange?: (range: TimeRange) => void;
  onDataPointHover?: (point: PriceData | null) => void;
  responsive?: boolean;
  height?: number;
}

const TIME_RANGES: TimeRange[] = [
  "1D",
  "1W",
  "1M",
  "3M",
  "1Y",
  "5Y",
  "YTD",
  "Max",
];

/**
 * ChartComponent with time range selection, multiple chart types,
 * and interactive features (zoom, pan, crosshair)
 */
export function ChartComponent({
  data,
  type = "line",
  initialTimeRange = "1M",
  indicators = [],
  onTimeRangeChange,
  onDataPointHover,
  responsive = true,
  height = 400,
}: ChartComponentProps) {
  const [selectedTimeRange, setSelectedTimeRange] =
    useState<TimeRange>(initialTimeRange);
  const [chartType, setChartType] = useState<ChartType>(type);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<PriceData | null>(null);
  const [chartKey, setChartKey] = useState(0);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Filter data based on selected time range
  const getFilteredData = useCallback(
    (allData: PriceData[], range: TimeRange): PriceData[] => {
      if (!allData || allData.length === 0) return [];

      const now = new Date();
      const startDate = new Date();

      switch (range) {
        case "1D":
          startDate.setHours(now.getHours() - 24);
          break;
        case "1W":
          startDate.setDate(now.getDate() - 7);
          break;
        case "1M":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "3M":
          startDate.setMonth(now.getMonth() - 3);
          break;
        case "1Y":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case "5Y":
          startDate.setFullYear(now.getFullYear() - 5);
          break;
        case "Max":
          return allData;
      }

      const filtered = allData.filter(
        (d) => new Date(d.timestamp) >= startDate
      );

      // If no data found, return at least the last few points
      if (filtered.length === 0 && allData.length > 0) {
        const count = Math.min(10, allData.length);
        return allData.slice(-count);
      }

      return filtered;
    },
    []
  );

  const filteredData = getFilteredData(data, selectedTimeRange);

  // Handle time range change
  const handleTimeRangeChange = useCallback(
    (range: TimeRange) => {
      setSelectedTimeRange(range);
      if (onTimeRangeChange) {
        onTimeRangeChange(range);
      }
    },
    [onTimeRangeChange]
  );

  // Handle chart type change
  const handleChartTypeChange = useCallback((newType: ChartType) => {
    setChartType(newType);
    setChartKey((prev) => prev + 1); // Force chart recreation
  }, []);

  // Convert PriceData to chart format
  const convertToChartData = useCallback(
    (priceData: PriceData[]): LineData[] | CandlestickData[] => {
      if (chartType === "candlestick") {
        return priceData.map((d) => ({
          time: Math.floor(new Date(d.timestamp).getTime() / 1000) as Time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));
      }

      // For line and area charts
      return priceData.map((d) => ({
        time: Math.floor(new Date(d.timestamp).getTime() / 1000) as Time,
        value: d.close,
      }));
    },
    [chartType]
  );
  // Convert volume data
  const convertVolumeData = useCallback(
    (priceData: PriceData[]): HistogramData[] => {
      return priceData.map((d) => ({
        time: Math.floor(new Date(d.timestamp).getTime() / 1000) as Time,
        value: d.volume,
        color: d.close >= d.open ? "#26a69a" : "#ef5350",
      }));
    },
    []
  );

  // Initialize chart with data
  const initializeChart = useCallback(
    (chart: IChartApi) => {
      if (!filteredData || filteredData.length === 0) {
        setError("No data available");
        return;
      }

      try {
        setError(null);
        const chartData = convertToChartData(filteredData);
        const volumeData = convertVolumeData(filteredData);

        // Create main series based on chart type
        let mainSeries:
          | ISeriesApi<"Candlestick">
          | ISeriesApi<"Area">
          | ISeriesApi<"Line">;

        if (chartType === "candlestick") {
          mainSeries = chart.addSeries(CandlestickSeries, {
            upColor: "#26a69a",
            downColor: "#ef5350",
            borderVisible: false,
            wickUpColor: "#26a69a",
            wickDownColor: "#ef5350",
          });
        } else if (chartType === "area") {
          mainSeries = chart.addSeries(AreaSeries, {
            lineColor: "#2962FF",
            topColor: "#2962FF",
            bottomColor: "rgba(41, 98, 255, 0.28)",
            lineWidth: 2,
          });
        } else {
          // line chart
          mainSeries = chart.addSeries(LineSeries, {
            color: "#2962FF",
            lineWidth: 2,
          });
        }

        mainSeries.setData(chartData);

        // Add volume histogram
        const volumeSeries = chart.addSeries(HistogramSeries, {
          color: "#26a69a",
          priceFormat: {
            type: "volume",
          },
          priceScaleId: "",
        });

        volumeSeries.priceScale().applyOptions({
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });

        volumeSeries.setData(volumeData);

        // Add technical indicators
        indicators.forEach((indicator) => {
          if (!indicator.visible) return;

          if (indicator.type === "MA") {
            const maData = calculateMovingAverage(
              filteredData,
              indicator.period || 50
            );
            const maSeries = chart.addSeries(LineSeries, {
              color: indicator.color || "#FF6B6B",
              lineWidth: 1,
              title: `MA(${indicator.period || 50})`,
            });
            maSeries.setData(maData);
          } else if (indicator.type === "EMA") {
            const emaData = calculateEMA(filteredData, indicator.period || 20);
            const emaDataFormatted: LineData[] = emaData.map((d) => ({
              time: Math.floor(new Date(d.timestamp).getTime() / 1000) as Time,
              value: d.value,
            }));
            const emaSeries = chart.addSeries(LineSeries, {
              color: indicator.color || "#95E1D3",
              lineWidth: 1,
              title: `EMA(${indicator.period || 20})`,
            });
            emaSeries.setData(emaDataFormatted);
          } else if (indicator.type === "RSI") {
            const rsiData = calculateRSI(filteredData, indicator.period || 14);
            const rsiDataFormatted: LineData[] = rsiData.map((d) => ({
              time: Math.floor(new Date(d.timestamp).getTime() / 1000) as Time,
              value: d.value,
            }));
            const rsiSeries = chart.addSeries(LineSeries, {
              color: indicator.color || "#F38181",
              lineWidth: 2,
              title: `RSI(${indicator.period || 14})`,
              priceScaleId: "rsi",
            });
            rsiSeries.priceScale().applyOptions({
              scaleMargins: {
                top: 0.1,
                bottom: 0.7,
              },
            });
            rsiSeries.setData(rsiDataFormatted);
          } else if (indicator.type === "MACD") {
            const macdData = calculateMACD(filteredData);
            const macdLineData: LineData[] = macdData.map((d) => ({
              time: Math.floor(new Date(d.timestamp).getTime() / 1000) as Time,
              value: d.macd,
            }));
            const signalLineData: LineData[] = macdData.map((d) => ({
              time: Math.floor(new Date(d.timestamp).getTime() / 1000) as Time,
              value: d.signal,
            }));
            const histogramData: HistogramData[] = macdData.map((d) => ({
              time: Math.floor(new Date(d.timestamp).getTime() / 1000) as Time,
              value: d.histogram,
              color: d.histogram >= 0 ? "#26a69a" : "#ef5350",
            }));

            const macdSeries = chart.addSeries(LineSeries, {
              color: indicator.color || "#AA96DA",
              lineWidth: 2,
              title: "MACD",
              priceScaleId: "macd",
            });
            macdSeries.priceScale().applyOptions({
              scaleMargins: {
                top: 0.7,
                bottom: 0.1,
              },
            });
            macdSeries.setData(macdLineData);

            const signalSeries = chart.addSeries(LineSeries, {
              color: "#FF6B6B",
              lineWidth: 1,
              title: "Signal",
              priceScaleId: "macd",
            });
            signalSeries.setData(signalLineData);

            const histogramSeries = chart.addSeries(HistogramSeries, {
              priceScaleId: "macd",
            });
            histogramSeries.setData(histogramData);
          } else if (indicator.type === "BB") {
            const bbData = calculateBollingerBands(
              filteredData,
              indicator.period || 20
            );
            const upperBandData: LineData[] = bbData.map((d) => ({
              time: Math.floor(new Date(d.timestamp).getTime() / 1000) as Time,
              value: d.upper,
            }));
            const middleBandData: LineData[] = bbData.map((d) => ({
              time: Math.floor(new Date(d.timestamp).getTime() / 1000) as Time,
              value: d.middle,
            }));
            const lowerBandData: LineData[] = bbData.map((d) => ({
              time: Math.floor(new Date(d.timestamp).getTime() / 1000) as Time,
              value: d.lower,
            }));

            const upperSeries = chart.addSeries(LineSeries, {
              color: indicator.color || "#FCBAD3",
              lineWidth: 1,
              title: `BB Upper(${indicator.period || 20})`,
            });
            upperSeries.setData(upperBandData);

            const middleSeries = chart.addSeries(LineSeries, {
              color: indicator.color || "#FCBAD3",
              lineWidth: 1,
              lineStyle: 2, // Dashed
              title: `BB Middle(${indicator.period || 20})`,
            });
            middleSeries.setData(middleBandData);

            const lowerSeries = chart.addSeries(LineSeries, {
              color: indicator.color || "#FCBAD3",
              lineWidth: 1,
              title: `BB Lower(${indicator.period || 20})`,
            });
            lowerSeries.setData(lowerBandData);
          }
        });

        // Setup crosshair move handler for hover events
        chart.subscribeCrosshairMove((param) => {
          if (!param.time) {
            setHoveredPoint(null);
            if (onDataPointHover) onDataPointHover(null);
            return;
          }

          const timestamp = (param.time as number) * 1000;
          const point = filteredData.find(
            (d) =>
              Math.floor(new Date(d.timestamp).getTime() / 1000) === param.time
          );

          if (point) {
            setHoveredPoint(point);
            if (onDataPointHover) onDataPointHover(point);
          }
        });

        // Fit content to visible range
        chart.timeScale().fitContent();
      } catch (err) {
        console.error("Error initializing chart:", err);
        setError("Failed to initialize chart");
      }
    },
    [
      filteredData,
      chartType,
      indicators,
      convertToChartData,
      convertVolumeData,
      onDataPointHover,
    ]
  );

  // Calculate moving average for indicators
  const calculateMovingAverage = (
    priceData: PriceData[],
    period: number
  ): LineData[] => {
    const result: LineData[] = [];

    for (let i = period - 1; i < priceData.length; i++) {
      const slice = priceData.slice(i - period + 1, i + 1);
      const avg = slice.reduce((sum, d) => sum + d.close, 0) / period;

      result.push({
        time: Math.floor(
          new Date(priceData[i].timestamp).getTime() / 1000
        ) as Time,
        value: avg,
      });
    }

    return result;
  };

  // Error state
  if (error) {
    return (
      <div className="chart-container">
        <div className="chart-controls">
          <TimeRangeSelector
            selectedRange={selectedTimeRange}
            onRangeChange={handleTimeRangeChange}
          />
          <ChartTypeSelector
            selectedType={chartType}
            onTypeChange={handleChartTypeChange}
          />
        </div>
        <div
          className={`flex items-center justify-center rounded-lg ${
            isDark ? "bg-red-900/20" : "bg-red-50"
          }`}
          style={{ height: `${height}px` }}
        >
          <div className={isDark ? "text-red-400" : "text-red-600"}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container w-full">
      {/* Chart Controls */}
      <div className="chart-controls mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <TimeRangeSelector
          selectedRange={selectedTimeRange}
          onRangeChange={handleTimeRangeChange}
        />
        <ChartTypeSelector
          selectedType={chartType}
          onTypeChange={handleChartTypeChange}
        />
      </div>

      {/* Hovered Point Info */}
      {hoveredPoint && (
        <div
          className={`mb-2 p-2 rounded text-xs sm:text-sm ${
            isDark ? "bg-gray-800 text-gray-200" : "bg-gray-50 text-gray-900"
          }`}
        >
          <span className="font-semibold">
            {new Date(hoveredPoint.timestamp).toLocaleDateString()}
          </span>
          <span className="hidden sm:inline">
            {" - "}
            <span>O: ${hoveredPoint.open.toFixed(2)}</span>
            {" | "}
            <span>H: ${hoveredPoint.high.toFixed(2)}</span>
            {" | "}
            <span>L: ${hoveredPoint.low.toFixed(2)}</span>
            {" | "}
            <span>C: ${hoveredPoint.close.toFixed(2)}</span>
            {" | "}
            <span>Vol: {(hoveredPoint.volume / 1000000).toFixed(2)}M</span>
          </span>
          <div className="sm:hidden mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            <span>C: ${hoveredPoint.close.toFixed(2)}</span>
            <span>H: ${hoveredPoint.high.toFixed(2)}</span>
            <span>L: ${hoveredPoint.low.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Chart */}
      <ChartWrapper key={chartKey} height={height} isDark={isDark}>
        {initializeChart}
      </ChartWrapper>

      {/* Chart Instructions */}
      <div
        className={`mt-2 text-xs ${isDark ? "text-gray-300" : "text-gray-500"}`}
      >
        <p className="hidden sm:block">
          💡 Use mouse wheel to zoom, drag to pan, hover for details
        </p>
        <p className="sm:hidden">
          💡 Pinch to zoom, swipe to pan, tap for details
        </p>
      </div>
    </div>
  );
}

/**
 * Time Range Selector Component
 */
interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

function TimeRangeSelector({
  selectedRange,
  onRangeChange,
}: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-1 flex-wrap">
      {TIME_RANGES.map((range) => (
        <button
          key={range}
          onClick={() => onRangeChange(range)}
          className={`px-3 py-2 text-sm rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
            selectedRange === range
              ? homeChipClasses(true)
              : homeChipClasses(false)
          }`}
        >
          {range}
        </button>
      ))}
    </div>
  );
}

/**
 * Chart Type Selector Component
 */
interface ChartTypeSelectorProps {
  selectedType: ChartType;
  onTypeChange: (type: ChartType) => void;
}

function ChartTypeSelector({
  selectedType,
  onTypeChange,
}: ChartTypeSelectorProps) {
  const types: { value: ChartType; label: string }[] = [
    { value: "line", label: "Line" },
    { value: "area", label: "Area" },
    { value: "candlestick", label: "Candles" },
  ];

  return (
    <div className="flex gap-1">
      {types.map((type) => (
        <button
          key={type.value}
          onClick={() => onTypeChange(type.value)}
          className={`px-3 py-2 text-sm rounded transition-colors min-h-[44px] flex items-center justify-center ${
            selectedType === type.value
              ? homeChipClasses(true)
              : homeChipClasses(false)
          }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}
