"use client";

/**
 * ChartComponent
 * Main chart component with support for multiple chart types, time ranges,
 * interactive features, and technical indicators
 *
 * Requirements: 4.2, 11.2, 11.3, 11.4, 11.5
 */

import { DNA_CAPTION } from "@/lib/design-dna";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { ChartWrapper, IChartApi } from "./ChartWrapper";
import {
  ChartSparkleOverlay,
  type ChartSparkleOverlayHandle,
} from "./ChartSparkleOverlay";
import { ChartMagnifierTooltip } from "./ChartMagnifierTooltip";
import { PriceData, TimeRange, ChartType, ChartIndicator } from "@/types";
import { useTheme } from "@/lib/theme-context";
import { homeChipClasses } from "@/lib/home-ui";
import { animateChartTrail, type ChartTrailCancel } from "@/lib/chart-trail";
import {
  applyPlotClip,
  clearPlotClip,
  computePlotClipPathFromRatio,
  computePlotClipPathFromX,
  HIDDEN_PLOT_CLIP,
} from "@/lib/chart-plot-clip";
import {
  getMarketChartColors,
  marketChartAtmosphereGradient,
  marketChartOverlayColor,
  marketChartSignedColor,
  MARKET_DOWN_TEXT,
  MARKET_ERROR_SURFACE,
} from "@/lib/market-semantics";
import {
  CHART_MAGNIFIER_TOOLTIP_WIDTH,
  clampMagnifierTooltipLeft,
  resolveMagnifierPoint,
} from "@/lib/chart-magnifier-tooltip";
import { MARKET_UI_COPY } from "@/lib/market-ui-copy";
import { validatePriceDataSeries } from "@/lib/chart-price-data";
import { filterPriceDataByTimeRange } from "@/lib/chart-time-range";
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
  LineType,
  Time,
} from "lightweight-charts";

export interface ChartComponentProps {
  data: PriceData[];
  symbol?: string;
  symbolName?: string;
  type?: ChartType;
  initialTimeRange?: TimeRange;
  indicators?: ChartIndicator[];
  onTimeRangeChange?: (range: TimeRange) => void;
  onDataPointHover?: (point: PriceData | null) => void;
  responsive?: boolean;
  height?: number;
  /** Parent already fetches history for the active range (symbol overview). */
  serverRangeScoped?: boolean;
}

const EMPTY_INDICATORS: ChartIndicator[] = [];

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
  symbol,
  symbolName,
  type = "area",
  initialTimeRange = "1M",
  indicators = EMPTY_INDICATORS,
  onTimeRangeChange,
  onDataPointHover,
  height = 400,
  serverRangeScoped = false,
}: ChartComponentProps) {
  const priceData = useMemo(() => validatePriceDataSeries(data), [data]);
  const [selectedTimeRange, setSelectedTimeRange] =
    useState<TimeRange>(initialTimeRange);

  useEffect(() => {
    setSelectedTimeRange(initialTimeRange);
  }, [initialTimeRange]);
  const [chartType, setChartType] = useState<ChartType>(
    type === "candlestick" ? "candlestick" : "area"
  );
  const [error, setError] = useState<string | null>(null);
  const [magnifier, setMagnifier] = useState<{
    left: number;
    point: PriceData;
  } | null>(null);
  const [plotClipPath, setPlotClipPath] = useState<string | null>(null);
  const [chartKey, setChartKey] = useState(0);
  const chartApiRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const plotContainerRef = useRef<HTMLDivElement | null>(null);
  const sparkleRef = useRef<ChartSparkleOverlayHandle>(null);
  const isChartLoadingRef = useRef(false);
  const isPointerDownRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastHoverTimeRef = useRef<Time | undefined>(undefined);
  const trailCancelRef = useRef<ChartTrailCancel | null>(null);
  const trailRevealProgressRef = useRef(0);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const finishTrailAnimation = useCallback(() => {
    trailCancelRef.current?.(true);
    trailCancelRef.current = null;
  }, []);

  const handlePointerDown = useCallback(() => {
    isPointerDownRef.current = true;
    isPanningRef.current = false;
    finishTrailAnimation();
  }, [finishTrailAnimation]);

  const handlePointerUp = useCallback(() => {
    isPointerDownRef.current = false;
    isPanningRef.current = false;
    sparkleRef.current?.setCrosshairGlow(null);
    sparkleRef.current?.syncLivePoint();
    setMagnifier(null);
  }, []);

  const disposeTrailAnimation = useCallback(() => {
    trailCancelRef.current?.(true);
    trailCancelRef.current = null;
    clearPlotClip(plotContainerRef.current);
    setPlotClipPath(null);
  }, []);

  const applyRevealClip = useCallback((progress: number, tipIndex: number) => {
    trailRevealProgressRef.current = progress;

    const chart = chartApiRef.current;
    const series = mainSeriesRef.current;
    const plotEl = plotContainerRef.current;
    let clip = computePlotClipPathFromRatio(progress, plotEl);

    if (chart && series) {
      const data = series.data() as LineData[];
      const point = data[tipIndex];
      if (point) {
        const frontierX = chart.timeScale().timeToCoordinate(point.time);
        if (frontierX !== null) {
          clip = computePlotClipPathFromX(frontierX, plotEl);
        }
      }
    }

    applyPlotClip(plotEl, clip);
    sparkleRef.current?.syncLiveTip(tipIndex);
    sparkleRef.current?.setRevealProgress(progress);
  }, []);

  const filteredData = useMemo(() => {
    if (serverRangeScoped) return priceData;
    return filterPriceDataByTimeRange(priceData, selectedTimeRange);
  }, [priceData, selectedTimeRange, serverRangeScoped]);
  const filteredDataRef = useRef(filteredData);
  filteredDataRef.current = filteredData;
  const onDataPointHoverRef = useRef(onDataPointHover);
  onDataPointHoverRef.current = onDataPointHover;

  const isPeriodPositive =
    filteredData.length >= 2
      ? filteredData[filteredData.length - 1]!.close >= filteredData[0]!.close
      : true;

  const chartDataRevision = useMemo(() => {
    if (filteredData.length === 0) return `${selectedTimeRange}:empty`;
    const first = filteredData[0]!.timestamp;
    const last = filteredData[filteredData.length - 1]!.timestamp;
    return `${selectedTimeRange}:${chartType}:${filteredData.length}:${String(first)}:${String(last)}`;
  }, [filteredData, selectedTimeRange, chartType]);

  useEffect(() => {
    if (priceData.length === 0 || filteredData.length === 0) {
      setError(MARKET_UI_COPY.chart.noData);
      return;
    }
    setError(null);
  }, [priceData, filteredData]);

  // Handle time range change
  const handleTimeRangeChange = useCallback(
    (range: TimeRange) => {
      finishTrailAnimation();
      setSelectedTimeRange(range);
      onTimeRangeChange?.(range);
    },
    [onTimeRangeChange, finishTrailAnimation]
  );

  useEffect(() => () => disposeTrailAnimation(), [disposeTrailAnimation]);

  useEffect(() => {
    if (!plotClipPath) return;

    const recalc = () => {
      if (trailRevealProgressRef.current <= 0) return;
      applyRevealClip(
        trailRevealProgressRef.current,
        Math.max(
          0,
          Math.round(
            trailRevealProgressRef.current *
              (mainSeriesRef.current?.data().length ?? 0)
          ) - 1
        )
      );
    };

    window.addEventListener("resize", recalc);
    chartApiRef.current?.timeScale().subscribeVisibleLogicalRangeChange(recalc);

    return () => {
      window.removeEventListener("resize", recalc);
      chartApiRef.current
        ?.timeScale()
        .unsubscribeVisibleLogicalRangeChange(recalc);
    };
  }, [plotClipPath, applyRevealClip]);

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
      return priceData
        .map((d) => {
          const close = d.close;
          if (close == null || !Number.isFinite(close)) return null;
          const ms = new Date(d.timestamp).getTime();
          if (!Number.isFinite(ms)) return null;
          return {
            time: Math.floor(ms / 1000) as Time,
            value: close,
          };
        })
        .filter((point): point is LineData => point !== null);
    },
    [chartType]
  );
  // Convert volume data
  const convertVolumeData = useCallback(
    (priceData: PriceData[]): HistogramData[] => {
      return priceData.map((d) => ({
        time: Math.floor(new Date(d.timestamp).getTime() / 1000) as Time,
        value: d.volume,
        color: marketChartSignedColor(d.close >= d.open, isDark),
      }));
    },
    [isDark]
  );

  // Initialize chart with data
  const initializeChart = useCallback(
    (chart: IChartApi) => {
      if (!filteredData || filteredData.length === 0) {
        setError(MARKET_UI_COPY.chart.noData);
        return;
      }

      try {
        setError(null);
        const chartData = convertToChartData(filteredData);
        const volumeData = convertVolumeData(filteredData);
        const chartColors = getMarketChartColors(isDark, {
          signed: true,
          isPositive: isPeriodPositive,
          variant: "area",
        });

        let mainSeries: ISeriesApi<"Candlestick"> | ISeriesApi<"Area">;

        if (chartType === "candlestick") {
          mainSeries = chart.addSeries(CandlestickSeries, {
            upColor: chartColors.up,
            downColor: chartColors.down,
            borderVisible: false,
            wickUpColor: chartColors.wickUp,
            wickDownColor: chartColors.wickDown,
          });
        } else {
          chart.timeScale().applyOptions({
            fixLeftEdge: true,
            fixRightEdge: true,
            shiftVisibleRangeOnNewBar: false,
            rightOffset: 0,
          });

          mainSeries = chart.addSeries(AreaSeries, {
            lineColor: chartColors.series,
            topColor: chartColors.areaTop,
            bottomColor: chartColors.areaBottom,
            lineWidth: chartColors.lineWidth,
            lineType: LineType.Curved,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 5,
            lastValueVisible: false,
            priceLineVisible: false,
          });
        }

        disposeTrailAnimation();

        chartApiRef.current = chart;
        mainSeriesRef.current =
          chartType === "candlestick"
            ? null
            : (mainSeries as ISeriesApi<"Area">);

        if (chartType === "candlestick") {
          mainSeries.setData(chartData);
        } else {
          const lineData = chartData as LineData[];
          const areaSeries = mainSeries as ISeriesApi<"Area">;

          applyPlotClip(plotContainerRef.current, HIDDEN_PLOT_CLIP);
          setPlotClipPath(HIDDEN_PLOT_CLIP);

          isChartLoadingRef.current = true;
          sparkleRef.current?.setLoadingSplash(true);
          setMagnifier(null);

          trailCancelRef.current = animateChartTrail(areaSeries, lineData, {
            chart,
            onStep: (progress, tipIndex) => {
              applyRevealClip(progress, tipIndex);
            },
            onComplete: () => {
              isChartLoadingRef.current = false;
              trailRevealProgressRef.current = 0;
              clearPlotClip(plotContainerRef.current);
              setPlotClipPath(null);
              areaSeries.applyOptions({ lastValueVisible: true });
              sparkleRef.current?.setLoadingSplash(false);
              sparkleRef.current?.syncLivePoint();
            },
          });
        }

        if (chartType === "candlestick") {
          const volumeSeries = chart.addSeries(HistogramSeries, {
            color: chartColors.up,
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
        }

        // Add technical indicators
        indicators.forEach((indicator) => {
          if (!indicator.visible) return;

          if (indicator.type === "MA") {
            const maData = calculateMovingAverage(
              filteredData,
              indicator.period || 50
            );
            const maSeries = chart.addSeries(LineSeries, {
              color: indicator.color || marketChartOverlayColor(0, isDark),
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
              color: indicator.color || marketChartOverlayColor(2, isDark),
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
              color: indicator.color || marketChartOverlayColor(3, isDark),
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
              color: marketChartSignedColor(d.histogram >= 0, isDark),
            }));

            const macdSeries = chart.addSeries(LineSeries, {
              color: indicator.color || marketChartOverlayColor(4, isDark),
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
              color: marketChartOverlayColor(1, isDark),
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
              color: indicator.color || marketChartOverlayColor(5, isDark),
              lineWidth: 1,
              title: `BB Upper(${indicator.period || 20})`,
            });
            upperSeries.setData(upperBandData);

            const middleSeries = chart.addSeries(LineSeries, {
              color: indicator.color || marketChartOverlayColor(5, isDark),
              lineWidth: 1,
              lineStyle: 2, // Dashed
              title: `BB Middle(${indicator.period || 20})`,
            });
            middleSeries.setData(middleBandData);

            const lowerSeries = chart.addSeries(LineSeries, {
              color: indicator.color || marketChartOverlayColor(5, isDark),
              lineWidth: 1,
              title: `BB Lower(${indicator.period || 20})`,
            });
            lowerSeries.setData(lowerBandData);
          }
        });

        chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
          if (!isPointerDownRef.current) return;
          isPanningRef.current = true;
          sparkleRef.current?.setCrosshairGlow(null);
          setMagnifier(null);
        });

        chart.subscribeCrosshairMove((param) => {
          if (!param.point || param.time === undefined) {
            sparkleRef.current?.setCrosshairGlow(null);
            setMagnifier(null);
            if (lastHoverTimeRef.current !== undefined) {
              lastHoverTimeRef.current = undefined;
              onDataPointHoverRef.current?.(null);
            }
            return;
          }

          if (
            chartType !== "candlestick" &&
            !isChartLoadingRef.current &&
            !isPanningRef.current
          ) {
            const seriesPoint = param.seriesData.get(mainSeries);
            if (
              seriesPoint &&
              "value" in seriesPoint &&
              seriesPoint.value !== undefined
            ) {
              const y = mainSeries.priceToCoordinate(seriesPoint.value);
              if (y !== null) {
                sparkleRef.current?.setCrosshairGlow({
                  x: param.point.x,
                  y,
                });
              }
            }
          }

          const point = resolveMagnifierPoint(
            filteredDataRef.current,
            param.time,
            mainSeries,
            param.seriesData
          );

          if (
            point &&
            !isChartLoadingRef.current &&
            !isPanningRef.current &&
            param.point.x >= 0 &&
            param.point.y >= 0
          ) {
            const plotWidth = chart.timeScale().width();
            const left = clampMagnifierTooltipLeft(
              param.point.x,
              CHART_MAGNIFIER_TOOLTIP_WIDTH,
              plotWidth
            );
            setMagnifier({ left, point });
          } else {
            setMagnifier(null);
          }

          if (param.time === lastHoverTimeRef.current) return;

          lastHoverTimeRef.current = param.time as Time;
          if (point) {
            onDataPointHoverRef.current?.(point);
          }
        });

        if (chartType === "candlestick") {
          chart.timeScale().fitContent();
        }

        return disposeTrailAnimation;
      } catch (err) {
        console.error("Error initializing chart:", err);
        setError(MARKET_UI_COPY.chart.initFailed);
      }
    },
    [
      filteredData,
      chartType,
      indicators,
      convertToChartData,
      convertVolumeData,
      isDark,
      isPeriodPositive,
      disposeTrailAnimation,
      applyRevealClip,
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
          className={`flex items-center justify-center rounded-lg ${MARKET_ERROR_SURFACE}`}
          style={{ height: `${height}px` }}
        >
          <div className={`px-4 text-center text-sm ${MARKET_DOWN_TEXT}`}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container w-full" data-testid="price-chart-panel">
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

      {/* Chart — tooltip is absolutely positioned so hover never shifts layout */}
      <div
        className="relative"
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
      >
        <ChartWrapper
          key={chartKey}
          dataRevision={chartDataRevision}
          height={height}
          isDark={isDark}
          chartType={chartType}
          plotClipPath={plotClipPath}
          plotContainerRef={plotContainerRef}
          atmosphereGradient={marketChartAtmosphereGradient(
            isPeriodPositive,
            isDark
          )}
          overlay={
            <>
              <ChartMagnifierTooltip
                symbol={symbol ?? symbolName}
                isDark={isDark}
                isPositive={isPeriodPositive}
                left={magnifier?.left}
                point={magnifier?.point ?? null}
              />
              <ChartSparkleOverlay
                ref={sparkleRef}
                chartRef={chartApiRef}
                seriesRef={mainSeriesRef}
                chartType={chartType}
                isPositive={isPeriodPositive}
                dataRevision={chartDataRevision}
              />
            </>
          }
        >
          {initializeChart}
        </ChartWrapper>
      </div>

      {/* Chart Instructions */}
      <div className={`mt-2 ${DNA_CAPTION}`}>
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
