/**
 * Property-Based Tests for Screener Filter Conjunction
 * Feature: the-open-stock, Property 17: Screener Filter Conjunction
 *
 * Validates: Requirements 26.8
 * "For any set of screener filters applied, the results should include only
 * assets that match ALL filter criteria (AND logic), and the count of results
 * should match the number of assets meeting all criteria."
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { screenerService } from "@/services/screener.service";
import type { ScreenerFilter, ScreenerResult, ValuationContext } from "@/types";

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const valuationArb: fc.Arbitrary<ValuationContext> = fc.constantFrom(
  "overpriced",
  "underpriced",
  "fair"
);

const sectorArb = fc.constantFrom(
  "Technology",
  "Healthcare",
  "Energy",
  "Financial",
  "Consumer Discretionary"
);

const resultArb: fc.Arbitrary<ScreenerResult> = fc
  .record({
    symbol: fc.string({ minLength: 1, maxLength: 5 }),
    name: fc.string({ minLength: 1, maxLength: 30 }),
    sector: sectorArb,
    price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
    changePercent: fc.double({ min: -100, max: 500, noNaN: true }),
    volume: fc.integer({ min: 0, max: 100_000_000 }),
    marketCap: fc.integer({ min: 0, max: 5_000_000_000_000 }),
    peRatio: fc.option(fc.double({ min: 0, max: 200, noNaN: true })),
    pbRatio: fc.option(fc.double({ min: 0, max: 50, noNaN: true })),
    pegRatio: fc.option(fc.double({ min: 0, max: 10, noNaN: true })),
    dividendYield: fc.option(fc.double({ min: 0, max: 20, noNaN: true })),
    revenueGrowth: fc.option(fc.double({ min: -100, max: 500, noNaN: true })),
    earningsGrowth: fc.option(fc.double({ min: -100, max: 500, noNaN: true })),
    valuationContext: valuationArb,
    matchScore: fc.integer({ min: 0, max: 100 }),
  })
  .map((r) => ({
    ...r,
    peRatio: r.peRatio ?? undefined,
    pbRatio: r.pbRatio ?? undefined,
    pegRatio: r.pegRatio ?? undefined,
    dividendYield: r.dividendYield ?? undefined,
    revenueGrowth: r.revenueGrowth ?? undefined,
    earningsGrowth: r.earningsGrowth ?? undefined,
  }));

/** Generate a numeric filter targeting a known numeric field. */
const numericFieldArb = fc.constantFrom(
  "price",
  "changePercent",
  "volume",
  "marketCap"
);

const numericFilterArb: fc.Arbitrary<ScreenerFilter> = fc.oneof(
  // gt / lt / gte / lte / eq
  fc
    .record({
      field: numericFieldArb,
      operator: fc.constantFrom(
        "gt" as const,
        "lt" as const,
        "gte" as const,
        "lte" as const,
        "eq" as const
      ),
      value: fc.double({ min: -1000, max: 100000, noNaN: true }),
    })
    .map((f) => ({ ...f, label: `${f.field} ${f.operator} ${f.value}` })),
  // between
  fc
    .record({
      field: numericFieldArb,
      lo: fc.double({ min: -1000, max: 50000, noNaN: true }),
      hi: fc.double({ min: -1000, max: 50000, noNaN: true }),
    })
    .map((f) => {
      const min = Math.min(f.lo, f.hi);
      const max = Math.max(f.lo, f.hi);
      return {
        field: f.field,
        operator: "between" as const,
        value: [min, max] as [number, number],
        label: `${f.field} between ${min}-${max}`,
      };
    })
);

const sectorFilterArb: fc.Arbitrary<ScreenerFilter> = fc.oneof(
  // eq
  sectorArb.map((s) => ({
    field: "sector",
    operator: "eq" as const,
    value: s,
    label: `sector eq ${s}`,
  })),
  // in
  fc
    .subarray(
      [
        "Technology",
        "Healthcare",
        "Energy",
        "Financial",
        "Consumer Discretionary",
      ],
      { minLength: 1 }
    )
    .map((sectors) => ({
      field: "sector",
      operator: "in" as const,
      value: sectors,
      label: `sector in [${sectors.join(",")}]`,
    }))
);

const filterArb: fc.Arbitrary<ScreenerFilter> = fc.oneof(
  { weight: 3, arbitrary: numericFilterArb },
  { weight: 1, arbitrary: sectorFilterArb }
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 17: Screener Filter Conjunction", () => {
  it("every returned result satisfies ALL filters (AND logic)", () => {
    // Feature: the-open-stock, Property 17: Screener Filter Conjunction
    fc.assert(
      fc.property(
        fc.array(resultArb, { minLength: 0, maxLength: 30 }),
        fc.array(filterArb, { minLength: 1, maxLength: 5 }),
        (results, filters) => {
          const filtered = screenerService.filterResults(results, filters);

          for (const r of filtered) {
            expect(screenerService.matchesAllFilters(r, filters)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("no excluded result satisfies all filters", () => {
    // Feature: the-open-stock, Property 17: Screener Filter Conjunction
    fc.assert(
      fc.property(
        fc.array(resultArb, { minLength: 1, maxLength: 30 }),
        fc.array(filterArb, { minLength: 1, maxLength: 5 }),
        (results, filters) => {
          const filtered = screenerService.filterResults(results, filters);
          const filteredSymbols = new Set(
            filtered.map((r, i) => `${r.symbol}-${i}`)
          );

          const excluded = results.filter(
            (_, i) => !filteredSymbols.has(`${results[i].symbol}-${i}`)
          );

          // Rebuild excluded set properly via index
          const filteredIndices = new Set<number>();
          let fi = 0;
          for (let i = 0; i < results.length && fi < filtered.length; i++) {
            if (screenerService.matchesAllFilters(results[i], filters)) {
              filteredIndices.add(i);
              fi++;
            }
          }

          for (let i = 0; i < results.length; i++) {
            if (!filteredIndices.has(i)) {
              expect(
                screenerService.matchesAllFilters(results[i], filters)
              ).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("result count equals the number of assets matching all criteria", () => {
    // Feature: the-open-stock, Property 17: Screener Filter Conjunction
    fc.assert(
      fc.property(
        fc.array(resultArb, { minLength: 0, maxLength: 30 }),
        fc.array(filterArb, { minLength: 1, maxLength: 5 }),
        (results, filters) => {
          const filtered = screenerService.filterResults(results, filters);
          const manualCount = results.filter((r) =>
            screenerService.matchesAllFilters(r, filters)
          ).length;

          expect(filtered.length).toBe(manualCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("empty filters return all results unchanged", () => {
    // Feature: the-open-stock, Property 17: Screener Filter Conjunction
    fc.assert(
      fc.property(
        fc.array(resultArb, { minLength: 0, maxLength: 30 }),
        (results) => {
          const filtered = screenerService.filterResults(results, []);
          expect(filtered.length).toBe(results.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("adding a filter can only reduce or maintain result count (monotonicity)", () => {
    // Feature: the-open-stock, Property 17: Screener Filter Conjunction
    fc.assert(
      fc.property(
        fc.array(resultArb, { minLength: 1, maxLength: 30 }),
        fc.array(filterArb, { minLength: 1, maxLength: 4 }),
        filterArb,
        (results, baseFilters, extraFilter) => {
          const baseCount = screenerService.filterResults(
            results,
            baseFilters
          ).length;
          const stricterCount = screenerService.filterResults(results, [
            ...baseFilters,
            extraFilter,
          ]).length;

          expect(stricterCount).toBeLessThanOrEqual(baseCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("filter order does not affect results (commutativity)", () => {
    // Feature: the-open-stock, Property 17: Screener Filter Conjunction
    fc.assert(
      fc.property(
        fc.array(resultArb, { minLength: 1, maxLength: 20 }),
        fc.array(filterArb, { minLength: 2, maxLength: 5 }),
        (results, filters) => {
          const forward = screenerService.filterResults(results, filters);
          const reversed = screenerService.filterResults(
            results,
            [...filters].reverse()
          );

          expect(forward.length).toBe(reversed.length);
          expect(forward.map((r) => r.symbol)).toEqual(
            reversed.map((r) => r.symbol)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("filtered results are a subset of the original results", () => {
    // Feature: the-open-stock, Property 17: Screener Filter Conjunction
    fc.assert(
      fc.property(
        fc.array(resultArb, { minLength: 0, maxLength: 30 }),
        fc.array(filterArb, { minLength: 1, maxLength: 5 }),
        (results, filters) => {
          const filtered = screenerService.filterResults(results, filters);

          for (const fr of filtered) {
            expect(results).toContain(fr);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
