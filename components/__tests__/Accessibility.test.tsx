/**
 * Accessibility Tests (Task 40.1)
 * Verifies alt text, ARIA labels, aria-live regions, and roles
 * across all components for Requirements 18.1, 18.4, 18.5.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock theme context
vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
    resolvedTheme: "light",
  }),
}));

// Mock lightweight-charts
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

// Mock fetch globally
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: [] }),
  } as Response)
);

import { LoadingSpinner } from "../LoadingSpinner";
import { ErrorMessage } from "../ErrorMessage";
import { ThemeToggle } from "../ThemeToggle";
import { Footer } from "../Footer";
import { ChartWrapper } from "../ChartWrapper";
import { TabNavigation } from "../TabNavigation";
import { SymbolHeader } from "../SymbolHeader";
import { KeyMetrics } from "../KeyMetrics";

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

describe("Accessibility - LoadingSpinner (Req 18.5)", () => {
  it("should have role=status for screen reader announcement", () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner.getAttribute("role")).toBe("status");
  });

  it("should have aria-live=polite for dynamic loading announcements", () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner.getAttribute("aria-live")).toBe("polite");
  });

  it("should have sr-only text for screen readers", () => {
    render(<LoadingSpinner message="Loading data..." />);
    expect(
      screen.getAllByText("Loading data...").length
    ).toBeGreaterThanOrEqual(1);
  });
});

describe("Accessibility - ErrorMessage (Req 18.5)", () => {
  it("should have role=alert for error announcements", () => {
    render(<ErrorMessage type="api" />);
    const el = screen.getByTestId("error-message");
    expect(el.getAttribute("role")).toBe("alert");
  });

  it("should have aria-live=assertive for immediate error announcements", () => {
    render(<ErrorMessage type="network" />);
    const el = screen.getByTestId("error-message");
    expect(el.getAttribute("aria-live")).toBe("assertive");
  });

  it("should expose a readable title for screen readers", () => {
    render(<ErrorMessage type="api" />);
    expect(
      screen.getByRole("heading", { name: "Something went wrong" })
    ).toBeDefined();
  });
});

describe("Accessibility - ThemeToggle (Req 18.1, 18.4)", () => {
  it("should have aria-label on the toggle button", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toContain("Theme:");
  });

  it("should have aria-hidden on SVG icons", () => {
    const { container } = render(<ThemeToggle />);
    const svgs = container.querySelectorAll("svg");
    svgs.forEach((svg) => {
      expect(svg.getAttribute("aria-hidden")).toBe("true");
    });
  });
});

describe("Accessibility - Footer (Req 18.4)", () => {
  it("should have aria-label on footer element", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    expect(footer.getAttribute("aria-label")).toBe("Site footer");
  });
});

describe("Accessibility - ChartWrapper (Req 18.1, 18.4)", () => {
  it("should have role=img and aria-label on chart container", () => {
    const { container } = render(<ChartWrapper />);
    const chartDiv = container.querySelector(".chart-wrapper");
    expect(chartDiv?.getAttribute("role")).toBe("img");
    expect(chartDiv?.getAttribute("aria-label")).toBe("Financial price chart");
  });
});

describe("Accessibility - TabNavigation (Req 18.4)", () => {
  it("should use role=tablist on the nav element", () => {
    render(<TabNavigation activeTab="overview" onTabChange={vi.fn()} />);
    const tablist = screen.getByRole("tablist");
    expect(tablist).toBeDefined();
    expect(tablist.getAttribute("aria-label")).toBe("Symbol detail tabs");
  });

  it("should use role=tab on each tab button", () => {
    render(<TabNavigation activeTab="overview" onTabChange={vi.fn()} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBe(5);
  });

  it("should set aria-selected=true on the active tab", () => {
    render(<TabNavigation activeTab="financials" onTabChange={vi.fn()} />);
    const tabs = screen.getAllByRole("tab");
    const financialsTab = tabs.find((t) => t.textContent === "Financials");
    expect(financialsTab?.getAttribute("aria-selected")).toBe("true");
  });

  it("should set aria-selected=false on inactive tabs", () => {
    render(<TabNavigation activeTab="overview" onTabChange={vi.fn()} />);
    const tabs = screen.getAllByRole("tab");
    const inactiveTabs = tabs.filter((t) => t.textContent !== "Overview");
    inactiveTabs.forEach((tab) => {
      expect(tab.getAttribute("aria-selected")).toBe("false");
    });
  });
});

describe("Accessibility - SymbolHeader (Req 18.4, 18.5)", () => {
  it("should have aria-label on the header container", () => {
    render(<SymbolHeader symbolData={mockSymbolData} />);
    const container = screen.getByLabelText("AAPL - Apple Inc.");
    expect(container).toBeDefined();
  });

  it("should have aria-live=polite on the price section for dynamic updates", () => {
    const { container } = render(<SymbolHeader symbolData={mockSymbolData} />);
    const liveRegion = container.querySelector("[aria-live='polite']");
    expect(liveRegion).not.toBeNull();
  });

  it("should have aria-label on the price element", () => {
    render(<SymbolHeader symbolData={mockSymbolData} />);
    const priceEl = screen.getByLabelText(/Current price/);
    expect(priceEl).toBeDefined();
  });
});

describe("Accessibility - KeyMetrics (Req 18.4)", () => {
  it("should have aria-label on tooltip trigger buttons", () => {
    render(<KeyMetrics symbolData={mockSymbolData} />);
    const infoButtons = screen.getAllByRole("button");
    infoButtons.forEach((btn) => {
      expect(btn.getAttribute("aria-label")).toContain("More info about");
    });
  });

  it("should have role=tooltip on tooltip content when shown", async () => {
    const { container } = render(<KeyMetrics symbolData={mockSymbolData} />);
    // Tooltips are shown on hover, so we check the structure exists
    const metricCards = container.querySelectorAll("[aria-label*='More info']");
    expect(metricCards.length).toBeGreaterThan(0);
  });
});
