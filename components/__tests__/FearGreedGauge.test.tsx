/**
 * FearGreedGauge Component Tests
 * Tests for gauge visualization, data display, tooltip, loading/error states
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FearGreedGauge } from "../FearGreedGauge";
import { FearGreedData } from "@/types";

// Mock useTheme
vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({
    theme: "light",
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

const mockData: FearGreedData = {
  value: 35,
  label: "Fear",
  timestamp: new Date("2024-01-15"),
  history: [
    { date: new Date("2024-01-01"), value: 20 },
    { date: new Date("2024-01-08"), value: 30 },
    { date: new Date("2024-01-15"), value: 35 },
  ],
};

describe("FearGreedGauge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should display current index value when data is provided (Req 9.1)", () => {
    render(<FearGreedGauge data={mockData} />);
    expect(screen.getByTestId("fear-greed-value").textContent).toBe("35");
  });

  it("should render gauge visualization (Req 9.2)", () => {
    render(<FearGreedGauge data={mockData} />);
    const svg = screen.getByRole("img", { name: /fear and greed gauge/i });
    expect(svg).toBeDefined();
    expect(svg.tagName).toBe("svg");
  });

  it("should display historical timeline when history data exists (Req 9.3)", () => {
    render(<FearGreedGauge data={mockData} />);
    expect(screen.getByTestId("fear-greed-history")).toBeDefined();
    expect(
      screen.getByRole("img", { name: /historical timeline/i })
    ).toBeDefined();
  });

  it("should label ranges: Extreme Fear, Fear, Neutral, Greed, Extreme Greed (Req 9.4)", () => {
    render(<FearGreedGauge data={mockData} />);
    expect(screen.getAllByText(/Extreme Fear/).length).toBeGreaterThanOrEqual(
      1
    );
    expect(screen.getAllByText(/^Fear$/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/^Neutral$/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/^Greed$/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Extreme Greed/).length).toBeGreaterThanOrEqual(
      1
    );
  });

  it("should display the current label matching the value (Req 9.4)", () => {
    render(<FearGreedGauge data={mockData} />);
    expect(screen.getByTestId("fear-greed-label").textContent).toBe("Fear");
  });

  it("should show tooltip on hover explaining the index (Req 9.5)", async () => {
    render(<FearGreedGauge data={mockData} />);
    const infoButton = screen.getByLabelText(
      "What is the Fear and Greed Index?"
    );
    fireEvent.mouseEnter(infoButton.parentElement!);

    await waitFor(() => {
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toBeDefined();
      expect(tooltip.textContent).toContain("market sentiment");
    });
  });

  it("should hide tooltip on mouse leave", async () => {
    render(<FearGreedGauge data={mockData} />);
    const infoButton = screen.getByLabelText(
      "What is the Fear and Greed Index?"
    );
    const parent = infoButton.parentElement!;

    fireEvent.mouseEnter(parent);
    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toBeDefined();
    });

    fireEvent.mouseLeave(parent);
    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).toBeNull();
    });
  });

  it("should show loading state when fetching data", () => {
    vi.mocked(global.fetch).mockImplementation(
      () => new Promise(() => {}) // never resolves
    );
    render(<FearGreedGauge />);
    expect(screen.getByTestId("fear-greed-loading")).toBeDefined();
  });

  it("should show error state on fetch failure", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: "API error" }),
    });

    render(<FearGreedGauge />);

    await waitFor(() => {
      expect(screen.getByTestId("fear-greed-error")).toBeDefined();
      expect(
        screen.getByText("We couldn't load the Fear & Greed index. Try again.")
      ).toBeDefined();
    });
  });

  it("should fetch data from API when no data prop is provided", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockData }),
    });

    render(<FearGreedGauge />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/market/fear-greed?limit=30"
      );
      expect(screen.getByTestId("fear-greed-value").textContent).toBe("35");
    });
  });

  it("should not fetch when data prop is provided", () => {
    render(<FearGreedGauge data={mockData} />);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should display Extreme Fear label for value <= 25", () => {
    render(
      <FearGreedGauge
        data={{ ...mockData, value: 10, label: "Extreme Fear" }}
      />
    );
    expect(screen.getByTestId("fear-greed-label").textContent).toBe(
      "Extreme Fear"
    );
    expect(screen.getByTestId("fear-greed-value").textContent).toBe("10");
  });

  it("should display Extreme Greed label for value > 75", () => {
    render(
      <FearGreedGauge
        data={{ ...mockData, value: 90, label: "Extreme Greed" }}
      />
    );
    expect(screen.getByTestId("fear-greed-label").textContent).toBe(
      "Extreme Greed"
    );
    expect(screen.getByTestId("fear-greed-value").textContent).toBe("90");
  });

  it("should clamp value to 0-100 range", () => {
    render(
      <FearGreedGauge
        data={{ ...mockData, value: 150, label: "Extreme Greed" }}
      />
    );
    expect(screen.getByTestId("fear-greed-value").textContent).toBe("100");
  });

  it("should not render history section when history is empty", () => {
    render(<FearGreedGauge data={{ ...mockData, history: [] }} />);
    expect(screen.queryByTestId("fear-greed-history")).toBeNull();
  });

  it("should have retry button on error", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });

    render(<FearGreedGauge />);

    await waitFor(() => {
      expect(screen.getByText("Try again")).toBeDefined();
    });
  });
});
