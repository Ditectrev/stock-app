/**
 * Unit tests for SeasonalHeatmap
 * Tests heatmap rendering, color coding, hover tooltips, and disclaimer display
 * Task 12.3 - Requirements: 7.1, 7.3, 7.4
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SeasonalHeatmap } from "../SeasonalHeatmap";
import { ThemeProvider } from "@/lib/theme-context";
import { SeasonalData } from "@/types";

// Helper to wrap component with ThemeProvider
const renderWithTheme = (data: SeasonalData | null | undefined) =>
  render(
    <ThemeProvider>
      <SeasonalHeatmap data={data} />
    </ThemeProvider>
  );

// Mock seasonal data: 2 years, a few months each
const mockSeasonalData: SeasonalData = {
  heatmap: [
    { year: 2023, month: 1, return: 3.5 },
    { year: 2023, month: 2, return: -1.2 },
    { year: 2023, month: 3, return: 6.0 },
    { year: 2023, month: 6, return: -5.8 },
    { year: 2024, month: 1, return: 1.0 },
    { year: 2024, month: 2, return: -3.4 },
    { year: 2024, month: 3, return: 0.0 },
    { year: 2024, month: 6, return: 2.5 },
  ],
  averageByMonth: { 1: 2.25, 2: -2.3, 3: 3.0, 6: -1.65 },
};

describe("SeasonalHeatmap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Heatmap Rendering", () => {
    it("should render the heading", () => {
      renderWithTheme(mockSeasonalData);
      expect(screen.getByText("Seasonal Patterns")).toBeInTheDocument();
    });

    it("should render month column headers", () => {
      renderWithTheme(mockSeasonalData);
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      for (const m of months) {
        expect(screen.getByText(m)).toBeInTheDocument();
      }
    });

    it("should render year row labels", () => {
      renderWithTheme(mockSeasonalData);
      expect(screen.getByText("2023")).toBeInTheDocument();
      expect(screen.getByText("2024")).toBeInTheDocument();
    });

    it("should render an average row", () => {
      renderWithTheme(mockSeasonalData);
      expect(screen.getByText("Avg")).toBeInTheDocument();
    });

    it("should render return values in cells", () => {
      renderWithTheme(mockSeasonalData);
      // 3.5% formatted as "3.5%"
      expect(screen.getByText("3.5%")).toBeInTheDocument();
      expect(screen.getByText("-1.2%")).toBeInTheDocument();
      expect(screen.getByText("6.0%")).toBeInTheDocument();
    });

    it("should render dash for months with no data", () => {
      renderWithTheme(mockSeasonalData);
      // Months without data should show "—"
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThan(0);
    });

    it("should show loading skeleton when data is null", () => {
      const { container } = renderWithTheme(null);
      expect(screen.getByText("Seasonal Patterns")).toBeInTheDocument();
      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it("should show loading skeleton when data is undefined", () => {
      const { container } = renderWithTheme(undefined);
      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it("should show empty message when heatmap array is empty", () => {
      renderWithTheme({ heatmap: [], averageByMonth: {} });
      expect(
        screen.getByText("No seasonal data available.")
      ).toBeInTheDocument();
    });
  });

  describe("Color Coding", () => {
    it("should apply green color classes for positive returns", () => {
      const { container } = renderWithTheme(mockSeasonalData);
      // Strong positive (>=5): bg-green-500 in light mode
      const cell6 = screen.getByText("6.0%");
      expect(cell6.closest("div")).toHaveClass("bg-green-500");
    });

    it("should apply red color classes for negative returns", () => {
      renderWithTheme(mockSeasonalData);
      // Strong negative (>=5): bg-red-500 in light mode
      const cell = screen.getByText("-5.8%");
      expect(cell.closest("div")).toHaveClass("bg-red-500");
    });

    it("should apply moderate green for mid-range positive returns", () => {
      renderWithTheme(mockSeasonalData);
      // 3.5% is >=2 and <5 → bg-green-400
      const cell = screen.getByText("3.5%");
      expect(cell.closest("div")).toHaveClass("bg-green-400");
    });

    it("should apply moderate red for mid-range negative returns", () => {
      renderWithTheme(mockSeasonalData);
      // -3.4% is >=2 and <5 → bg-red-400
      const cell = screen.getByText("-3.4%");
      expect(cell.closest("div")).toHaveClass("bg-red-400");
    });

    it("should apply mild color for small returns", () => {
      renderWithTheme(mockSeasonalData);
      // -1.2% is <2 → bg-red-200
      const cell = screen.getByText("-1.2%");
      expect(cell.closest("div")).toHaveClass("bg-red-200");
    });

    it("should apply gray for zero return", () => {
      renderWithTheme(mockSeasonalData);
      const cell = screen.getByText("0.0%");
      expect(cell.closest("div")).toHaveClass("bg-stone-200");
    });

    it("should render a legend with color descriptions", () => {
      renderWithTheme(mockSeasonalData);
      expect(screen.getByText("Legend:")).toBeInTheDocument();
      expect(screen.getByText("Strong positive")).toBeInTheDocument();
      expect(screen.getByText("Mild positive")).toBeInTheDocument();
      expect(screen.getByText("Mild negative")).toBeInTheDocument();
      expect(screen.getByText("Strong negative")).toBeInTheDocument();
    });
  });

  describe("Hover Tooltips", () => {
    it("should show tooltip with month, year, and return on hover", () => {
      renderWithTheme(mockSeasonalData);

      // Find the cell containing "3.5%" and hover its parent <td>
      const cell = screen.getByText("3.5%");
      const td = cell.closest("td")!;
      fireEvent.mouseEnter(td);

      // Tooltip should show "Jan 2023" and the formatted return
      expect(screen.getByText("Jan 2023")).toBeInTheDocument();
      expect(screen.getByText("+3.50%")).toBeInTheDocument();
    });

    it("should show negative return in tooltip correctly", () => {
      renderWithTheme(mockSeasonalData);

      const cell = screen.getByText("-5.8%");
      const td = cell.closest("td")!;
      fireEvent.mouseEnter(td);

      expect(screen.getByText("Jun 2023")).toBeInTheDocument();
      expect(screen.getByText("-5.80%")).toBeInTheDocument();
    });

    it("should hide tooltip on mouse leave", () => {
      renderWithTheme(mockSeasonalData);

      const cell = screen.getByText("3.5%");
      const td = cell.closest("td")!;
      fireEvent.mouseEnter(td);
      expect(screen.getByText("Jan 2023")).toBeInTheDocument();

      fireEvent.mouseLeave(td);
      expect(screen.queryByText("Jan 2023")).not.toBeInTheDocument();
    });

    it("should not show tooltip for cells with no data", () => {
      renderWithTheme(mockSeasonalData);

      // Find a dash cell (no data) and hover it
      const dashes = screen.getAllByText("—");
      const td = dashes[0].closest("td")!;
      fireEvent.mouseEnter(td);

      // No tooltip should appear — "Return:" text is only in tooltips
      expect(screen.queryByText("Return:")).not.toBeInTheDocument();
    });

    it("should highlight hovered cell with ring", () => {
      renderWithTheme(mockSeasonalData);

      const cell = screen.getByText("3.5%");
      const td = cell.closest("td")!;
      fireEvent.mouseEnter(td);

      // The inner div should have ring-2 class when hovered
      const innerDiv = cell.closest("div.relative");
      expect(innerDiv).toHaveClass("ring-2");
      expect(innerDiv).toHaveClass("ring-stone-500");
    });
  });

  describe("Disclaimer Display", () => {
    it("should display the past performance disclaimer", () => {
      renderWithTheme(mockSeasonalData);
      expect(
        screen.getByText(
          "Past seasonality does not guarantee future performance"
        )
      ).toBeInTheDocument();
    });

    it("should style disclaimer as italic", () => {
      renderWithTheme(mockSeasonalData);
      const disclaimer = screen.getByText(
        "Past seasonality does not guarantee future performance"
      );
      expect(disclaimer).toHaveClass("italic");
    });

    it("should not display disclaimer when no data", () => {
      renderWithTheme(null);
      expect(
        screen.queryByText(
          "Past seasonality does not guarantee future performance"
        )
      ).not.toBeInTheDocument();
    });
  });
});
