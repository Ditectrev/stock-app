/**
 * Unit tests for ForecastDisplay component
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ForecastDisplay } from "../ForecastDisplay";
import { ForecastData } from "@/types";

let mockResolvedTheme: "light" | "dark" = "light";

vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({ resolvedTheme: mockResolvedTheme }),
}));

const mockForecast: ForecastData = {
  priceTargets: { low: 120.0, average: 165.0, high: 210.0 },
  analystRatings: { strongBuy: 10, buy: 8, hold: 5, sell: 2, strongSell: 1 },
  epsForecasts: [
    {
      quarter: "Q1 2024",
      estimate: 1.5,
      actual: 1.65,
      surprise: 0.15,
      surprisePercent: 10.0,
    },
    {
      quarter: "Q2 2024",
      estimate: 1.6,
      actual: 1.45,
      surprise: -0.15,
      surprisePercent: -9.38,
    },
    { quarter: "Q3 2024", estimate: 1.7 },
  ],
  revenueForecasts: [
    { quarter: "Q1 2024", estimate: 50000000000, actual: 52000000000 },
    { quarter: "Q2 2024", estimate: 51000000000, actual: 49000000000 },
    { quarter: "Q3 2024", estimate: 53000000000 },
  ],
};

describe("ForecastDisplay", () => {
  beforeEach(() => {
    mockResolvedTheme = "light";
  });

  // Requirement 6.1: Display analyst price targets
  it("should display price target values (low, average, high)", () => {
    render(<ForecastDisplay forecast={mockForecast} />);
    expect(screen.getByText("$120.00")).toBeInTheDocument();
    expect(screen.getByText("$165.00")).toBeInTheDocument();
    expect(screen.getByText("$210.00")).toBeInTheDocument();
  });

  it("should render the price target visual range indicator", () => {
    render(<ForecastDisplay forecast={mockForecast} />);
    expect(screen.getByTestId("price-target-range")).toBeInTheDocument();
    expect(screen.getByTestId("price-target-marker")).toBeInTheDocument();
  });

  // Requirement 6.2: Display analyst rating distribution
  it("should display analyst rating counts", () => {
    render(<ForecastDisplay forecast={mockForecast} />);
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("should use high-contrast bar fills for Hold and Strong Sell in light mode", () => {
    render(<ForecastDisplay forecast={mockForecast} />);
    expect(screen.getByTestId("rating-bar-fill-2")).toHaveClass("bg-amber-700");
    expect(screen.getByTestId("rating-bar-fill-4")).toHaveClass("bg-rose-800");
  });

  it("should use high-contrast bar fills for Hold and Strong Sell in dark mode", () => {
    mockResolvedTheme = "dark";
    render(<ForecastDisplay forecast={mockForecast} />);
    expect(screen.getByTestId("rating-bar-fill-2")).toHaveClass("bg-amber-400");
    expect(screen.getByTestId("rating-bar-fill-4")).toHaveClass("bg-rose-500");
  });

  // Requirement 6.3: Display EPS and revenue forecasts
  it("should display EPS forecast quarters", () => {
    render(<ForecastDisplay forecast={mockForecast} />);
    expect(screen.getAllByText("Q1 2024").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Q2 2024").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Q3 2024").length).toBeGreaterThanOrEqual(1);
  });

  it("should display EPS estimate and actual values", () => {
    render(<ForecastDisplay forecast={mockForecast} />);
    expect(screen.getByText("Est: $1.50")).toBeInTheDocument();
    expect(screen.getByText("Act: $1.65")).toBeInTheDocument();
    expect(screen.getByText("Est: $1.60")).toBeInTheDocument();
    expect(screen.getByText("Act: $1.45")).toBeInTheDocument();
  });

  it("should display revenue forecasts with formatted values", () => {
    render(<ForecastDisplay forecast={mockForecast} />);
    expect(screen.getByText("Est: $50.00B")).toBeInTheDocument();
    expect(screen.getByText("Act: $52.00B")).toBeInTheDocument();
    expect(screen.getByText("Est: $51.00B")).toBeInTheDocument();
    expect(screen.getByText("Act: $49.00B")).toBeInTheDocument();
  });

  // Requirement 6.4: Indicate earnings beats/misses
  it("should show green Beat indicator for positive EPS surprise", () => {
    render(<ForecastDisplay forecast={mockForecast} />);
    const beats = screen.getAllByTestId("earnings-beat");
    expect(beats.length).toBeGreaterThanOrEqual(1);
    expect(beats[0].textContent).toContain("Beat");
  });

  it("should show red Missed indicator for negative EPS surprise", () => {
    render(<ForecastDisplay forecast={mockForecast} />);
    const misses = screen.getAllByTestId("earnings-miss");
    expect(misses.length).toBeGreaterThanOrEqual(1);
    expect(misses[0].textContent).toContain("Missed");
  });

  it("should show surprise percentage for EPS forecasts", () => {
    render(<ForecastDisplay forecast={mockForecast} />);
    expect(screen.getByText(/\+10\.00%/)).toBeInTheDocument();
    expect(screen.getByText(/-9\.38%/)).toBeInTheDocument();
  });

  it("should show Beat/Missed for revenue forecasts with actuals", () => {
    render(<ForecastDisplay forecast={mockForecast} />);
    // Revenue: Q1 beat (52B > 50B), Q2 missed (49B < 51B)
    const beats = screen.getAllByTestId("earnings-beat");
    const misses = screen.getAllByTestId("earnings-miss");
    // At least 1 beat from EPS + 1 from revenue, 1 miss from EPS + 1 from revenue
    expect(beats.length).toBe(2);
    expect(misses.length).toBe(2);
  });

  // Requirement 6.5: Tooltips on hover
  it("should show tooltip on hover over Price Targets heading", () => {
    render(<ForecastDisplay forecast={mockForecast} />);
    const hoverTarget = screen.getByLabelText("More info about Price Targets");
    fireEvent.mouseEnter(hoverTarget);
    expect(
      screen.getByText(/Analyst price targets represent/)
    ).toBeInTheDocument();
  });

  it("should show tooltip on hover over Analyst Ratings heading", () => {
    render(<ForecastDisplay forecast={mockForecast} />);
    const hoverTarget = screen.getByLabelText(
      "More info about Analyst Ratings"
    );
    fireEvent.mouseEnter(hoverTarget);
    expect(
      screen.getByText(/Analyst ratings show the distribution/)
    ).toBeInTheDocument();
  });

  it("should show tooltip on hover over EPS Forecasts heading", () => {
    render(<ForecastDisplay forecast={mockForecast} />);
    const hoverTarget = screen.getByLabelText("More info about EPS Forecasts");
    fireEvent.mouseEnter(hoverTarget);
    expect(screen.getByText(/Earnings Per Share/)).toBeInTheDocument();
  });

  it("should show tooltip on hover over Revenue Forecasts heading", () => {
    render(<ForecastDisplay forecast={mockForecast} />);
    const hoverTarget = screen.getByLabelText(
      "More info about Revenue Forecasts"
    );
    fireEvent.mouseEnter(hoverTarget);
    expect(
      screen.getByText(/Revenue forecasts compare analyst estimates/)
    ).toBeInTheDocument();
  });

  it("should hide tooltip on mouse leave", () => {
    render(<ForecastDisplay forecast={mockForecast} />);
    const hoverTarget = screen.getByLabelText("More info about Price Targets");
    fireEvent.mouseEnter(hoverTarget);
    expect(
      screen.getByText(/Analyst price targets represent/)
    ).toBeInTheDocument();
    fireEvent.mouseLeave(hoverTarget);
    expect(
      screen.queryByText(/Analyst price targets represent/)
    ).not.toBeInTheDocument();
  });

  // Loading skeleton
  it("should render loading skeleton when forecast is null", () => {
    const { container } = render(<ForecastDisplay forecast={null} />);
    expect(screen.getByText("Forecast Data")).toBeInTheDocument();
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(4);
  });

  it("should render loading skeleton when forecast is undefined", () => {
    const { container } = render(<ForecastDisplay forecast={undefined} />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(4);
  });

  // Help icons
  it("should display help icons for each section", () => {
    render(<ForecastDisplay forecast={mockForecast} />);
    const helpIcons = screen.getAllByText("?");
    expect(helpIcons.length).toBe(4);
  });

  // Edge case: no surprise data
  it("should not show surprise indicator when surprise is zero", () => {
    const noSurprise: ForecastData = {
      ...mockForecast,
      epsForecasts: [
        {
          quarter: "Q1 2024",
          estimate: 1.5,
          actual: 1.5,
          surprise: 0,
          surprisePercent: 0,
        },
      ],
      revenueForecasts: [
        { quarter: "Q1 2024", estimate: 50000000000, actual: 50000000000 },
      ],
    };
    render(<ForecastDisplay forecast={noSurprise} />);
    expect(screen.queryByTestId("earnings-beat")).not.toBeInTheDocument();
    expect(screen.queryByTestId("earnings-miss")).not.toBeInTheDocument();
  });

  // Edge case: no actual data (future quarters)
  it("should not show actual values for future quarters", () => {
    const futureOnly: ForecastData = {
      ...mockForecast,
      epsForecasts: [{ quarter: "Q4 2025", estimate: 2.0 }],
      revenueForecasts: [{ quarter: "Q4 2025", estimate: 60000000000 }],
    };
    render(<ForecastDisplay forecast={futureOnly} />);
    expect(screen.queryByText(/Act:/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("earnings-beat")).not.toBeInTheDocument();
    expect(screen.queryByTestId("earnings-miss")).not.toBeInTheDocument();
  });
});
