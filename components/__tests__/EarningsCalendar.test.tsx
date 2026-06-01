/**
 * EarningsCalendar Component Tests
 * Tests for earnings display, EPS comparison, surprise color coding, loading/error states
 *
 * Requirements: 24.8, 24.10, 24.13
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EarningsCalendar } from "../EarningsCalendar";
import { EarningsEvent } from "@/types";

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

const mockEvents: EarningsEvent[] = [
  {
    id: "1",
    symbol: "AAPL",
    companyName: "Apple Inc.",
    date: daysFromNow(1),
    time: "AMC",
    epsEstimate: 1.43,
    epsActual: 1.52,
    epsSurprise: 0.09,
    epsSurprisePercent: 6.29,
  },
  {
    id: "2",
    symbol: "MSFT",
    companyName: "Microsoft Corp.",
    date: daysFromNow(1),
    epsEstimate: 2.82,
  },
  {
    id: "3",
    symbol: "TSLA",
    companyName: "Tesla Inc.",
    date: daysFromNow(3),
    time: "BMO",
    epsEstimate: 0.73,
    epsActual: 0.62,
    epsSurprise: -0.11,
    epsSurprisePercent: -15.07,
  },
  {
    id: "4",
    symbol: "NVDA",
    companyName: "NVIDIA Corp.",
    date: daysFromNow(7),
    epsEstimate: 5.16,
    epsActual: 5.16,
    epsSurprise: 0,
    epsSurprisePercent: 0,
  },
];

describe("EarningsCalendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Earnings display (Req 24.8) ---

  it("should display earnings events with company name and symbol (Req 24.8)", () => {
    render(<EarningsCalendar data={mockEvents} />);
    expect(screen.getByTestId("earnings-calendar")).toBeDefined();
    expect(screen.getByText("Apple Inc.")).toBeDefined();
    expect(screen.getByText("AAPL")).toBeDefined();
    expect(screen.getByText("Microsoft Corp.")).toBeDefined();
    expect(screen.getByText("MSFT")).toBeDefined();
    expect(screen.getByText("Tesla Inc.")).toBeDefined();
    expect(screen.getByText("NVIDIA Corp.")).toBeDefined();
  });

  it("should display earnings call time when available (Req 24.12)", () => {
    render(<EarningsCalendar data={mockEvents} />);
    expect(screen.getByTestId("time-1").textContent).toBe("AMC");
    expect(screen.getByTestId("time-3").textContent).toBe("BMO");
    // MSFT has no time
    expect(screen.queryByTestId("time-2")).toBeNull();
  });

  it("should group events by day with day headers", () => {
    render(<EarningsCalendar data={mockEvents} />);
    const eventsList = screen.getByTestId("events-list");
    const dayGroups = eventsList.querySelectorAll(
      "[data-testid^='day-group-']"
    );
    // 3 distinct days: daysFromNow(1), daysFromNow(3), daysFromNow(7)
    expect(dayGroups.length).toBe(3);
  });

  // --- EPS comparison (Req 24.10) ---

  it("should display EPS estimate for all events (Req 24.9)", () => {
    render(<EarningsCalendar data={mockEvents} />);
    expect(screen.getByTestId("eps-estimate-1").textContent).toBe("Est: $1.43");
    expect(screen.getByTestId("eps-estimate-2").textContent).toBe("Est: $2.82");
    expect(screen.getByTestId("eps-estimate-3").textContent).toBe("Est: $0.73");
  });

  it("should display actual EPS when available (Req 24.10)", () => {
    render(<EarningsCalendar data={mockEvents} />);
    expect(screen.getByTestId("eps-actual-1").textContent).toBe("Act: $1.52");
    expect(screen.getByTestId("eps-actual-3").textContent).toBe("Act: $0.62");
    // MSFT has no actual EPS
    expect(screen.queryByTestId("eps-actual-2")).toBeNull();
  });

  it("should display surprise amount and percentage (Req 24.11)", () => {
    render(<EarningsCalendar data={mockEvents} />);
    // AAPL beat: +0.09, +6.29%
    expect(screen.getByTestId("eps-surprise-1").textContent).toContain("0.09");
    expect(screen.getByTestId("eps-surprise-1").textContent).toContain(
      "+6.29%"
    );
    // TSLA miss: -0.11, -15.07%
    expect(screen.getByTestId("eps-surprise-3").textContent).toContain("-0.11");
    expect(screen.getByTestId("eps-surprise-3").textContent).toContain(
      "-15.07%"
    );
  });

  it("should show dash for missing EPS estimate", () => {
    const noEps: EarningsEvent[] = [
      { id: "x", symbol: "XYZ", companyName: "XYZ Corp", date: daysFromNow(1) },
    ];
    render(<EarningsCalendar data={noEps} />);
    expect(screen.getByTestId("eps-estimate-x").textContent).toBe("Est: —");
  });

  // --- Surprise color coding (Req 24.13) ---

  it("should color-code earnings beat in green (Req 24.13)", () => {
    render(<EarningsCalendar data={mockEvents} />);
    const surprise = screen.getByTestId("eps-surprise-1");
    expect(surprise.className).toContain("text-green-600");
  });

  it("should color-code earnings miss in red (Req 24.13)", () => {
    render(<EarningsCalendar data={mockEvents} />);
    const surprise = screen.getByTestId("eps-surprise-3");
    expect(surprise.className).toContain("text-red-600");
  });

  it("should color-code zero surprise in gray (Req 24.13)", () => {
    render(<EarningsCalendar data={mockEvents} />);
    const surprise = screen.getByTestId("eps-surprise-4");
    expect(surprise.className).toContain("text-stone-600");
  });

  it("should not display surprise when not available", () => {
    render(<EarningsCalendar data={mockEvents} />);
    expect(screen.queryByTestId("eps-surprise-2")).toBeNull();
  });

  // --- Date filtering ---

  it("should filter events by date range", () => {
    render(<EarningsCalendar data={mockEvents} />);
    const target = daysFromNow(3);
    const targetStr = target.toISOString().slice(0, 10);

    fireEvent.change(screen.getByTestId("start-date"), {
      target: { value: targetStr },
    });
    fireEvent.change(screen.getByTestId("end-date"), {
      target: { value: targetStr },
    });

    expect(screen.getByText("Tesla Inc.")).toBeDefined();
    expect(screen.queryByText("Apple Inc.")).toBeNull();
    expect(screen.queryByText("NVIDIA Corp.")).toBeNull();
  });

  // --- Loading / Error / Empty states ---

  it("should show loading state when fetching data", () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
    render(<EarningsCalendar />);
    expect(screen.getByTestId("earnings-calendar-loading")).toBeDefined();
  });

  it("should show error state on fetch failure with retry button", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: "API error" }),
    });

    render(<EarningsCalendar />);

    await waitFor(() => {
      expect(screen.getByTestId("earnings-calendar-error")).toBeDefined();
      expect(screen.getByText("Try again")).toBeDefined();
    });
  });

  it("should fetch data from API when no data prop is provided", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockEvents }),
    });

    render(<EarningsCalendar />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/calendar/earnings");
      expect(screen.getByTestId("earnings-calendar")).toBeDefined();
    });
  });

  it("should not fetch when data prop is provided", () => {
    render(<EarningsCalendar data={mockEvents} />);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should show no-events message when data is empty", () => {
    render(<EarningsCalendar data={[]} />);
    expect(screen.getByTestId("no-events")).toBeDefined();
  });
});
