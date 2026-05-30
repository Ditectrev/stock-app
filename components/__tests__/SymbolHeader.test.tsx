/**
 * Unit tests for SymbolHeader component
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SymbolHeader } from "../SymbolHeader";
import { SymbolData } from "@/types";

// Mock theme context
vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

describe("SymbolHeader", () => {
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

  it("should render symbol and name", () => {
    render(<SymbolHeader symbolData={mockSymbolData} />);

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("Apple Inc.")).toBeInTheDocument();
  });

  it("should display current price", () => {
    render(<SymbolHeader symbolData={mockSymbolData} />);

    expect(screen.getByText("$150.25")).toBeInTheDocument();
  });

  it("should display positive change with green color", () => {
    render(<SymbolHeader symbolData={mockSymbolData} />);

    const changeElement = screen.getByText(/\+2\.50/);
    expect(changeElement).toBeInTheDocument();
    expect(changeElement).toHaveClass("text-green-700");
  });

  it("should display negative change with red color", () => {
    const negativeData: SymbolData = {
      ...mockSymbolData,
      change: -2.5,
      changePercent: -1.69,
    };

    render(<SymbolHeader symbolData={negativeData} />);

    const changeElement = screen.getByText(/-2\.50/);
    expect(changeElement).toBeInTheDocument();
    expect(changeElement).toHaveClass("text-red-700");
  });

  it("should display change percentage", () => {
    render(<SymbolHeader symbolData={mockSymbolData} />);

    expect(screen.getByText(/\+1\.69%/)).toBeInTheDocument();
  });

  it("should display last updated timestamp", () => {
    render(<SymbolHeader symbolData={mockSymbolData} />);

    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it("should handle zero change", () => {
    const zeroChangeData: SymbolData = {
      ...mockSymbolData,
      change: 0,
      changePercent: 0,
    };

    render(<SymbolHeader symbolData={zeroChangeData} />);

    expect(screen.getByText(/\+0\.00/)).toBeInTheDocument();
  });
});
