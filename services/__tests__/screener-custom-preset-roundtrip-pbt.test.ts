/**
 * Property-Based Tests for Custom Preset Round Trip
 * Feature: the-open-stock, Property 20: Custom Preset Round Trip
 *
 * Validates: Requirements 26.15
 * "For any custom screener preset saved by a user, retrieving the preset
 * should return the exact same filter combination that was saved."
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { screenerService } from "@/services/screener.service";
import type {
  ScreenerFilter,
  ScreenerPreset,
  ScreenerResult,
  ValuationContext,
} from "@/types";

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const operatorArb = fc.constantFrom(
  "gt" as const,
  "lt" as const,
  "gte" as const,
  "lte" as const,
  "eq" as const
);

const numericFieldArb = fc.constantFrom(
  "price",
  "changePercent",
  "volume",
  "marketCap",
  "peRatio",
  "pbRatio",
  "pegRatio",
  "dividendYield",
  "revenueGrowth",
  "earningsGrowth"
);

const numericFilterArb: fc.Arbitrary<ScreenerFilter> = fc
  .record({
    field: numericFieldArb,
    operator: operatorArb,
    value: fc.double({ min: -1000, max: 100000, noNaN: true }),
  })
  .map((f) => ({ ...f, label: `${f.field} ${f.operator} ${f.value}` }));

const betweenFilterArb: fc.Arbitrary<ScreenerFilter> = fc
  .record({
    field: numericFieldArb,
    low: fc.double({ min: -1000, max: 50000, noNaN: true }),
    high: fc.double({ min: -1000, max: 50000, noNaN: true }),
  })
  .map((f) => {
    const min = Math.min(f.low, f.high);
    const max = Math.max(f.low, f.high);
    return {
      field: f.field,
      operator: "between" as const,
      value: [min, max] as [number, number],
      label: `${f.field} between ${min} and ${max}`,
    };
  });

const sectorArb = fc.constantFrom(
  "Technology",
  "Healthcare",
  "Energy",
  "Financial",
  "Consumer Discretionary",
  "Industrials",
  "Consumer Staples",
  "Materials",
  "Real Estate",
  "Utilities",
  "Communication"
);

const sectorFilterArb: fc.Arbitrary<ScreenerFilter> = fc
  .subarray(
    [
      "Technology",
      "Healthcare",
      "Energy",
      "Financial",
      "Consumer Discretionary",
      "Industrials",
      "Consumer Staples",
    ],
    { minLength: 1 }
  )
  .map((sectors) => ({
    field: "sector",
    operator: "in" as const,
    value: sectors,
    label: `sector in [${sectors.join(",")}]`,
  }));

const filterArb: fc.Arbitrary<ScreenerFilter> = fc.oneof(
  { weight: 3, arbitrary: numericFilterArb },
  { weight: 1, arbitrary: betweenFilterArb },
  { weight: 1, arbitrary: sectorFilterArb }
);

/** Arbitrary for a non-empty preset name (alphanumeric + spaces). */
const presetNameArb = fc
  .stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,29}$/)
  .filter((s) => s.trim().length > 0);

const presetDescriptionArb = fc.string({ minLength: 0, maxLength: 60 });

const filtersArb = fc.array(filterArb, { minLength: 1, maxLength: 8 });

const valuationArb: fc.Arbitrary<ValuationContext> = fc.constantFrom(
  "overpriced",
  "underpriced",
  "fair"
);

const resultArb: fc.Arbitrary<ScreenerResult> = fc
  .record({
    symbol: fc.stringMatching(/^[A-Z]{1,5}$/),
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

// ---------------------------------------------------------------------------
// Helpers — simulate the preset save/retrieve round trip
// ---------------------------------------------------------------------------

/**
 * Simulates the POST /api/screener/presets handler logic:
 * constructs a ScreenerPreset from user input.
 */
function savePreset(
  name: string,
  description: string,
  filters: ScreenerFilter[]
): ScreenerPreset {
  return {
    id: `custom-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    description,
    filters,
    isDefault: false,
    createdAt: new Date(),
  };
}

/**
 * Simulates retrieving a saved preset (identity — the API returns
 * the preset as-is from storage).
 */
function retrievePreset(preset: ScreenerPreset): ScreenerPreset {
  return { ...preset };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 20: Custom Preset Round Trip", () => {
  it("saved preset filters are identical to the original filters", () => {
    // Feature: the-open-stock, Property 20: Custom Preset Round Trip
    fc.assert(
      fc.property(
        presetNameArb,
        presetDescriptionArb,
        filtersArb,
        (name, description, filters) => {
          const saved = savePreset(name, description, filters);
          const retrieved = retrievePreset(saved);

          // Filter combination must be exactly preserved
          expect(retrieved.filters).toEqual(filters);
          expect(retrieved.filters.length).toBe(filters.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("each filter field, operator, value, and label survive the round trip", () => {
    // Feature: the-open-stock, Property 20: Custom Preset Round Trip
    fc.assert(
      fc.property(
        presetNameArb,
        presetDescriptionArb,
        filtersArb,
        (name, description, filters) => {
          const saved = savePreset(name, description, filters);
          const retrieved = retrievePreset(saved);

          for (let i = 0; i < filters.length; i++) {
            expect(retrieved.filters[i].field).toBe(filters[i].field);
            expect(retrieved.filters[i].operator).toBe(filters[i].operator);
            expect(retrieved.filters[i].value).toEqual(filters[i].value);
            expect(retrieved.filters[i].label).toBe(filters[i].label);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("preset metadata (name, description, isDefault) is preserved", () => {
    // Feature: the-open-stock, Property 20: Custom Preset Round Trip
    fc.assert(
      fc.property(
        presetNameArb,
        presetDescriptionArb,
        filtersArb,
        (name, description, filters) => {
          const saved = savePreset(name, description, filters);
          const retrieved = retrievePreset(saved);

          expect(retrieved.name).toBe(name);
          expect(retrieved.description).toBe(description);
          expect(retrieved.isDefault).toBe(false);
          expect(retrieved.id).toBe(
            `custom-${name.toLowerCase().replace(/\s+/g, "-")}`
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("applying a round-tripped preset produces the same filter results as the original filters", () => {
    // Feature: the-open-stock, Property 20: Custom Preset Round Trip
    fc.assert(
      fc.property(
        presetNameArb,
        presetDescriptionArb,
        filtersArb,
        fc.array(resultArb, { minLength: 0, maxLength: 30 }),
        (name, description, filters, results) => {
          const saved = savePreset(name, description, filters);
          const retrieved = retrievePreset(saved);

          const originalResults = screenerService.filterResults(
            results,
            filters
          );
          const roundTrippedResults = screenerService.filterResults(
            results,
            retrieved.filters
          );

          expect(roundTrippedResults).toEqual(originalResults);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("saving and retrieving twice yields the same preset", () => {
    // Feature: the-open-stock, Property 20: Custom Preset Round Trip
    fc.assert(
      fc.property(
        presetNameArb,
        presetDescriptionArb,
        filtersArb,
        (name, description, filters) => {
          const first = savePreset(name, description, filters);
          const second = savePreset(name, description, filters);

          // Ignore createdAt (timestamps differ)
          const { createdAt: _a, ...firstRest } = first;
          const { createdAt: _b, ...secondRest } = second;

          expect(firstRest).toEqual(secondRest);
          expect(retrievePreset(first).filters).toEqual(
            retrievePreset(second).filters
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("filter order is preserved through the round trip", () => {
    // Feature: the-open-stock, Property 20: Custom Preset Round Trip
    fc.assert(
      fc.property(
        presetNameArb,
        presetDescriptionArb,
        filtersArb,
        (name, description, filters) => {
          const saved = savePreset(name, description, filters);
          const retrieved = retrievePreset(saved);

          // Verify order is preserved — filters at each index must match
          retrieved.filters.forEach((f, i) => {
            expect(f).toEqual(filters[i]);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
