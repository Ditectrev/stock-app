/**
 * HeatmapComponent Unit Tests
 * Tests for tile rendering, color coding, time period changes,
 * filtering, and sorting.
 *
 * Requirements: 25.3, 25.4, 25.5, 25.12, 25.17, 25.18
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HeatmapComponent } from "../HeatmapComponent";
import { HeatmapData } from "@/types";

vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({
    theme: "light",
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

const mockData: HeatmapData[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    value: 195.5,
    changePercent: 2.5,
    sector: "Technology",
    marketCap: 3e12,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    value: 420.1,
    changePercent: -1.3,
    sector: "Technology",
    marketCap: 2.8e12,
  },
  {
    symbol: "JPM",
    name: "JPMorgan Chase",
    value: 198.0,
    changePercent: 0.8,
    sector: "Financial",
    marketCap: 570e9,
  },
  {
    symbol: "XOM",
    name: "Exxon Mobil",
    value: 105.2,
    changePercent: -3.5,
    sector: "Energy",
    marketCap: 450e9,
  },
  {
    symbol: "JNJ",
    name: "Johnson & Johnson",
    value: 155.0,
    changePercent: 0,
    sector: "Healthcare",
    marketCap: 380e9,
  },
];

describe("HeatmapComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Tile rendering (Req 25.3, 25.6) ---

  it("should render a tile for each data item", () => {
    render(<HeatmapComponent data={mockData} />);
    expect(screen.getByTestId("heatmap-grid")).toBeDefined();
    for (const item of mockData) {
      expect(screen.getByTestId(`heatmap-tile-${item.symbol}`)).toBeDefined();
    }
  });

  it("should display symbol and percentage change on each tile", () => {
    render(<HeatmapComponent data={mockData} />);
    expect(screen.getByTestId("heatmap-symbol-AAPL").textContent).toBe("AAPL");
    expect(screen.getByTestId("heatmap-change-AAPL").textContent).toBe(
      "+2.50%"
    );
    expect(screen.getByTestId("heatmap-change-MSFT").textContent).toBe(
      "-1.30%"
    );
    expect(screen.getByTestId("heatmap-change-JNJ").textContent).toBe("+0.00%");
  });

  it("should show tooltip with details on hover", () => {
    render(<HeatmapComponent data={mockData} />);
    expect(screen.queryByTestId("heatmap-tooltip-AAPL")).toBeNull();

    fireEvent.mouseEnter(screen.getByTestId("heatmap-tile-AAPL"));
    const tooltip = screen.getByTestId("heatmap-tooltip-AAPL");
    expect(tooltip).toBeDefined();
    expect(tooltip.textContent).toContain("Apple Inc.");
    expect(tooltip.textContent).toContain("Technology");
    expect(tooltip.textContent).toContain("3.00T");

    fireEvent.mouseLeave(screen.getByTestId("heatmap-tile-AAPL"));
    expect(screen.queryByTestId("heatmap-tooltip-AAPL")).toBeNull();
  });

  it("should call onTileClick when a tile is clicked", () => {
    const onClick = vi.fn();
    render(<HeatmapComponent data={mockData} onTileClick={onClick} />);
    fireEvent.click(screen.getByTestId("heatmap-tile-AAPL"));
    expect(onClick).toHaveBeenCalledWith(mockData[0]);
  });

  it("should call onTileClick on Enter key press", () => {
    const onClick = vi.fn();
    render(<HeatmapComponent data={mockData} onTileClick={onClick} />);
    fireEvent.keyDown(screen.getByTestId("heatmap-tile-AAPL"), {
      key: "Enter",
    });
    expect(onClick).toHaveBeenCalledWith(mockData[0]);
  });

  // --- Color coding (Req 25.4, 25.5) ---

  it("should apply green background for positive change", () => {
    render(<HeatmapComponent data={mockData} />);
    const tile = screen.getByTestId("heatmap-tile-AAPL");
    // Positive → green rgba(34,197,94,...)
    expect(tile.style.backgroundColor).toContain("34, 197, 94");
  });

  it("should apply red background for negative change", () => {
    render(<HeatmapComponent data={mockData} />);
    const tile = screen.getByTestId("heatmap-tile-MSFT");
    // Negative → red rgba(239,68,68,...)
    expect(tile.style.backgroundColor).toContain("239, 68, 68");
  });

  it("should apply neutral background for zero change", () => {
    render(<HeatmapComponent data={mockData} />);
    const tile = screen.getByTestId("heatmap-tile-JNJ");
    // Zero → gray
    expect(tile.style.backgroundColor).toContain("156, 163, 175");
  });

  it("should vary color intensity based on magnitude", () => {
    const data: HeatmapData[] = [
      { symbol: "SMALL", name: "Small Change", value: 10, changePercent: 0.5 },
      { symbol: "BIG", name: "Big Change", value: 10, changePercent: 8.0 },
    ];
    render(<HeatmapComponent data={data} />);
    const smallTile = screen.getByTestId("heatmap-tile-SMALL");
    const bigTile = screen.getByTestId("heatmap-tile-BIG");

    // Both green, but big should have higher opacity
    const smallAlpha = parseFloat(
      smallTile.style.backgroundColor.split(",")[3]
    );
    const bigAlpha = parseFloat(bigTile.style.backgroundColor.split(",")[3]);
    expect(bigAlpha).toBeGreaterThan(smallAlpha);
  });

  it("should display a color legend", () => {
    render(<HeatmapComponent data={mockData} />);
    const legend = screen.getByTestId("heatmap-legend");
    expect(legend).toBeDefined();
    expect(legend.textContent).toContain("Strong decline");
    expect(legend.textContent).toContain("Strong gain");
  });

  // --- Time period changes (Req 25.12, 25.13) ---

  it("should render all time period buttons", () => {
    render(<HeatmapComponent data={mockData} />);
    expect(screen.getByTestId("heatmap-period-1D")).toBeDefined();
    expect(screen.getByTestId("heatmap-period-1W")).toBeDefined();
    expect(screen.getByTestId("heatmap-period-1M")).toBeDefined();
    expect(screen.getByTestId("heatmap-period-3M")).toBeDefined();
    expect(screen.getByTestId("heatmap-period-1Y")).toBeDefined();
    expect(screen.getByTestId("heatmap-period-5Y")).toBeDefined();
    expect(screen.getByTestId("heatmap-period-YTD")).toBeDefined();
    expect(screen.getByTestId("heatmap-period-MAX")).toBeDefined();
  });

  it("should highlight the active time period", () => {
    render(<HeatmapComponent data={mockData} timePeriod="1M" />);
    const btn = screen.getByTestId("heatmap-period-1M");
    expect(btn.className).toContain("bg-stone-900");
    expect(btn.getAttribute("aria-pressed")).toBe("true");

    const other = screen.getByTestId("heatmap-period-1D");
    expect(other.getAttribute("aria-pressed")).toBe("false");
  });

  it("should call onTimePeriodChange when a period button is clicked", () => {
    const onChange = vi.fn();
    render(<HeatmapComponent data={mockData} onTimePeriodChange={onChange} />);
    fireEvent.click(screen.getByTestId("heatmap-period-1W"));
    expect(onChange).toHaveBeenCalledWith("1W");
  });

  // --- Sorting (Req 25.18) ---

  it("should sort by changePercent descending by default", () => {
    render(<HeatmapComponent data={mockData} />);
    const grid = screen.getByTestId("heatmap-grid");
    const tiles = grid.querySelectorAll("[data-testid^='heatmap-tile-']");
    // Descending by changePercent: AAPL(2.5), JPM(0.8), JNJ(0), MSFT(-1.3), XOM(-3.5)
    expect(tiles[0].getAttribute("data-testid")).toBe("heatmap-tile-AAPL");
    expect(tiles[4].getAttribute("data-testid")).toBe("heatmap-tile-XOM");
  });

  it("should highlight the active sort button", () => {
    render(<HeatmapComponent data={mockData} sortField="changePercent" />);
    const btn = screen.getByTestId("heatmap-sort-changePercent");
    expect(btn.className).toContain("bg-stone-900");
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });

  it("should call onSortChange when a sort button is clicked", () => {
    const onSort = vi.fn();
    render(<HeatmapComponent data={mockData} onSortChange={onSort} />);
    fireEvent.click(screen.getByTestId("heatmap-sort-marketCap"));
    expect(onSort).toHaveBeenCalledWith("marketCap", "desc");
  });

  it("should toggle sort direction when clicking the active sort field", () => {
    const onSort = vi.fn();
    render(
      <HeatmapComponent
        data={mockData}
        sortField="changePercent"
        sortDirection="desc"
        onSortChange={onSort}
      />
    );
    fireEvent.click(screen.getByTestId("heatmap-sort-changePercent"));
    expect(onSort).toHaveBeenCalledWith("changePercent", "asc");
  });

  it("should sort by name ascending when configured", () => {
    render(
      <HeatmapComponent data={mockData} sortField="name" sortDirection="asc" />
    );
    const grid = screen.getByTestId("heatmap-grid");
    const tiles = grid.querySelectorAll("[data-testid^='heatmap-tile-']");
    // Alphabetical by name: Apple, Exxon, JPMorgan, Johnson, Microsoft
    expect(tiles[0].getAttribute("data-testid")).toBe("heatmap-tile-AAPL");
    expect(tiles[1].getAttribute("data-testid")).toBe("heatmap-tile-XOM");
  });

  it("should sort by marketCap descending when configured", () => {
    render(
      <HeatmapComponent
        data={mockData}
        sortField="marketCap"
        sortDirection="desc"
      />
    );
    const grid = screen.getByTestId("heatmap-grid");
    const tiles = grid.querySelectorAll("[data-testid^='heatmap-tile-']");
    // Descending by marketCap: AAPL(3T), MSFT(2.8T), JPM(570B), XOM(450B), JNJ(380B)
    expect(tiles[0].getAttribute("data-testid")).toBe("heatmap-tile-AAPL");
    expect(tiles[1].getAttribute("data-testid")).toBe("heatmap-tile-MSFT");
  });

  // --- Filtering (Req 25.17) ---

  it("should render sector filter dropdown with all sectors", () => {
    render(<HeatmapComponent data={mockData} />);
    const select = screen.getByTestId("heatmap-sector-filter");
    expect(select).toBeDefined();
    const options = select.querySelectorAll("option");
    // "All Sectors" + Energy, Financial, Healthcare, Technology (sorted)
    expect(options.length).toBe(5);
    expect(options[0].textContent).toBe("All Sectors");
  });

  it("should filter tiles by sector when sectorFilter is set", () => {
    render(<HeatmapComponent data={mockData} sectorFilter="Technology" />);
    const grid = screen.getByTestId("heatmap-grid");
    const tiles = grid.querySelectorAll("[data-testid^='heatmap-tile-']");
    expect(tiles.length).toBe(2); // AAPL and MSFT
  });

  it("should call onSectorFilterChange when sector is selected", () => {
    const onFilter = vi.fn();
    render(
      <HeatmapComponent data={mockData} onSectorFilterChange={onFilter} />
    );
    fireEvent.change(screen.getByTestId("heatmap-sector-filter"), {
      target: { value: "Energy" },
    });
    expect(onFilter).toHaveBeenCalledWith("Energy");
  });

  // --- Loading and empty states ---

  it("should show loading state", () => {
    render(<HeatmapComponent data={[]} loading={true} />);
    expect(screen.getByTestId("heatmap-loading")).toBeDefined();
  });

  it("should show empty state when data is empty", () => {
    render(<HeatmapComponent data={[]} />);
    expect(screen.getByTestId("heatmap-empty")).toBeDefined();
    expect(screen.getByText("No heatmap data available.")).toBeDefined();
  });

  // --- Auto-refresh ---

  it("should call onRefresh at the configured interval", () => {
    vi.useFakeTimers();
    const onRefresh = vi.fn();
    render(
      <HeatmapComponent
        data={mockData}
        refreshInterval={5000}
        onRefresh={onRefresh}
      />
    );
    expect(onRefresh).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5000);
    expect(onRefresh).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5000);
    expect(onRefresh).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("should not call onRefresh when refreshInterval is 0", () => {
    vi.useFakeTimers();
    const onRefresh = vi.fn();
    render(
      <HeatmapComponent
        data={mockData}
        refreshInterval={0}
        onRefresh={onRefresh}
      />
    );
    vi.advanceTimersByTime(10000);
    expect(onRefresh).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  // --- Accessibility ---

  it("should have proper ARIA attributes", () => {
    render(<HeatmapComponent data={mockData} />);
    const region = screen.getByTestId("heatmap");
    expect(region.getAttribute("role")).toBe("region");
    expect(region.getAttribute("aria-label")).toBe("Market heatmap");

    const tile = screen.getByTestId("heatmap-tile-AAPL");
    expect(tile.getAttribute("role")).toBe("button");
    expect(tile.getAttribute("aria-label")).toContain("AAPL");
    expect(tile.getAttribute("tabindex")).toBe("0");
  });
});
