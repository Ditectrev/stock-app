/**
 * Responsive Design Unit Tests
 *
 * Requirements: 13.1, 13.2, 13.3, 13.5
 * Tests:
 * - Mobile breakpoints (320px-768px) — Req 13.1
 * - Tablet breakpoints (768px-1024px) — Req 13.2
 * - Desktop breakpoints (>1024px) — Req 13.3
 * - Touch-friendly controls — Req 13.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchBar } from "../SearchBar";
import { TabNavigation } from "../TabNavigation";
import { SymbolHeader } from "../SymbolHeader";
import { KeyMetrics } from "../KeyMetrics";
import { Footer } from "../Footer";
import { SymbolData } from "@/types";

// Mock theme context
vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

// Mock react-github-btn for Footer
vi.mock("react-github-btn", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="github-btn">{children}</span>
  ),
}));

const mockSymbolData: SymbolData = {
  symbol: "AAPL",
  name: "Apple Inc.",
  price: 150.25,
  change: 2.5,
  changePercent: 1.69,
  marketCap: 2500000000000,
  volume: 50000000,
  fiftyTwoWeekHigh: 180.0,
  fiftyTwoWeekLow: 120.0,
  lastUpdated: new Date("2024-01-15T10:30:00Z"),
};

/**
 * Helper: set up window.matchMedia to simulate a given viewport width.
 * Tailwind breakpoints: sm=640, md=768, lg=1024, xl=1280, 2xl=1536
 */
function mockMatchMedia(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });

  window.matchMedia = vi.fn().mockImplementation((query: string) => {
    // Parse min-width / max-width from the media query
    const minMatch = query.match(/\(min-width:\s*(\d+)px\)/);
    const maxMatch = query.match(/\(max-width:\s*(\d+)px\)/);

    let matches = false;
    if (minMatch && maxMatch) {
      matches = width >= Number(minMatch[1]) && width <= Number(maxMatch[1]);
    } else if (minMatch) {
      matches = width >= Number(minMatch[1]);
    } else if (maxMatch) {
      matches = width <= Number(maxMatch[1]);
    }

    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    };
  });
}

describe("Responsive Design", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Mobile breakpoints (320px-768px) — Requirement 13.1 ───

  describe("Mobile breakpoints (Req 13.1)", () => {
    beforeEach(() => {
      mockMatchMedia(375);
    });

    it("should render SearchBar at full width on mobile", () => {
      const { container } = render(<SearchBar placeholder="Search..." />);
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.classList.contains("w-full")).toBe(true);
    });

    it("should render SymbolHeader with stacked layout classes", () => {
      const { container } = render(
        <SymbolHeader symbolData={mockSymbolData} />
      );
      const flexContainer = container.querySelector(".flex.flex-col");
      expect(flexContainer).not.toBeNull();
    });

    it("should render TabNavigation with horizontal scroll for overflow", () => {
      const onTabChange = vi.fn();
      const { container } = render(
        <TabNavigation activeTab="overview" onTabChange={onTabChange} />
      );
      const nav = container.querySelector("nav");
      expect(nav).not.toBeNull();
      expect(nav!.classList.contains("overflow-x-auto")).toBe(true);
    });

    it("should render all five tabs on mobile (scrollable)", () => {
      const onTabChange = vi.fn();
      render(<TabNavigation activeTab="overview" onTabChange={onTabChange} />);
      expect(screen.getByText("Overview")).toBeInTheDocument();
      expect(screen.getByText("Financials")).toBeInTheDocument();
      expect(screen.getByText("Technicals")).toBeInTheDocument();
      expect(screen.getByText("Forecasts")).toBeInTheDocument();
      expect(screen.getByText("Seasonals")).toBeInTheDocument();
    });

    it("should render KeyMetrics in single-column grid on mobile", () => {
      const { container } = render(<KeyMetrics symbolData={mockSymbolData} />);
      const grid = container.querySelector(".grid");
      expect(grid).not.toBeNull();
      expect(grid!.classList.contains("grid-cols-1")).toBe(true);
    });

    it("should render Footer with compact padding on mobile", () => {
      const { container } = render(<Footer />);
      const footer = container.querySelector("footer");
      expect(footer).not.toBeNull();
      // Base padding is py-4, sm:py-6 — at mobile the base class applies
      expect(footer!.className).toContain("py-4");
    });

    it("should render SymbolHeader text at base size (text-3xl)", () => {
      render(<SymbolHeader symbolData={mockSymbolData} />);
      const heading = screen.getByText("AAPL");
      expect(heading.className).toContain("text-3xl");
    });

    it("should render search input with base text size on mobile", () => {
      render(<SearchBar placeholder="Search..." />);
      const input = screen.getByPlaceholderText("Search...");
      expect(input.className).toContain("text-base");
    });
  });

  // ─── Tablet breakpoints (768px-1024px) — Requirement 13.2 ───

  describe("Tablet breakpoints (Req 13.2)", () => {
    beforeEach(() => {
      mockMatchMedia(800);
    });

    it("should render SymbolHeader with row layout classes for sm+", () => {
      const { container } = render(
        <SymbolHeader symbolData={mockSymbolData} />
      );
      const flexContainer = container.querySelector(
        ".flex.flex-col"
      ) as HTMLElement;
      expect(flexContainer).not.toBeNull();
      // sm:flex-row is present in the class list for tablet+
      expect(flexContainer!.className).toContain("sm:flex-row");
    });

    it("should render KeyMetrics with 2-column grid at sm breakpoint", () => {
      const { container } = render(<KeyMetrics symbolData={mockSymbolData} />);
      const grid = container.querySelector(".grid");
      expect(grid).not.toBeNull();
      expect(grid!.classList.contains("sm:grid-cols-2")).toBe(true);
    });

    it("should render KeyMetrics as a horizontal strip at lg breakpoint", () => {
      const { container } = render(<KeyMetrics symbolData={mockSymbolData} />);
      const grid = container.querySelector(".grid");
      expect(grid).not.toBeNull();
      expect(grid!.classList.contains("lg:flex")).toBe(true);
    });

    it("should render TabNavigation as a segmented control", () => {
      const onTabChange = vi.fn();
      const { container } = render(
        <TabNavigation activeTab="overview" onTabChange={onTabChange} />
      );
      const nav = container.querySelector("nav");
      expect(nav).not.toBeNull();
      expect(nav!.className).toContain("rounded-xl");
      expect(nav!.className).toContain("p-1");
    });

    it("should render SymbolHeader price aligned right at sm+", () => {
      const { container } = render(
        <SymbolHeader symbolData={mockSymbolData} />
      );
      // The sm:text-right class is on the wrapper div around the price
      const priceWrapper = container.querySelector(
        ".text-left.sm\\:text-right"
      );
      expect(priceWrapper).not.toBeNull();
      expect(priceWrapper!.className).toContain("sm:text-right");
    });

    it("should render Footer with increased padding at sm+", () => {
      const { container } = render(<Footer />);
      const footer = container.querySelector("footer");
      expect(footer).not.toBeNull();
      expect(footer!.className).toContain("sm:py-6");
    });
  });

  // ─── Desktop breakpoints (>1024px) — Requirement 13.3 ───

  describe("Desktop breakpoints (Req 13.3)", () => {
    beforeEach(() => {
      mockMatchMedia(1280);
    });

    it("should render KeyMetrics strip items with desktop padding", () => {
      const { container } = render(<KeyMetrics symbolData={mockSymbolData} />);
      const items = container.querySelectorAll("li");
      expect(items.length).toBe(5);
      items.forEach((item) => {
        expect(item.className).toContain("lg:px-5");
      });
    });

    it("should render KeyMetrics with instrument panel padding at sm+", () => {
      const { container } = render(<KeyMetrics symbolData={mockSymbolData} />);
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.className).toContain("sm:p-6");
    });

    it("should render KeyMetrics with horizontal dividers at lg+", () => {
      const { container } = render(<KeyMetrics symbolData={mockSymbolData} />);
      const grid = container.querySelector(".grid");
      expect(grid).not.toBeNull();
      expect(grid!.className).toContain("lg:divide-x");
    });

    it("should render SymbolHeader heading at sm:text-4xl for desktop", () => {
      render(<SymbolHeader symbolData={mockSymbolData} />);
      const heading = screen.getByText("AAPL");
      expect(heading.className).toContain("sm:text-4xl");
    });

    it("should render all metric cards on desktop", () => {
      render(<KeyMetrics symbolData={mockSymbolData} />);
      expect(screen.getByText("Market Cap")).toBeInTheDocument();
      expect(screen.getByText("Volume")).toBeInTheDocument();
      expect(screen.getByText("52-Week High")).toBeInTheDocument();
      expect(screen.getByText("52-Week Low")).toBeInTheDocument();
      expect(screen.getByText("52-Week Range")).toBeInTheDocument();
    });
  });

  // ─── Touch-friendly controls — Requirement 13.5 ───

  describe("Touch-friendly controls (Req 13.5)", () => {
    beforeEach(() => {
      mockMatchMedia(375);
    });

    it("should render tab buttons with minimum 44px touch target", () => {
      const onTabChange = vi.fn();
      const { container } = render(
        <TabNavigation activeTab="overview" onTabChange={onTabChange} />
      );
      const buttons = container.querySelectorAll("button");
      buttons.forEach((button) => {
        expect(button.className).toContain("min-h-[44px]");
      });
    });

    it("should render search result items with minimum 44px touch target", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            {
              symbol: "AAPL",
              name: "Apple Inc.",
              type: "EQUITY",
              exchange: "NASDAQ",
            },
          ],
        }),
      });

      render(<SearchBar />);
      const input = screen.getByRole("combobox");

      // Trigger search
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(input, { target: { value: "AAPL" } });

      // Wait for results
      const { waitFor } = await import("@testing-library/react");
      await waitFor(
        () => {
          expect(screen.getByText("Apple Inc.")).toBeInTheDocument();
        },
        { timeout: 500 }
      );

      const listItem = screen.getByText("Apple Inc.").closest("li");
      expect(listItem).not.toBeNull();
      expect(listItem!.className).toContain("min-h-[44px]");
    });

    it("should render search input with adequate padding for touch", () => {
      render(<SearchBar placeholder="Search..." />);
      const input = screen.getByPlaceholderText("Search...");
      // py-3 = 12px top + 12px bottom + line height ≥ 44px
      expect(input.className).toContain("py-3");
      expect(input.className).toContain("px-4");
    });

    it("should render metric strip items with adequate padding for touch", () => {
      const { container } = render(<KeyMetrics symbolData={mockSymbolData} />);
      const items = container.querySelectorAll("li");
      expect(items.length).toBeGreaterThan(0);
      items.forEach((item) => {
        expect(item.className).toContain("py-3");
      });
    });

    it("should render tab buttons with adequate padding for touch", () => {
      const onTabChange = vi.fn();
      const { container } = render(
        <TabNavigation activeTab="overview" onTabChange={onTabChange} />
      );
      const buttons = container.querySelectorAll("button");
      buttons.forEach((button) => {
        expect(button.className).toContain("min-h-[44px]");
      });
    });

    it("should render tab buttons with whitespace-nowrap to prevent wrapping", () => {
      const onTabChange = vi.fn();
      const { container } = render(
        <TabNavigation activeTab="overview" onTabChange={onTabChange} />
      );
      const buttons = container.querySelectorAll("button");
      buttons.forEach((button) => {
        expect(button.className).toContain("whitespace-nowrap");
      });
    });
  });

  // ─── Cross-breakpoint consistency ───

  describe("Cross-breakpoint consistency", () => {
    it("should render all components without errors at 320px (min mobile)", () => {
      mockMatchMedia(320);
      const onTabChange = vi.fn();

      expect(() => {
        render(<SearchBar placeholder="Search..." />);
      }).not.toThrow();

      expect(() => {
        render(<SymbolHeader symbolData={mockSymbolData} />);
      }).not.toThrow();

      expect(() => {
        render(
          <TabNavigation activeTab="overview" onTabChange={onTabChange} />
        );
      }).not.toThrow();

      expect(() => {
        render(<KeyMetrics symbolData={mockSymbolData} />);
      }).not.toThrow();

      expect(() => {
        render(<Footer />);
      }).not.toThrow();
    });

    it("should render all components without errors at 768px (tablet)", () => {
      mockMatchMedia(768);
      const onTabChange = vi.fn();

      expect(() => {
        render(<SearchBar placeholder="Search..." />);
      }).not.toThrow();

      expect(() => {
        render(<SymbolHeader symbolData={mockSymbolData} />);
      }).not.toThrow();

      expect(() => {
        render(
          <TabNavigation activeTab="overview" onTabChange={onTabChange} />
        );
      }).not.toThrow();

      expect(() => {
        render(<KeyMetrics symbolData={mockSymbolData} />);
      }).not.toThrow();

      expect(() => {
        render(<Footer />);
      }).not.toThrow();
    });

    it("should render all components without errors at 1440px (desktop)", () => {
      mockMatchMedia(1440);
      const onTabChange = vi.fn();

      expect(() => {
        render(<SearchBar placeholder="Search..." />);
      }).not.toThrow();

      expect(() => {
        render(<SymbolHeader symbolData={mockSymbolData} />);
      }).not.toThrow();

      expect(() => {
        render(
          <TabNavigation activeTab="overview" onTabChange={onTabChange} />
        );
      }).not.toThrow();

      expect(() => {
        render(<KeyMetrics symbolData={mockSymbolData} />);
      }).not.toThrow();

      expect(() => {
        render(<Footer />);
      }).not.toThrow();
    });

    it("should use responsive text sizing on SymbolHeader", () => {
      mockMatchMedia(375);
      render(<SymbolHeader symbolData={mockSymbolData} />);

      const heading = screen.getByText("AAPL");
      // DNA_DISPLAY: text-3xl, sm: text-4xl
      expect(heading.className).toContain("text-3xl");
      expect(heading.className).toContain("sm:text-4xl");

      const subtitle = screen.getByText("Apple Inc.");
      // Base: text-base, sm: text-lg
      expect(subtitle.className).toContain("text-base");
      expect(subtitle.className).toContain("sm:text-lg");
    });

    it("should use responsive padding on SymbolHeader", () => {
      mockMatchMedia(375);
      const { container } = render(
        <SymbolHeader symbolData={mockSymbolData} />
      );
      const wrapper = container.firstElementChild as HTMLElement;
      // Base: p-4, sm: p-6
      expect(wrapper.className).toContain("p-4");
      expect(wrapper.className).toContain("sm:p-6");
    });

    it("should use responsive gap on SymbolHeader flex container", () => {
      const { container } = render(
        <SymbolHeader symbolData={mockSymbolData} />
      );
      const flexContainer = container.querySelector(
        ".flex.flex-col"
      ) as HTMLElement;
      expect(flexContainer).not.toBeNull();
      expect(flexContainer!.className).toContain("gap-3");
      expect(flexContainer!.className).toContain("sm:gap-4");
    });
  });
});
