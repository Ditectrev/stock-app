/**
 * EconomicCalendar Component Tests
 * Tests for event display, country filter, importance filter, loading/error states
 *
 * Requirements: 24.4, 24.5, 24.6, 24.7
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EconomicCalendar } from "../EconomicCalendar";
import { EconomicEvent } from "@/types";

vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({
    theme: "light",
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

global.fetch = vi.fn();

// Generate dates relative to today so tests always fall within the default date range
const now = new Date();
const daysFromNow = (d: number) =>
  new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

const mockEvents: EconomicEvent[] = [
  {
    id: "1",
    name: "Non-Farm Payrolls",
    country: "US",
    date: daysFromNow(1),
    time: "08:30",
    importance: "high",
    description: "Monthly employment report",
    previous: "175K",
    forecast: "180K",
  },
  {
    id: "2",
    name: "BOE Interest Rate Decision",
    country: "UK",
    date: daysFromNow(7),
    time: "12:00",
    importance: "high",
    description: "Bank of England rate decision",
  },
  {
    id: "3",
    name: "Consumer Confidence",
    country: "US",
    date: daysFromNow(14),
    importance: "medium",
    description: "Consumer confidence index",
    previous: "97.0",
    forecast: "96.5",
    actual: "98.0",
  },
  {
    id: "4",
    name: "Trade Balance",
    country: "JP",
    date: daysFromNow(10),
    importance: "low",
    description: "Japan trade balance data",
  },
];

describe("EconomicCalendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should display economic events with name, date, and description (Req 24.4)", () => {
    render(<EconomicCalendar data={mockEvents} />);
    expect(screen.getByTestId("economic-calendar")).toBeDefined();
    expect(screen.getByText("Non-Farm Payrolls")).toBeDefined();
    expect(screen.getByText("Monthly employment report")).toBeDefined();
    expect(screen.getByText("BOE Interest Rate Decision")).toBeDefined();
    expect(screen.getByText("Consumer Confidence")).toBeDefined();
    expect(screen.getByText("Trade Balance")).toBeDefined();
  });

  it("should display country flags for each event", () => {
    render(<EconomicCalendar data={mockEvents} />);
    // Flags are rendered as emoji with title attributes
    expect(screen.getAllByTitle("United States").length).toBe(2);
    expect(screen.getAllByTitle("United Kingdom").length).toBe(1);
    expect(screen.getAllByTitle("Japan").length).toBe(1);
  });

  it("should display importance badges with correct styling (Req 24.6)", () => {
    render(<EconomicCalendar data={mockEvents} />);
    const highBadge = screen.getByTestId("badge-1");
    expect(highBadge.textContent).toBe("high");
    expect(highBadge.className).toContain("bg-red-100");

    const medBadge = screen.getByTestId("badge-3");
    expect(medBadge.textContent).toBe("medium");
    expect(medBadge.className).toContain("bg-yellow-100");

    const lowBadge = screen.getByTestId("badge-4");
    expect(lowBadge.textContent).toBe("low");
    expect(lowBadge.className).toContain("bg-stone-100");
  });

  it("should display previous, forecast, and actual values when available", () => {
    render(<EconomicCalendar data={mockEvents} />);
    expect(screen.getByText("Prev: 175K")).toBeDefined();
    expect(screen.getByText("Fcst: 180K")).toBeDefined();
    expect(screen.getByText("Act: 98.0")).toBeDefined();
  });

  it("should filter events by country (Req 24.5, 24.7)", () => {
    render(<EconomicCalendar data={mockEvents} />);
    const select = screen.getByTestId("country-filter");

    fireEvent.change(select, { target: { value: "United Kingdom" } });

    expect(screen.getByText("BOE Interest Rate Decision")).toBeDefined();
    expect(screen.queryByText("Non-Farm Payrolls")).toBeNull();
    expect(screen.queryByText("Trade Balance")).toBeNull();
  });

  it("should filter events by importance level (Req 24.6, 24.7)", () => {
    render(<EconomicCalendar data={mockEvents} />);

    // Deselect high importance
    fireEvent.click(screen.getByTestId("importance-high"));

    expect(screen.queryByText("Non-Farm Payrolls")).toBeNull();
    expect(screen.queryByText("BOE Interest Rate Decision")).toBeNull();
    expect(screen.getByText("Consumer Confidence")).toBeDefined();
    expect(screen.getByText("Trade Balance")).toBeDefined();
  });

  it("should show no-events message when filters match nothing (Req 24.7)", () => {
    render(<EconomicCalendar data={mockEvents} />);

    // Filter to Japan country
    fireEvent.change(screen.getByTestId("country-filter"), {
      target: { value: "Japan" },
    });
    // Deselect low importance (only JP event is low)
    fireEvent.click(screen.getByTestId("importance-low"));

    expect(screen.getByTestId("no-events")).toBeDefined();
  });

  it("should not allow deselecting all importance levels", () => {
    // Start with only one importance selected
    render(<EconomicCalendar data={mockEvents} />);

    // Deselect high and medium, leaving only low
    fireEvent.click(screen.getByTestId("importance-high"));
    fireEvent.click(screen.getByTestId("importance-medium"));

    // Try to deselect low - should remain selected (last one)
    fireEvent.click(screen.getByTestId("importance-low"));

    // Low should still be pressed
    expect(
      screen.getByTestId("importance-low").getAttribute("aria-pressed")
    ).toBe("true");
    expect(screen.getByText("Trade Balance")).toBeDefined();
  });

  it("should filter events by date range (Req 24.22)", () => {
    render(<EconomicCalendar data={mockEvents} />);

    // Set a narrow date range that only includes the first event (1 day from now)
    const tomorrow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    fireEvent.change(screen.getByTestId("start-date"), {
      target: { value: tomorrowStr },
    });
    fireEvent.change(screen.getByTestId("end-date"), {
      target: { value: tomorrowStr },
    });

    expect(screen.getByText("Non-Farm Payrolls")).toBeDefined();
    expect(screen.queryByText("BOE Interest Rate Decision")).toBeNull();
    expect(screen.queryByText("Consumer Confidence")).toBeNull();
    expect(screen.queryByText("Trade Balance")).toBeNull();
  });

  it("should show all events when no date range is set", () => {
    render(<EconomicCalendar data={mockEvents} />);
    expect(screen.getByText("Non-Farm Payrolls")).toBeDefined();
    expect(screen.getByText("BOE Interest Rate Decision")).toBeDefined();
    expect(screen.getByText("Consumer Confidence")).toBeDefined();
    expect(screen.getByText("Trade Balance")).toBeDefined();
  });

  it("should show loading state when fetching data", () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
    render(<EconomicCalendar />);
    expect(screen.getByTestId("economic-calendar-loading")).toBeDefined();
  });

  it("should show error state on fetch failure with retry button", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: "API error" }),
    });

    render(<EconomicCalendar />);

    await waitFor(() => {
      expect(screen.getByTestId("economic-calendar-error")).toBeDefined();
      expect(screen.getByText("Try again")).toBeDefined();
    });
  });

  it("should fetch data from API when no data prop is provided", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockEvents }),
    });

    render(<EconomicCalendar />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/calendar/economic");
      expect(screen.getByTestId("economic-calendar")).toBeDefined();
    });
  });

  it("should not fetch when data prop is provided", () => {
    render(<EconomicCalendar data={mockEvents} />);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should show no-events message when data is empty", () => {
    render(<EconomicCalendar data={[]} />);
    expect(screen.getByTestId("no-events")).toBeDefined();
  });

  it("should display event time when available", () => {
    render(<EconomicCalendar data={mockEvents} />);
    expect(screen.getByText(/08:30/)).toBeDefined();
    expect(screen.getByText(/12:00/)).toBeDefined();
  });

  it("should group events by day with day headers", () => {
    render(<EconomicCalendar data={mockEvents} />);
    // 4 events on 4 different days = 4 day groups
    const eventsList = screen.getByTestId("events-list");
    const dayGroups = eventsList.querySelectorAll(
      "[data-testid^='day-group-']"
    );
    expect(dayGroups.length).toBe(4);
    // Each group has a header
    const dayHeaders = eventsList.querySelectorAll(
      "[data-testid^='day-header-']"
    );
    expect(dayHeaders.length).toBe(4);
  });
});
