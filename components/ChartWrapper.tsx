"use client";

/**
 * ChartWrapper Component
 * Wrapper for Lightweight Charts with consistent styling and theme configuration
 * Provides default chart settings and theme for the application
 */

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineData,
  CandlestickData,
  ColorType,
  CrosshairMode,
  LineStyle,
} from "lightweight-charts";
import type { ChartType } from "@/types";
import { chartAtmosphereEnabled } from "@/lib/chart-effects";

export type ChartVisualStyle = "default" | "atmospheric";

export type ChartInitCallback = (chart: IChartApi) => void | (() => void);

export interface ChartWrapperProps {
  children?: ChartInitCallback;
  /** Bumps when series data should be re-initialized without remounting the wrapper. */
  dataRevision?: string;
  height?: number;
  isDark?: boolean;
  visualStyle?: ChartVisualStyle;
  atmosphereGradient?: string;
  chartType?: ChartType;
  overlay?: ReactNode;
  /** Clips the plot canvas during trail reveal (overlay stays full width for splash). */
  plotClipPath?: string | null;
  plotContainerRef?: RefObject<HTMLDivElement | null>;
}

/**
 * Default chart configuration with consistent styling
 * Supports light and dark themes
 */
export const getDefaultChartOptions = (
  width: number,
  height: number,
  isDark: boolean = false,
  visualStyle: ChartVisualStyle = "default"
) => {
  const atmospheric = visualStyle === "atmospheric";
  const crosshairColor = atmospheric
    ? isDark
      ? "rgba(168, 162, 158, 0.55)"
      : "rgba(120, 113, 108, 0.55)"
    : "#9B7DFF";
  const gridColor = isDark ? "#2d2d2d" : "#f0f0f0";

  return {
    width,
    height,
    layout: {
      background: {
        type: ColorType.Solid,
        color: atmospheric ? "transparent" : isDark ? "#1e1e1e" : "#ffffff",
      },
      textColor: isDark ? "#a8a29e" : "#57534e",
    },
    grid: {
      vertLines: {
        visible: !atmospheric,
        color: gridColor,
      },
      horzLines: {
        visible: !atmospheric,
        color: gridColor,
      },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: {
        visible: true,
        width: 1 as const,
        color: crosshairColor,
        style: LineStyle.Dashed,
      },
      horzLine: {
        visible: true,
        width: 1 as const,
        color: crosshairColor,
        style: LineStyle.Dashed,
      },
    },
    rightPriceScale: {
      borderVisible: !atmospheric,
      borderColor: isDark ? "#2d2d2d" : "#e0e0e0",
    },
    timeScale: {
      borderVisible: !atmospheric,
      borderColor: isDark ? "#2d2d2d" : "#e0e0e0",
      timeVisible: true,
      secondsVisible: false,
      fixLeftEdge: true,
      fixRightEdge: true,
      shiftVisibleRangeOnNewBar: false,
      rightOffset: 0,
    },
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: true,
    },
    handleScale: {
      axisPressedMouseMove: true,
      mouseWheel: true,
      pinch: true,
    },
  };
};

/**
 * ChartWrapper component that initializes and manages a Lightweight Chart instance
 */
export function ChartWrapper({
  children,
  dataRevision = "0",
  height = 400,
  isDark = false,
  visualStyle = "atmospheric",
  atmosphereGradient,
  chartType = "area",
  overlay,
  plotClipPath = null,
  plotContainerRef,
}: ChartWrapperProps) {
  const showAtmosphere =
    visualStyle === "atmospheric" && chartAtmosphereEnabled(chartType);
  const internalPlotRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = plotContainerRef ?? internalPlotRef;
  const chartRef = useRef<IChartApi | null>(null);
  const childrenRef = useRef(children);
  childrenRef.current = children;

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Get container width for responsive chart
    const containerWidth = chartContainerRef.current.clientWidth;

    // Create chart with default options
    const chart = createChart(
      chartContainerRef.current,
      getDefaultChartOptions(containerWidth, height, isDark, visualStyle)
    );

    chartRef.current = chart;

    const init = childrenRef.current;
    const cleanupChildren =
      typeof init === "function" ? init(chart) : undefined;

    return () => {
      cleanupChildren?.();
      chart.remove();
      chartRef.current = null;
    };
  }, [height, isDark, visualStyle, dataRevision, chartContainerRef]);

  // Handle responsive resize
  useEffect(() => {
    if (!chartRef.current) return;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const containerWidth = chartContainerRef.current.clientWidth;
        chartRef.current.applyOptions({
          width: containerWidth,
          height,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial resize

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [height, chartContainerRef]);

  useLayoutEffect(() => {
    const plot = chartContainerRef.current;
    if (!plot) return;
    if (plotClipPath) {
      plot.style.clipPath = plotClipPath;
      plot.style.overflow = "hidden";
    } else {
      plot.style.clipPath = "";
      plot.style.overflow = "";
    }
  }, [plotClipPath, chartContainerRef]);

  return (
    <div
      className="chart-wrapper relative w-full overflow-hidden rounded-xl"
      style={{ height: `${height}px` }}
      role="img"
      aria-label="Financial price chart"
    >
      {showAtmosphere && atmosphereGradient ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{ background: atmosphereGradient }}
        />
      ) : null}
      <div
        ref={chartContainerRef}
        className="relative z-[1] h-full w-full overflow-hidden"
        style={plotClipPath ? { clipPath: plotClipPath } : undefined}
      />
      {overlay ? (
        <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden rounded-xl">
          {overlay}
        </div>
      ) : null}
    </div>
  );
}

// Export types for use in other components
export type { IChartApi, ISeriesApi, LineData, CandlestickData };
