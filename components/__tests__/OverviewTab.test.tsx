/**
 * Unit tests for OverviewTab component
 *
 * Requirements: 4.3, 4.4, 4.5
 * Tests:
 * - Metric display (4.4)
 * - Tooltip functionality (4.5)
 * - Color coding (4.3, 4.4)
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OverviewTab } from "../OverviewTab";
import { KeyMetrics } from "../KeyMetrics";
import { SymbolData, PriceData } from "@/types";

// Mock theme context
vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

// Mock ChartComponent
vi.mock("../ChartComponent", () => ({
  ChartComponent: ({ data }: { data: PriceData[] }) => (
    <div data-testid="chart-component">
      Chart with {data.length} data points
    </div>
  ),
}));

describe("OverviewTab", () => {
  const mockSymbolData: SymbolData = {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 150.25,
    change: 2.5,
    changePercent: 1.69,
    marketCap: 2500000000000,
    volume: 50000000,
    fiftyTwoWeekHigh: 180.0,
    fiftyTwoWeekLow: 120.0,
    lastUpdated: new Date("2024-01-15T10:30:00Z"),
  };

  const mockHistoricalData: PriceData[] = [
    {
      timestamp: new Date("2024-01-01"),
      open: 145.0,
      high: 148.0,
      low: 144.0,
      close: 147.0,
      volume: 40000000,
    },
    {
      timestamp: new Date("2024-01-02"),
      open: 147.0,
      high: 150.0,
      low: 146.0,
      close: 149.0,
      volume: 45000000,
    },
  ];

  describe("Basic Rendering", () => {
    it("should render current price section", () => {
      const onTimeRangeChange = vi.fn();
      render(
        <OverviewTab
          symbolData={mockSymbolData}
          historicalData={mockHistoricalData}
          timeRange="1M"
          onTimeRangeChange={onTimeRangeChange}
        />
      );

      expect(screen.getByText("Current Price")).toBeInTheDocument();
      expect(screen.getByText("$150.25")).toBeInTheDocument();
    });

    it("should render price chart section", () => {
      const onTimeRangeChange = vi.fn();
      render(
        <OverviewTab
          symbolData={mockSymbolData}
          historicalData={mockHistoricalData}
          timeRange="1M"
          onTimeRangeChange={onTimeRangeChange}
        />
      );

      expect(screen.getByText("Price Chart")).toBeInTheDocument();
      expect(screen.getByTestId("chart-component")).toBeInTheDocument();
    });

    it("should render key metrics section", () => {
      const onTimeRangeChange = vi.fn();
      render(
        <OverviewTab
          symbolData={mockSymbolData}
          historicalData={mockHistoricalData}
          timeRange="1M"
          onTimeRangeChange={onTimeRangeChange}
        />
      );

      expect(screen.getByText("Key Metrics")).toBeInTheDocument();
    });
  });

  describe("Color Coding - Requirement 4.3", () => {
    it("should display positive change with green styling", () => {
      const onTimeRangeChange = vi.fn();
      render(
        <OverviewTab
          symbolData={mockSymbolData}
          historicalData={mockHistoricalData}
          timeRange="1M"
          onTimeRangeChange={onTimeRangeChange}
        />
      );

      const changeElement = screen.getByText(/\+2\.50/);
      expect(changeElement).toBeInTheDocument();
      expect(changeElement).toHaveClass("text-green-600");
    });

    it("should display negative change with red styling", () => {
      const negativeData: SymbolData = {
        ...mockSymbolData,
        change: -2.5,
        changePercent: -1.69,
      };

      const onTimeRangeChange = vi.fn();
      render(
        <OverviewTab
          symbolData={negativeData}
          historicalData={mockHistoricalData}
          timeRange="1M"
          onTimeRangeChange={onTimeRangeChange}
        />
      );

      const changeElement = screen.getByText(/-2\.50/);
      expect(changeElement).toBeInTheDocument();
      expect(changeElement).toHaveClass("text-red-600");
    });

    it("should display zero change with green styling (non-negative)", () => {
      const zeroData: SymbolData = {
        ...mockSymbolData,
        change: 0,
        changePercent: 0,
      };

      const onTimeRangeChange = vi.fn();
      render(
        <OverviewTab
          symbolData={zeroData}
          historicalData={mockHistoricalData}
          timeRange="1M"
          onTimeRangeChange={onTimeRangeChange}
        />
      );

      const changeElement = screen.getByText(/\+0\.00/);
      expect(changeElement).toHaveClass("text-green-600");
    });

    it("should apply green background to positive change badge", () => {
      const onTimeRangeChange = vi.fn();
      const { container } = render(
        <OverviewTab
          symbolData={mockSymbolData}
          historicalData={mockHistoricalData}
          timeRange="1M"
          onTimeRangeChange={onTimeRangeChange}
        />
      );

      const badge = screen.getByText(/1\.69% Today/).closest("div");
      expect(badge).toHaveClass("bg-green-50");
    });

    it("should apply red background to negative change badge", () => {
      const negativeData: SymbolData = {
        ...mockSymbolData,
        change: -2.5,
        changePercent: -1.69,
      };

      const onTimeRangeChange = vi.fn();
      render(
        <OverviewTab
          symbolData={negativeData}
          historicalData={mockHistoricalData}
          timeRange="1M"
          onTimeRangeChange={onTimeRangeChange}
        />
      );

      const badge = screen.getByText(/1\.69% Today/).closest("div");
      expect(badge).toHaveClass("bg-red-50");
    });

    it("should show up arrow for positive change", () => {
      const onTimeRangeChange = vi.fn();
      render(
        <OverviewTab
          symbolData={mockSymbolData}
          historicalData={mockHistoricalData}
          timeRange="1M"
          onTimeRangeChange={onTimeRangeChange}
        />
      );

      expect(screen.getByText(/▲/)).toBeInTheDocument();
    });

    it("should show down arrow for negative change", () => {
      const negativeData: SymbolData = {
        ...mockSymbolData,
        change: -2.5,
        changePercent: -1.69,
      };

      const onTimeRangeChange = vi.fn();
      render(
        <OverviewTab
          symbolData={negativeData}
          historicalData={mockHistoricalData}
          timeRange="1M"
          onTimeRangeChange={onTimeRangeChange}
        />
      );

      expect(screen.getByText(/▼/)).toBeInTheDocument();
    });

    it("should display change percentage badge with correct formatting", () => {
      const onTimeRangeChange = vi.fn();
      render(
        <OverviewTab
          symbolData={mockSymbolData}
          historicalData={mockHistoricalData}
          timeRange="1M"
          onTimeRangeChange={onTimeRangeChange}
        />
      );

      expect(screen.getByText(/1\.69% Today/)).toBeInTheDocument();
    });
  });

  describe("Metric Display - Requirement 4.4", () => {
    it("should display all key metrics", () => {
      render(<KeyMetrics symbolData={mockSymbolData} />);

      expect(screen.getByText("Market Cap")).toBeInTheDocument();
      expect(screen.getByText("Volume")).toBeInTheDocument();
      expect(screen.getByText("52-Week High")).toBeInTheDocument();
      expect(screen.getByText("52-Week Low")).toBeInTheDocument();
      expect(screen.getByText("52-Week Range")).toBeInTheDocument();
    });

    it("should format market cap correctly (trillions)", () => {
      render(<KeyMetrics symbolData={mockSymbolData} />);

      expect(screen.getByText("$2.50T")).toBeInTheDocument();
    });

    it("should format market cap correctly (billions)", () => {
      const billionData: SymbolData = {
        ...mockSymbolData,
        marketCap: 150000000000, // 150B
      };

      render(<KeyMetrics symbolData={billionData} />);

      expect(screen.getByText("$150.00B")).toBeInTheDocument();
    });

    it("should format market cap correctly (millions)", () => {
      const millionData: SymbolData = {
        ...mockSymbolData,
        marketCap: 500000000, // 500M
      };

      render(<KeyMetrics symbolData={millionData} />);

      expect(screen.getByText("$500.00M")).toBeInTheDocument();
    });

    it("should format volume correctly (millions)", () => {
      render(<KeyMetrics symbolData={mockSymbolData} />);

      expect(screen.getByText("50.00M")).toBeInTheDocument();
    });

    it("should format volume correctly (billions)", () => {
      const highVolumeData: SymbolData = {
        ...mockSymbolData,
        volume: 2500000000, // 2.5B
      };

      render(<KeyMetrics symbolData={highVolumeData} />);

      expect(screen.getByText("2.50B")).toBeInTheDocument();
    });

    it("should format volume correctly (thousands)", () => {
      const lowVolumeData: SymbolData = {
        ...mockSymbolData,
        volume: 5000, // 5K
      };

      render(<KeyMetrics symbolData={lowVolumeData} />);

      expect(screen.getByText("5.00K")).toBeInTheDocument();
    });

    it("should display 52-week high with correct formatting", () => {
      render(<KeyMetrics symbolData={mockSymbolData} />);

      expect(screen.getByText("$180.00")).toBeInTheDocument();
    });

    it("should display 52-week low with correct formatting", () => {
      render(<KeyMetrics symbolData={mockSymbolData} />);

      expect(screen.getByText("$120.00")).toBeInTheDocument();
    });

    it("should display 52-week range correctly", () => {
      render(<KeyMetrics symbolData={mockSymbolData} />);

      expect(screen.getByText("$120.00 - $180.00")).toBeInTheDocument();
    });

    it("should display help icon for each metric", () => {
      const { container } = render(<KeyMetrics symbolData={mockSymbolData} />);

      // Each metric card should have a "?" icon
      const helpIcons = container.querySelectorAll(
        'div:has(> div:contains("?"))'
      );
      expect(screen.getAllByText("?")).toHaveLength(5); // 5 metrics
    });
  });

  describe("Tooltip Functionality - Requirement 4.5", () => {
    it("should show tooltip on hover for Market Cap", async () => {
      const user = userEvent.setup();
      render(<KeyMetrics symbolData={mockSymbolData} />);

      const marketCapCard = screen.getByText("Market Cap").closest("div");
      expect(marketCapCard).toBeInTheDocument();

      await user.hover(marketCapCard!);

      await waitFor(() => {
        expect(
          screen.getByText(/Market Capitalization is the total value/)
        ).toBeInTheDocument();
      });
    });

    it("should show tooltip on hover for Volume", async () => {
      const user = userEvent.setup();
      render(<KeyMetrics symbolData={mockSymbolData} />);

      const volumeCard = screen.getByText("Volume").closest("div");
      expect(volumeCard).toBeInTheDocument();

      await user.hover(volumeCard!);

      await waitFor(() => {
        expect(
          screen.getByText(
            /Volume represents the total number of shares traded/
          )
        ).toBeInTheDocument();
      });
    });

    it("should show tooltip on hover for 52-Week High", async () => {
      const user = userEvent.setup();
      render(<KeyMetrics symbolData={mockSymbolData} />);

      const highCard = screen.getByText("52-Week High").closest("div");
      expect(highCard).toBeInTheDocument();

      await user.hover(highCard!);

      await waitFor(() => {
        expect(
          screen.getByText(/The highest price the stock has reached/)
        ).toBeInTheDocument();
      });
    });

    it("should show tooltip on hover for 52-Week Low", async () => {
      const user = userEvent.setup();
      render(<KeyMetrics symbolData={mockSymbolData} />);

      const lowCard = screen.getByText("52-Week Low").closest("div");
      expect(lowCard).toBeInTheDocument();

      await user.hover(lowCard!);

      await waitFor(() => {
        expect(
          screen.getByText(/The lowest price the stock has reached/)
        ).toBeInTheDocument();
      });
    });

    it("should show tooltip on hover for 52-Week Range", async () => {
      const user = userEvent.setup();
      render(<KeyMetrics symbolData={mockSymbolData} />);

      const rangeCard = screen.getByText("52-Week Range").closest("div");
      expect(rangeCard).toBeInTheDocument();

      await user.hover(rangeCard!);

      await waitFor(() => {
        expect(
          screen.getByText(/The range between the lowest and highest prices/)
        ).toBeInTheDocument();
      });
    });

    it("should hide tooltip on mouse leave", async () => {
      const user = userEvent.setup();
      render(<KeyMetrics symbolData={mockSymbolData} />);

      const marketCapCard = screen.getByText("Market Cap").closest("div");
      expect(marketCapCard).toBeInTheDocument();

      // Hover to show tooltip
      await user.hover(marketCapCard!);

      await waitFor(() => {
        expect(
          screen.getByText(/Market Capitalization is the total value/)
        ).toBeInTheDocument();
      });

      // Unhover to hide tooltip
      await user.unhover(marketCapCard!);

      await waitFor(() => {
        expect(
          screen.queryByText(/Market Capitalization is the total value/)
        ).not.toBeInTheDocument();
      });
    });

    it("should display tooltip with proper styling", async () => {
      const user = userEvent.setup();
      const { container } = render(<KeyMetrics symbolData={mockSymbolData} />);

      const marketCapCard = screen.getByText("Market Cap").closest("div");
      await user.hover(marketCapCard!);

      await waitFor(() => {
        const tooltipText = screen.getByText(
          /Market Capitalization is the total value/
        );
        const tooltipContainer = tooltipText.closest('[role="tooltip"]');
        expect(tooltipContainer).toHaveClass("absolute");
        expect(tooltipContainer).toHaveClass("z-10");
        expect(tooltipContainer).toHaveClass("rounded-lg");
        expect(tooltipContainer).toHaveClass("shadow-lg");
      });
    });

    it("should show different tooltips for different metrics", async () => {
      const user = userEvent.setup();
      render(<KeyMetrics symbolData={mockSymbolData} />);

      // Hover over Market Cap
      const marketCapCard = screen.getByText("Market Cap").closest("div");
      await user.hover(marketCapCard!);

      await waitFor(() => {
        expect(
          screen.getByText(/Market Capitalization is the total value/)
        ).toBeInTheDocument();
      });

      await user.unhover(marketCapCard!);

      // Hover over Volume
      const volumeCard = screen.getByText("Volume").closest("div");
      await user.hover(volumeCard!);

      await waitFor(() => {
        expect(
          screen.getByText(
            /Volume represents the total number of shares traded/
          )
        ).toBeInTheDocument();
        expect(
          screen.queryByText(/Market Capitalization is the total value/)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large market cap values", () => {
      const largeCapData: SymbolData = {
        ...mockSymbolData,
        marketCap: 5000000000000, // 5T
      };

      render(<KeyMetrics symbolData={largeCapData} />);

      expect(screen.getByText("$5.00T")).toBeInTheDocument();
    });

    it("should handle very small volume values", () => {
      const smallVolumeData: SymbolData = {
        ...mockSymbolData,
        volume: 100,
      };

      render(<KeyMetrics symbolData={smallVolumeData} />);

      expect(screen.getByText("100")).toBeInTheDocument();
    });

    it("should handle decimal price changes correctly", () => {
      const decimalData: SymbolData = {
        ...mockSymbolData,
        change: 0.01,
        changePercent: 0.01,
      };

      const onTimeRangeChange = vi.fn();
      render(
        <OverviewTab
          symbolData={decimalData}
          historicalData={mockHistoricalData}
          timeRange="1M"
          onTimeRangeChange={onTimeRangeChange}
        />
      );

      expect(screen.getByText(/\+0\.01/)).toBeInTheDocument();
    });

    it("should handle large negative changes", () => {
      const largeNegativeData: SymbolData = {
        ...mockSymbolData,
        change: -50.75,
        changePercent: -25.5,
      };

      const onTimeRangeChange = vi.fn();
      render(
        <OverviewTab
          symbolData={largeNegativeData}
          historicalData={mockHistoricalData}
          timeRange="1M"
          onTimeRangeChange={onTimeRangeChange}
        />
      );

      expect(screen.getByText(/-50\.75/)).toBeInTheDocument();
      expect(screen.getByText(/25\.50% Today/)).toBeInTheDocument();
    });
  });
});
