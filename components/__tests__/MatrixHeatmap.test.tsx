/**
 * MatrixHeatmap Unit Tests
 * Tests for matrix layout rendering and cell color coding.
 *
 * Requirements: 25.10, 25.11
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  MatrixHeatmap,
  MatrixRow,
  MatrixColumn,
  MatrixCellData,
} from "../MatrixHeatmap";

vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({
    theme: "light",
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

const mockRows: MatrixRow[] = [
  { key: "AAPL", label: "Apple" },
  { key: "MSFT", label: "Microsoft" },
  { key: "XOM", label: "Exxon Mobil" },
];

const mockColumns: MatrixColumn[] = [
  { key: "1D", label: "1 Day" },
  { key: "1W", label: "1 Week" },
  { key: "1M", label: "1 Month" },
];

const mockCells: MatrixCellData[] = [
  { rowKey: "AAPL", colKey: "1D", value: 2.5 },
  { rowKey: "AAPL", colKey: "1W", value: -1.2 },
  { rowKey: "AAPL", colKey: "1M", value: 5.8 },
  { rowKey: "MSFT", colKey: "1D", value: -3.1 },
  { rowKey: "MSFT", colKey: "1W", value: 0 },
  { rowKey: "MSFT", colKey: "1M", value: 1.4 },
  { rowKey: "XOM", colKey: "1D", value: 0 },
  { rowKey: "XOM", colKey: "1W", value: -7.5 },
  { rowKey: "XOM", colKey: "1M", value: 9.2 },
];

describe("MatrixHeatmap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Matrix layout (Req 25.10) ---

  it("should render a table with correct row and column headers", () => {
    render(
      <MatrixHeatmap rows={mockRows} columns={mockColumns} cells={mockCells} />
    );
    expect(screen.getByTestId("matrix-heatmap-table")).toBeDefined();

    // Column headers
    for (const col of mockColumns) {
      expect(
        screen.getByTestId(`matrix-col-header-${col.key}`).textContent
      ).toBe(col.label);
    }

    // Row headers
    for (const row of mockRows) {
      expect(
        screen.getByTestId(`matrix-row-header-${row.key}`).textContent
      ).toBe(row.label);
    }
  });

  it("should render a cell for each row/column combination", () => {
    render(
      <MatrixHeatmap rows={mockRows} columns={mockColumns} cells={mockCells} />
    );
    for (const row of mockRows) {
      for (const col of mockColumns) {
        expect(
          screen.getByTestId(`matrix-cell-${row.key}-${col.key}`)
        ).toBeDefined();
      }
    }
  });

  it("should render correct number of rows", () => {
    render(
      <MatrixHeatmap rows={mockRows} columns={mockColumns} cells={mockCells} />
    );
    for (const row of mockRows) {
      expect(screen.getByTestId(`matrix-row-${row.key}`)).toBeDefined();
    }
  });

  it("should display formatted percentage values in cells", () => {
    render(
      <MatrixHeatmap rows={mockRows} columns={mockColumns} cells={mockCells} />
    );
    expect(screen.getByTestId("matrix-cell-AAPL-1D").textContent).toBe(
      "+2.50%"
    );
    expect(screen.getByTestId("matrix-cell-MSFT-1D").textContent).toBe(
      "-3.10%"
    );
    expect(screen.getByTestId("matrix-cell-MSFT-1W").textContent).toBe(
      "+0.00%"
    );
  });

  it("should use displayValue override when provided", () => {
    const cells: MatrixCellData[] = [
      { rowKey: "AAPL", colKey: "1D", value: 2.5, displayValue: "Custom" },
    ];
    render(
      <MatrixHeatmap
        rows={[mockRows[0]]}
        columns={[mockColumns[0]]}
        cells={cells}
      />
    );
    expect(screen.getByTestId("matrix-cell-AAPL-1D").textContent).toBe(
      "Custom"
    );
  });

  // --- Cell color coding (Req 25.11) ---

  it("should apply green background for positive values", () => {
    render(
      <MatrixHeatmap rows={mockRows} columns={mockColumns} cells={mockCells} />
    );
    const cell = screen.getByTestId("matrix-cell-AAPL-1D");
    // Positive → green rgba(34,197,94,...)
    expect(cell.style.backgroundColor).toContain("34, 197, 94");
  });

  it("should apply red background for negative values", () => {
    render(
      <MatrixHeatmap rows={mockRows} columns={mockColumns} cells={mockCells} />
    );
    const cell = screen.getByTestId("matrix-cell-MSFT-1D");
    // Negative → red rgba(239,68,68,...)
    expect(cell.style.backgroundColor).toContain("239, 68, 68");
  });

  it("should apply neutral background for zero values", () => {
    render(
      <MatrixHeatmap rows={mockRows} columns={mockColumns} cells={mockCells} />
    );
    const cell = screen.getByTestId("matrix-cell-MSFT-1W");
    // Zero → neutral stone
    expect(cell.style.backgroundColor).toContain("168, 162, 158");
  });

  it("should vary color intensity based on magnitude", () => {
    const cells: MatrixCellData[] = [
      { rowKey: "AAPL", colKey: "1D", value: 0.5 },
      { rowKey: "AAPL", colKey: "1W", value: 9.0 },
    ];
    render(
      <MatrixHeatmap
        rows={[mockRows[0]]}
        columns={mockColumns.slice(0, 2)}
        cells={cells}
      />
    );
    const smallCell = screen.getByTestId("matrix-cell-AAPL-1D");
    const bigCell = screen.getByTestId("matrix-cell-AAPL-1W");

    const smallAlpha = parseFloat(
      smallCell.style.backgroundColor.split(",")[3]
    );
    const bigAlpha = parseFloat(bigCell.style.backgroundColor.split(",")[3]);
    expect(bigAlpha).toBeGreaterThan(smallAlpha);
  });

  it("should render a color legend", () => {
    render(
      <MatrixHeatmap rows={mockRows} columns={mockColumns} cells={mockCells} />
    );
    const legend = screen.getByTestId("matrix-heatmap-legend");
    expect(legend).toBeDefined();
    expect(legend.textContent).toContain("Strong decline");
    expect(legend.textContent).toContain("Strong gain");
  });

  // --- Interaction ---

  it("should call onCellClick when a cell is clicked", () => {
    const onClick = vi.fn();
    render(
      <MatrixHeatmap
        rows={mockRows}
        columns={mockColumns}
        cells={mockCells}
        onCellClick={onClick}
      />
    );
    fireEvent.click(screen.getByTestId("matrix-cell-AAPL-1D"));
    expect(onClick).toHaveBeenCalledWith(mockCells[0]);
  });

  it("should call onCellClick on Enter key press", () => {
    const onClick = vi.fn();
    render(
      <MatrixHeatmap
        rows={mockRows}
        columns={mockColumns}
        cells={mockCells}
        onCellClick={onClick}
      />
    );
    fireEvent.keyDown(screen.getByTestId("matrix-cell-AAPL-1D"), {
      key: "Enter",
    });
    expect(onClick).toHaveBeenCalledWith(mockCells[0]);
  });

  it("should highlight cell on hover", () => {
    render(
      <MatrixHeatmap rows={mockRows} columns={mockColumns} cells={mockCells} />
    );
    const cell = screen.getByTestId("matrix-cell-AAPL-1D");
    expect(cell.className).not.toContain("ring-2");

    fireEvent.mouseEnter(cell);
    expect(cell.className).toContain("ring-2");

    fireEvent.mouseLeave(cell);
    expect(cell.className).not.toContain("ring-2");
  });

  // --- Loading and empty states ---

  it("should show loading state", () => {
    render(
      <MatrixHeatmap
        rows={mockRows}
        columns={mockColumns}
        cells={mockCells}
        loading={true}
      />
    );
    expect(screen.getByTestId("matrix-heatmap-loading")).toBeDefined();
  });

  it("should show empty state when rows are empty", () => {
    render(<MatrixHeatmap rows={[]} columns={mockColumns} cells={[]} />);
    expect(screen.getByTestId("matrix-heatmap-empty")).toBeDefined();
    expect(screen.getByText("No matrix data available.")).toBeDefined();
  });

  it("should show empty state when columns are empty", () => {
    render(<MatrixHeatmap rows={mockRows} columns={[]} cells={[]} />);
    expect(screen.getByTestId("matrix-heatmap-empty")).toBeDefined();
  });

  // --- Accessibility ---

  it("should have proper ARIA attributes", () => {
    render(
      <MatrixHeatmap rows={mockRows} columns={mockColumns} cells={mockCells} />
    );
    const region = screen.getByTestId("matrix-heatmap");
    expect(region.getAttribute("role")).toBe("region");
    expect(region.getAttribute("aria-label")).toBe("Matrix heatmap");

    const table = screen.getByTestId("matrix-heatmap-table");
    expect(table.getAttribute("role")).toBe("grid");

    const cell = screen.getByTestId("matrix-cell-AAPL-1D");
    expect(cell.getAttribute("role")).toBe("gridcell");
    expect(cell.getAttribute("tabindex")).toBe("0");
    expect(cell.getAttribute("aria-label")).toContain("Apple");
    expect(cell.getAttribute("aria-label")).toContain("1 Day");
    expect(cell.getAttribute("aria-label")).toContain("+2.50%");
  });

  // --- Missing cell data ---

  it("should render +0.00% for cells with no matching data", () => {
    render(<MatrixHeatmap rows={mockRows} columns={mockColumns} cells={[]} />);
    const cell = screen.getByTestId("matrix-cell-AAPL-1D");
    expect(cell.textContent).toBe("+0.00%");
    // Should get neutral stone color
    expect(cell.style.backgroundColor).toContain("168, 162, 158");
  });
});
