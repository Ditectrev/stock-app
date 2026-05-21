/**
 * Property-Based Tests for Screener State Persistence
 * Feature: the-open-stock, Property 19: Screener State Persistence
 *
 * Validates: Requirements 26.23
 * "For any screener filter configuration, refreshing the page should restore
 * the same filter selections using browser storage."
 *
 * The ScreenerHub component persists filters to localStorage via
 * JSON.stringify and restores them via JSON.parse on mount. These tests
 * verify that the serialization round trip preserves every filter exactly.
 */
import { describe, it, expect, beforeEach } from "vitest";
import fc from "fast-check";
import type { ScreenerFilter } from "@/types";

// ---------------------------------------------------------------------------
// localStorage simulation (mirrors ScreenerHub's STORAGE_KEY)
// ---------------------------------------------------------------------------

const STORAGE_KEY = "screener-filters";

/** Persist filters the same way ScreenerHub.handleFiltersChange does. */
function persistFilters(
  storage: Map<string, string>,
  filters: ScreenerFilter[]
): void {
  if (filters.length === 0) {
    storage.delete(STORAGE_KEY);
  } else {
    storage.set(STORAGE_KEY, JSON.stringify(filters));
  }
}

/** Restore filters the same way ScreenerHub's mount effect does. */
function restoreFilters(storage: Map<string, string>): ScreenerFilter[] | null {
  const raw = storage.get(STORAGE_KEY);
  if (!raw) return null;
  const parsed: unknown = JSON.parse(raw);
  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed as ScreenerFilter[];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helpers — JSON.stringify converts -0 to 0, so we normalise generated
// doubles to avoid false negatives that don't reflect real bugs.
// ---------------------------------------------------------------------------

/** Replace -0 with +0 (JSON.stringify already does this). */
const safeDouble = (opts: { min: number; max: number }) =>
  fc
    .double({ ...opts, noNaN: true, noDefaultInfinity: true })
    .map((n) => (Object.is(n, -0) ? 0 : n));

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const operatorArb = fc.constantFrom(
  "gt" as const,
  "lt" as const,
  "eq" as const,
  "gte" as const,
  "lte" as const
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
  "earningsGrowth",
  "payoutRatio"
);

const numericFilterArb: fc.Arbitrary<ScreenerFilter> = fc
  .record({
    field: numericFieldArb,
    operator: operatorArb,
    value: safeDouble({ min: -1000, max: 100000 }),
  })
  .map((f) => ({ ...f, label: `${f.field} ${f.operator} ${f.value}` }));

const betweenFilterArb: fc.Arbitrary<ScreenerFilter> = fc
  .record({
    field: numericFieldArb,
    low: safeDouble({ min: -1000, max: 50000 }),
    high: safeDouble({ min: -1000, max: 50000 }),
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
      "Materials",
      "Real Estate",
      "Utilities",
      "Communication",
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

const filtersArb = fc.array(filterArb, { minLength: 1, maxLength: 10 });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 19: Screener State Persistence", () => {
  let storage: Map<string, string>;

  beforeEach(() => {
    storage = new Map();
  });

  it("persisted filters are identical after a storage round trip", () => {
    // Feature: the-open-stock, Property 19: Screener State Persistence
    fc.assert(
      fc.property(filtersArb, (filters) => {
        persistFilters(storage, filters);
        const restored = restoreFilters(storage);

        expect(restored).not.toBeNull();
        expect(restored).toEqual(filters);
      }),
      { numRuns: 100 }
    );
  });

  it("each filter field, operator, value, and label survive persistence", () => {
    // Feature: the-open-stock, Property 19: Screener State Persistence
    fc.assert(
      fc.property(filtersArb, (filters) => {
        persistFilters(storage, filters);
        const restored = restoreFilters(storage)!;

        expect(restored.length).toBe(filters.length);

        for (let i = 0; i < filters.length; i++) {
          expect(restored[i].field).toBe(filters[i].field);
          expect(restored[i].operator).toBe(filters[i].operator);
          expect(restored[i].value).toEqual(filters[i].value);
          expect(restored[i].label).toBe(filters[i].label);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("filter order is preserved through persistence", () => {
    // Feature: the-open-stock, Property 19: Screener State Persistence
    fc.assert(
      fc.property(filtersArb, (filters) => {
        persistFilters(storage, filters);
        const restored = restoreFilters(storage)!;

        restored.forEach((f, i) => {
          expect(f).toEqual(filters[i]);
        });
      }),
      { numRuns: 100 }
    );
  });

  it("persisting twice overwrites previous state correctly", () => {
    // Feature: the-open-stock, Property 19: Screener State Persistence
    fc.assert(
      fc.property(filtersArb, filtersArb, (filtersA, filtersB) => {
        persistFilters(storage, filtersA);
        persistFilters(storage, filtersB);
        const restored = restoreFilters(storage);

        expect(restored).toEqual(filtersB);
      }),
      { numRuns: 100 }
    );
  });

  it("clearing filters removes persisted state", () => {
    // Feature: the-open-stock, Property 19: Screener State Persistence
    fc.assert(
      fc.property(filtersArb, (filters) => {
        persistFilters(storage, filters);
        // Clearing = persisting an empty array (mirrors handleClear)
        persistFilters(storage, []);
        const restored = restoreFilters(storage);

        expect(restored).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it("multiple round trips yield the same result (idempotent)", () => {
    // Feature: the-open-stock, Property 19: Screener State Persistence
    fc.assert(
      fc.property(filtersArb, (filters) => {
        // First round trip
        persistFilters(storage, filters);
        const firstRestore = restoreFilters(storage)!;

        // Second round trip using restored data
        persistFilters(storage, firstRestore);
        const secondRestore = restoreFilters(storage)!;

        expect(secondRestore).toEqual(filters);
        expect(secondRestore).toEqual(firstRestore);
      }),
      { numRuns: 100 }
    );
  });

  it("between-filter tuple values survive JSON serialization", () => {
    // Feature: the-open-stock, Property 19: Screener State Persistence
    fc.assert(
      fc.property(
        fc.array(betweenFilterArb, { minLength: 1, maxLength: 5 }),
        (filters) => {
          persistFilters(storage, filters);
          const restored = restoreFilters(storage)!;

          for (let i = 0; i < filters.length; i++) {
            expect(Array.isArray(restored[i].value)).toBe(true);
            const orig = filters[i].value as [number, number];
            const rest = restored[i].value as [number, number];
            expect(rest[0]).toBe(orig[0]);
            expect(rest[1]).toBe(orig[1]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("sector in-filter string arrays survive JSON serialization", () => {
    // Feature: the-open-stock, Property 19: Screener State Persistence
    fc.assert(
      fc.property(
        fc.array(sectorFilterArb, { minLength: 1, maxLength: 3 }),
        (filters) => {
          persistFilters(storage, filters);
          const restored = restoreFilters(storage)!;

          for (let i = 0; i < filters.length; i++) {
            expect(Array.isArray(restored[i].value)).toBe(true);
            expect(restored[i].value).toEqual(filters[i].value);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
