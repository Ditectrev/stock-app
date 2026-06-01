/**
 * DividendCalendar Component Tests
 * Tests for dividend display, country filter,
 * timezone filter, loading/error states
 *
 * Requirements: 24.14, 24.15, 24.17, 24.18
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DividendCalendar } from "../DividendCalendar";
import { DividendEvent } from "@/types";

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

const mockEvents: DividendEvent[] = [
  {
    id: "div-JNJ-2026-04-01",
    symbol: "JNJ",
    companyName: "Johnson & Johnson",
    amount: 1.24,
    exDividendDate: daysFromNow(2),
    paymentDate: daysFromNow(16),
    yield: 2.95,
    frequency: "quarterly",
    country: "US",
    timezone: "EST",
  },
  {
    id: "div-KO-2026-04-01",
    symbol: "KO",
    companyName: "Coca-Cola Co.",
    amount: 0.485,
    exDividendDate: daysFromNow(2),
    paymentDate: daysFromNow(20),
    yield: 3.12,
    frequency: "quarterly",
    country: "US",
    timezone: "EST",
  },
  {
    id: "div-O-2026-04-05",
    symbol: "O",
    companyName: "Realty Income Corp.",
    amount: 0.263,
    exDividendDate: daysFromNow(5),
    paymentDate: daysFromNow(19),
    yield: 5.45,
    frequency: "monthly",
    country: "US",
    timezone: "PST",
  },
  {
    id: "div-XOM-2026-05-10",
    symbol: "XOM",
    companyName: "Exxon Mobil Corp.",
    amount: 0.95,
    exDividendDate: daysFromNow(45),
    paymentDate: daysFromNow(60),
    yield: 3.68,
    frequency: "quarterly",
    country: "UK",
    timezone: "GMT",
  },
  {
    id: "div-EPD-2026-07-01",
    symbol: "EPD",
    companyName: "Enterprise Products Partners",
    amount: 0.515,
    exDividendDate: daysFromNow(100),
    paymentDate: daysFromNow(115),
    yield: 7.2,
    frequency: "quarterly",
    country: "UK",
    timezone: "GMT",
  },
];

describe("DividendCalendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Dividend display (Req 24.14) ---

  it("should display dividend events with company name and symbol (Req 24.14)", () => {
    render(<DividendCalendar data={mockEvents} />);
    expect(screen.getByTestId("dividend-calendar")).toBeDefined();
    expect(screen.getByText("Johnson & Johnson")).toBeDefined();
    expect(screen.getByText("JNJ")).toBeDefined();
    expect(screen.getByText("Coca-Cola Co.")).toBeDefined();
    expect(screen.getByText("KO")).toBeDefined();
  });

  it("should display dividend amount and yield (Req 24.15)", () => {
    render(<DividendCalendar data={mockEvents} />);
    expect(screen.getByTestId("amount-div-JNJ-2026-04-01").textContent).toBe(
      "Div: $1.24"
    );
    expect(screen.getByTestId("yield-div-JNJ-2026-04-01").textContent).toBe(
      "Yield: 2.95%"
    );
  });

  it("should display payment date (Req 24.15)", () => {
    render(<DividendCalendar data={mockEvents} />);
    const payEl = screen.getByTestId("payment-date-div-JNJ-2026-04-01");
    expect(payEl.textContent).toContain("Pay:");
  });

  it("should display frequency (Req 24.15)", () => {
    render(<DividendCalendar data={mockEvents} />);
    expect(screen.getByTestId("frequency-div-JNJ-2026-04-01").textContent).toBe(
      "quarterly"
    );
    expect(screen.getByTestId("frequency-div-O-2026-04-05").textContent).toBe(
      "monthly"
    );
  });

  it("should group events by ex-dividend date with day headers", () => {
    render(<DividendCalendar data={mockEvents} />);
    const eventsList = screen.getByTestId("events-list");
    const dayGroups = eventsList.querySelectorAll(
      "[data-testid^='day-group-']"
    );
    expect(dayGroups.length).toBe(4);
  });

  // --- Country filter (Req 24.17) ---

  it("should show country filter dropdown (Req 24.17)", () => {
    render(<DividendCalendar data={mockEvents} />);
    const select = screen.getByTestId("country-filter");
    expect(select).toBeDefined();
  });

  it("should list available countries from data (Req 24.17)", () => {
    render(<DividendCalendar data={mockEvents} />);
    const select = screen.getByTestId("country-filter");
    const options = select.querySelectorAll("option");
    const values = Array.from(options).map((o) => o.getAttribute("value"));
    expect(values).toContain("all");
    expect(values).toContain("US");
    expect(values).toContain("UK");
  });

  it("should filter events by country (Req 24.17)", () => {
    render(<DividendCalendar data={mockEvents} />);
    fireEvent.change(screen.getByTestId("country-filter"), {
      target: { value: "UK" },
    });
    expect(screen.getByText("Exxon Mobil Corp.")).toBeDefined();
    expect(screen.getByText("Enterprise Products Partners")).toBeDefined();
    expect(screen.queryByText("Johnson & Johnson")).toBeNull();
    expect(screen.queryByText("Coca-Cola Co.")).toBeNull();
  });

  it("should show all events when country set to 'all' (Req 24.17)", () => {
    render(<DividendCalendar data={mockEvents} />);
    fireEvent.change(screen.getByTestId("country-filter"), {
      target: { value: "UK" },
    });
    fireEvent.change(screen.getByTestId("country-filter"), {
      target: { value: "all" },
    });
    expect(screen.getByText("Johnson & Johnson")).toBeDefined();
    expect(screen.getByText("Exxon Mobil Corp.")).toBeDefined();
  });

  it("should not show country filter when no country data exists", () => {
    const noCountry: DividendEvent[] = [
      {
        id: "x",
        symbol: "X",
        companyName: "X Corp",
        amount: 1,
        exDividendDate: daysFromNow(2),
        paymentDate: daysFromNow(10),
        yield: 2,
        frequency: "quarterly",
      },
    ];
    render(<DividendCalendar data={noCountry} />);
    expect(screen.queryByTestId("country-filter")).toBeNull();
  });

  // --- Timezone filter (Req 24.18) ---

  it("should show timezone filter dropdown (Req 24.18)", () => {
    render(<DividendCalendar data={mockEvents} />);
    const select = screen.getByTestId("timezone-filter");
    expect(select).toBeDefined();
  });

  it("should list available timezones from data (Req 24.18)", () => {
    render(<DividendCalendar data={mockEvents} />);
    const select = screen.getByTestId("timezone-filter");
    const options = select.querySelectorAll("option");
    const values = Array.from(options).map((o) => o.getAttribute("value"));
    expect(values).toContain("all");
    expect(values).toContain("EST");
    expect(values).toContain("PST");
    expect(values).toContain("GMT");
  });

  it("should filter events by timezone (Req 24.18)", () => {
    render(<DividendCalendar data={mockEvents} />);
    fireEvent.change(screen.getByTestId("timezone-filter"), {
      target: { value: "EST" },
    });
    expect(screen.getByText("Johnson & Johnson")).toBeDefined();
    expect(screen.getByText("Coca-Cola Co.")).toBeDefined();
    expect(screen.queryByText("Realty Income Corp.")).toBeNull();
    expect(screen.queryByText("Exxon Mobil Corp.")).toBeNull();
  });

  it("should show all events when timezone set to 'all' (Req 24.18)", () => {
    render(<DividendCalendar data={mockEvents} />);
    fireEvent.change(screen.getByTestId("timezone-filter"), {
      target: { value: "GMT" },
    });
    fireEvent.change(screen.getByTestId("timezone-filter"), {
      target: { value: "all" },
    });
    expect(screen.getByText("Johnson & Johnson")).toBeDefined();
    expect(screen.getByText("Exxon Mobil Corp.")).toBeDefined();
  });

  it("should not show timezone filter when no timezone data exists", () => {
    const noTz: DividendEvent[] = [
      {
        id: "x",
        symbol: "X",
        companyName: "X Corp",
        amount: 1,
        exDividendDate: daysFromNow(2),
        paymentDate: daysFromNow(10),
        yield: 2,
        frequency: "quarterly",
      },
    ];
    render(<DividendCalendar data={noTz} />);
    expect(screen.queryByTestId("timezone-filter")).toBeNull();
  });

  // --- Combined filters ---

  it("should apply country and timezone filters together", () => {
    render(<DividendCalendar data={mockEvents} />);
    fireEvent.change(screen.getByTestId("country-filter"), {
      target: { value: "US" },
    });
    fireEvent.change(screen.getByTestId("timezone-filter"), {
      target: { value: "PST" },
    });
    // Only O is US + PST
    expect(screen.getByText("Realty Income Corp.")).toBeDefined();
    expect(screen.queryByText("Johnson & Johnson")).toBeNull();
    expect(screen.queryByText("Exxon Mobil Corp.")).toBeNull();
  });

  // --- Date range filtering ---

  it("should filter events by start date", () => {
    render(<DividendCalendar data={mockEvents} />);
    const target = daysFromNow(4);
    const targetStr = target.toISOString().slice(0, 10);

    fireEvent.change(screen.getByTestId("start-date"), {
      target: { value: targetStr },
    });

    expect(screen.getByText("Realty Income Corp.")).toBeDefined();
    expect(screen.getByText("Exxon Mobil Corp.")).toBeDefined();
    expect(screen.queryByText("Johnson & Johnson")).toBeNull();
  });

  it("should filter events by end date", () => {
    render(<DividendCalendar data={mockEvents} />);
    const target = daysFromNow(6);
    const targetStr = target.toISOString().slice(0, 10);

    fireEvent.change(screen.getByTestId("end-date"), {
      target: { value: targetStr },
    });

    expect(screen.getByText("Johnson & Johnson")).toBeDefined();
    expect(screen.getByText("Realty Income Corp.")).toBeDefined();
    expect(screen.queryByText("Exxon Mobil Corp.")).toBeNull();
  });

  it("should filter events by date range", () => {
    render(<DividendCalendar data={mockEvents} />);
    const start = daysFromNow(4);
    const end = daysFromNow(6);

    fireEvent.change(screen.getByTestId("start-date"), {
      target: { value: start.toISOString().slice(0, 10) },
    });
    fireEvent.change(screen.getByTestId("end-date"), {
      target: { value: end.toISOString().slice(0, 10) },
    });

    expect(screen.getByText("Realty Income Corp.")).toBeDefined();
    expect(screen.queryByText("Johnson & Johnson")).toBeNull();
    expect(screen.queryByText("Exxon Mobil Corp.")).toBeNull();
  });

  // --- Loading / Error / Empty states ---

  it("should show loading state when fetching data", () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
    render(<DividendCalendar />);
    expect(screen.getByTestId("dividend-calendar-loading")).toBeDefined();
  });

  it("should show error state on fetch failure with retry button", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: "API error" }),
    });

    render(<DividendCalendar />);

    await waitFor(() => {
      expect(screen.getByTestId("dividend-calendar-error")).toBeDefined();
      expect(screen.getByText("Try again")).toBeDefined();
    });
  });

  it("should fetch data from API when no data prop is provided", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockEvents }),
    });

    render(<DividendCalendar />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/calendar/dividends");
      expect(screen.getByTestId("dividend-calendar")).toBeDefined();
    });
  });

  it("should not fetch when data prop is provided", () => {
    render(<DividendCalendar data={mockEvents} />);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should show no-events message when data is empty", () => {
    render(<DividendCalendar data={[]} />);
    expect(screen.getByTestId("no-events")).toBeDefined();
  });
});
