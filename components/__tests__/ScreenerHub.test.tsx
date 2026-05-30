/**
 * ScreenerHub Component Tests
 * Tests for view mode toggle, shared results state, composition
 * of AssetScreener + ScreenerTableView + ScreenerHeatmapView,
 * and filter state persistence via localStorage, and auto-refresh.
 *
 * Requirements: 26.10, 26.11, 26.17, 26.23, 26.25
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ScreenerHub } from "../ScreenerHub";
import type { ScreenerFilter, ScreenerResult } from "@/types";

vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

// ---------------------------------------------------------------------------
// Capture callbacks from AssetScreener so we can simulate filter/result flow.
// ---------------------------------------------------------------------------

let capturedOnResultsChange: ((results: ScreenerResult[]) => void) | undefined;
let capturedOnFiltersChange: ((filters: ScreenerFilter[]) => void) | undefined;
let capturedInitialFilters: ScreenerFilter[] | undefined;

vi.mock("../AssetScreener", () => ({
  AssetScreener: (props: {
    onResultsChange?: (r: ScreenerResult[]) => void;
    onFiltersChange?: (f: ScreenerFilter[]) => void;
    initialFilters?: ScreenerFilter[];
  }) => {
    capturedOnResultsChange = props.onResultsChange;
    capturedOnFiltersChange = props.onFiltersChange;
    capturedInitialFilters = props.initialFilters;
    return <div data-testid="mock-asset-screener">AssetScreener</div>;
  },
}));

vi.mock("../ScreenerPresets", () => ({
  ScreenerPresets: () => (
    <div data-testid="mock-screener-presets">ScreenerPresets</div>
  ),
}));

vi.mock("../ScreenerTableView", () => ({
  ScreenerTableView: (props: {
    results: ScreenerResult[];
    onSymbolClick?: (s: string) => void;
  }) => (
    <div data-testid="mock-table-view">
      <span data-testid="table-count">{props.results.length}</span>
      {props.results.map((r) => (
        <button
          key={r.symbol}
          data-testid={`table-row-${r.symbol}`}
          onClick={() => props.onSymbolClick?.(r.symbol)}
        >
          {r.symbol}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../ScreenerHeatmapView", () => ({
  ScreenerHeatmapView: (props: {
    results: ScreenerResult[];
    onSymbolClick?: (s: string) => void;
  }) => (
    <div data-testid="mock-heatmap-view">
      <span data-testid="heatmap-count">{props.results.length}</span>
      {props.results.map((r) => (
        <button
          key={r.symbol}
          data-testid={`heatmap-tile-${r.symbol}`}
          onClick={() => props.onSymbolClick?.(r.symbol)}
        >
          {r.symbol}
        </button>
      ))}
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResult(overrides: Partial<ScreenerResult> = {}): ScreenerResult {
  return {
    symbol: "AAPL",
    name: "Apple Inc.",
    sector: "Technology",
    price: 180.5,
    changePercent: 1.25,
    volume: 50_000_000,
    marketCap: 2_800_000_000_000,
    valuationContext: "fair",
    matchScore: 85,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ScreenerHub", () => {
  beforeEach(() => {
    vi.useFakeTimers();

    // Replace the global localStorage mock (from vitest.setup.ts) with a
    // working in-memory implementation so persistence tests function.
    const store: Record<string, string> = {};
    const storageMock: Storage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
      get length() {
        return Object.keys(store).length;
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
    };
    Object.defineProperty(globalThis, "localStorage", {
      value: storageMock,
      writable: true,
      configurable: true,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    capturedOnResultsChange = undefined;
    capturedOnFiltersChange = undefined;
    capturedInitialFilters = undefined;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // --- Composition ---

  it("should render AssetScreener", () => {
    render(<ScreenerHub />);
    expect(screen.getByTestId("mock-asset-screener")).toBeDefined();
  });

  it("should render the view toggle buttons", () => {
    render(<ScreenerHub />);
    expect(screen.getByTestId("view-toggle-table")).toBeDefined();
    expect(screen.getByTestId("view-toggle-heatmap")).toBeDefined();
  });

  it("should render wrapper with data-testid", () => {
    render(<ScreenerHub />);
    expect(screen.getByTestId("screener-hub")).toBeDefined();
  });

  // --- Default view mode ---

  it("should show table view by default", () => {
    render(<ScreenerHub />);
    expect(screen.getByTestId("mock-table-view")).toBeDefined();
    expect(screen.queryByTestId("mock-heatmap-view")).toBeNull();
  });

  it("should mark Table tab as selected by default", () => {
    render(<ScreenerHub />);
    const tableTab = screen.getByTestId("view-toggle-table");
    expect(tableTab.getAttribute("aria-selected")).toBe("true");
    const heatmapTab = screen.getByTestId("view-toggle-heatmap");
    expect(heatmapTab.getAttribute("aria-selected")).toBe("false");
  });

  // --- Toggle between views (Req 26.11) ---

  it("should switch to heatmap view when Heatmap tab is clicked", () => {
    render(<ScreenerHub />);

    fireEvent.click(screen.getByTestId("view-toggle-heatmap"));

    expect(screen.getByTestId("mock-heatmap-view")).toBeDefined();
    expect(screen.queryByTestId("mock-table-view")).toBeNull();
  });

  it("should switch back to table view when Table tab is clicked", () => {
    render(<ScreenerHub />);

    fireEvent.click(screen.getByTestId("view-toggle-heatmap"));
    fireEvent.click(screen.getByTestId("view-toggle-table"));

    expect(screen.getByTestId("mock-table-view")).toBeDefined();
    expect(screen.queryByTestId("mock-heatmap-view")).toBeNull();
  });

  it("should update aria-selected when switching views", () => {
    render(<ScreenerHub />);

    fireEvent.click(screen.getByTestId("view-toggle-heatmap"));

    expect(
      screen.getByTestId("view-toggle-heatmap").getAttribute("aria-selected")
    ).toBe("true");
    expect(
      screen.getByTestId("view-toggle-table").getAttribute("aria-selected")
    ).toBe("false");
  });

  // --- Shared results state ---

  it("should pass results from AssetScreener to the active view", () => {
    render(<ScreenerHub />);

    const results = [
      makeResult({ symbol: "AAPL" }),
      makeResult({ symbol: "MSFT" }),
    ];

    act(() => {
      capturedOnResultsChange?.(results);
    });

    expect(screen.getByTestId("table-count").textContent).toBe("2");
  });

  it("should pass results to heatmap view after toggle", () => {
    render(<ScreenerHub />);

    const results = [makeResult({ symbol: "GOOG" })];

    act(() => {
      capturedOnResultsChange?.(results);
    });

    fireEvent.click(screen.getByTestId("view-toggle-heatmap"));

    expect(screen.getByTestId("heatmap-count").textContent).toBe("1");
    expect(screen.getByTestId("heatmap-tile-GOOG")).toBeDefined();
  });

  // --- onSymbolClick passthrough ---

  it("should pass onSymbolClick to table view", () => {
    const onClick = vi.fn();
    render(<ScreenerHub onSymbolClick={onClick} />);

    const results = [makeResult({ symbol: "TSLA" })];
    act(() => {
      capturedOnResultsChange?.(results);
    });

    fireEvent.click(screen.getByTestId("table-row-TSLA"));
    expect(onClick).toHaveBeenCalledWith("TSLA");
  });

  it("should pass onSymbolClick to heatmap view", () => {
    const onClick = vi.fn();
    render(<ScreenerHub onSymbolClick={onClick} />);

    const results = [makeResult({ symbol: "NVDA" })];
    act(() => {
      capturedOnResultsChange?.(results);
    });

    fireEvent.click(screen.getByTestId("view-toggle-heatmap"));
    fireEvent.click(screen.getByTestId("heatmap-tile-NVDA"));
    expect(onClick).toHaveBeenCalledWith("NVDA");
  });

  // --- Tablist accessibility ---

  it("should have a tablist role on the toggle container", () => {
    render(<ScreenerHub />);
    expect(screen.getByRole("tablist")).toBeDefined();
  });

  it("should have tab roles on toggle buttons", () => {
    render(<ScreenerHub />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
  });

  // --- Filter state persistence (Req 26.23) ---

  it("should save filters to localStorage when filters change", () => {
    render(<ScreenerHub />);

    expect(capturedOnFiltersChange).toBeDefined();

    const filters: ScreenerFilter[] = [
      {
        field: "peRatio",
        operator: "lte",
        value: 20,
        label: "P/E Ratio <= 20",
      },
    ];

    act(() => {
      capturedOnFiltersChange!(filters);
    });

    const stored = localStorage.getItem("screener-filters");
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toEqual(filters);
  });

  it("should restore filters from localStorage on mount", async () => {
    const filters: ScreenerFilter[] = [
      {
        field: "sector",
        operator: "in",
        value: ["Technology"],
        label: "Sector: Technology",
      },
    ];
    localStorage.setItem("screener-filters", JSON.stringify(filters));

    await act(async () => {
      render(<ScreenerHub />);
    });

    expect(capturedInitialFilters).toEqual(filters);
  });

  it("should remove localStorage key when filters are cleared", () => {
    localStorage.setItem(
      "screener-filters",
      JSON.stringify([
        { field: "peRatio", operator: "lte", value: 15, label: "P/E <= 15" },
      ])
    );

    render(<ScreenerHub />);

    act(() => {
      capturedOnFiltersChange?.([]);
    });

    expect(localStorage.getItem("screener-filters")).toBeNull();
  });

  it("should handle invalid JSON in localStorage gracefully", () => {
    localStorage.setItem("screener-filters", "not-valid-json{{{");

    // Should not throw
    expect(() => render(<ScreenerHub />)).not.toThrow();
    // initialFilters should remain undefined (no restored filters)
    expect(capturedInitialFilters).toBeUndefined();
  });

  it("should handle missing localStorage data gracefully", () => {
    // localStorage is empty — no key set
    render(<ScreenerHub />);
    expect(capturedInitialFilters).toBeUndefined();
  });

  it("should handle localStorage errors on save gracefully", () => {
    // Override localStorage.setItem to throw
    const original = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error("QuotaExceededError");
    };

    render(<ScreenerHub />);

    const filters: ScreenerFilter[] = [
      {
        field: "volume",
        operator: "gte",
        value: 1000000,
        label: "Volume >= 1,000,000",
      },
    ];

    // Should not throw even when localStorage.setItem fails
    expect(() => {
      act(() => {
        capturedOnFiltersChange?.(filters);
      });
    }).not.toThrow();

    localStorage.setItem = original;
  });

  // --- Auto-refresh (Req 26.25) ---

  it("should auto-refresh results when filters are active", async () => {
    const refreshedResults = [makeResult({ symbol: "REFRESHED" })];
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: refreshedResults }),
    });

    render(<ScreenerHub refreshInterval={5000} />);

    // Set active filters
    act(() => {
      capturedOnFiltersChange?.([
        { field: "peRatio", operator: "lte", value: 20, label: "P/E <= 20" },
      ]);
    });

    // Advance past the refresh interval
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/screener/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: expect.any(String),
    });
  });

  it("should not auto-refresh when no filters are active", async () => {
    render(<ScreenerHub refreshInterval={5000} />);

    // No filters set — fetch should not be called on interval
    const callsBefore = (global.fetch as ReturnType<typeof vi.fn>).mock.calls
      .length;

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    const callsAfter = (global.fetch as ReturnType<typeof vi.fn>).mock.calls
      .length;
    expect(callsAfter).toBe(callsBefore);
  });

  it("should not auto-refresh when refreshInterval is 0", async () => {
    render(<ScreenerHub refreshInterval={0} />);

    act(() => {
      capturedOnFiltersChange?.([
        { field: "peRatio", operator: "lte", value: 20, label: "P/E <= 20" },
      ]);
    });

    const callsBefore = (global.fetch as ReturnType<typeof vi.fn>).mock.calls
      .length;

    await act(async () => {
      vi.advanceTimersByTime(60000);
    });

    const callsAfter = (global.fetch as ReturnType<typeof vi.fn>).mock.calls
      .length;
    expect(callsAfter).toBe(callsBefore);
  });

  it("should clear interval on unmount", async () => {
    const { unmount } = render(<ScreenerHub refreshInterval={5000} />);

    act(() => {
      capturedOnFiltersChange?.([
        { field: "peRatio", operator: "lte", value: 20, label: "P/E <= 20" },
      ]);
    });

    unmount();

    const callsBefore = (global.fetch as ReturnType<typeof vi.fn>).mock.calls
      .length;

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    const callsAfter = (global.fetch as ReturnType<typeof vi.fn>).mock.calls
      .length;
    expect(callsAfter).toBe(callsBefore);
  });

  it("should handle auto-refresh fetch errors gracefully", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error")
    );

    render(<ScreenerHub refreshInterval={5000} />);

    act(() => {
      capturedOnFiltersChange?.([
        { field: "peRatio", operator: "lte", value: 20, label: "P/E <= 20" },
      ]);
    });

    // Should not throw
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    // Component should still be rendered
    expect(screen.getByTestId("screener-hub")).toBeDefined();
  });
});
