/**
 * ScreenerTableView Component Tests
 * Tests for table rendering, sorting, pagination, valuation color-coding,
 * symbol click navigation, and empty state.
 *
 * Requirements: 26.9, 26.16, 26.18, 26.19, 26.21, 26.22
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { ScreenerTableView } from "../ScreenerTableView";
import type { ScreenerResult, ValuationContext } from "@/types";

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
    peRatio: 28.5,
    valuationContext: "fair",
    matchScore: 85,
    ...overrides,
  };
}

function makeManyResults(count: number): ScreenerResult[] {
  return Array.from({ length: count }, (_, i) =>
    makeResult({
      symbol: `SYM${String(i).padStart(3, "0")}`,
      name: `Company ${i}`,
      price: 100 + i,
      changePercent: i % 3 === 0 ? -1.5 : 2.3,
      volume: 1_000_000 * (i + 1),
      marketCap: 1_000_000_000 * (i + 1),
      peRatio: 10 + i,
      sector: i % 2 === 0 ? "Technology" : "Healthcare",
      valuationContext: (
        ["fair", "overpriced", "underpriced"] as ValuationContext[]
      )[i % 3],
      matchScore: 50 + i,
    })
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ScreenerTableView", () => {
  // --- Empty state (Req 26.9) ---

  it("should show 'No results' when results array is empty", () => {
    render(<ScreenerTableView results={[]} />);
    expect(screen.getByText("No results")).toBeDefined();
  });

  it("should not render a table when results are empty", () => {
    render(<ScreenerTableView results={[]} />);
    expect(screen.queryByRole("table")).toBeNull();
  });

  // --- Table rendering with data (Req 26.9, 26.16) ---

  it("should render all column headers", () => {
    render(<ScreenerTableView results={[makeResult()]} />);
    const headers = [
      "Symbol",
      "Name",
      "Price",
      "Change %",
      "Volume",
      "Market Cap",
      "P/E",
      "Sector",
      "Valuation",
    ];
    for (const h of headers) {
      expect(screen.getByText(h)).toBeDefined();
    }
  });

  it("should render result data with formatted values (Req 26.16)", () => {
    render(<ScreenerTableView results={[makeResult()]} />);
    expect(screen.getByText("AAPL")).toBeDefined();
    expect(screen.getByText("Apple Inc.")).toBeDefined();
    expect(screen.getByText("$180.50")).toBeDefined();
    expect(screen.getByText("+1.25%")).toBeDefined();
    expect(screen.getByText("50,000,000")).toBeDefined();
    expect(screen.getByText("$2.8T")).toBeDefined();
    expect(screen.getByText("28.5")).toBeDefined();
    expect(screen.getByText("Technology")).toBeDefined();
    expect(screen.getByText("fair")).toBeDefined();
  });

  it("should format market cap abbreviations correctly", () => {
    const results = [
      makeResult({ symbol: "A", marketCap: 500_000_000 }),
      makeResult({ symbol: "B", marketCap: 5_000_000_000 }),
      makeResult({ symbol: "C", marketCap: 1_500_000_000_000 }),
    ];
    render(<ScreenerTableView results={results} />);
    expect(screen.getByText("$500.0M")).toBeDefined();
    expect(screen.getByText("$5.0B")).toBeDefined();
    expect(screen.getByText("$1.5T")).toBeDefined();
  });

  it("should show dash for missing P/E ratio", () => {
    render(
      <ScreenerTableView results={[makeResult({ peRatio: undefined })]} />
    );
    expect(screen.getByText("—")).toBeDefined();
  });

  it("should format negative change percent with minus sign", () => {
    render(
      <ScreenerTableView results={[makeResult({ changePercent: -3.14 })]} />
    );
    expect(screen.getByText("-3.14%")).toBeDefined();
  });

  // --- Column sorting (Req 26.21) ---

  it("should sort by column ascending on first click", () => {
    const results = [
      makeResult({ symbol: "MSFT", price: 400 }),
      makeResult({ symbol: "AAPL", price: 180 }),
      makeResult({ symbol: "GOOG", price: 150 }),
    ];
    render(<ScreenerTableView results={results} />);

    fireEvent.click(screen.getByText("Price"));

    const rows = screen.getAllByTestId(/^row-/);
    expect(rows[0].getAttribute("data-testid")).toBe("row-GOOG");
    expect(rows[1].getAttribute("data-testid")).toBe("row-AAPL");
    expect(rows[2].getAttribute("data-testid")).toBe("row-MSFT");
  });

  it("should toggle sort direction on second click", () => {
    const results = [
      makeResult({ symbol: "MSFT", price: 400 }),
      makeResult({ symbol: "AAPL", price: 180 }),
      makeResult({ symbol: "GOOG", price: 150 }),
    ];
    render(<ScreenerTableView results={results} />);

    fireEvent.click(screen.getByText("Price"));
    fireEvent.click(screen.getByText("Price"));

    const rows = screen.getAllByTestId(/^row-/);
    expect(rows[0].getAttribute("data-testid")).toBe("row-MSFT");
    expect(rows[2].getAttribute("data-testid")).toBe("row-GOOG");
  });

  it("should display sort indicator arrow on active column", () => {
    render(<ScreenerTableView results={[makeResult()]} />);

    // Default sort is symbol asc
    const symbolHeader = screen.getByText("Symbol").closest("th")!;
    expect(symbolHeader.textContent).toContain("▲");

    fireEvent.click(screen.getByText("Price"));
    const priceHeader = screen.getByText("Price").closest("th")!;
    expect(priceHeader.textContent).toContain("▲");

    // Symbol header should no longer have arrow
    expect(screen.getByText("Symbol").closest("th")!.textContent).not.toContain(
      "▲"
    );
  });

  it("should set aria-sort on the active column header", () => {
    render(<ScreenerTableView results={[makeResult()]} />);

    const symbolTh = screen.getByText("Symbol").closest("th")!;
    expect(symbolTh.getAttribute("aria-sort")).toBe("ascending");

    fireEvent.click(screen.getByText("Symbol"));
    expect(symbolTh.getAttribute("aria-sort")).toBe("descending");
  });

  // --- Valuation context color coding (Req 26.18) ---

  it("should apply red tint to overpriced rows", () => {
    render(
      <ScreenerTableView
        results={[makeResult({ valuationContext: "overpriced" })]}
      />
    );
    const row = screen.getByTestId("row-AAPL");
    expect(row.className).toContain("bg-rose-50");
  });

  it("should apply green tint to underpriced rows", () => {
    render(
      <ScreenerTableView
        results={[makeResult({ valuationContext: "underpriced" })]}
      />
    );
    const row = screen.getByTestId("row-AAPL");
    expect(row.className).toContain("bg-emerald-50");
  });

  it("should not apply tint to fair rows", () => {
    render(
      <ScreenerTableView results={[makeResult({ valuationContext: "fair" })]} />
    );
    const row = screen.getByTestId("row-AAPL");
    expect(row.className).not.toContain("bg-rose-50");
    expect(row.className).not.toContain("bg-emerald-50");
  });

  // --- Change % color coding ---

  it("should color positive change green and negative change red", () => {
    const results = [
      makeResult({ symbol: "UP", changePercent: 2.5 }),
      makeResult({ symbol: "DOWN", changePercent: -1.5 }),
    ];
    render(<ScreenerTableView results={results} />);

    const upRow = screen.getByTestId("row-UP");
    const upChange = within(upRow).getByText("+2.50%");
    expect(upChange.className).toContain("text-emerald-800");

    const downRow = screen.getByTestId("row-DOWN");
    const downChange = within(downRow).getByText("-1.50%");
    expect(downChange.className).toContain("text-rose-800");
  });

  // --- Symbol click navigation (Req 26.19) ---

  it("should call onSymbolClick when a row is clicked", () => {
    const onClick = vi.fn();
    render(
      <ScreenerTableView
        results={[makeResult({ symbol: "TSLA" })]}
        onSymbolClick={onClick}
      />
    );

    fireEvent.click(screen.getByTestId("row-TSLA"));
    expect(onClick).toHaveBeenCalledWith("TSLA");
  });

  it("should not throw when row clicked without onSymbolClick", () => {
    render(<ScreenerTableView results={[makeResult({ symbol: "TSLA" })]} />);
    expect(() => {
      fireEvent.click(screen.getByTestId("row-TSLA"));
    }).not.toThrow();
  });

  // --- Pagination (Req 26.22) ---

  it("should not show pagination when results <= 50", () => {
    render(<ScreenerTableView results={makeManyResults(50)} />);
    expect(screen.queryByText("Previous")).toBeNull();
    expect(screen.queryByText("Next")).toBeNull();
  });

  it("should show pagination when results > 50", () => {
    render(<ScreenerTableView results={makeManyResults(75)} />);
    expect(screen.getByText("Previous")).toBeDefined();
    expect(screen.getByText("Next")).toBeDefined();
    expect(screen.getByText("Page 1 of 2")).toBeDefined();
  });

  it("should show 50 rows on first page", () => {
    render(<ScreenerTableView results={makeManyResults(75)} />);
    const rows = screen.getAllByTestId(/^row-/);
    expect(rows.length).toBe(50);
  });

  it("should navigate to next page and show remaining rows", () => {
    render(<ScreenerTableView results={makeManyResults(75)} />);

    fireEvent.click(screen.getByText("Next"));

    expect(screen.getByText("Page 2 of 2")).toBeDefined();
    const rows = screen.getAllByTestId(/^row-/);
    expect(rows.length).toBe(25);
  });

  it("should navigate back to previous page", () => {
    render(<ScreenerTableView results={makeManyResults(75)} />);

    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Previous"));

    expect(screen.getByText("Page 1 of 2")).toBeDefined();
    const rows = screen.getAllByTestId(/^row-/);
    expect(rows.length).toBe(50);
  });

  it("should disable Previous on first page", () => {
    render(<ScreenerTableView results={makeManyResults(75)} />);
    const prevBtn = screen.getByText("Previous") as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);
  });

  it("should disable Next on last page", () => {
    render(<ScreenerTableView results={makeManyResults(75)} />);
    fireEvent.click(screen.getByText("Next"));
    const nextBtn = screen.getByText("Next") as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(true);
  });

  it("should reset to page 1 when sort changes", () => {
    render(<ScreenerTableView results={makeManyResults(75)} />);

    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText("Page 2 of 2")).toBeDefined();

    fireEvent.click(screen.getByText("Price"));
    expect(screen.getByText("Page 1 of 2")).toBeDefined();
  });
});
