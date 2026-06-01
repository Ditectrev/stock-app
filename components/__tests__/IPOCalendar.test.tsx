/**
 * IPOCalendar Component Tests
 * Tests for IPO display, price range display, exchange display, loading/error states
 *
 * Requirements: 24.19, 24.20, 24.21
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { IPOCalendar } from "../IPOCalendar";
import { IPOEvent } from "@/types";

vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({
    theme: "light",
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

global.fetch = vi.fn();

const now = new Date();
const daysFromNow = (d: number) =>
  new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

const mockEvents: IPOEvent[] = [
  {
    id: "1",
    companyName: "Acme Corp",
    symbol: "ACME",
    expectedDate: daysFromNow(1),
    priceRangeLow: 18.0,
    priceRangeHigh: 22.0,
    sharesOffered: 15_000_000,
    exchange: "NYSE",
  },
  {
    id: "2",
    companyName: "Beta Technologies",
    expectedDate: daysFromNow(1),
    priceRangeLow: 10.5,
    priceRangeHigh: 13.5,
    exchange: "NASDAQ",
  },
  {
    id: "3",
    companyName: "Gamma Holdings",
    symbol: "GAMA",
    expectedDate: daysFromNow(5),
    sharesOffered: 500_000,
    exchange: "NYSE",
  },
  {
    id: "4",
    companyName: "Delta Inc",
    symbol: "DLTA",
    expectedDate: daysFromNow(10),
    priceRangeLow: 30.0,
    priceRangeHigh: 35.0,
    sharesOffered: 2_500_000,
    exchange: "AMEX",
  },
];

describe("IPOCalendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- IPO display (Req 24.19) ---

  it("should display IPO events with company name (Req 24.19)", () => {
    render(<IPOCalendar data={mockEvents} />);
    expect(screen.getByTestId("ipo-calendar")).toBeDefined();
    expect(screen.getByText("Acme Corp")).toBeDefined();
    expect(screen.getByText("Beta Technologies")).toBeDefined();
    expect(screen.getByText("Gamma Holdings")).toBeDefined();
    expect(screen.getByText("Delta Inc")).toBeDefined();
  });

  it("should display symbol when available (Req 24.19)", () => {
    render(<IPOCalendar data={mockEvents} />);
    expect(screen.getByTestId("symbol-1").textContent).toBe("ACME");
    expect(screen.getByTestId("symbol-3").textContent).toBe("GAMA");
    expect(screen.getByTestId("symbol-4").textContent).toBe("DLTA");
    // Beta Technologies has no symbol
    expect(screen.queryByTestId("symbol-2")).toBeNull();
  });

  it("should display expected listing date via day group headers (Req 24.19)", () => {
    render(<IPOCalendar data={mockEvents} />);
    const eventsList = screen.getByTestId("events-list");
    const dayGroups = eventsList.querySelectorAll(
      "[data-testid^='day-group-']"
    );
    // 3 distinct days: daysFromNow(1), daysFromNow(5), daysFromNow(10)
    expect(dayGroups.length).toBe(3);
  });

  it("should group events by day with correct counts", () => {
    render(<IPOCalendar data={mockEvents} />);
    // daysFromNow(1) has 2 events
    const firstDayHeader = screen
      .getByTestId("events-list")
      .querySelector("[data-testid^='day-header-']");
    expect(firstDayHeader?.textContent).toContain("2 IPOs");
  });

  // --- Price range display (Req 24.20) ---

  it("should display price range when both low and high are available (Req 24.20)", () => {
    render(<IPOCalendar data={mockEvents} />);
    const priceRange1 = screen.getByTestId("price-range-1");
    expect(priceRange1.textContent).toContain("18.00");
    expect(priceRange1.textContent).toContain("22.00");
  });

  it("should display price range with formatted values (Req 24.20)", () => {
    render(<IPOCalendar data={mockEvents} />);
    const priceRange2 = screen.getByTestId("price-range-2");
    expect(priceRange2.textContent).toContain("10.50");
    expect(priceRange2.textContent).toContain("13.50");
  });

  it("should not display price range when not available (Req 24.20)", () => {
    render(<IPOCalendar data={mockEvents} />);
    // Gamma Holdings has no price range
    expect(screen.queryByTestId("price-range-3")).toBeNull();
  });

  it("should display shares offered when available (Req 24.20)", () => {
    render(<IPOCalendar data={mockEvents} />);
    expect(screen.getByTestId("shares-1").textContent).toContain("15.0M");
    expect(screen.getByTestId("shares-3").textContent).toContain("500K");
    expect(screen.getByTestId("shares-4").textContent).toContain("2.5M");
    // Beta Technologies has no shares
    expect(screen.queryByTestId("shares-2")).toBeNull();
  });

  // --- Exchange display (Req 24.21) ---

  it("should display exchange for each IPO event (Req 24.21)", () => {
    render(<IPOCalendar data={mockEvents} />);
    expect(screen.getByTestId("exchange-1").textContent).toBe("NYSE");
    expect(screen.getByTestId("exchange-2").textContent).toBe("NASDAQ");
    expect(screen.getByTestId("exchange-3").textContent).toBe("NYSE");
    expect(screen.getByTestId("exchange-4").textContent).toBe("AMEX");
  });

  // --- Date filtering ---

  it("should filter events by date range", () => {
    render(<IPOCalendar data={mockEvents} />);
    const target = daysFromNow(5);
    const targetStr = target.toISOString().slice(0, 10);

    fireEvent.change(screen.getByTestId("start-date"), {
      target: { value: targetStr },
    });
    fireEvent.change(screen.getByTestId("end-date"), {
      target: { value: targetStr },
    });

    expect(screen.getByText("Gamma Holdings")).toBeDefined();
    expect(screen.queryByText("Acme Corp")).toBeNull();
    expect(screen.queryByText("Delta Inc")).toBeNull();
  });

  // --- Loading / Error / Empty states ---

  it("should show loading state when fetching data", () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
    render(<IPOCalendar />);
    expect(screen.getByTestId("ipo-calendar-loading")).toBeDefined();
  });

  it("should show error state on fetch failure with retry button", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: "API error" }),
    });

    render(<IPOCalendar />);

    await waitFor(() => {
      expect(screen.getByTestId("ipo-calendar-error")).toBeDefined();
      expect(screen.getByText("Try again")).toBeDefined();
    });
  });

  it("should fetch data from API when no data prop is provided", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockEvents }),
    });

    render(<IPOCalendar />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/calendar/ipos");
      expect(screen.getByTestId("ipo-calendar")).toBeDefined();
    });
  });

  it("should not fetch when data prop is provided", () => {
    render(<IPOCalendar data={mockEvents} />);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should show no-events message when data is empty", () => {
    render(<IPOCalendar data={[]} />);
    expect(screen.getByTestId("no-events")).toBeDefined();
  });
});
