import { describe, expect, it } from "vitest";
import { validatePriceDataSeries } from "@/lib/chart-price-data";

describe("chart-price-data", () => {
  it("returns empty array for invalid input", () => {
    expect(validatePriceDataSeries(null)).toEqual([]);
    expect(validatePriceDataSeries("bad")).toEqual([]);
    expect(validatePriceDataSeries([{ close: "nope" }])).toEqual([]);
  });

  it("keeps valid price rows", () => {
    const ts = new Date("2024-01-02");
    expect(
      validatePriceDataSeries([
        {
          timestamp: ts,
          open: 1,
          high: 2,
          low: 0.5,
          close: 1.5,
          volume: 100,
        },
      ])
    ).toEqual([
      {
        timestamp: ts,
        open: 1,
        high: 2,
        low: 0.5,
        close: 1.5,
        volume: 100,
      },
    ]);
  });

  it("coerces numeric strings from JSON payloads", () => {
    const points = validatePriceDataSeries([
      {
        timestamp: "2024-01-02T00:00:00.000Z",
        open: "100",
        high: "102",
        low: "99",
        close: "101.5",
        volume: "1000",
      },
    ]);

    expect(points).toHaveLength(1);
    expect(points[0]?.close).toBe(101.5);
  });
});
