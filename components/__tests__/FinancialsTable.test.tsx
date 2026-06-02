/**
 * Unit tests for FinancialsTable component
 * Tests metric display, tooltip functionality, color coding, and loading skeleton
 * Task 13.2 - Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FinancialsTable } from "../FinancialsTable";
import { ThemeProvider } from "@/lib/theme-context";
import { FinancialData } from "@/types";

// Helper to wrap component with ThemeProvider
const renderWithTheme = (financials: FinancialData | null | undefined) =>
  render(
    <ThemeProvider>
      <FinancialsTable financials={financials} />
    </ThemeProvider>
  );

const mockFinancials: FinancialData = {
  keyFacts: {
    revenue: 394328000000,
    netIncome: 96995000000,
    profitMargin: 0.246,
  },
  valuation: {
    peRatio: 28.5,
    pbRatio: 45.2,
    pegRatio: 1.5,
  },
  growth: {
    revenueGrowth: 0.08,
    earningsGrowth: 0.15,
  },
  profitability: {
    roe: 0.175,
    roa: 0.065,
    operatingMargin: 0.302,
  },
};

describe("FinancialsTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Requirement 8.1: Key financial facts
  describe("Key Financial Facts Section", () => {
    it("should display the Key Financial Facts heading", () => {
      renderWithTheme(mockFinancials);
      expect(screen.getByText("Key Financial Facts")).toBeInTheDocument();
    });

    it("should display Revenue metric", () => {
      renderWithTheme(mockFinancials);
      expect(screen.getByText("Revenue")).toBeInTheDocument();
    });

    it("should display Net Income metric", () => {
      renderWithTheme(mockFinancials);
      expect(screen.getByText("Net Income")).toBeInTheDocument();
    });

    it("should display Profit Margin metric", () => {
      renderWithTheme(mockFinancials);
      expect(screen.getByText("Profit Margin")).toBeInTheDocument();
    });
  });

  // Requirement 8.2: Valuation metrics
  describe("Valuation Metrics Section", () => {
    it("should display the Valuation Metrics heading", () => {
      renderWithTheme(mockFinancials);
      expect(screen.getByText("Valuation Metrics")).toBeInTheDocument();
    });

    it("should display P/E Ratio metric", () => {
      renderWithTheme(mockFinancials);
      expect(screen.getByText("P/E Ratio")).toBeInTheDocument();
    });

    it("should display P/B Ratio metric", () => {
      renderWithTheme(mockFinancials);
      expect(screen.getByText("P/B Ratio")).toBeInTheDocument();
    });

    it("should display PEG Ratio metric", () => {
      renderWithTheme(mockFinancials);
      expect(screen.getByText("PEG Ratio")).toBeInTheDocument();
    });
  });

  // Requirement 8.3: Growth metrics
  describe("Growth Metrics Section", () => {
    it("should display the Growth Metrics heading", () => {
      renderWithTheme(mockFinancials);
      expect(screen.getByText("Growth Metrics")).toBeInTheDocument();
    });

    it("should display Revenue Growth metric", () => {
      renderWithTheme(mockFinancials);
      expect(screen.getByText("Revenue Growth")).toBeInTheDocument();
    });

    it("should display Earnings Growth metric", () => {
      renderWithTheme(mockFinancials);
      expect(screen.getByText("Earnings Growth")).toBeInTheDocument();
    });
  });

  // Requirement 8.4: Profitability metrics
  describe("Profitability Metrics Section", () => {
    it("should display the Profitability Metrics heading", () => {
      renderWithTheme(mockFinancials);
      expect(screen.getByText("Profitability Metrics")).toBeInTheDocument();
    });

    it("should display ROE metric", () => {
      renderWithTheme(mockFinancials);
      expect(screen.getByText("ROE")).toBeInTheDocument();
    });

    it("should display ROA metric", () => {
      renderWithTheme(mockFinancials);
      expect(screen.getByText("ROA")).toBeInTheDocument();
    });

    it("should display Operating Margin metric", () => {
      renderWithTheme(mockFinancials);
      expect(screen.getByText("Operating Margin")).toBeInTheDocument();
    });
  });

  // Requirement 8.5: Tooltips
  describe("Tooltip Functionality", () => {
    it("should show tooltip on hover over Key Financial Facts heading", () => {
      renderWithTheme(mockFinancials);
      const heading = screen.getByText("Key Financial Facts");
      const hoverTarget = heading.closest("div")!;
      fireEvent.mouseEnter(hoverTarget);
      expect(
        screen.getByText(/Core financial figures that summarize/)
      ).toBeInTheDocument();
    });

    it("should show tooltip on hover over Valuation Metrics heading", () => {
      renderWithTheme(mockFinancials);
      const heading = screen.getByText("Valuation Metrics");
      const hoverTarget = heading.closest("div")!;
      fireEvent.mouseEnter(hoverTarget);
      expect(
        screen.getByText(/Ratios that help assess whether a stock/)
      ).toBeInTheDocument();
    });

    it("should show tooltip on hover over Growth Metrics heading", () => {
      renderWithTheme(mockFinancials);
      const heading = screen.getByText("Growth Metrics");
      const hoverTarget = heading.closest("div")!;
      fireEvent.mouseEnter(hoverTarget);
      expect(
        screen.getByText(/Measures of how quickly the company/)
      ).toBeInTheDocument();
    });

    it("should show tooltip on hover over Profitability Metrics heading", () => {
      renderWithTheme(mockFinancials);
      const heading = screen.getByText("Profitability Metrics");
      const hoverTarget = heading.closest("div")!;
      fireEvent.mouseEnter(hoverTarget);
      expect(
        screen.getByText(/Ratios that measure how effectively/)
      ).toBeInTheDocument();
    });

    it("should hide section tooltip on mouse leave", () => {
      renderWithTheme(mockFinancials);
      const heading = screen.getByText("Key Financial Facts");
      const hoverTarget = heading.closest("div")!;
      fireEvent.mouseEnter(hoverTarget);
      expect(
        screen.getByText(/Core financial figures that summarize/)
      ).toBeInTheDocument();
      fireEvent.mouseLeave(hoverTarget);
      expect(
        screen.queryByText(/Core financial figures that summarize/)
      ).not.toBeInTheDocument();
    });

    it("should show tooltip on hover over Revenue metric label", () => {
      renderWithTheme(mockFinancials);
      const hoverTarget = screen.getByLabelText("More info about Revenue");
      fireEvent.mouseEnter(hoverTarget);
      expect(
        screen.getByText(/Total revenue generated by the company/)
      ).toBeInTheDocument();
    });

    it("should show tooltip on hover over P/E Ratio metric label", () => {
      renderWithTheme(mockFinancials);
      const hoverTarget = screen.getByLabelText("More info about P/E Ratio");
      fireEvent.mouseEnter(hoverTarget);
      expect(
        screen.getByText(/Price-to-Earnings ratio compares/)
      ).toBeInTheDocument();
    });

    it("should hide metric tooltip on mouse leave", () => {
      renderWithTheme(mockFinancials);
      const hoverTarget = screen.getByLabelText("More info about Revenue");
      fireEvent.mouseEnter(hoverTarget);
      expect(
        screen.getByText(/Total revenue generated by the company/)
      ).toBeInTheDocument();
      fireEvent.mouseLeave(hoverTarget);
      expect(
        screen.queryByText(/Total revenue generated by the company/)
      ).not.toBeInTheDocument();
    });
  });

  // Requirement 8.6: Color coding
  describe("Color Coding", () => {
    it("should apply green color for favorable profit margin (>15%)", () => {
      renderWithTheme(mockFinancials);
      // profitMargin = 0.246 → 24.60% → favorable → green
      const value = screen.getByText("24.60%");
      expect(value).toHaveClass("text-emerald-800");
    });

    it("should apply red color for unfavorable P/B ratio (>5)", () => {
      renderWithTheme(mockFinancials);
      // pbRatio = 45.2 → unfavorable → red
      const value = screen.getByText("45.20");
      expect(value).toHaveClass("text-rose-800");
    });

    it("should apply neutral color for neutral growth values", () => {
      // revenueGrowth = 0.08 → 8.00% → between 0 and 0.1 → neutral
      renderWithTheme(mockFinancials);
      const value = screen.getByText("8.00%");
      expect(value).toHaveClass("text-stone-600");
    });

    it("should apply green for favorable earnings growth (>10%)", () => {
      renderWithTheme(mockFinancials);
      // earningsGrowth = 0.15 → 15.00% → favorable → green
      const value = screen.getByText("15.00%");
      expect(value).toHaveClass("text-emerald-800");
    });

    it("should apply red for negative net income", () => {
      const negativeData: FinancialData = {
        ...mockFinancials,
        keyFacts: { ...mockFinancials.keyFacts, netIncome: -5000000000 },
      };
      renderWithTheme(negativeData);
      const value = screen.getByText("$-5.00B");
      expect(value).toHaveClass("text-rose-800");
    });

    it("should apply green for favorable ROE (>15%)", () => {
      renderWithTheme(mockFinancials);
      // roe = 0.175 → 17.50% → favorable → green
      const value = screen.getByText("17.50%");
      expect(value).toHaveClass("text-emerald-800");
    });
  });

  // Loading skeleton
  describe("Loading Skeleton", () => {
    it("should render loading skeleton when financials is null", () => {
      const { container } = renderWithTheme(null);
      expect(screen.getByText("Financials")).toBeInTheDocument();
      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBe(4);
    });

    it("should render loading skeleton when financials is undefined", () => {
      const { container } = renderWithTheme(undefined);
      expect(screen.getByText("Financials")).toBeInTheDocument();
      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBe(4);
    });
  });

  // Help icons
  describe("Help Icons", () => {
    it("should display help icons (?) for each section and metric", () => {
      renderWithTheme(mockFinancials);
      const helpIcons = screen.getAllByText("?");
      // 4 section help icons + 11 metric help icons = 15
      expect(helpIcons.length).toBe(15);
    });
  });

  // Formatted values
  describe("Formatted Values", () => {
    it("should format large revenue in trillions/billions", () => {
      renderWithTheme(mockFinancials);
      // 394328000000 → $394.33B
      expect(screen.getByText("$394.33B")).toBeInTheDocument();
    });

    it("should format ratios with 2 decimal places", () => {
      renderWithTheme(mockFinancials);
      expect(screen.getByText("28.50")).toBeInTheDocument(); // P/E
      expect(screen.getByText("1.50")).toBeInTheDocument(); // PEG
    });

    it("should format percentages correctly", () => {
      renderWithTheme(mockFinancials);
      expect(screen.getByText("24.60%")).toBeInTheDocument(); // profit margin
      expect(screen.getByText("30.20%")).toBeInTheDocument(); // operating margin
    });
  });
});
