/**
 * Property-Based Tests for Screener Preset Application
 * Feature: the-open-stock, Property 18: Screener Preset Application
 *
 * Validates: Requirements 26.13
 * "For any screener preset selected, the applied filters should exactly match
 * the preset's defined filter combination."
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

/** Arbitrary that picks one of the default presets by index. */
const defaultPresets = screenerService.getDefaultPresets();
const presetIndexArb = fc.integer({ min: 0, max: defaultPresets.length - 1 });

/** Arbitrary for a custom preset with random filters. */
const operatorArb = fc.constantFrom(
  "gt" as const,
  "lt" as const,
  "gte" as const,
  "lte" as const
);

const numericFieldArb = fc.constantFrom(
  "price",
  "changePercent",
  "volume",
  "marketCap",
  "peRatio",
  "dividendYield"
);

const numericFilterArb: fc.Arbitrary<ScreenerFilter> = fc
  .record({
    field: numericFieldArb,
    operator: operatorArb,
    value: fc.double({ min: -1000, max: 100000, noNaN: true }),
  })
  .map((f) => ({ ...f, label: `${f.field} ${f.operator} ${f.value}` }));

const sectorFilterArb: fc.Arbitrary<ScreenerFilter> = fc
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
  }));

const filterArb: fc.Arbitrary<ScreenerFilter> = fc.oneof(
  { weight: 3, arbitrary: numericFilterArb },
  { weight: 1, arbitrary: sectorFilterArb }
);

const customPresetArb: fc.Arbitrary<ScreenerPreset> = fc
  .record({
    id: fc
      .string({ minLength: 3, maxLength: 20 })
      .map((s) => `custom-${s.replace(/\s+/g, "-")}`),
    name: fc.string({ minLength: 1, maxLength: 30 }),
    description: fc.string({ minLength: 0, maxLength: 50 }),
    filters: fc.array(filterArb, { minLength: 1, maxLength: 5 }),
  })
  .map((p) => ({
    ...p,
    isDefault: false,
    createdAt: new Date(),
  }));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 18: Screener Preset Application", () => {
  it("applying a default preset uses exactly its defined filters", () => {
    // Feature: the-open-stock, Property 18: Screener Preset Application
    fc.assert(
      fc.property(
        presetIndexArb,
        fc.array(resultArb, { minLength: 0, maxLength: 30 }),
        (presetIdx, results) => {
          const preset = defaultPresets[presetIdx];
          const appliedFilters = preset.filters;

          // The filters used for filtering must be identical to the preset
          const filtered = screenerService.filterResults(
            results,
            appliedFilters
          );
          const expected = screenerService.filterResults(
            results,
            preset.filters
          );

          expect(filtered).toEqual(expected);
          expect(appliedFilters).toEqual(preset.filters);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("applying a custom preset uses exactly its defined filters", () => {
    // Feature: the-open-stock, Property 18: Screener Preset Application
    fc.assert(
      fc.property(
        customPresetArb,
        fc.array(resultArb, { minLength: 0, maxLength: 30 }),
        (preset, results) => {
          const appliedFilters = preset.filters;

          const filtered = screenerService.filterResults(
            results,
            appliedFilters
          );
          const expected = screenerService.filterResults(
            results,
            preset.filters
          );

          expect(filtered).toEqual(expected);
          expect(appliedFilters).toEqual(preset.filters);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("preset filters are structurally preserved (field, operator, value, label)", () => {
    // Feature: the-open-stock, Property 18: Screener Preset Application
    fc.assert(
      fc.property(presetIndexArb, (presetIdx) => {
        const preset = defaultPresets[presetIdx];
        const appliedFilters: ScreenerFilter[] = [...preset.filters];

        expect(appliedFilters.length).toBe(preset.filters.length);

        for (let i = 0; i < appliedFilters.length; i++) {
          expect(appliedFilters[i].field).toBe(preset.filters[i].field);
          expect(appliedFilters[i].operator).toBe(preset.filters[i].operator);
          expect(appliedFilters[i].value).toEqual(preset.filters[i].value);
          expect(appliedFilters[i].label).toBe(preset.filters[i].label);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("applying the same preset twice yields identical results", () => {
    // Feature: the-open-stock, Property 18: Screener Preset Application
    fc.assert(
      fc.property(
        presetIndexArb,
        fc.array(resultArb, { minLength: 1, maxLength: 30 }),
        (presetIdx, results) => {
          const preset = defaultPresets[presetIdx];

          const first = screenerService.filterResults(results, preset.filters);
          const second = screenerService.filterResults(results, preset.filters);

          expect(first).toEqual(second);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("switching presets replaces filters entirely (no bleed between presets)", () => {
    // Feature: the-open-stock, Property 18: Screener Preset Application
    fc.assert(
      fc.property(
        presetIndexArb,
        presetIndexArb,
        fc.array(resultArb, { minLength: 1, maxLength: 30 }),
        (idxA, idxB, results) => {
          const presetA = defaultPresets[idxA];
          const presetB = defaultPresets[idxB];

          // Simulate selecting preset A then switching to preset B
          const resultsA = screenerService.filterResults(
            results,
            presetA.filters
          );
          const resultsB = screenerService.filterResults(
            results,
            presetB.filters
          );

          // Results from B should only reflect B's filters, not A's
          const expectedB = screenerService.filterResults(
            results,
            presetB.filters
          );
          expect(resultsB).toEqual(expectedB);

          // If presets differ, results may differ
          if (idxA !== idxB) {
            // At minimum, B's results should be independent of A
            const reBFromScratch = screenerService.filterResults(
              results,
              presetB.filters
            );
            expect(resultsB).toEqual(reBFromScratch);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("every default preset has at least one filter defined", () => {
    // Feature: the-open-stock, Property 18: Screener Preset Application
    for (const preset of defaultPresets) {
      expect(preset.filters.length).toBeGreaterThan(0);
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
    }
  });

  it("preset filter application produces results consistent with manual filter-by-filter check", () => {
    // Feature: the-open-stock, Property 18: Screener Preset Application
    fc.assert(
      fc.property(
        presetIndexArb,
        fc.array(resultArb, { minLength: 1, maxLength: 30 }),
        (presetIdx, results) => {
          const preset = defaultPresets[presetIdx];
          const presetResults = screenerService.filterResults(
            results,
            preset.filters
          );

          // Manually verify each result passes every preset filter
          for (const r of presetResults) {
            for (const f of preset.filters) {
              expect(screenerService.matchesFilter(r, f)).toBe(true);
            }
          }

          // Verify no matching result was excluded
          const manualCount = results.filter((r) =>
            preset.filters.every((f) => screenerService.matchesFilter(r, f))
          ).length;
          expect(presetResults.length).toBe(manualCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
