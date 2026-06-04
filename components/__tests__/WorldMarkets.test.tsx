/**
 * WorldMarkets Component Tests
 * Tests for index display, color coding, regional grouping, loading/error states
 *
 * Requirements: 10.1, 10.2, 10.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { WorldMarkets } from "../WorldMarkets";
import { MarketIndex } from "@/types";

// Mock useTheme
vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({
    theme: "light",
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

const mockData: MarketIndex[] = [
  {
    name: "S&P 500",
    symbol: "SPX",
    value: 5234.18,
    change: 45.32,
    changePercent: 0.87,
    region: "Americas",
  },
  {
    name: "Dow Jones",
    symbol: "DJI",
    value: 39150.33,
    change: -120.45,
    changePercent: -0.31,
    region: "Americas",
  },
  {
    name: "Nikkei 225",
    symbol: "N225",
    value: 38460.08,
    change: 310.55,
    changePercent: 0.81,
    region: "Asia-Pacific",
  },
  {
    name: "FTSE 100",
    symbol: "FTSE",
    value: 8125.44,
    change: -22.1,
    changePercent: -0.27,
    region: "Europe",
  },
];

describe("WorldMarkets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should display major market indices by region - Americas, Asia-Pacific, Europe (Req 10.1)", () => {
    render(<WorldMarkets data={mockData} />);
    expect(screen.getByTestId("region-Americas")).toBeDefined();
    expect(screen.getByTestId("region-Asia-Pacific")).toBeDefined();
    expect(screen.getByTestId("region-Europe")).toBeDefined();
  });

  it("should display index names and symbols (Req 10.1)", () => {
    render(<WorldMarkets data={mockData} />);
    expect(screen.getByText("S&P 500")).toBeDefined();
    expect(screen.getByText("SPX")).toBeDefined();
    expect(screen.getByText("Nikkei 225")).toBeDefined();
    expect(screen.getByText("N225")).toBeDefined();
    expect(screen.getByText("FTSE 100")).toBeDefined();
    expect(screen.getByText("FTSE")).toBeDefined();
  });

  it("should display current values and percentage changes for each index (Req 10.2)", () => {
    render(<WorldMarkets data={mockData} />);
    expect(screen.getByTestId("value-SPX")).toBeDefined();
    expect(screen.getByTestId("change-SPX")).toBeDefined();
    expect(screen.getByTestId("value-N225")).toBeDefined();
    expect(screen.getByTestId("change-N225")).toBeDefined();
    expect(screen.getByTestId("value-FTSE")).toBeDefined();
    expect(screen.getByTestId("change-FTSE")).toBeDefined();
  });

  it("should format values with toLocaleString and 2 decimals, and format percent with +/- prefix (Req 10.2)", () => {
    render(<WorldMarkets data={mockData} />);

    // Positive change: +45.32 (+0.87%)
    const spxChange = screen.getByTestId("change-SPX").textContent!;
    expect(spxChange).toContain("+45.32");
    expect(spxChange).toContain("+0.87%");

    // Negative change: -120.45 (-0.31%)
    const djiChange = screen.getByTestId("change-DJI").textContent!;
    expect(djiChange).toContain("-120.45");
    expect(djiChange).toContain("-0.31%");

    // Value formatting (2 decimal places)
    const n225Value = screen.getByTestId("value-N225").textContent!;
    expect(n225Value).toContain("38");
    expect(n225Value).toContain(".08");
  });

  it("should color-code positive changes green and negative changes red (Req 10.3)", () => {
    render(<WorldMarkets data={mockData} />);

    // Positive: SPX (+0.87%)
    const spxChange = screen.getByTestId("change-SPX");
    expect(spxChange.className).toContain("text-emerald-800");

    // Negative: DJI (-0.31%)
    const djiChange = screen.getByTestId("change-DJI");
    expect(djiChange.className).toContain("text-rose-800");

    // Negative: FTSE (-0.27%)
    const ftseChange = screen.getByTestId("change-FTSE");
    expect(ftseChange.className).toContain("text-rose-800");

    // Positive: N225 (+0.81%)
    const n225Change = screen.getByTestId("change-N225");
    expect(n225Change.className).toContain("text-emerald-800");
  });

  it("should show loading state when fetching data", () => {
    vi.mocked(global.fetch).mockImplementation(
      () => new Promise(() => {}) // never resolves
    );
    render(<WorldMarkets />);
    expect(screen.getByTestId("world-markets-loading")).toBeDefined();
  });

  it("should show error state on fetch failure with retry button", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: "API error" }),
    });

    render(<WorldMarkets />);

    await waitFor(() => {
      expect(screen.getByTestId("world-markets-error")).toBeDefined();
      expect(screen.getByText("Try again")).toBeDefined();
    });
  });

  it("should fetch data from API when no data prop is provided", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockData }),
    });

    render(<WorldMarkets />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/market/world-markets");
      expect(screen.getByTestId("region-Americas")).toBeDefined();
    });
  });

  it("should not fetch when data prop is provided", () => {
    render(<WorldMarkets data={mockData} />);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should return null when data is an empty array", () => {
    const { container } = render(<WorldMarkets data={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("should group indices with unknown region into Americas bucket", () => {
    const dataWithUnknownRegion: MarketIndex[] = [
      {
        name: "Mystery Index",
        symbol: "MYS",
        value: 1000.0,
        change: 5.0,
        changePercent: 0.5,
        region: "Unknown" as unknown as MarketIndex["region"],
      },
    ];

    render(<WorldMarkets data={dataWithUnknownRegion} />);
    const americasRegion = screen.getByTestId("region-Americas");
    expect(americasRegion).toBeDefined();
    expect(screen.getByTestId("index-MYS")).toBeDefined();
    expect(screen.getByText("Mystery Index")).toBeDefined();
  });
});
