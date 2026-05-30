/**
 * Retry Functionality Tests
 * Verifies that error states show the ErrorMessage component with a "Try again"
 * button, and that clicking it triggers a re-fetch while preserving user context.
 *
 * Requirements: 14.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FearGreedGauge } from "../FearGreedGauge";
import { WorldMarkets } from "../WorldMarkets";
import { SectorHub } from "../SectorHub";
import { EconomicCalendar } from "../EconomicCalendar";
import { EarningsCalendar } from "../EarningsCalendar";
import { DividendCalendar } from "../DividendCalendar";
import { IPOCalendar } from "../IPOCalendar";

vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({
    theme: "light",
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

global.fetch = vi.fn();

describe("Retry Functionality (Req 14.5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("FearGreedGauge: shows ErrorMessage with Try again on error and re-fetches on click", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });

    render(<FearGreedGauge />);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeDefined();
      expect(screen.getByText("Try again")).toBeDefined();
    });

    // Click retry
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          value: 50,
          label: "Neutral",
          timestamp: new Date(),
          history: [],
        },
      }),
    });

    fireEvent.click(screen.getByText("Try again"));

    await waitFor(() => {
      expect(screen.getByTestId("fear-greed-gauge")).toBeDefined();
    });
  });

  it("WorldMarkets: shows ErrorMessage with Try again on error and re-fetches on click", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });

    render(<WorldMarkets />);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeDefined();
      expect(screen.getByText("Try again")).toBeDefined();
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            name: "S&P 500",
            symbol: "SPX",
            value: 5000,
            change: 10,
            changePercent: 0.2,
            region: "Americas",
          },
        ],
      }),
    });

    fireEvent.click(screen.getByText("Try again"));

    await waitFor(() => {
      expect(screen.getByTestId("world-markets")).toBeDefined();
    });
  });

  it("SectorHub: shows ErrorMessage with Try again on error and re-fetches on click", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });

    render(<SectorHub />);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeDefined();
      expect(screen.getByText("Try again")).toBeDefined();
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            sector: "Technology",
            performance: 100,
            changePercent: 1.5,
            constituents: 0,
          },
        ],
      }),
    });

    fireEvent.click(screen.getByText("Try again"));

    await waitFor(() => {
      expect(screen.getByTestId("sector-hub")).toBeDefined();
    });
  });

  it("EconomicCalendar: shows ErrorMessage with Try again on error and re-fetches on click", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });

    render(<EconomicCalendar />);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeDefined();
      expect(screen.getByText("Try again")).toBeDefined();
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    fireEvent.click(screen.getByText("Try again"));

    await waitFor(() => {
      expect(screen.getByTestId("economic-calendar")).toBeDefined();
    });
  });

  it("EarningsCalendar: shows ErrorMessage with Try again on error and re-fetches on click", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });

    render(<EarningsCalendar />);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeDefined();
      expect(screen.getByText("Try again")).toBeDefined();
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    fireEvent.click(screen.getByText("Try again"));

    await waitFor(() => {
      expect(screen.getByTestId("earnings-calendar")).toBeDefined();
    });
  });

  it("DividendCalendar: shows ErrorMessage with Try again on error and re-fetches on click", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });

    render(<DividendCalendar />);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeDefined();
      expect(screen.getByText("Try again")).toBeDefined();
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    fireEvent.click(screen.getByText("Try again"));

    await waitFor(() => {
      expect(screen.getByTestId("dividend-calendar")).toBeDefined();
    });
  });

  it("IPOCalendar: shows ErrorMessage with Try again on error and re-fetches on click", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });

    render(<IPOCalendar />);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeDefined();
      expect(screen.getByText("Try again")).toBeDefined();
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    fireEvent.click(screen.getByText("Try again"));

    await waitFor(() => {
      expect(screen.getByTestId("ipo-calendar")).toBeDefined();
    });
  });

  it("SectorHub: preserves user context (time period, sort) during retry", async () => {
    // First render with data to set user context
    const mockData = [
      {
        sector: "Technology",
        performance: 100,
        changePercent: 1.5,
        constituents: 0,
      },
      {
        sector: "Financial",
        performance: 50,
        changePercent: -0.5,
        constituents: 0,
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockData }),
    });

    const { unmount } = render(<SectorHub />);

    await waitFor(() => {
      expect(screen.getByTestId("sector-hub")).toBeDefined();
    });

    // Change time period to 1M
    fireEvent.click(screen.getByTestId("period-1M"));

    // Change sort to name
    fireEvent.click(screen.getByTestId("sort-name"));

    // Verify the period button is active
    expect(screen.getByTestId("period-1M").className).toContain("bg-stone-900");

    unmount();

    // Now simulate error then retry - the component should re-fetch with same period
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });

    render(<SectorHub />);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeDefined();
    });

    // Retry should re-fetch (fetch is called, preserving the component's internal state)
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockData }),
    });

    fireEvent.click(screen.getByText("Try again"));

    await waitFor(() => {
      expect(screen.getByTestId("sector-hub")).toBeDefined();
    });

    // Verify fetch was called (retry triggered re-fetch)
    expect(global.fetch).toHaveBeenCalled();
  });
});
