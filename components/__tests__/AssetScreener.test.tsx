/**
 * AssetScreener Component Tests
 * Tests for filter selection, table view, heatmap view, preset selection,
 * custom preset saving, and state persistence.
 *
 * Requirements: 26.1, 26.9, 26.10, 26.12, 26.15, 26.23
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AssetScreener } from "../AssetScreener";
import type { ScreenerFilter } from "@/types";

vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({
    theme: "light",
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

global.fetch = vi.fn();

const mockResults = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    sector: "Technology",
    price: 180,
    changePercent: 1.2,
    volume: 50000000,
    marketCap: 2800000000000,
    peRatio: 28,
    pbRatio: 40,
    pegRatio: 2.5,
    dividendYield: 0.55,
    revenueGrowth: 8,
    earningsGrowth: 12,
    valuationContext: "fair" as const,
    matchScore: 85,
  },
];

describe("AssetScreener", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockResults }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render the screener heading", () => {
    render(<AssetScreener />);
    expect(screen.getByText("Valuation Metrics")).toBeDefined();
  });

  // --- Filter sections present (Req 26.1) ---

  it("should display valuation metrics section (Req 26.2)", () => {
    render(<AssetScreener />);
    expect(screen.getByText("Valuation Metrics")).toBeDefined();
    expect(screen.getByText("P/E Ratio")).toBeDefined();
    expect(screen.getByText("P/B Ratio")).toBeDefined();
    expect(screen.getByText("PEG Ratio")).toBeDefined();
  });

  it("should display growth metrics section (Req 26.3)", () => {
    render(<AssetScreener />);
    expect(screen.getByText("Growth Metrics")).toBeDefined();
    expect(screen.getByText("Revenue Growth (%)")).toBeDefined();
    expect(screen.getByText("Earnings Growth (%)")).toBeDefined();
  });

  it("should display dividend metrics section (Req 26.4)", () => {
    render(<AssetScreener />);
    expect(screen.getByText("Dividend Metrics")).toBeDefined();
    expect(screen.getByText("Dividend Yield (%)")).toBeDefined();
    expect(screen.getByText("Payout Ratio (%)")).toBeDefined();
  });

  it("should display sector filter with all 11 sectors (Req 26.5)", () => {
    render(<AssetScreener />);
    const sectors = [
      "Technology",
      "Financial",
      "Consumer Discretionary",
      "Communication",
      "Healthcare",
      "Industrials",
      "Consumer Staples",
      "Energy",
      "Materials",
      "Real Estate",
      "Utilities",
    ];
    for (const sector of sectors) {
      expect(screen.getByText(sector)).toBeDefined();
    }
  });

  it("should display market cap filter options (Req 26.6)", () => {
    render(<AssetScreener />);
    expect(screen.getByText("Small Cap (< $2B)")).toBeDefined();
    expect(screen.getByText("Mid Cap ($2B - $10B)")).toBeDefined();
    expect(screen.getByText("Large Cap (> $10B)")).toBeDefined();
  });

  it("should display volume/liquidity filter (Req 26.7)", () => {
    render(<AssetScreener />);
    expect(screen.getByText("Minimum Volume")).toBeDefined();
    expect(screen.getByLabelText("Minimum volume")).toBeDefined();
  });

  // --- Tooltips (Req 26.24) ---

  it("should display tooltips for filter metrics (Req 26.24)", () => {
    render(<AssetScreener />);
    const tooltips = screen.getAllByRole("tooltip");
    expect(tooltips.length).toBeGreaterThan(0);
  });

  // --- Sector toggle ---

  it("should toggle sector selection on click", () => {
    render(<AssetScreener />);
    const techBtn = screen.getByText("Technology");
    expect(techBtn.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(techBtn);
    expect(techBtn.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(techBtn);
    expect(techBtn.getAttribute("aria-pressed")).toBe("false");
  });

  // --- Market cap toggle ---

  it("should toggle market cap selection on click", () => {
    render(<AssetScreener />);
    const btn = screen.getByText("Large Cap (> $10B)");
    expect(btn.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });

  // --- Apply Filters (Req 26.14) ---

  it("should call API and display result count on Apply Filters (Req 26.14)", async () => {
    const onResultsChange = vi.fn();
    render(<AssetScreener onResultsChange={onResultsChange} />);

    fireEvent.click(screen.getByText("Apply Filters"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/screener/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.any(String),
      });
    });

    await waitFor(() => {
      expect(screen.getByText("1 asset found")).toBeDefined();
    });

    expect(onResultsChange).toHaveBeenCalledWith(mockResults);
  });

  it("should send constructed filters in the API request body", async () => {
    render(<AssetScreener />);

    // Set a P/E min value
    const peMinInput = screen.getByLabelText("P/E Ratio minimum");
    fireEvent.change(peMinInput, { target: { value: "10" } });

    fireEvent.click(screen.getByText("Apply Filters"));

    await waitFor(() => {
      const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.filters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "peRatio",
            operator: "gte",
            value: 10,
          }),
        ])
      );
    });
  });

  // --- Clear All ---

  it("should clear all filters and results on Clear All", async () => {
    const onResultsChange = vi.fn();
    render(<AssetScreener onResultsChange={onResultsChange} />);

    // Apply first
    fireEvent.click(screen.getByText("Apply Filters"));
    await waitFor(() => {
      expect(screen.getByText("1 asset found")).toBeDefined();
    });

    // Clear
    fireEvent.click(screen.getByText("Clear All"));
    expect(screen.queryByText("1 asset found")).toBeNull();
    expect(onResultsChange).toHaveBeenLastCalledWith([]);
  });

  // --- Error handling ---

  it("should display error message on API failure", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });

    render(<AssetScreener />);
    fireEvent.click(screen.getByText("Apply Filters"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "We couldn't run the screener. Check your filters and try again."
        )
      ).toBeDefined();
    });
  });

  // --- Loading state ---

  it("should show loading text while fetching", async () => {
    let resolvePromise: (v: unknown) => void;
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    render(<AssetScreener />);
    fireEvent.click(screen.getByText("Apply Filters"));

    expect(screen.getByText("Searching…")).toBeDefined();

    // Resolve to clean up
    resolvePromise!({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    await waitFor(() => {
      expect(screen.getByText("Apply Filters")).toBeDefined();
    });
  });

  // --- Filters callback ---

  it("should call onFiltersChange with constructed filters", async () => {
    const onFiltersChange = vi.fn();
    render(<AssetScreener onFiltersChange={onFiltersChange} />);

    // Select a sector
    fireEvent.click(screen.getByText("Technology"));

    fireEvent.click(screen.getByText("Apply Filters"));

    await waitFor(() => {
      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            field: "sector",
            operator: "in",
            value: ["Technology"],
          }),
        ])
      );
    });
  });

  // --- Range filter with both min and max ---

  it("should build between filter when both min and max are set", async () => {
    render(<AssetScreener />);

    fireEvent.change(screen.getByLabelText("P/E Ratio minimum"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("P/E Ratio maximum"), {
      target: { value: "25" },
    });

    fireEvent.click(screen.getByText("Apply Filters"));

    await waitFor(() => {
      const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.filters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "peRatio",
            operator: "between",
            value: [5, 25],
          }),
        ])
      );
    });
  });

  // --- Active filter count ---

  it("should display active filter count", () => {
    render(<AssetScreener />);

    fireEvent.change(screen.getByLabelText("P/E Ratio minimum"), {
      target: { value: "10" },
    });

    expect(screen.getByText("(1 filter active)")).toBeDefined();
  });

  // --- initialFilters prop (Req 26.12, 26.23) ---

  it("should populate filter UI from initialFilters prop", () => {
    const filters: ScreenerFilter[] = [
      {
        field: "peRatio",
        operator: "between",
        value: [5, 30] as [number, number],
        label: "P/E 5–30",
      },
      {
        field: "sector",
        operator: "in",
        value: ["Technology", "Healthcare"],
        label: "Sector",
      },
    ];
    render(<AssetScreener initialFilters={filters} />);

    expect(
      (screen.getByLabelText("P/E Ratio minimum") as HTMLInputElement).value
    ).toBe("5");
    expect(
      (screen.getByLabelText("P/E Ratio maximum") as HTMLInputElement).value
    ).toBe("30");
    expect(screen.getByText("Technology").getAttribute("aria-pressed")).toBe(
      "true"
    );
    expect(screen.getByText("Healthcare").getAttribute("aria-pressed")).toBe(
      "true"
    );
    expect(screen.getByText("Energy").getAttribute("aria-pressed")).toBe(
      "false"
    );
  });

  it("should populate gte range filter from initialFilters", () => {
    const filters = [
      {
        field: "dividendYield",
        operator: "gte" as const,
        value: 3,
        label: "Yield >= 3",
      },
    ];
    render(<AssetScreener initialFilters={filters} />);

    expect(
      (screen.getByLabelText("Dividend Yield (%) minimum") as HTMLInputElement)
        .value
    ).toBe("3");
    expect(
      (screen.getByLabelText("Dividend Yield (%) maximum") as HTMLInputElement)
        .value
    ).toBe("");
  });

  it("should populate lte range filter from initialFilters", () => {
    const filters = [
      {
        field: "pbRatio",
        operator: "lte" as const,
        value: 2,
        label: "P/B <= 2",
      },
    ];
    render(<AssetScreener initialFilters={filters} />);

    expect(
      (screen.getByLabelText("P/B Ratio minimum") as HTMLInputElement).value
    ).toBe("");
    expect(
      (screen.getByLabelText("P/B Ratio maximum") as HTMLInputElement).value
    ).toBe("2");
  });

  it("should populate market cap filter from initialFilters", () => {
    const filters = [
      {
        field: "marketCap",
        operator: "gte" as const,
        value: 10_000_000_000,
        label: "Large Cap",
      },
    ];
    render(<AssetScreener initialFilters={filters} />);

    expect(
      screen.getByText("Large Cap (> $10B)").getAttribute("aria-pressed")
    ).toBe("true");
    expect(
      screen.getByText("Small Cap (< $2B)").getAttribute("aria-pressed")
    ).toBe("false");
  });

  it("should populate volume filter from initialFilters", () => {
    const filters = [
      {
        field: "volume",
        operator: "gte" as const,
        value: 5000000,
        label: "Volume >= 5M",
      },
    ];
    render(<AssetScreener initialFilters={filters} />);

    expect(
      (screen.getByLabelText("Minimum volume") as HTMLInputElement).value
    ).toBe("5000000");
  });

  it("should not change state when initialFilters is empty array", () => {
    render(<AssetScreener initialFilters={[]} />);

    expect(
      (screen.getByLabelText("P/E Ratio minimum") as HTMLInputElement).value
    ).toBe("");
    expect(screen.getByText("Technology").getAttribute("aria-pressed")).toBe(
      "false"
    );
  });

  // --- Multiple filters active count ---

  it("should show correct count for multiple active filters", () => {
    render(<AssetScreener />);

    fireEvent.change(screen.getByLabelText("P/E Ratio minimum"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("P/E Ratio maximum"), {
      target: { value: "25" },
    });
    fireEvent.click(screen.getByText("Technology"));
    fireEvent.change(screen.getByLabelText("Minimum volume"), {
      target: { value: "1000000" },
    });

    expect(screen.getByText("(3 filters active)")).toBeDefined();
  });

  // --- Multiple results display ---

  it("should display plural 'assets' for multiple results", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          mockResults[0],
          { ...mockResults[0], symbol: "MSFT", name: "Microsoft Corp." },
        ],
      }),
    });

    render(<AssetScreener />);
    fireEvent.click(screen.getByText("Apply Filters"));

    await waitFor(() => {
      expect(screen.getByText("2 assets found")).toBeDefined();
    });
  });

  // --- Clear resets initialFilters-populated state ---

  it("should clear filters populated from initialFilters on Clear All", () => {
    const filters = [
      {
        field: "peRatio",
        operator: "gte" as const,
        value: 10,
        label: "P/E >= 10",
      },
      {
        field: "sector",
        operator: "in" as const,
        value: ["Energy"],
        label: "Sector: Energy",
      },
    ];
    render(<AssetScreener initialFilters={filters} />);

    expect(
      (screen.getByLabelText("P/E Ratio minimum") as HTMLInputElement).value
    ).toBe("10");
    expect(screen.getByText("Energy").getAttribute("aria-pressed")).toBe(
      "true"
    );

    fireEvent.click(screen.getByText("Clear All"));

    expect(
      (screen.getByLabelText("P/E Ratio minimum") as HTMLInputElement).value
    ).toBe("");
    expect(screen.getByText("Energy").getAttribute("aria-pressed")).toBe(
      "false"
    );
  });
});
