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
});
