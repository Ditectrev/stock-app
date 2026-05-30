/**
 * Color Contrast Compliance Tests (Task 40.3)
 * Verifies that components use contrast-compliant Tailwind CSS classes
 * in both light and dark modes.
 *
 * Validates: Requirement 18.3 - Color contrast ratios ≥4.5:1 for text
 *
 * Key contrast ratios (Tailwind colors on common backgrounds):
 * - text-gray-300 (#D1D5DB) on bg-gray-800 (#1F2937): ~7.5:1 ✓
 * - text-gray-300 (#D1D5DB) on bg-gray-900 (#111827): ~9.4:1 ✓
 * - text-gray-400 (#9CA3AF) on bg-gray-800 (#1F2937): ~4.4:1 ✗ (below 4.5:1)
 * - text-gray-400 (#9CA3AF) on bg-gray-700 (#374151): ~3.6:1 ✗
 * - text-gray-500 (#6B7280) on white (#FFFFFF): ~5.9:1 ✓
 * - text-gray-500 (#6B7280) on bg-gray-50 (#F9FAFB): ~5.7:1 ✓
 * - text-green-500 (#22C55E) on bg-gray-800 (#1F2937): ~5.1:1 ✓
 * - text-red-500 (#EF4444) on bg-gray-800 (#1F2937): ~4.6:1 ✓
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockTheme = "dark";

vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: vi.fn(),
    resolvedTheme: mockTheme,
  }),
}));

vi.mock("lightweight-charts", () => ({
  createChart: () => ({
    addLineSeries: () => ({ setData: vi.fn() }),
    addAreaSeries: () => ({ setData: vi.fn() }),
    addCandlestickSeries: () => ({ setData: vi.fn() }),
    applyOptions: vi.fn(),
    remove: vi.fn(),
    timeScale: () => ({ fitContent: vi.fn() }),
  }),
  ColorType: { Solid: "Solid" },
  CrosshairMode: { Normal: 0 },
  LineStyle: { Dashed: 2 },
}));

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: [] }),
  } as Response)
);

import { LoadingSpinner } from "../LoadingSpinner";
import { ErrorMessage } from "../ErrorMessage";
import { Footer } from "../Footer";

// ---------------------------------------------------------------------------
// Disallowed dark-mode classes: these fail the 4.5:1 contrast threshold
// on bg-gray-800 or bg-gray-900 backgrounds.
// ---------------------------------------------------------------------------

const LOW_CONTRAST_DARK_CLASSES = ["dark:text-gray-400", "dark:text-gray-500"];

/**
 * Helper: renders a component and returns the full HTML string so we can
 * assert that no low-contrast utility classes leaked through.
 */
function renderHTML(ui: React.ReactElement): string {
  const { container } = render(ui);
  return container.innerHTML;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Color Contrast Compliance (Req 18.3)", () => {
  beforeEach(() => {
    mockTheme = "dark";
  });

  describe("LoadingSpinner", () => {
    it("uses text-gray-300 (not text-gray-400) for message text in dark mode", () => {
      const { container } = render(
        <LoadingSpinner message="Loading data..." />
      );
      const messageEl = container.querySelector("p");
      expect(messageEl).not.toBeNull();
      const cls = messageEl!.className;
      // Should use gray-300 in dark mode for sufficient contrast
      expect(cls).toContain("dark:text-gray-300");
      expect(cls).not.toContain("dark:text-gray-400");
    });
  });

  describe("ErrorMessage", () => {
    it("uses text-gray-300 for description text in dark mode", () => {
      const { container } = render(<ErrorMessage type="api" />);
      const descEl = container.querySelector("p");
      expect(descEl).not.toBeNull();
      const cls = descEl!.className;
      expect(cls).toContain("dark:text-gray-300");
      expect(cls).not.toContain("dark:text-gray-400");
    });

    it("uses text-gray-100 for title text in dark mode", () => {
      const { container } = render(<ErrorMessage type="api" />);
      const titleEl = container.querySelector("h3");
      expect(titleEl).not.toBeNull();
      const cls = titleEl!.className;
      expect(cls).toContain("dark:text-gray-100");
    });
  });

  describe("Footer", () => {
    it("uses readable stone text on dark background in dark mode", () => {
      const { container } = render(<Footer />);
      const footer = container.querySelector("footer");
      expect(footer).not.toBeNull();
      const cls = footer!.className;
      expect(cls).toContain("dark:text-stone-200");
      expect(cls).not.toContain("dark:text-stone-400");
    });
  });

  describe("No low-contrast dark:text-gray-400 or dark:text-gray-500 classes", () => {
    it("LoadingSpinner does not use low-contrast dark classes", () => {
      const html = renderHTML(<LoadingSpinner message="Loading..." />);
      for (const cls of LOW_CONTRAST_DARK_CLASSES) {
        expect(html).not.toContain(cls);
      }
    });

    it("ErrorMessage does not use low-contrast dark classes", () => {
      const html = renderHTML(<ErrorMessage type="api" />);
      for (const cls of LOW_CONTRAST_DARK_CLASSES) {
        expect(html).not.toContain(cls);
      }
    });

    it("Footer does not use low-contrast dark classes", () => {
      const html = renderHTML(<Footer />);
      for (const cls of LOW_CONTRAST_DARK_CLASSES) {
        expect(html).not.toContain(cls);
      }
    });
  });
});
