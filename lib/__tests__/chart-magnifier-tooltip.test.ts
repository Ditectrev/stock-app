import { describe, expect, it } from "vitest";
import {
  CHART_MAGNIFIER_TOOLTIP_WIDTH,
  clampMagnifierTooltipLeft,
  findPricePointAtTime,
  formatMagnifierDate,
  formatMagnifierPrice,
  magnifierPriceFromPoint,
  pricePointFromCrosshair,
} from "@/lib/chart-magnifier-tooltip";
import type { PriceData } from "@/types";

describe("chart-magnifier-tooltip", () => {
  it("centers tooltip on crosshair and clamps within plot width", () => {
    const half = CHART_MAGNIFIER_TOOLTIP_WIDTH / 2;
    expect(
      clampMagnifierTooltipLeft(200, CHART_MAGNIFIER_TOOLTIP_WIDTH, 640)
    ).toBe(200 - half);
    expect(
      clampMagnifierTooltipLeft(10, CHART_MAGNIFIER_TOOLTIP_WIDTH, 640)
    ).toBe(0);
    expect(
      clampMagnifierTooltipLeft(630, CHART_MAGNIFIER_TOOLTIP_WIDTH, 640)
    ).toBe(640 - CHART_MAGNIFIER_TOOLTIP_WIDTH);
  });

  it("formats magnifier price and date", () => {
    const point: PriceData = {
      timestamp: new Date("2019-03-15"),
      open: 1,
      high: 2,
      low: 0.5,
      close: 26.11,
      volume: 1,
    };

    expect(formatMagnifierPrice(26.114)).toBe("26.11");
    expect(magnifierPriceFromPoint(point)).toBe(26.11);
    expect(formatMagnifierDate(new Date("2019-03-15"))).toMatch(/Mar/);
  });

  it("finds price rows by unix timestamp", () => {
    const data: PriceData[] = [
      {
        timestamp: new Date(1_700_000_000_000),
        open: 1,
        high: 2,
        low: 0.5,
        close: 100,
        volume: 1,
      },
    ];

    expect(findPricePointAtTime(data, 1_700_000_000)?.close).toBe(100);
  });

  it("falls back to series crosshair data", () => {
    const point = pricePointFromCrosshair(1_700_000_000, { value: 42.5 });
    expect(point?.close).toBe(42.5);
    expect(point?.timestamp.getTime()).toBe(1_700_000_000_000);
  });
});
