import { describe, expect, it } from "vitest";
import { filterPriceDataByTimeRange } from "@/lib/chart-time-range";
import type { PriceData } from "@/types";

function daysAgo(
  count: number,
  from = new Date("2026-06-15T12:00:00")
): PriceData[] {
  return Array.from({ length: count }, (_, i) => {
    const day = new Date(from);
    day.setDate(day.getDate() - (count - 1 - i));
    return {
      timestamp: day,
      open: 100 + i,
      high: 101 + i,
      low: 99 + i,
      close: 100 + i,
      volume: 1_000_000,
    };
  });
}

describe("chart-time-range", () => {
  it("returns different slices per range", () => {
    const data = daysAgo(400);
    const oneMonth = filterPriceDataByTimeRange(data, "1M");
    const oneYear = filterPriceDataByTimeRange(data, "1Y");
    const ytd = filterPriceDataByTimeRange(data, "YTD");

    expect(oneMonth.length).toBeLessThan(oneYear.length);
    expect(ytd.length).toBeLessThan(oneYear.length);
    expect(oneMonth.length).toBeGreaterThan(20);
  });

  it("returns all data for Max", () => {
    const data = daysAgo(10);
    expect(filterPriceDataByTimeRange(data, "Max")).toHaveLength(10);
  });
});
