/**
 * Axe Accessibility Audit (Task 40.4)
 * Uses axe-core via vitest-axe to test WCAG 2.1 Level AA compliance
 * across all major user-facing components.
 *
 * Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { configureAxe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";

expect.extend(matchers);

// ---------------------------------------------------------------------------
// Configure axe for WCAG 2.1 Level AA
// ---------------------------------------------------------------------------
const axe = configureAxe({
  rules: {
    // Disable color-contrast in jsdom — it cannot compute styles/layout
    "color-contrast": { enabled: false },
  },
  runOnly: {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21aa"],
  },
});

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
    resolvedTheme: "light",
  }),
}));

vi.mock("lightweight-charts", () => ({
  createChart: () => ({
    addLineSeries: () => ({ setData: vi.fn() }),
    addAreaSeries: () => ({ setData: vi.fn() }),
    addCandlestickSeries: () => ({ setData: vi.fn() }),
    applyOptions: vi.fn(),
    remove: vi.fn(),
    timeScale: () => ({ fitContent: vi.fn() }),
  }),
  ColorType: { Solid: "Solid" },
  CrosshairMode: { Normal: 0 },
  LineStyle: { Dashed: 2 },
}));

// Mock react-github-btn used by Footer
vi.mock("react-github-btn", () => ({
  default: (props: Record<string, unknown>) => (
    <a href={props.href as string} aria-label={props["aria-label"] as string}>
      {props.children as string}
    </a>
  ),
}));

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: [] }),
  } as Response)
);

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { LoadingSpinner } from "../LoadingSpinner";
import { ErrorMessage } from "../ErrorMessage";
import { ThemeToggle } from "../ThemeToggle";
import { Footer } from "../Footer";
import { TabNavigation } from "../TabNavigation";
import { SymbolHeader } from "../SymbolHeader";
import { KeyMetrics } from "../KeyMetrics";
import { SearchBar } from "../SearchBar";
import { FearGreedGauge } from "../FearGreedGauge";
import { WorldMarkets } from "../WorldMarkets";
import { CalendarNavigation } from "../CalendarNavigation";
import { HeatmapNavigation } from "../HeatmapNavigation";
import { ForecastDisplay } from "../ForecastDisplay";
import { TechnicalIndicatorsDisplay } from "../TechnicalIndicatorsDisplay";
import { FinancialsTable } from "../FinancialsTable";
import { SeasonalHeatmap } from "../SeasonalHeatmap";
import { SectorHub } from "../SectorHub";
import { CalendarHub } from "../CalendarHub";
import { HeatmapHub } from "../HeatmapHub";
import { ScreenerHub } from "../ScreenerHub";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

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

const mockFearGreedData = {
  value: 65,
  label: "Greed" as const,
  timestamp: new Date("2024-01-15"),
  history: [
    { date: new Date("2024-01-01"), value: 50 },
    { date: new Date("2024-01-15"), value: 65 },
  ],
};

const mockWorldMarketsData = [
  {
    name: "S&P 500",
    symbol: "SPX",
    value: 4800,
    change: 25,
    changePercent: 0.52,
    region: "Americas" as const,
  },
  {
    name: "FTSE 100",
    symbol: "UKX",
    value: 7600,
    change: -10,
    changePercent: -0.13,
    region: "Europe" as const,
  },
  {
    name: "Nikkei 225",
    symbol: "NI225",
    value: 35000,
    change: 200,
    changePercent: 0.57,
    region: "Asia-Pacific" as const,
  },
];

const mockForecast = {
  priceTargets: { low: 100, average: 150, high: 200 },
  analystRatings: { strongBuy: 10, buy: 15, hold: 5, sell: 2, strongSell: 1 },
  epsForecasts: [{ quarter: "Q1 2024", estimate: 1.5 }],
  revenueForecasts: [{ quarter: "Q1 2024", estimate: 50000000000 }],
};

const mockIndicators = {
  rsi: { value: 55, signal: "fair" as const },
  macd: {
    value: 1.5,
    signal: 1.2,
    histogram: 0.3,
    trend: "underpriced" as const,
  },
  movingAverages: { ma50: 155, ma200: 148, signal: "fair" as const },
  bollingerBands: {
    upper: 170,
    middle: 150,
    lower: 130,
    signal: "fair" as const,
  },
  overallSentiment: "fair" as const,
};

const mockFinancials = {
  keyFacts: {
    revenue: 400000000000,
    netIncome: 100000000000,
    profitMargin: 0.25,
  },
  valuation: { peRatio: 28, pbRatio: 45, pegRatio: 1.5 },
  growth: { revenueGrowth: 0.08, earningsGrowth: 0.12 },
  profitability: { roe: 0.15, roa: 0.06, operatingMargin: 0.3 },
};

const mockSeasonalData = {
  heatmap: [
    { year: 2023, month: 1, return: 5.2 },
    { year: 2023, month: 2, return: -1.3 },
    { year: 2023, month: 3, return: 2.1 },
  ],
  averageByMonth: { 1: 3.5, 2: -0.5, 3: 1.8 },
};

const mockSectorData = [
  {
    sector: "Technology",
    performance: 25,
    changePercent: 1.5,
    constituents: 50,
  },
  {
    sector: "Healthcare",
    performance: 10,
    changePercent: -0.3,
    constituents: 40,
  },
  {
    sector: "Financial",
    performance: 15,
    changePercent: 0.8,
    constituents: 45,
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Axe Accessibility Audit – WCAG 2.1 Level AA", () => {
  it("LoadingSpinner has no violations", async () => {
    const { container } = render(<LoadingSpinner message="Loading data..." />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("ErrorMessage has no violations", async () => {
    const { container } = render(
      <ErrorMessage type="api" onRetry={() => {}} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("ThemeToggle has no violations", async () => {
    const { container } = render(<ThemeToggle />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("Footer has no violations", async () => {
    const { container } = render(<Footer />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("TabNavigation has no violations", async () => {
    const { container } = render(
      <TabNavigation activeTab="overview" onTabChange={vi.fn()} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("SymbolHeader has no violations", async () => {
    const { container } = render(<SymbolHeader symbolData={mockSymbolData} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("KeyMetrics has no violations", async () => {
    const { container } = render(<KeyMetrics symbolData={mockSymbolData} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("SearchBar has no violations", async () => {
    const { container } = render(<SearchBar />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("FearGreedGauge has no violations", async () => {
    const { container } = render(<FearGreedGauge data={mockFearGreedData} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("WorldMarkets has no violations", async () => {
    const { container } = render(<WorldMarkets data={mockWorldMarketsData} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("CalendarNavigation has no violations", async () => {
    const { container } = render(
      <CalendarNavigation
        activeCalendar="economic"
        onCalendarChange={vi.fn()}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("HeatmapNavigation has no violations", async () => {
    const { container } = render(
      <HeatmapNavigation activeHeatmap="etf" onHeatmapChange={vi.fn()} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("ForecastDisplay has no violations", async () => {
    const { container } = render(<ForecastDisplay forecast={mockForecast} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("TechnicalIndicatorsDisplay has no violations", async () => {
    const { container } = render(
      <TechnicalIndicatorsDisplay indicators={mockIndicators} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("FinancialsTable has no violations", async () => {
    const { container } = render(
      <FinancialsTable financials={mockFinancials} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("SeasonalHeatmap has no violations", async () => {
    const { container } = render(<SeasonalHeatmap data={mockSeasonalData} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("SectorHub has no violations", async () => {
    const { container } = render(
      <SectorHub data={mockSectorData} refreshInterval={0} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("CalendarHub has no violations", async () => {
    const { container } = render(<CalendarHub />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("HeatmapHub has no violations", async () => {
    const { container } = render(<HeatmapHub refreshInterval={0} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("ScreenerHub has no violations", async () => {
    const { container } = render(<ScreenerHub refreshInterval={0} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
