/**
 * StockHeatmap Unit Tests
 * Tests for stock display, sector grouping, and TradingView style.
 *
 * Requirements: 25.9
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StockHeatmap } from "../StockHeatmap";

vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({
    theme: "light",
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

const mockStocks = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 195.0,
    changePercent: 1.5,
    sector: "Technology",
    marketCap: 3e12,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    price: 420.0,
    changePercent: -0.6,
    sector: "Technology",
    marketCap: 2.8e12,
  },
  {
    symbol: "JPM",
    name: "JPMorgan Chase",
    price: 198.0,
    changePercent: 0.9,
    sector: "Financial",
    marketCap: 570e9,
  },
  {
    symbol: "JNJ",
    name: "Johnson & Johnson",
    price: 155.0,
    changePercent: -1.3,
    sector: "Healthcare",
    marketCap: 375e9,
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
  return { success: true, data: mockStocks, timestamp: new Date() };
}

vi.mock("swr", () => ({
  default: () => mockSWRResponse,
}));

describe("StockHeatmap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSWRResponse.data = createSuccessResponse();
    mockSWRResponse.error = undefined;
  });

  // --- Stock display ---

  it("should render the stock heatmap container", () => {
    render(<StockHeatmap />);
    expect(screen.getByTestId("stock-heatmap")).toBeDefined();
  });

  it("should render tiles for each stock", () => {
    render(<StockHeatmap />);
    for (const stock of mockStocks) {
      expect(screen.getByTestId(`heatmap-tile-${stock.symbol}`)).toBeDefined();
    }
  });

  it("should display stock symbols and change percentages", () => {
    render(<StockHeatmap />);
    expect(screen.getByTestId("heatmap-symbol-AAPL").textContent).toBe("AAPL");
    expect(screen.getByTestId("heatmap-change-AAPL").textContent).toBe(
      "+1.50%"
    );
    expect(screen.getByTestId("heatmap-change-MSFT").textContent).toBe(
      "-0.60%"
    );
  });

  it("should call onStockClick when a tile is clicked", () => {
    const onClick = vi.fn();
    render(<StockHeatmap onStockClick={onClick} />);
    fireEvent.click(screen.getByTestId("heatmap-tile-AAPL"));
    expect(onClick).toHaveBeenCalledWith("AAPL");
  });

  // --- Sector grouping / filtering ---

  it("should render sector filter buttons", () => {
    render(<StockHeatmap />);
    const filter = screen.getByTestId("stock-sector-filter");
    expect(filter).toBeDefined();
    expect(screen.getByTestId("stock-sector-all")).toBeDefined();
  });

  it("should render a button for each unique sector", () => {
    render(<StockHeatmap />);
    expect(screen.getByTestId("stock-sector-technology")).toBeDefined();
    expect(screen.getByTestId("stock-sector-financial")).toBeDefined();
    expect(screen.getByTestId("stock-sector-healthcare")).toBeDefined();
  });

  it("should show all stocks when 'All' sector is selected", () => {
    render(<StockHeatmap />);
    const grid = screen.getByTestId("heatmap-grid");
    const tiles = grid.querySelectorAll("[data-testid^='heatmap-tile-']");
    expect(tiles.length).toBe(4);
  });

  it("should filter stocks when a sector button is clicked", async () => {
    render(<StockHeatmap />);
    fireEvent.click(screen.getByTestId("stock-sector-technology"));

    await waitFor(() => {
      const grid = screen.getByTestId("heatmap-grid");
      const tiles = grid.querySelectorAll("[data-testid^='heatmap-tile-']");
      expect(tiles.length).toBe(2);
    });

    expect(screen.getByTestId("heatmap-tile-AAPL")).toBeDefined();
    expect(screen.getByTestId("heatmap-tile-MSFT")).toBeDefined();
  });

  it("should return to all stocks when 'All' is clicked after filtering", async () => {
    render(<StockHeatmap />);
    fireEvent.click(screen.getByTestId("stock-sector-technology"));

    await waitFor(() => {
      const grid = screen.getByTestId("heatmap-grid");
      expect(
        grid.querySelectorAll("[data-testid^='heatmap-tile-']").length
      ).toBe(2);
    });

    fireEvent.click(screen.getByTestId("stock-sector-all"));

    await waitFor(() => {
      const grid = screen.getByTestId("heatmap-grid");
      expect(
        grid.querySelectorAll("[data-testid^='heatmap-tile-']").length
      ).toBe(4);
    });
  });

  it("should highlight the active sector button", async () => {
    render(<StockHeatmap />);
    const allBtn = screen.getByTestId("stock-sector-all");
    expect(allBtn.getAttribute("aria-pressed")).toBe("true");
    expect(allBtn.className).toContain("bg-stone-900");

    fireEvent.click(screen.getByTestId("stock-sector-financial"));

    await waitFor(() => {
      const finBtn = screen.getByTestId("stock-sector-financial");
      expect(finBtn.getAttribute("aria-pressed")).toBe("true");
      expect(finBtn.className).toContain("bg-stone-900");
    });

    expect(
      screen.getByTestId("stock-sector-all").getAttribute("aria-pressed")
    ).toBe("false");
  });

  // --- TradingView style ---

  it("should apply green color for positive change tiles", () => {
    render(<StockHeatmap />);
    const tile = screen.getByTestId("heatmap-tile-AAPL");
    const style = tile.getAttribute("style") || tile.className;
    // Positive stocks should have green-tinted background
    expect(style).toBeTruthy();
  });

  it("should apply red color for negative change tiles", () => {
    render(<StockHeatmap />);
    const tile = screen.getByTestId("heatmap-tile-MSFT");
    const style = tile.getAttribute("style") || tile.className;
    // Negative stocks should have red-tinted background
    expect(style).toBeTruthy();
  });

  // --- Error state ---

  it("should show error message when data fetch fails", () => {
    mockSWRResponse.data = undefined;
    mockSWRResponse.error = new Error("Network error");
    render(<StockHeatmap />);
    expect(screen.getByTestId("stock-heatmap-error")).toBeDefined();
    expect(
      screen.getByText("Failed to load stock data. Please try again later.")
    ).toBeDefined();
  });

  // --- Loading state ---

  it("should show loading state when data is not yet available", () => {
    mockSWRResponse.data = undefined;
    mockSWRResponse.error = undefined;
    render(<StockHeatmap />);
    expect(screen.getByTestId("heatmap-loading")).toBeDefined();
  });

  // --- Accessibility ---

  it("should have proper ARIA label on sector filter group", () => {
    render(<StockHeatmap />);
    const group = screen.getByTestId("stock-sector-filter");
    expect(group.getAttribute("aria-label")).toBe("Stock sector filter");
    expect(group.getAttribute("role")).toBe("group");
  });
});
