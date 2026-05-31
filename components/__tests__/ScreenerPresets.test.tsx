/**
 * ScreenerPresets Component Tests
 * Tests for preset fetching, selection, highlighting, custom preset saving,
 * and custom badge display.
 *
 * Requirements: 26.12, 26.13, 26.15
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ScreenerPresets } from "../ScreenerPresets";
import type { ScreenerFilter, ScreenerPreset } from "@/types";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockPresets: ScreenerPreset[] = [
  {
    id: "most-active-penny-stocks",
    name: "Most Active Penny Stocks",
    description: "Stocks under $5 with high trading volume",
    filters: [
      { field: "price", operator: "lt", value: 5, label: "Price < $5" },
      {
        field: "volume",
        operator: "gte",
        value: 1_000_000,
        label: "Volume >= 1M",
      },
    ],
    isDefault: true,
    createdAt: new Date(),
  },
  {
    id: "undervalued-growth-stocks",
    name: "Undervalued Growth Stocks",
    description: "Low P/E with strong earnings growth",
    filters: [
      { field: "peRatio", operator: "lt", value: 15, label: "P/E < 15" },
      {
        field: "earningsGrowth",
        operator: "gt",
        value: 10,
        label: "Earnings Growth > 10%",
      },
    ],
    isDefault: true,
    createdAt: new Date(),
  },
  {
    id: "day-gainers",
    name: "Day Gainers",
    description: "Stocks with the highest daily gains",
    filters: [
      {
        field: "changePercent",
        operator: "gt",
        value: 3,
        label: "Change > 3%",
      },
    ],
    isDefault: true,
    createdAt: new Date(),
  },
  {
    id: "most-shorted-stocks",
    name: "Most Shorted Stocks",
    description: "Heavily shorted stocks with high volume",
    filters: [
      {
        field: "volume",
        operator: "gte",
        value: 5_000_000,
        label: "Volume >= 5M",
      },
      {
        field: "changePercent",
        operator: "lt",
        value: 0,
        label: "Change < 0%",
      },
    ],
    isDefault: true,
    createdAt: new Date(),
  },
  {
    id: "undervalued-large-caps",
    name: "Undervalued Large Caps",
    description: "Large cap stocks with low valuation ratios",
    filters: [
      {
        field: "marketCap",
        operator: "gte",
        value: 10_000_000_000,
        label: "Market Cap >= $10B",
      },
      { field: "peRatio", operator: "lt", value: 20, label: "P/E < 20" },
    ],
    isDefault: true,
    createdAt: new Date(),
  },
  {
    id: "aggressive-small-caps",
    name: "Aggressive Small Caps",
    description: "Small cap stocks with high growth potential",
    filters: [
      {
        field: "marketCap",
        operator: "lt",
        value: 2_000_000_000,
        label: "Market Cap < $2B",
      },
      {
        field: "changePercent",
        operator: "gt",
        value: 1,
        label: "Change > 1%",
      },
    ],
    isDefault: true,
    createdAt: new Date(),
  },
  {
    id: "high-dividend-yield",
    name: "High Dividend Yield",
    description: "Stocks with above-average dividend yields",
    filters: [
      {
        field: "dividendYield",
        operator: "gt",
        value: 3,
        label: "Dividend Yield > 3%",
      },
    ],
    isDefault: true,
    createdAt: new Date(),
  },
];

const sampleFilters: ScreenerFilter[] = [
  { field: "peRatio", operator: "lt", value: 20, label: "P/E < 20" },
];

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetchPresets() {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, data: mockPresets }),
  });
}

function mockFetchPresetsError() {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: false,
    json: async () => ({ success: false }),
  });
}

function mockSavePreset(preset: Partial<ScreenerPreset> = {}) {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      success: true,
      data: {
        id: "custom-my-preset",
        name: "My Preset",
        description: "Test",
        filters: sampleFilters,
        isDefault: false,
        createdAt: new Date(),
        ...preset,
      },
    }),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ScreenerPresets", () => {
  // --- Loading state ---

  it("should show loading state initially", () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      new Promise(() => {})
    );
    render(<ScreenerPresets currentFilters={[]} onPresetSelect={vi.fn()} />);
    expect(screen.getByTestId("presets-loading")).toBeDefined();
  });

  // --- Fetching presets (Req 26.12) ---

  it("should fetch and display all 7 default presets", async () => {
    mockFetchPresets();
    render(<ScreenerPresets currentFilters={[]} onPresetSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("screener-presets")).toBeDefined();
    });

    expect(screen.getByText("Most Active Penny Stocks")).toBeDefined();
    expect(screen.getByText("Undervalued Growth Stocks")).toBeDefined();
    expect(screen.getByText("Day Gainers")).toBeDefined();
    expect(screen.getByText("Most Shorted Stocks")).toBeDefined();
    expect(screen.getByText("Undervalued Large Caps")).toBeDefined();
    expect(screen.getByText("Aggressive Small Caps")).toBeDefined();
    expect(screen.getByText("High Dividend Yield")).toBeDefined();
  });

  it("should call GET /api/screener/presets on mount", async () => {
    mockFetchPresets();
    render(<ScreenerPresets currentFilters={[]} onPresetSelect={vi.fn()} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/screener/presets");
    });
  });

  // --- Error handling ---

  it("should display error when fetch fails", async () => {
    mockFetchPresetsError();
    render(<ScreenerPresets currentFilters={[]} onPresetSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("presets-error")).toBeDefined();
    });
  });

  // --- Preset selection (Req 26.13) ---

  it("should call onPresetSelect when a preset is clicked", async () => {
    mockFetchPresets();
    const onPresetSelect = vi.fn();
    render(
      <ScreenerPresets currentFilters={[]} onPresetSelect={onPresetSelect} />
    );

    await waitFor(() => {
      expect(screen.getByText("Day Gainers")).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("preset-day-gainers"));

    expect(onPresetSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "day-gainers",
        name: "Day Gainers",
      })
    );
  });

  // --- Highlight selected preset ---

  it("should highlight the selected preset with aria-pressed", async () => {
    mockFetchPresets();
    render(<ScreenerPresets currentFilters={[]} onPresetSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Day Gainers")).toBeDefined();
    });

    const btn = screen.getByTestId("preset-day-gainers");
    expect(btn.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });

  it("should deselect previous preset when a new one is clicked", async () => {
    mockFetchPresets();
    render(<ScreenerPresets currentFilters={[]} onPresetSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Day Gainers")).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("preset-day-gainers"));
    fireEvent.click(screen.getByTestId("preset-most-active-penny-stocks"));

    expect(
      screen.getByTestId("preset-day-gainers").getAttribute("aria-pressed")
    ).toBe("false");
    expect(
      screen
        .getByTestId("preset-most-active-penny-stocks")
        .getAttribute("aria-pressed")
    ).toBe("true");
  });

  // --- Save current filters (Req 26.15) ---

  it("should disable save button when no filters are active", async () => {
    mockFetchPresets();
    render(<ScreenerPresets currentFilters={[]} onPresetSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("save-preset-btn")).toBeDefined();
    });

    expect(
      (screen.getByTestId("save-preset-btn") as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it("should enable save button when filters are active", async () => {
    mockFetchPresets();
    render(
      <ScreenerPresets
        currentFilters={sampleFilters}
        onPresetSelect={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("save-preset-btn")).toBeDefined();
    });

    expect(
      (screen.getByTestId("save-preset-btn") as HTMLButtonElement).disabled
    ).toBe(false);
  });

  it("should show save form when save button is clicked", async () => {
    mockFetchPresets();
    render(
      <ScreenerPresets
        currentFilters={sampleFilters}
        onPresetSelect={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("save-preset-btn")).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("save-preset-btn"));
    expect(screen.getByTestId("save-preset-form")).toBeDefined();
    expect(screen.getByTestId("preset-name-input")).toBeDefined();
    expect(screen.getByTestId("preset-description-input")).toBeDefined();
  });

  it("should hide save form when cancel is clicked", async () => {
    mockFetchPresets();
    render(
      <ScreenerPresets
        currentFilters={sampleFilters}
        onPresetSelect={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("save-preset-btn")).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("save-preset-btn"));
    fireEvent.click(screen.getByTestId("save-preset-cancel"));

    expect(screen.queryByTestId("save-preset-form")).toBeNull();
  });

  it("should POST to /api/screener/presets and add custom preset", async () => {
    mockFetchPresets();
    render(
      <ScreenerPresets
        currentFilters={sampleFilters}
        onPresetSelect={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("save-preset-btn")).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("save-preset-btn"));

    fireEvent.change(screen.getByTestId("preset-name-input"), {
      target: { value: "My Preset" },
    });
    fireEvent.change(screen.getByTestId("preset-description-input"), {
      target: { value: "Test description" },
    });

    mockSavePreset();
    fireEvent.click(screen.getByTestId("save-preset-confirm"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/screener/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "My Preset",
          description: "Test description",
          filters: sampleFilters,
        }),
      });
    });

    // Custom preset should appear in the list
    await waitFor(() => {
      expect(screen.getByText("My Preset")).toBeDefined();
    });
  });

  // --- Custom badge ---

  it("should show Custom badge on user-saved presets", async () => {
    mockFetchPresets();
    render(
      <ScreenerPresets
        currentFilters={sampleFilters}
        onPresetSelect={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("save-preset-btn")).toBeDefined();
    });

    // Save a custom preset
    fireEvent.click(screen.getByTestId("save-preset-btn"));
    fireEvent.change(screen.getByTestId("preset-name-input"), {
      target: { value: "My Preset" },
    });

    mockSavePreset();
    fireEvent.click(screen.getByTestId("save-preset-confirm"));

    await waitFor(() => {
      expect(screen.getByTestId("custom-badge-custom-my-preset")).toBeDefined();
    });

    expect(
      screen.getByTestId("custom-badge-custom-my-preset").textContent
    ).toBe("Custom");
  });

  // --- Default presets should NOT have custom badge ---

  it("should not show Custom badge on default presets", async () => {
    mockFetchPresets();
    render(<ScreenerPresets currentFilters={[]} onPresetSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Day Gainers")).toBeDefined();
    });

    expect(screen.queryByTestId("custom-badge-day-gainers")).toBeNull();
  });

  // --- Save button disabled when name is empty ---

  it("should disable save confirm when name is empty", async () => {
    mockFetchPresets();
    render(
      <ScreenerPresets
        currentFilters={sampleFilters}
        onPresetSelect={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("save-preset-btn")).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("save-preset-btn"));

    expect(
      (screen.getByTestId("save-preset-confirm") as HTMLButtonElement).disabled
    ).toBe(true);
  });
});
