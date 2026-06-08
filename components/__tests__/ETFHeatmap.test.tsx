/**
 * ETFHeatmap Unit Tests
 * Tests for ETF display and category grouping/filtering.
 *
 * Requirements: 25.7
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ETFHeatmap } from "../ETFHeatmap";

vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({
    theme: "light",
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

const mockETFs = [
  {
    symbol: "SPY",
    name: "SPDR S&P 500",
    price: 520.0,
    changePercent: 1.2,
    category: "Broad Market",
    marketCap: 500e9,
  },
  {
    symbol: "QQQ",
    name: "Invesco QQQ",
    price: 440.0,
    changePercent: -0.8,
    category: "Technology",
    marketCap: 250e9,
  },
  {
    symbol: "XLF",
    name: "Financial Select",
    price: 42.0,
    changePercent: 0.5,
    category: "Financial",
    marketCap: 35e9,
  },
  {
    symbol: "VGT",
    name: "Vanguard IT",
    price: 530.0,
    changePercent: 2.1,
    category: "Technology",
    marketCap: 60e9,
  },
];

const mockSWRResponse = {
  data: undefined as ReturnType<typeof createSuccessResponse> | undefined,
  error: undefined as Error | undefined,
  mutate: vi.fn(),
  isValidating: false,
  isLoading: false,
};

function createSuccessResponse() {
  return { success: true, data: mockETFs, timestamp: new Date() };
}

vi.mock("swr", () => ({
  default: () => mockSWRResponse,
}));

describe("ETFHeatmap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSWRResponse.data = createSuccessResponse();
    mockSWRResponse.error = undefined;
  });

  // --- ETF display ---

  it("should render the ETF heatmap container", () => {
    render(<ETFHeatmap />);
    expect(screen.getByTestId("etf-heatmap")).toBeDefined();
  });

  it("should render tiles for each ETF", () => {
    render(<ETFHeatmap />);
    for (const etf of mockETFs) {
      expect(screen.getByTestId(`heatmap-tile-${etf.symbol}`)).toBeDefined();
    }
  });

  it("should display ETF symbols and change percentages", () => {
    render(<ETFHeatmap />);
    expect(screen.getByTestId("heatmap-symbol-SPY").textContent).toBe("SPY");
    expect(screen.getByTestId("heatmap-change-SPY").textContent).toBe("+1.20%");
    expect(screen.getByTestId("heatmap-change-QQQ").textContent).toBe("-0.80%");
  });

  it("should call onETFClick when a tile is clicked", () => {
    const onClick = vi.fn();
    render(<ETFHeatmap onETFClick={onClick} />);
    fireEvent.click(screen.getByTestId("heatmap-tile-SPY"));
    expect(onClick).toHaveBeenCalledWith("SPY");
  });

  // --- Category grouping / filtering ---

  it("should render category filter buttons", () => {
    render(<ETFHeatmap />);
    const filter = screen.getByTestId("etf-category-filter");
    expect(filter).toBeDefined();
    expect(screen.getByTestId("etf-category-all")).toBeDefined();
  });

  it("should render a button for each unique category", () => {
    render(<ETFHeatmap />);
    expect(screen.getByTestId("etf-category-broad-market")).toBeDefined();
    expect(screen.getByTestId("etf-category-technology")).toBeDefined();
    expect(screen.getByTestId("etf-category-financial")).toBeDefined();
  });

  it("should show all ETFs when 'All' category is selected", () => {
    render(<ETFHeatmap />);
    const grid = screen.getByTestId("heatmap-grid");
    const tiles = grid.querySelectorAll("[data-testid^='heatmap-tile-']");
    expect(tiles.length).toBe(4);
  });

  it("should filter ETFs when a category button is clicked", async () => {
    render(<ETFHeatmap />);
    fireEvent.click(screen.getByTestId("etf-category-technology"));

    await waitFor(() => {
      const grid = screen.getByTestId("heatmap-grid");
      const tiles = grid.querySelectorAll("[data-testid^='heatmap-tile-']");
      expect(tiles.length).toBe(2);
    });

    expect(screen.getByTestId("heatmap-tile-QQQ")).toBeDefined();
    expect(screen.getByTestId("heatmap-tile-VGT")).toBeDefined();
  });

  it("should return to all ETFs when 'All' is clicked after filtering", async () => {
    render(<ETFHeatmap />);
    fireEvent.click(screen.getByTestId("etf-category-technology"));

    await waitFor(() => {
      const grid = screen.getByTestId("heatmap-grid");
      expect(
        grid.querySelectorAll("[data-testid^='heatmap-tile-']").length
      ).toBe(2);
    });

    fireEvent.click(screen.getByTestId("etf-category-all"));

    await waitFor(() => {
      const grid = screen.getByTestId("heatmap-grid");
      expect(
        grid.querySelectorAll("[data-testid^='heatmap-tile-']").length
      ).toBe(4);
    });
  });

  it("should highlight the active category button", async () => {
    render(<ETFHeatmap />);
    const allBtn = screen.getByTestId("etf-category-all");
    expect(allBtn.getAttribute("aria-pressed")).toBe("true");
    expect(allBtn.className).toContain("bg-stone-900");

    fireEvent.click(screen.getByTestId("etf-category-technology"));

    await waitFor(() => {
      const techBtn = screen.getByTestId("etf-category-technology");
      expect(techBtn.getAttribute("aria-pressed")).toBe("true");
      expect(techBtn.className).toContain("bg-stone-900");
    });

    expect(
      screen.getByTestId("etf-category-all").getAttribute("aria-pressed")
    ).toBe("false");
  });

  // --- Error state ---

  it("should show error message when data fetch fails", () => {
    mockSWRResponse.data = undefined;
    mockSWRResponse.error = new Error("Network error");
    render(<ETFHeatmap />);
    expect(screen.getByTestId("etf-heatmap-error")).toBeDefined();
    expect(
      screen.getByText("We couldn't load the ETF heatmap. Try again.")
    ).toBeDefined();
  });

  // --- Loading state ---

  it("should show loading state when data is not yet available", () => {
    mockSWRResponse.data = undefined;
    mockSWRResponse.error = undefined;
    render(<ETFHeatmap />);
    expect(screen.getByTestId("heatmap-loading")).toBeDefined();
  });

  // --- Accessibility ---

  it("should have proper ARIA label on category filter group", () => {
    render(<ETFHeatmap />);
    const group = screen.getByTestId("etf-category-filter");
    expect(group.getAttribute("aria-label")).toBe("ETF category filter");
    expect(group.getAttribute("role")).toBe("group");
  });
});
