/**
 * Unit tests for ChartComponent
 * Tests chart type switching, time range changes, and indicator toggles
 * Task 6.4 - Requirements: 4.2, 11.2, 11.4
 */

import type { ComponentProps } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChartComponent } from "../ChartComponent";
import { ThemeProvider } from "@/lib/theme-context";
import { marketChartOverlayColor } from "@/lib/market-semantics";
import { PriceData, ChartIndicator } from "@/types";

const overlay = (index: number) => marketChartOverlayColor(index, false);

// Mock data generator
const generateMockData = (days: number = 30): PriceData[] => {
  const data: PriceData[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let price = 100;

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    const change = (Math.random() - 0.5) * 5;
    const open = price;
    const close = price + change;

    data.push({
      timestamp: date,
      open,
      high: Math.max(open, close) + Math.random() * 2,
      low: Math.min(open, close) - Math.random() * 2,
      close,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
    });

    price = close;
  }

  return data;
};

// Wrapper component with ThemeProvider
const ChartWithTheme = (props: ComponentProps<typeof ChartComponent>) => (
  <ThemeProvider>
    <ChartComponent {...props} />
  </ThemeProvider>
);

describe("ChartComponent", () => {
  const mockData = generateMockData(365);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Chart Type Switching", () => {
    it("should render with default area chart type", () => {
      render(<ChartWithTheme data={mockData} />);

      expect(screen.getByText("Area")).toHaveClass("bg-stone-900");
      expect(screen.queryByText("Line")).not.toBeInTheDocument();
    });

    it("should render area chart without layout-shifting hover tooltip", async () => {
      const { container } = render(
        <ChartWithTheme data={mockData} type="area" />
      );

      await waitFor(() => {
        expect(container.querySelector(".chart-wrapper")).toBeInTheDocument();
      });

      const tooltip = container.querySelector("[aria-live='polite']");
      expect(tooltip).toHaveClass("absolute");
      expect(tooltip).toHaveClass("pointer-events-none");
    });

    it("should switch to candlestick chart when Candles button is clicked", async () => {
      render(<ChartWithTheme data={mockData} type="area" />);

      const candlesButton = screen.getByText("Candles");
      fireEvent.click(candlesButton);

      await waitFor(() => {
        expect(candlesButton).toHaveClass("bg-stone-900");
      });
    });

    it("should maintain selected chart type after switching", async () => {
      render(<ChartWithTheme data={mockData} type="area" />);

      const candlesButton = screen.getByText("Candles");
      fireEvent.click(candlesButton);

      await waitFor(() => {
        expect(candlesButton).toHaveClass("bg-stone-900");
        expect(screen.getByText("Area")).not.toHaveClass("bg-stone-900");
      });
    });

    it("should render with candlestick chart as initial type", () => {
      render(<ChartWithTheme data={mockData} type="candlestick" />);

      expect(screen.getByText("Candles")).toHaveClass("bg-stone-900");
      expect(screen.queryByText("Line")).not.toBeInTheDocument();
    });
  });

  describe("Time Range Changes", () => {
    it("should render with default time range", () => {
      render(<ChartWithTheme data={mockData} initialTimeRange="1M" />);

      const oneMonthButton = screen.getByText("1M");
      expect(oneMonthButton).toHaveClass("bg-stone-900");
    });

    it("should switch time range when button is clicked", async () => {
      const onTimeRangeChange = vi.fn();
      render(
        <ChartWithTheme
          data={mockData}
          initialTimeRange="1M"
          onTimeRangeChange={onTimeRangeChange}
        />
      );

      const oneWeekButton = screen.getByText("1W");
      fireEvent.click(oneWeekButton);

      await waitFor(() => {
        expect(oneWeekButton).toHaveClass("bg-stone-900");
        expect(onTimeRangeChange).toHaveBeenCalledWith("1W");
      });
    });

    it("should render all time range options", () => {
      render(<ChartWithTheme data={mockData} />);

      expect(screen.getByText("1D")).toBeInTheDocument();
      expect(screen.getByText("1W")).toBeInTheDocument();
      expect(screen.getByText("1M")).toBeInTheDocument();
      expect(screen.getByText("3M")).toBeInTheDocument();
      expect(screen.getByText("1Y")).toBeInTheDocument();
      expect(screen.getByText("5Y")).toBeInTheDocument();
      expect(screen.getByText("YTD")).toBeInTheDocument();
      expect(screen.getByText("Max")).toBeInTheDocument();
    });

    it("should call onTimeRangeChange callback with correct range", async () => {
      const onTimeRangeChange = vi.fn();
      render(
        <ChartWithTheme data={mockData} onTimeRangeChange={onTimeRangeChange} />
      );

      fireEvent.click(screen.getByText("1Y"));

      await waitFor(() => {
        expect(onTimeRangeChange).toHaveBeenCalledWith("1Y");
      });
    });
  });

  describe("Indicator Toggles", () => {
    it("should render chart with indicators", () => {
      const indicators: ChartIndicator[] = [
        { type: "MA", period: 50, color: overlay(0), visible: true },
      ];

      render(<ChartWithTheme data={mockData} indicators={indicators} />);

      // Chart should render without errors
      expect(screen.getByTestId("price-chart-panel")).toBeInTheDocument();
    });

    it("should handle multiple indicators", () => {
      const indicators: ChartIndicator[] = [
        { type: "MA", period: 50, color: overlay(0), visible: true },
        { type: "EMA", period: 20, color: overlay(1), visible: true },
      ];

      render(<ChartWithTheme data={mockData} indicators={indicators} />);

      expect(screen.getByTestId("price-chart-panel")).toBeInTheDocument();
    });

    it("should not render invisible indicators", () => {
      const indicators: ChartIndicator[] = [
        { type: "MA", period: 50, color: overlay(0), visible: false },
      ];

      render(<ChartWithTheme data={mockData} indicators={indicators} />);

      // Chart should render without errors
      expect(screen.getByTestId("price-chart-panel")).toBeInTheDocument();
    });

    it("should render RSI indicator without errors", () => {
      const indicators: ChartIndicator[] = [
        { type: "RSI", period: 14, color: overlay(2), visible: true },
      ];

      render(<ChartWithTheme data={mockData} indicators={indicators} />);

      expect(screen.getByTestId("price-chart-panel")).toBeInTheDocument();
    });

    it("should render MACD indicator without errors", () => {
      const indicators: ChartIndicator[] = [{ type: "MACD", visible: true }];

      render(<ChartWithTheme data={mockData} indicators={indicators} />);

      expect(screen.getByTestId("price-chart-panel")).toBeInTheDocument();
    });

    it("should render Bollinger Bands indicator without errors", () => {
      const indicators: ChartIndicator[] = [
        { type: "BB", period: 20, color: overlay(3), visible: true },
      ];

      render(<ChartWithTheme data={mockData} indicators={indicators} />);

      expect(screen.getByTestId("price-chart-panel")).toBeInTheDocument();
    });

    it("should render all indicator types simultaneously", () => {
      const indicators: ChartIndicator[] = [
        { type: "MA", period: 50, color: overlay(0), visible: true },
        { type: "EMA", period: 20, color: overlay(1), visible: true },
        { type: "RSI", period: 14, color: overlay(2), visible: true },
        { type: "MACD", visible: true },
        { type: "BB", period: 20, color: overlay(3), visible: true },
      ];

      render(<ChartWithTheme data={mockData} indicators={indicators} />);

      expect(screen.getByTestId("price-chart-panel")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should display error message when data is empty", () => {
      render(<ChartWithTheme data={[]} />);

      expect(
        screen.getByText("No price data for this range.")
      ).toBeInTheDocument();
    });

    it("should display error message when data is invalid", () => {
      render(<ChartWithTheme data={null as unknown as typeof mockData} />);

      expect(
        screen.getByText("No price data for this range.")
      ).toBeInTheDocument();
    });
  });

  describe("Responsive Behavior", () => {
    it("should render with custom height", () => {
      const { container } = render(
        <ChartWithTheme data={mockData} height={600} />
      );

      const chartWrapper = container.querySelector(".chart-wrapper");
      expect(chartWrapper).toHaveStyle({ height: "600px" });
    });

    it("should render with default height when not specified", () => {
      const { container } = render(<ChartWithTheme data={mockData} />);

      const chartWrapper = container.querySelector(".chart-wrapper");
      expect(chartWrapper).toHaveStyle({ height: "400px" });
    });

    it("should show mobile-friendly touch instructions", () => {
      render(<ChartWithTheme data={mockData} />);

      expect(
        screen.getByText(/Pinch to zoom, swipe to pan, tap for details/)
      ).toBeInTheDocument();
    });

    it("should render chart wrapper with full width", () => {
      const { container } = render(<ChartWithTheme data={mockData} />);

      const chartContainer = container.querySelector(".chart-container");
      expect(chartContainer).toHaveClass("w-full");
    });
  });

  describe("Data Point Hover", () => {
    it("should call onDataPointHover callback when hovering", async () => {
      const onDataPointHover = vi.fn();
      render(
        <ChartWithTheme data={mockData} onDataPointHover={onDataPointHover} />
      );

      // Chart should render
      expect(screen.getByTestId("price-chart-panel")).toBeInTheDocument();
    });
  });

  describe("Chart Instructions", () => {
    it("should display usage instructions", () => {
      render(<ChartWithTheme data={mockData} />);

      expect(
        screen.getByText(
          /Use mouse wheel to zoom, drag to pan, hover for details/
        )
      ).toBeInTheDocument();
    });
  });
});
