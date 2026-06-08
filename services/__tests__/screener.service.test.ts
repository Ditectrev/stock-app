import { describe, it, expect } from "vitest";
import { screenerService } from "@/services/screener.service";
import type { ScreenerFilter, ScreenerResult } from "@/types";

const makeResult = (
  overrides: Partial<ScreenerResult> = {}
): ScreenerResult => ({
  symbol: "AAPL",
  name: "Apple Inc.",
  sector: "Technology",
  price: 150,
  changePercent: 2.5,
  volume: 1_000_000,
  marketCap: 2_500_000_000_000,
  peRatio: 28,
  pbRatio: 45,
  pegRatio: 1.5,
  dividendYield: 0.6,
  revenueGrowth: 8,
  earningsGrowth: 12,
  valuationContext: "fair",
  matchScore: 85,
  ...overrides,
});

describe("ScreenerService", () => {
  describe("matchesFilter", () => {
    it("gt: returns true when field > value", () => {
      const result = makeResult({ peRatio: 30 });
      const filter: ScreenerFilter = {
        field: "peRatio",
        operator: "gt",
        value: 25,
        label: "P/E > 25",
      };
      expect(screenerService.matchesFilter(result, filter)).toBe(true);
    });

    it("gt: returns false when field <= value", () => {
      const result = makeResult({ peRatio: 25 });
      const filter: ScreenerFilter = {
        field: "peRatio",
        operator: "gt",
        value: 25,
        label: "P/E > 25",
      };
      expect(screenerService.matchesFilter(result, filter)).toBe(false);
    });

    it("lt: returns true when field < value", () => {
      const result = makeResult({ peRatio: 10 });
      const filter: ScreenerFilter = {
        field: "peRatio",
        operator: "lt",
        value: 15,
        label: "P/E < 15",
      };
      expect(screenerService.matchesFilter(result, filter)).toBe(true);
    });

    it("lt: returns false when field >= value", () => {
      const result = makeResult({ peRatio: 15 });
      const filter: ScreenerFilter = {
        field: "peRatio",
        operator: "lt",
        value: 15,
        label: "P/E < 15",
      };
      expect(screenerService.matchesFilter(result, filter)).toBe(false);
    });

    it("eq: returns true when field == value (number)", () => {
      const result = makeResult({ peRatio: 28 });
      const filter: ScreenerFilter = {
        field: "peRatio",
        operator: "eq",
        value: 28,
        label: "P/E = 28",
      };
      expect(screenerService.matchesFilter(result, filter)).toBe(true);
    });

    it("eq: returns true when field == value (string)", () => {
      const result = makeResult({ sector: "Technology" });
      const filter: ScreenerFilter = {
        field: "sector",
        operator: "eq",
        value: "Technology",
        label: "Sector = Tech",
      };
      expect(screenerService.matchesFilter(result, filter)).toBe(true);
    });

    it("eq: returns false when field != value", () => {
      const result = makeResult({ sector: "Healthcare" });
      const filter: ScreenerFilter = {
        field: "sector",
        operator: "eq",
        value: "Technology",
        label: "Sector = Tech",
      };
      expect(screenerService.matchesFilter(result, filter)).toBe(false);
    });

    it("gte: returns true when field >= value", () => {
      const result = makeResult({ volume: 1_000_000 });
      const filter: ScreenerFilter = {
        field: "volume",
        operator: "gte",
        value: 1_000_000,
        label: "Vol >= 1M",
      };
      expect(screenerService.matchesFilter(result, filter)).toBe(true);
    });

    it("gte: returns false when field < value", () => {
      const result = makeResult({ volume: 999_999 });
      const filter: ScreenerFilter = {
        field: "volume",
        operator: "gte",
        value: 1_000_000,
        label: "Vol >= 1M",
      };
      expect(screenerService.matchesFilter(result, filter)).toBe(false);
    });

    it("lte: returns true when field <= value", () => {
      const result = makeResult({ price: 100 });
      const filter: ScreenerFilter = {
        field: "price",
        operator: "lte",
        value: 100,
        label: "Price <= 100",
      };
      expect(screenerService.matchesFilter(result, filter)).toBe(true);
    });

    it("lte: returns false when field > value", () => {
      const result = makeResult({ price: 101 });
      const filter: ScreenerFilter = {
        field: "price",
        operator: "lte",
        value: 100,
        label: "Price <= 100",
      };
      expect(screenerService.matchesFilter(result, filter)).toBe(false);
    });

    it("between: returns true when field is within range (inclusive)", () => {
      const result = makeResult({ peRatio: 20 });
      const filter: ScreenerFilter = {
        field: "peRatio",
        operator: "between",
        value: [15, 25],
        label: "P/E 15-25",
      };
      expect(screenerService.matchesFilter(result, filter)).toBe(true);
    });

    it("between: returns true at range boundaries", () => {
      const result = makeResult({ peRatio: 15 });
      const filter: ScreenerFilter = {
        field: "peRatio",
        operator: "between",
        value: [15, 25],
        label: "P/E 15-25",
      };
      expect(screenerService.matchesFilter(result, filter)).toBe(true);
    });

    it("between: returns false when field is outside range", () => {
      const result = makeResult({ peRatio: 30 });
      const filter: ScreenerFilter = {
        field: "peRatio",
        operator: "between",
        value: [15, 25],
        label: "P/E 15-25",
      };
      expect(screenerService.matchesFilter(result, filter)).toBe(false);
    });

    it("in: returns true when field is in the list (string)", () => {
      const result = makeResult({ sector: "Technology" });
      const filter: ScreenerFilter = {
        field: "sector",
        operator: "in",
        value: ["Technology", "Healthcare"],
        label: "Sector in list",
      };
      expect(screenerService.matchesFilter(result, filter)).toBe(true);
    });

    it("in: returns false when field is not in the list", () => {
      const result = makeResult({ sector: "Energy" });
      const filter: ScreenerFilter = {
        field: "sector",
        operator: "in",
        value: ["Technology", "Healthcare"],
        label: "Sector in list",
      };
      expect(screenerService.matchesFilter(result, filter)).toBe(false);
    });

    it("returns false for undefined/missing fields", () => {
      const result = makeResult({ peRatio: undefined });
      const filter: ScreenerFilter = {
        field: "peRatio",
        operator: "gt",
        value: 10,
        label: "P/E > 10",
      };
      expect(screenerService.matchesFilter(result, filter)).toBe(false);
    });

    it("returns false for non-existent fields", () => {
      const result = makeResult();
      const filter: ScreenerFilter = {
        field: "nonExistentField",
        operator: "gt",
        value: 10,
        label: "test",
      };
      expect(screenerService.matchesFilter(result, filter)).toBe(false);
    });

    it("returns false for invalid operator", () => {
      const result = makeResult({ peRatio: 20 });
      const filter = {
        field: "peRatio",
        operator: "invalid" as unknown as ScreenerFilter["operator"],
        value: 10,
        label: "test",
      };
      expect(screenerService.matchesFilter(result, filter)).toBe(false);
    });

    it("between: returns false when value is not a 2-element array", () => {
      const result = makeResult({ peRatio: 20 });
      const filter: ScreenerFilter = {
        field: "peRatio",
        operator: "between",
        value: 10 as unknown as ScreenerFilter["value"],
        label: "test",
      };
      expect(screenerService.matchesFilter(result, filter)).toBe(false);
    });

    it("in: returns false when value is not an array", () => {
      const result = makeResult({ sector: "Technology" });
      const filter: ScreenerFilter = {
        field: "sector",
        operator: "in",
        value: "Technology" as unknown as ScreenerFilter["value"],
        label: "test",
      };
      expect(screenerService.matchesFilter(result, filter)).toBe(false);
    });
  });

  describe("matchesAllFilters", () => {
    it("returns true when result matches all filters (AND logic)", () => {
      const result = makeResult({
        peRatio: 20,
        sector: "Technology",
        volume: 2_000_000,
      });
      const filters: ScreenerFilter[] = [
        { field: "peRatio", operator: "lt", value: 25, label: "P/E < 25" },
        {
          field: "sector",
          operator: "eq",
          value: "Technology",
          label: "Sector = Tech",
        },
        {
          field: "volume",
          operator: "gte",
          value: 1_000_000,
          label: "Vol >= 1M",
        },
      ];
      expect(screenerService.matchesAllFilters(result, filters)).toBe(true);
    });

    it("returns false when result fails any single filter", () => {
      const result = makeResult({
        peRatio: 30,
        sector: "Technology",
        volume: 2_000_000,
      });
      const filters: ScreenerFilter[] = [
        { field: "peRatio", operator: "lt", value: 25, label: "P/E < 25" },
        {
          field: "sector",
          operator: "eq",
          value: "Technology",
          label: "Sector = Tech",
        },
      ];
      expect(screenerService.matchesAllFilters(result, filters)).toBe(false);
    });

    it("returns true when filters array is empty", () => {
      const result = makeResult();
      expect(screenerService.matchesAllFilters(result, [])).toBe(true);
    });
  });

  describe("filterResults", () => {
    const results: ScreenerResult[] = [
      makeResult({
        symbol: "AAPL",
        peRatio: 28,
        sector: "Technology",
        volume: 5_000_000,
      }),
      makeResult({
        symbol: "MSFT",
        peRatio: 35,
        sector: "Technology",
        volume: 3_000_000,
      }),
      makeResult({
        symbol: "JNJ",
        peRatio: 15,
        sector: "Healthcare",
        volume: 1_000_000,
      }),
      makeResult({
        symbol: "XOM",
        peRatio: 10,
        sector: "Energy",
        volume: 800_000,
      }),
    ];

    it("returns only results matching all filters", () => {
      const filters: ScreenerFilter[] = [
        {
          field: "sector",
          operator: "eq",
          value: "Technology",
          label: "Sector = Tech",
        },
        { field: "peRatio", operator: "lt", value: 30, label: "P/E < 30" },
      ];
      const filtered = screenerService.filterResults(results, filters);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].symbol).toBe("AAPL");
    });

    it("returns all results when no filters applied", () => {
      const filtered = screenerService.filterResults(results, []);
      expect(filtered).toHaveLength(results.length);
    });

    it("returns empty array when no results match", () => {
      const filters: ScreenerFilter[] = [
        { field: "peRatio", operator: "gt", value: 100, label: "P/E > 100" },
      ];
      const filtered = screenerService.filterResults(results, filters);
      expect(filtered).toHaveLength(0);
    });
  });

  describe("calculateValuationContext", () => {
    it("returns 'overpriced' when P/E > 30", () => {
      const result = makeResult({ peRatio: 35, pbRatio: 2, pegRatio: 0.8 });
      expect(screenerService.calculateValuationContext(result)).toBe(
        "overpriced"
      );
    });

    it("returns 'overpriced' when P/B > 5", () => {
      const result = makeResult({ peRatio: 20, pbRatio: 6, pegRatio: 0.8 });
      expect(screenerService.calculateValuationContext(result)).toBe(
        "overpriced"
      );
    });

    it("returns 'overpriced' when PEG > 2", () => {
      const result = makeResult({ peRatio: 20, pbRatio: 2, pegRatio: 2.5 });
      expect(screenerService.calculateValuationContext(result)).toBe(
        "overpriced"
      );
    });

    it("returns 'underpriced' when P/E < 15 AND P/B < 1.5 AND PEG < 1", () => {
      const result = makeResult({ peRatio: 10, pbRatio: 1.0, pegRatio: 0.5 });
      expect(screenerService.calculateValuationContext(result)).toBe(
        "underpriced"
      );
    });

    it("returns 'fair' when metrics are in between", () => {
      const result = makeResult({ peRatio: 20, pbRatio: 2, pegRatio: 1.2 });
      expect(screenerService.calculateValuationContext(result)).toBe("fair");
    });

    it("returns 'fair' when all metrics are undefined", () => {
      const result = makeResult({
        peRatio: undefined,
        pbRatio: undefined,
        pegRatio: undefined,
      });
      expect(screenerService.calculateValuationContext(result)).toBe("fair");
    });

    it("returns 'fair' when only some metrics present and none trigger overpriced", () => {
      const result = makeResult({
        peRatio: 20,
        pbRatio: undefined,
        pegRatio: undefined,
      });
      expect(screenerService.calculateValuationContext(result)).toBe("fair");
    });

    it("does not return 'underpriced' when any metric is missing", () => {
      const result = makeResult({
        peRatio: 10,
        pbRatio: 1.0,
        pegRatio: undefined,
      });
      expect(screenerService.calculateValuationContext(result)).not.toBe(
        "underpriced"
      );
    });

    it("returns 'overpriced' at boundary: P/E exactly 30 is fair, P/E 30.01 is overpriced", () => {
      const fair = makeResult({ peRatio: 30, pbRatio: 2, pegRatio: 1 });
      expect(screenerService.calculateValuationContext(fair)).toBe("fair");

      const over = makeResult({ peRatio: 30.01, pbRatio: 2, pegRatio: 1 });
      expect(screenerService.calculateValuationContext(over)).toBe(
        "overpriced"
      );
    });
  });

  describe("getDefaultPresets", () => {
    it("returns exactly 7 presets", () => {
      const presets = screenerService.getDefaultPresets();
      expect(presets).toHaveLength(7);
    });

    it("all presets have isDefault set to true", () => {
      const presets = screenerService.getDefaultPresets();
      presets.forEach((preset) => {
        expect(preset.isDefault).toBe(true);
      });
    });

    it("all presets have non-empty filters", () => {
      const presets = screenerService.getDefaultPresets();
      presets.forEach((preset) => {
        expect(preset.filters.length).toBeGreaterThan(0);
      });
    });

    it("contains expected preset names", () => {
      const presets = screenerService.getDefaultPresets();
      const names = presets.map((p) => p.name);
      expect(names).toContain("Most Active Penny Stocks");
      expect(names).toContain("Undervalued Growth Stocks");
      expect(names).toContain("Day Gainers");
      expect(names).toContain("Most Shorted Stocks");
      expect(names).toContain("Undervalued Large Caps");
      expect(names).toContain("Aggressive Small Caps");
      expect(names).toContain("High Dividend Yield");
    });

    it("each preset has a unique id", () => {
      const presets = screenerService.getDefaultPresets();
      const ids = presets.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("fetchScreenerData", () => {
    it("returns filtered results with valuation context", async () => {
      const { vi } = await import("vitest");
      const marketDataMod = await import("@/services/market-data.service");

      vi.spyOn(
        marketDataMod.marketDataService,
        "getStockPerformance"
      ).mockResolvedValue([
        {
          symbol: "AAPL",
          name: "Apple",
          price: 150,
          changePercent: 2.5,
          sector: "Technology",
          marketCap: 2_500_000_000_000,
        },
        {
          symbol: "XOM",
          name: "Exxon",
          price: 100,
          changePercent: -1.2,
          sector: "Energy",
          marketCap: 400_000_000_000,
        },
      ]);

      const results = await screenerService.fetchScreenerData([]);
      expect(results).toHaveLength(2);
      results.forEach((r) => {
        expect(["overpriced", "underpriced", "fair"]).toContain(
          r.valuationContext
        );
      });

      vi.restoreAllMocks();
    });

    it("applies filters to fetched data", async () => {
      const { vi } = await import("vitest");
      const marketDataMod = await import("@/services/market-data.service");

      vi.spyOn(
        marketDataMod.marketDataService,
        "getStockPerformance"
      ).mockResolvedValue([
        {
          symbol: "AAPL",
          name: "Apple",
          price: 150,
          changePercent: 2.5,
          sector: "Technology",
          marketCap: 2_500_000_000_000,
        },
        {
          symbol: "XOM",
          name: "Exxon",
          price: 100,
          changePercent: -1.2,
          sector: "Energy",
          marketCap: 400_000_000_000,
        },
      ]);

      const filters: ScreenerFilter[] = [
        {
          field: "sector",
          operator: "eq",
          value: "Technology",
          label: "Sector = Tech",
        },
      ];
      const results = await screenerService.fetchScreenerData(filters);
      expect(results).toHaveLength(1);
      expect(results[0].symbol).toBe("AAPL");

      vi.restoreAllMocks();
    });
  });
});
