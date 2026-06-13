import { describe, expect, it } from "vitest";
import {
  chartAtmosphereEnabled,
  CHART_LOAD_SPLASH_LOOPS,
  CHART_LOAD_SPLASH_LOOP_MS,
  chartEffectTone,
  chartLiveFlashCoreClass,
  chartLiveFlashRingClass,
  chartScrubBeamClass,
  chartSparkleEnabled,
  chartSparkleFlashClass,
  chartSparkleSweepClass,
} from "@/lib/chart-effects";

describe("chart-effects", () => {
  it("enables sparkle and atmosphere for area charts only", () => {
    expect(chartSparkleEnabled("area")).toBe(true);
    expect(chartSparkleEnabled("candlestick")).toBe(false);
    expect(chartAtmosphereEnabled("area")).toBe(true);
    expect(chartAtmosphereEnabled("candlestick")).toBe(false);
  });

  it("exposes sparkle, scrub, and live flash classes", () => {
    expect(chartEffectTone(false)).toBe("down");
    expect(CHART_LOAD_SPLASH_LOOP_MS).toBe(1500);
    expect(CHART_LOAD_SPLASH_LOOPS).toBe(2);
    expect(chartSparkleSweepClass("up")).toContain("chart-sparkle-sweep--up");
    expect(chartSparkleFlashClass("down")).toContain(
      "chart-sparkle-flash--down"
    );
    expect(chartScrubBeamClass("up", true)).toContain(
      "chart-scrub-beam--active"
    );
    expect(chartLiveFlashRingClass("up")).toContain(
      "chart-live-flash-ring--up"
    );
    expect(chartLiveFlashCoreClass("up")).toContain(
      "chart-live-flash-core--up"
    );
  });
});
