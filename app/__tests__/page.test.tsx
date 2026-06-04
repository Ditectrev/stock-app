/**
 * Home Page Unit Tests
 * Tests for component rendering and symbol flow
 *
 * Requirements: 9.1, 10.1
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const searchParamsState = { symbol: null as string | null };

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn((url: string) => {
      try {
        const u = new URL(url, "http://localhost");
        searchParamsState.symbol = u.searchParams.get("symbol");
      } catch {
        searchParamsState.symbol = null;
      }
    }),
    replace: vi.fn(() => {
      searchParamsState.symbol = null;
    }),
  }),
  usePathname: () => "/",
  useSearchParams: () => ({
    get: (key: string) => (key === "symbol" ? searchParamsState.symbol : null),
  }),
}));

// Mock theme context
vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({
    theme: "light",
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock next/dynamic to render simple placeholders instead of lazy-loaded components
vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: (_loader: () => Promise<unknown>, _opts?: { ssr?: boolean }) => {
    const MockComponent = (_props: Record<string, unknown>) => (
      <div data-testid="dynamic-component" />
    );
    MockComponent.displayName = "DynamicMock";
    return MockComponent;
  },
}));

vi.mock("@/components/SymbolHeader", () => ({
  SymbolHeader: ({ symbolData }: { symbolData?: { name?: string } }) => (
    <div data-testid="symbol-header">{symbolData?.name}</div>
  ),
}));

vi.mock("@/components/TabNavigation", () => ({
  TabNavigation: ({
    activeTab,
    onTabChange,
  }: {
    activeTab: string;
    onTabChange: (tab: string) => void;
  }) => (
    <div data-testid="tab-navigation" data-active-tab={activeTab}>
      {["overview", "financials", "technicals", "forecasts", "seasonals"].map(
        (tab) => (
          <button
            key={tab}
            data-testid={`tab-${tab}`}
            onClick={() => onTabChange(tab)}
          >
            {tab}
          </button>
        )
      )}
    </div>
  ),
}));

vi.mock("@/components/LoadingSpinner", () => ({
  LoadingSpinner: ({ message }: { message?: string }) => (
    <div data-testid="loading-spinner">{message}</div>
  ),
}));

// Mock react-github-btn
vi.mock("react-github-btn", () => ({
  __esModule: true,
  default: () => <span data-testid="github-button">Star</span>,
}));

// Mock package.json
vi.mock("../../package.json", () => ({
  __esModule: true,
  default: { version: "1.0.0" },
}));

// Mock fetch
global.fetch = vi.fn();

import { HomePageClient } from "../(main)/home-page-client";

describe("Home Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsState.symbol = null;
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    });
  });

  describe("Component rendering", () => {
    it("renders the dashboard quick links (no symbol selected)", () => {
      render(<HomePageClient />);
      expect(screen.getAllByText("Sectors").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Heatmaps").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Screener").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Calendars").length).toBeGreaterThanOrEqual(1);
    });

    it("renders quick link descriptions", () => {
      render(<HomePageClient />);
      expect(
        screen.getByText("Compare sector performance")
      ).toBeInTheDocument();
      expect(screen.getByText("Visual market overview")).toBeInTheDocument();
      expect(screen.getByText("Filter and find assets")).toBeInTheDocument();
      expect(
        screen.getByText("Earnings, dividends & IPOs")
      ).toBeInTheDocument();
    });

    it("renders home section container", () => {
      render(<HomePageClient />);
      expect(document.getElementById("section-home")).toBeInTheDocument();
    });

    it("does not render symbol detail view when no symbol is selected", () => {
      render(<HomePageClient />);
      expect(screen.queryByTestId("symbol-header")).not.toBeInTheDocument();
      expect(screen.queryByTestId("tab-navigation")).not.toBeInTheDocument();
    });
  });

  describe("Symbol selection", () => {
    it("shows loading state when a symbol is in the URL", async () => {
      searchParamsState.symbol = "AAPL";
      vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
      render(<HomePageClient />);
      await waitFor(() => {
        expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
      });
    });

    it("shows error state when symbol fetch fails", async () => {
      searchParamsState.symbol = "AAPL";
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ success: false }),
      });
      render(<HomePageClient />);
      await waitFor(() => {
        expect(screen.getByTestId("symbol-load-error")).toBeInTheDocument();
        expect(screen.getByText("Couldn't load symbol")).toBeInTheDocument();
      });
    });

    it("shows symbol detail view when data loads successfully", async () => {
      searchParamsState.symbol = "AAPL";
      const mockSymbolData = {
        symbol: "AAPL",
        name: "Apple Inc.",
        price: 175.5,
        change: 2.3,
        changePercent: 1.33,
        marketCap: 2800000000000,
        volume: 55000000,
        fiftyTwoWeekHigh: 199.62,
        fiftyTwoWeekLow: 124.17,
        lastUpdated: new Date().toISOString(),
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockSymbolData }),
      });

      render(<HomePageClient />);

      await waitFor(() => {
        expect(screen.getByTestId("symbol-header")).toBeInTheDocument();
        expect(screen.getByText("Apple Inc.")).toBeInTheDocument();
        expect(screen.getByTestId("tab-navigation")).toBeInTheDocument();
      });
    });

    it("has a Clear Selection button on error that returns to dashboard", async () => {
      searchParamsState.symbol = "AAPL";
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ success: false }),
      });

      render(<HomePageClient />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Clear selection" })
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));

      await waitFor(() => {
        expect(
          screen.getByText("Compare sector performance")
        ).toBeInTheDocument();
      });
    });
  });
});
