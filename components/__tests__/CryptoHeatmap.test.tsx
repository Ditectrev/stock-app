/**
 * CryptoHeatmap Unit Tests
 * Tests for crypto display and category grouping/filtering.
 *
 * Requirements: 25.8
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CryptoHeatmap } from "../CryptoHeatmap";

vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({
    theme: "light",
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

const mockCryptos = [
  {
    symbol: "BTC-USD",
    name: "Bitcoin",
    price: 67000.0,
    changePercent: 3.5,
    category: "Large Cap",
    marketCap: 1.3e12,
  },
  {
    symbol: "ETH-USD",
    name: "Ethereum",
    price: 3500.0,
    changePercent: -1.2,
    category: "Large Cap",
    marketCap: 420e9,
  },
  {
    symbol: "LINK-USD",
    name: "Chainlink",
    price: 18.5,
    changePercent: 5.1,
    category: "DeFi",
    marketCap: 10e9,
  },
  {
    symbol: "MATIC-USD",
    name: "Polygon",
    price: 0.72,
    changePercent: -2.8,
    category: "Layer 2",
    marketCap: 7e9,
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
  return { success: true, data: mockCryptos, timestamp: new Date() };
}

vi.mock("swr", () => ({
  default: () => mockSWRResponse,
}));

describe("CryptoHeatmap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSWRResponse.data = createSuccessResponse();
    mockSWRResponse.error = undefined;
  });

  // --- Crypto display ---

  it("should render the crypto heatmap container", () => {
    render(<CryptoHeatmap />);
    expect(screen.getByTestId("crypto-heatmap")).toBeDefined();
  });

  it("should render tiles for each crypto", () => {
    render(<CryptoHeatmap />);
    for (const crypto of mockCryptos) {
      expect(screen.getByTestId(`heatmap-tile-${crypto.symbol}`)).toBeDefined();
    }
  });

  it("should display crypto symbols and change percentages", () => {
    render(<CryptoHeatmap />);
    expect(screen.getByTestId("heatmap-symbol-BTC-USD").textContent).toBe(
      "BTC-USD"
    );
    expect(screen.getByTestId("heatmap-change-BTC-USD").textContent).toBe(
      "+3.50%"
    );
    expect(screen.getByTestId("heatmap-change-ETH-USD").textContent).toBe(
      "-1.20%"
    );
  });

  it("should call onCryptoClick when a tile is clicked", () => {
    const onClick = vi.fn();
    render(<CryptoHeatmap onCryptoClick={onClick} />);
    fireEvent.click(screen.getByTestId("heatmap-tile-BTC-USD"));
    expect(onClick).toHaveBeenCalledWith("BTC-USD");
  });

  // --- Category grouping / filtering ---

  it("should render category filter buttons", () => {
    render(<CryptoHeatmap />);
    const filter = screen.getByTestId("crypto-category-filter");
    expect(filter).toBeDefined();
    expect(screen.getByTestId("crypto-category-all")).toBeDefined();
  });

  it("should render a button for each unique category", () => {
    render(<CryptoHeatmap />);
    expect(screen.getByTestId("crypto-category-large-cap")).toBeDefined();
    expect(screen.getByTestId("crypto-category-defi")).toBeDefined();
    expect(screen.getByTestId("crypto-category-layer-2")).toBeDefined();
  });

  it("should show all cryptos when 'All' category is selected", () => {
    render(<CryptoHeatmap />);
    const grid = screen.getByTestId("heatmap-grid");
    const tiles = grid.querySelectorAll("[data-testid^='heatmap-tile-']");
    expect(tiles.length).toBe(4);
  });

  it("should filter cryptos when a category button is clicked", async () => {
    render(<CryptoHeatmap />);
    fireEvent.click(screen.getByTestId("crypto-category-large-cap"));

    await waitFor(() => {
      const grid = screen.getByTestId("heatmap-grid");
      const tiles = grid.querySelectorAll("[data-testid^='heatmap-tile-']");
      expect(tiles.length).toBe(2);
    });

    expect(screen.getByTestId("heatmap-tile-BTC-USD")).toBeDefined();
    expect(screen.getByTestId("heatmap-tile-ETH-USD")).toBeDefined();
  });

  it("should return to all cryptos when 'All' is clicked after filtering", async () => {
    render(<CryptoHeatmap />);
    fireEvent.click(screen.getByTestId("crypto-category-defi"));

    await waitFor(() => {
      const grid = screen.getByTestId("heatmap-grid");
      expect(
        grid.querySelectorAll("[data-testid^='heatmap-tile-']").length
      ).toBe(1);
    });

    fireEvent.click(screen.getByTestId("crypto-category-all"));

    await waitFor(() => {
      const grid = screen.getByTestId("heatmap-grid");
      expect(
        grid.querySelectorAll("[data-testid^='heatmap-tile-']").length
      ).toBe(4);
    });
  });

  it("should highlight the active category button", async () => {
    render(<CryptoHeatmap />);
    const allBtn = screen.getByTestId("crypto-category-all");
    expect(allBtn.getAttribute("aria-pressed")).toBe("true");
    expect(allBtn.className).toContain("bg-stone-900");

    fireEvent.click(screen.getByTestId("crypto-category-defi"));

    await waitFor(() => {
      const defiBtn = screen.getByTestId("crypto-category-defi");
      expect(defiBtn.getAttribute("aria-pressed")).toBe("true");
      expect(defiBtn.className).toContain("bg-stone-900");
    });

    expect(
      screen.getByTestId("crypto-category-all").getAttribute("aria-pressed")
    ).toBe("false");
  });

  // --- Error state ---

  it("should show error message when data fetch fails", () => {
    mockSWRResponse.data = undefined;
    mockSWRResponse.error = new Error("Network error");
    render(<CryptoHeatmap />);
    expect(screen.getByTestId("crypto-heatmap-error")).toBeDefined();
    expect(
      screen.getByText("We couldn't load the crypto heatmap. Try again.")
    ).toBeDefined();
  });

  // --- Loading state ---

  it("should show loading state when data is not yet available", () => {
    mockSWRResponse.data = undefined;
    mockSWRResponse.error = undefined;
    render(<CryptoHeatmap />);
    expect(screen.getByTestId("heatmap-loading")).toBeDefined();
  });

  // --- Accessibility ---

  it("should have proper ARIA label on category filter group", () => {
    render(<CryptoHeatmap />);
    const group = screen.getByTestId("crypto-category-filter");
    expect(group.getAttribute("aria-label")).toBe("Crypto category filter");
    expect(group.getAttribute("role")).toBe("group");
  });
});
