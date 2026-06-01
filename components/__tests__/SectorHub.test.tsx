/**
 * SectorHub Component Tests
 * Tests for sector display, comparison view, time period selection, sorting
 *
 * Requirements: 23.1, 23.5, 23.7, 23.12
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SectorHub } from "../SectorHub";
import { SectorData } from "@/types";

vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({
    theme: "light",
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

global.fetch = vi.fn();

const mockData: SectorData[] = [
  {
    sector: "Technology",
    performance: 180.5,
    changePercent: 1.25,
    constituents: 0,
  },
  {
    sector: "Financial",
    performance: 42.3,
    changePercent: -0.45,
    constituents: 0,
  },
  {
    sector: "Healthcare",
    performance: 140.1,
    changePercent: 0.78,
    constituents: 0,
  },
  { sector: "Energy", performance: 88.9, changePercent: -1.1, constituents: 0 },
  {
    sector: "Consumer Discretionary",
    performance: 195.2,
    changePercent: 0.32,
    constituents: 0,
  },
  {
    sector: "Communication",
    performance: 82.4,
    changePercent: 0.55,
    constituents: 0,
  },
  {
    sector: "Industrials",
    performance: 120.7,
    changePercent: 0.15,
    constituents: 0,
  },
  {
    sector: "Consumer Staples",
    performance: 78.3,
    changePercent: -0.22,
    constituents: 0,
  },
  {
    sector: "Materials",
    performance: 85.6,
    changePercent: 0.68,
    constituents: 0,
  },
  {
    sector: "Real Estate",
    performance: 40.1,
    changePercent: -0.9,
    constituents: 0,
  },
  {
    sector: "Utilities",
    performance: 70.2,
    changePercent: 0.1,
    constituents: 0,
  },
];

describe("SectorHub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should display all 11 sectors (Req 23.1)", () => {
    render(<SectorHub data={mockData} />);
    expect(screen.getByTestId("sector-hub")).toBeDefined();
    expect(screen.getByText("Technology")).toBeDefined();
    expect(screen.getByText("Financial")).toBeDefined();
    expect(screen.getByText("Healthcare")).toBeDefined();
    expect(screen.getByText("Energy")).toBeDefined();
    expect(screen.getByText("Consumer Discretionary")).toBeDefined();
    expect(screen.getByText("Communication")).toBeDefined();
    expect(screen.getByText("Industrials")).toBeDefined();
    expect(screen.getByText("Consumer Staples")).toBeDefined();
    expect(screen.getByText("Materials")).toBeDefined();
    expect(screen.getByText("Real Estate")).toBeDefined();
    expect(screen.getByText("Utilities")).toBeDefined();
  });

  it("should display performance metrics with percentage change (Req 23.3)", () => {
    render(<SectorHub data={mockData} />);
    expect(screen.getByTestId("change-Technology").textContent).toBe("+1.25%");
    expect(screen.getByTestId("change-Financial").textContent).toBe("-0.45%");
    expect(screen.getByTestId("change-Energy").textContent).toBe("-1.10%");
  });

  it("should color-code positive green and negative red (Req 23.4)", () => {
    render(<SectorHub data={mockData} />);
    const techChange = screen.getByTestId("change-Technology");
    expect(techChange.className).toContain("text-green-500");

    const finChange = screen.getByTestId("change-Financial");
    expect(finChange.className).toContain("text-red-500");
  });

  it("should show comparison view when sectors are selected (Req 23.5, 23.6)", () => {
    render(<SectorHub data={mockData} />);

    // No comparison initially
    expect(screen.queryByTestId("comparison-view")).toBeNull();

    // Click two sectors
    fireEvent.click(screen.getByTestId("sector-Technology"));
    fireEvent.click(screen.getByTestId("sector-Financial"));

    expect(screen.getByTestId("comparison-view")).toBeDefined();
    expect(screen.getByText("Sector Comparison")).toBeDefined();
  });

  it("should clear comparison when clear button is clicked", () => {
    render(<SectorHub data={mockData} />);

    fireEvent.click(screen.getByTestId("sector-Technology"));
    expect(screen.getByTestId("comparison-view")).toBeDefined();

    fireEvent.click(screen.getByTestId("clear-comparison"));
    expect(screen.queryByTestId("comparison-view")).toBeNull();
  });

  it("should display time period selector with all periods (Req 23.7)", () => {
    render(<SectorHub data={mockData} />);
    const selector = screen.getByTestId("time-period-selector");
    expect(selector).toBeDefined();

    expect(screen.getByTestId("period-1D")).toBeDefined();
    expect(screen.getByTestId("period-1W")).toBeDefined();
    expect(screen.getByTestId("period-1M")).toBeDefined();
    expect(screen.getByTestId("period-3M")).toBeDefined();
    expect(screen.getByTestId("period-1Y")).toBeDefined();
    expect(screen.getByTestId("period-YTD")).toBeDefined();
  });

  it("should sort sectors by performance descending by default (Req 23.12)", () => {
    render(<SectorHub data={mockData} />);
    const grid = screen.getByTestId("sector-grid");
    const sectors = grid.querySelectorAll("[data-testid^='sector-']");

    // First sector should have highest changePercent (Technology: +1.25%)
    expect(sectors[0].getAttribute("data-testid")).toBe("sector-Technology");
  });

  it("should toggle sort direction when clicking sort button (Req 23.12)", () => {
    render(<SectorHub data={mockData} />);

    // Click performance sort to toggle to ascending
    fireEvent.click(screen.getByTestId("sort-performance"));

    const grid = screen.getByTestId("sector-grid");
    const sectors = grid.querySelectorAll("[data-testid^='sector-']");

    // First sector should now have lowest changePercent (Energy: -1.10%)
    expect(sectors[0].getAttribute("data-testid")).toBe("sector-Energy");
  });

  it("should sort by name when name sort is clicked", () => {
    render(<SectorHub data={mockData} />);

    fireEvent.click(screen.getByTestId("sort-name"));

    const grid = screen.getByTestId("sector-grid");
    const sectors = grid.querySelectorAll("[data-testid^='sector-']");

    // Alphabetically first: Communication
    expect(sectors[0].getAttribute("data-testid")).toBe("sector-Communication");
  });

  it("should show tooltip on hover (Req 23.8)", () => {
    render(<SectorHub data={mockData} />);

    fireEvent.mouseEnter(screen.getByTestId("sector-Technology"));
    expect(screen.getByTestId("tooltip-Technology")).toBeDefined();
    expect(screen.getByText(/software, hardware/i)).toBeDefined();

    fireEvent.mouseLeave(screen.getByTestId("sector-Technology"));
    expect(screen.queryByTestId("tooltip-Technology")).toBeNull();
  });

  it("should show loading state when fetching", () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
    render(<SectorHub />);
    expect(screen.getByTestId("sector-hub-loading")).toBeDefined();
  });

  it("should show error state on fetch failure with retry", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: "API error" }),
    });

    render(<SectorHub />);

    await waitFor(() => {
      expect(screen.getByTestId("sector-hub-error")).toBeDefined();
      expect(screen.getByText("Try again")).toBeDefined();
    });
  });

  it("should fetch data from API when no data prop provided", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockData }),
    });

    render(<SectorHub />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/market/sectors?period=1D"
      );
      expect(screen.getByTestId("sector-hub")).toBeDefined();
    });
  });

  it("should not fetch when data prop is provided", () => {
    render(<SectorHub data={mockData} />);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should return null when data is empty", () => {
    const { container } = render(<SectorHub data={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("should display relative strength bars (Req 23.11)", () => {
    render(<SectorHub data={mockData} />);
    const bar = screen.getByTestId("strength-bar-Technology");
    expect(bar).toBeDefined();
    expect(bar.style.width).not.toBe("0%");
  });
});
