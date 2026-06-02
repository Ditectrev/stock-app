/**
 * Error Handling & Loading States — Consolidated Test Suite
 *
 * Validates the cross-cutting error handling pattern used by data-fetching
 * components: loading indicators (Req 14.1), user-friendly error messages
 * (Req 14.2), "Symbol not found" (Req 14.3), connectivity errors (Req 14.4),
 * and retry functionality (Req 14.5).
 *
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoadingSpinner } from "../LoadingSpinner";
import { ErrorMessage } from "../ErrorMessage";
import { FearGreedGauge } from "../FearGreedGauge";
import { WorldMarkets } from "../WorldMarkets";
import { SectorHub } from "../SectorHub";
import { EconomicCalendar } from "../EconomicCalendar";

vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({
    theme: "light",
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Req 14.1 — Loading indicators
// ---------------------------------------------------------------------------
describe("Req 14.1: Loading indicators", () => {
  it("LoadingSpinner renders with role=status and accessible label", () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner.getAttribute("role")).toBe("status");
    expect(spinner.getAttribute("aria-label")).toBe("Loading");
  });

  it("LoadingSpinner shows custom message", () => {
    render(<LoadingSpinner message="Fetching market data..." />);
    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner.getAttribute("aria-label")).toBe("Fetching market data...");
    expect(
      screen.getAllByText("Fetching market data...").length
    ).toBeGreaterThanOrEqual(1);
  });

  it("FearGreedGauge shows loading spinner while fetching", () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );
    render(<FearGreedGauge />);
    expect(screen.getByTestId("fear-greed-loading")).toBeDefined();
  });

  it("WorldMarkets shows loading spinner while fetching", () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );
    render(<WorldMarkets />);
    expect(screen.getByTestId("loading-spinner")).toBeDefined();
  });

  it("SectorHub shows loading spinner while fetching", () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );
    render(<SectorHub />);
    expect(screen.getByTestId("loading-spinner")).toBeDefined();
  });

  it("EconomicCalendar shows loading spinner while fetching", () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );
    render(<EconomicCalendar />);
    expect(screen.getByTestId("loading-spinner")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Req 14.2 — User-friendly error messages for API failures
// ---------------------------------------------------------------------------
describe("Req 14.2: User-friendly error messages", () => {
  it("ErrorMessage renders API error with role=alert", () => {
    render(<ErrorMessage type="api" />);
    const el = screen.getByTestId("error-message");
    expect(el.getAttribute("role")).toBe("alert");
    expect(el.getAttribute("aria-live")).toBe("assertive");
    expect(screen.getByText("Something went wrong")).toBeDefined();
  });

  it("ErrorMessage shows custom message override", () => {
    render(<ErrorMessage type="api" message="Server returned 500" />);
    expect(screen.getByText("Server returned 500")).toBeDefined();
  });

  it("FearGreedGauge shows error message on fetch failure", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });
    render(<FearGreedGauge />);
    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeDefined();
    });
  });

  it("WorldMarkets shows error message on fetch failure", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });
    render(<WorldMarkets />);
    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeDefined();
    });
  });

  it("SectorHub shows error message on fetch failure", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });
    render(<SectorHub />);
    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// Req 14.3 — "Symbol not found" message
// ---------------------------------------------------------------------------
describe("Req 14.3: Symbol not found message", () => {
  it("ErrorMessage renders not-found type correctly", () => {
    render(<ErrorMessage type="not-found" />);
    expect(screen.getByText("Symbol not found")).toBeDefined();
    expect(
      screen.getByText(
        "The symbol you searched for could not be found. Please check the ticker and try again."
      )
    ).toBeDefined();
  });

  it("not-found type shows search icon", () => {
    render(<ErrorMessage type="not-found" />);
    expect(screen.getByText("🔍")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Req 14.4 — Connectivity error message
// ---------------------------------------------------------------------------
describe("Req 14.4: Connectivity error message", () => {
  it("ErrorMessage renders network type correctly", () => {
    render(<ErrorMessage type="network" />);
    expect(screen.getByText("Connection error")).toBeDefined();
    expect(
      screen.getByText(
        "Unable to reach the server. Check your connection and try again."
      )
    ).toBeDefined();
  });

  it("network type shows globe icon", () => {
    render(<ErrorMessage type="network" />);
    expect(screen.getByText("🌐")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Req 14.5 — Retry functionality
// ---------------------------------------------------------------------------
describe("Req 14.5: Retry functionality", () => {
  it("ErrorMessage renders retry button when onRetry provided", () => {
    const onRetry = vi.fn();
    render(<ErrorMessage onRetry={onRetry} />);
    expect(screen.getByRole("button", { name: "Try again" })).toBeDefined();
  });

  it("ErrorMessage does not render retry button without onRetry", () => {
    render(<ErrorMessage />);
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("ErrorMessage calls onRetry on click", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorMessage onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("FearGreedGauge re-fetches data after retry", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });

    render(<FearGreedGauge />);

    await waitFor(() => {
      expect(screen.getByText("Try again")).toBeDefined();
    });

    // Retry with successful response
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

  it("SectorHub re-fetches data after retry", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });

    render(<SectorHub />);

    await waitFor(() => {
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

  it("EconomicCalendar re-fetches data after retry", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });

    render(<EconomicCalendar />);

    await waitFor(() => {
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
});
