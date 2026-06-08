/**
 * Keyboard Navigation Tests (Task 40.2)
 * Verifies keyboard navigation for all interactive elements.
 * Requirements: 18.2
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock theme context
vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
    resolvedTheme: "light",
  }),
}));

// Mock fetch globally
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: [] }),
  } as Response)
);

import { TabNavigation } from "../TabNavigation";
import { CalendarNavigation } from "../CalendarNavigation";
import { HeatmapNavigation } from "../HeatmapNavigation";
import { KeyMetrics } from "../KeyMetrics";
import { ThemeToggle } from "../ThemeToggle";
import { ForecastDisplay } from "../ForecastDisplay";
import { TechnicalIndicatorsDisplay } from "../TechnicalIndicatorsDisplay";

const mockSymbolData = {
  symbol: "AAPL",
  name: "Apple Inc.",
  price: 150.25,
  change: 2.5,
  changePercent: 1.69,
  marketCap: 2500000000000,
  volume: 75000000,
  fiftyTwoWeekHigh: 180.0,
  fiftyTwoWeekLow: 120.0,
  lastUpdated: new Date("2024-01-15T10:00:00Z"),
};

// ---------------------------------------------------------------------------
// TabNavigation keyboard tests
// ---------------------------------------------------------------------------
describe("Keyboard Navigation - TabNavigation (Req 18.2)", () => {
  it("should move focus right with ArrowRight key", () => {
    const onTabChange = vi.fn();
    render(<TabNavigation activeTab="overview" onTabChange={onTabChange} />);
    const tabs = screen.getAllByRole("tab");
    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(onTabChange).toHaveBeenCalledWith("financials");
  });

  it("should move focus left with ArrowLeft key", () => {
    const onTabChange = vi.fn();
    render(<TabNavigation activeTab="financials" onTabChange={onTabChange} />);
    const tabs = screen.getAllByRole("tab");
    tabs[1].focus();
    fireEvent.keyDown(tabs[1], { key: "ArrowLeft" });
    expect(onTabChange).toHaveBeenCalledWith("overview");
  });

  it("should wrap around from last to first with ArrowRight", () => {
    const onTabChange = vi.fn();
    render(<TabNavigation activeTab="seasonals" onTabChange={onTabChange} />);
    const tabs = screen.getAllByRole("tab");
    tabs[4].focus();
    fireEvent.keyDown(tabs[4], { key: "ArrowRight" });
    expect(onTabChange).toHaveBeenCalledWith("overview");
  });

  it("should wrap around from first to last with ArrowLeft", () => {
    const onTabChange = vi.fn();
    render(<TabNavigation activeTab="overview" onTabChange={onTabChange} />);
    const tabs = screen.getAllByRole("tab");
    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: "ArrowLeft" });
    expect(onTabChange).toHaveBeenCalledWith("seasonals");
  });

  it("should jump to first tab with Home key", () => {
    const onTabChange = vi.fn();
    render(<TabNavigation activeTab="technicals" onTabChange={onTabChange} />);
    const tabs = screen.getAllByRole("tab");
    tabs[2].focus();
    fireEvent.keyDown(tabs[2], { key: "Home" });
    expect(onTabChange).toHaveBeenCalledWith("overview");
  });

  it("should jump to last tab with End key", () => {
    const onTabChange = vi.fn();
    render(<TabNavigation activeTab="overview" onTabChange={onTabChange} />);
    const tabs = screen.getAllByRole("tab");
    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: "End" });
    expect(onTabChange).toHaveBeenCalledWith("seasonals");
  });

  it("should set tabIndex=0 on active tab and tabIndex=-1 on inactive tabs", () => {
    render(<TabNavigation activeTab="financials" onTabChange={vi.fn()} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[1]).toHaveAttribute("tabindex", "0"); // financials
    expect(tabs[0]).toHaveAttribute("tabindex", "-1"); // overview
    expect(tabs[2]).toHaveAttribute("tabindex", "-1"); // technicals
  });
});

// ---------------------------------------------------------------------------
// CalendarNavigation keyboard tests
// ---------------------------------------------------------------------------
describe("Keyboard Navigation - CalendarNavigation (Req 18.2)", () => {
  it("should move focus right with ArrowRight key", () => {
    const onChange = vi.fn();
    render(
      <CalendarNavigation
        activeCalendar="economic"
        onCalendarChange={onChange}
      />
    );
    const tabs = screen.getAllByRole("tab");
    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("earnings");
  });

  it("should wrap from last to first with ArrowRight", () => {
    const onChange = vi.fn();
    render(
      <CalendarNavigation activeCalendar="ipos" onCalendarChange={onChange} />
    );
    const tabs = screen.getAllByRole("tab");
    tabs[3].focus();
    fireEvent.keyDown(tabs[3], { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("economic");
  });

  it("should jump to first with Home and last with End", () => {
    const onChange = vi.fn();
    render(
      <CalendarNavigation
        activeCalendar="earnings"
        onCalendarChange={onChange}
      />
    );
    const tabs = screen.getAllByRole("tab");
    tabs[1].focus();
    fireEvent.keyDown(tabs[1], { key: "Home" });
    expect(onChange).toHaveBeenCalledWith("economic");

    onChange.mockClear();
    tabs[1].focus();
    fireEvent.keyDown(tabs[1], { key: "End" });
    expect(onChange).toHaveBeenCalledWith("ipos");
  });

  it("should set tabIndex roving correctly", () => {
    render(
      <CalendarNavigation
        activeCalendar="dividends"
        onCalendarChange={vi.fn()}
      />
    );
    const tabs = screen.getAllByRole("tab");
    expect(tabs[2]).toHaveAttribute("tabindex", "0"); // dividends
    expect(tabs[0]).toHaveAttribute("tabindex", "-1");
  });
});

// ---------------------------------------------------------------------------
// HeatmapNavigation keyboard tests
// ---------------------------------------------------------------------------
describe("Keyboard Navigation - HeatmapNavigation (Req 18.2)", () => {
  it("should move focus right with ArrowRight key", () => {
    const onChange = vi.fn();
    render(
      <HeatmapNavigation activeHeatmap="etf" onHeatmapChange={onChange} />
    );
    const tabs = screen.getAllByRole("tab");
    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("crypto");
  });

  it("should wrap from last to first with ArrowRight", () => {
    const onChange = vi.fn();
    render(
      <HeatmapNavigation activeHeatmap="stock" onHeatmapChange={onChange} />
    );
    const tabs = screen.getAllByRole("tab");
    tabs[2].focus();
    fireEvent.keyDown(tabs[2], { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("etf");
  });

  it("should set tabIndex roving correctly", () => {
    render(
      <HeatmapNavigation activeHeatmap="crypto" onHeatmapChange={vi.fn()} />
    );
    const tabs = screen.getAllByRole("tab");
    expect(tabs[1]).toHaveAttribute("tabindex", "0"); // crypto
    expect(tabs[0]).toHaveAttribute("tabindex", "-1");
    expect(tabs[2]).toHaveAttribute("tabindex", "-1");
  });
});

// ---------------------------------------------------------------------------
// Tooltip focus accessibility tests
// ---------------------------------------------------------------------------
describe("Keyboard Navigation - Tooltip Focus (Req 18.2)", () => {
  it("KeyMetrics: tooltip should appear on button focus", () => {
    render(<KeyMetrics symbolData={mockSymbolData} />);
    const infoBtn = screen.getByLabelText("More info about Market Cap");
    fireEvent.focus(infoBtn);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("KeyMetrics: tooltip should disappear on button blur", () => {
    render(<KeyMetrics symbolData={mockSymbolData} />);
    const infoBtn = screen.getByLabelText("More info about Market Cap");
    fireEvent.focus(infoBtn);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.blur(infoBtn);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("TechnicalIndicatorsDisplay: tooltip should appear on button focus", () => {
    const mockIndicators = {
      rsi: { value: 72.5, signal: "overpriced" as const },
      macd: {
        value: 1.5,
        signal: 1.2,
        histogram: 0.3,
        trend: "underpriced" as const,
      },
      movingAverages: {
        ma50: 155.0,
        ma200: 148.0,
        signal: "fair" as const,
      },
      bollingerBands: {
        upper: 170.0,
        middle: 150.0,
        lower: 130.0,
        signal: "overpriced" as const,
      },
      overallSentiment: "overpriced" as const,
    };
    render(<TechnicalIndicatorsDisplay indicators={mockIndicators} />);
    const infoBtn = screen.getByLabelText(
      "More info about RSI (Relative Strength Index)"
    );
    fireEvent.focus(infoBtn);
    expect(
      screen.getByText(/RSI measures the speed and magnitude/)
    ).toBeInTheDocument();
  });

  it("ForecastDisplay: tooltip should appear on button focus", () => {
    const mockForecast = {
      priceTargets: { low: 100, average: 150, high: 200 },
      analystRatings: {
        strongBuy: 10,
        buy: 15,
        hold: 5,
        sell: 2,
        strongSell: 1,
      },
      epsForecasts: [{ quarter: "Q1 2024", estimate: 1.5 }],
      revenueForecasts: [{ quarter: "Q1 2024", estimate: 50000000000 }],
    };
    render(<ForecastDisplay forecast={mockForecast} />);
    const infoBtn = screen.getByLabelText("More info about Price Targets");
    fireEvent.focus(infoBtn);
    expect(
      screen.getByText(/Analyst price targets represent/)
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ThemeToggle focus indicator test
// ---------------------------------------------------------------------------
describe("Keyboard Navigation - ThemeToggle (Req 18.2)", () => {
  it("should have focus-visible ring classes on the button", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("focus-visible:ring-2");
    expect(button.className).toContain("focus-visible:ring-stone-600");
  });
});
