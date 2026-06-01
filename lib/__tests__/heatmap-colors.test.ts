import { describe, it, expect } from "vitest";
import { getHeatmapFillColor, getHeatmapTextClass } from "@/lib/heatmap-colors";

describe("heatmap-colors", () => {
  it("uses dark text on pale positive tiles in light mode", () => {
    expect(getHeatmapTextClass(0.5, false)).toBe("text-stone-900");
    expect(getHeatmapTextClass(-0.8, false)).toBe("text-stone-900");
  });

  it("uses white text on strong moves in light mode", () => {
    expect(getHeatmapTextClass(2.5, false)).toBe("text-white");
    expect(getHeatmapTextClass(-3, false)).toBe("text-white");
  });

  it("uses solid neutral fill for zero in light mode", () => {
    expect(getHeatmapFillColor(0, false)).toBe("rgb(231, 229, 228)");
  });

  it("uses higher minimum alpha for light mode fills", () => {
    const fill = getHeatmapFillColor(0.1, false);
    const match = fill.match(/rgba\([^)]+,\s*([\d.]+)\)/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThanOrEqual(0.42);
  });
});
