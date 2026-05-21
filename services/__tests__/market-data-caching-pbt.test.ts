/**
 * Property-Based Tests for Market Data Caching
 * Feature: the-open-stock, Property 3: Market Data Caching
 *
 * Validates: Requirements 3.4, 17.2
 * "For any market data request, if the data is cached and the TTL has not
 * expired, subsequent requests should return the cached data without making
 * external API calls."
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fc from "fast-check";

// ---------------------------------------------------------------------------
// Mock dependencies before importing the service
// ---------------------------------------------------------------------------

const { mockGetSymbolQuote, mockGetHistoricalData } = vi.hoisted(() => ({
  mockGetSymbolQuote: vi.fn(),
  mockGetHistoricalData: vi.fn(),
}));

vi.mock("@/services/yahoo-finance.service", () => ({
  yahooFinanceService: {
    getSymbolQuote: mockGetSymbolQuote,
    getHistoricalData: mockGetHistoricalData,
    searchSymbols: vi.fn().mockResolvedValue([]),
    getFinancialStatements: vi.fn().mockResolvedValue({}),
    getAnalystForecasts: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@/services/cnn-api.service", () => ({
  cnnApiService: {
    getFearGreedIndex: vi.fn().mockResolvedValue({}),
    getWorldMarkets: vi.fn().mockResolvedValue([]),
    getEconomicEvents: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/services/trading-economics.service", () => ({
  tradingEconomicsService: {
    getEconomicEvents: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/env", () => ({
  env: {
    cache: {
      ttlSeconds: 300,
      rateLimitMaxRequests: 1000,
      rateLimitWindowSeconds: 60,
    },
    apis: {
      yahooFinanceUrl: "https://query1.finance.yahoo.com",
      cnnDatavizUrl: "https://production.dataviz.cnn.io",
    },
  },
}));

// Import after mocks are set up
import { MarketDataService } from "@/services/market-data.service";
import { cacheService } from "@/lib/cache";
import { rateLimiter } from "@/lib/rate-limiter";
import type { SymbolData, PriceData, TimeRange } from "@/types";

// ---------------------------------------------------------------------------
// Helpers — generate realistic mock data
// ---------------------------------------------------------------------------

function makeSymbolData(symbol: string, price: number): SymbolData {
  return {
    symbol: symbol.toUpperCase(),
    name: `${symbol} Inc.`,
    price,
    change: price * 0.01,
    changePercent: 1.0,
    marketCap: price * 1_000_000,
    volume: 500_000,
    fiftyTwoWeekHigh: price * 1.3,
    fiftyTwoWeekLow: price * 0.7,
    lastUpdated: new Date(),
  };
}

function makePriceData(close: number, idx: number): PriceData {
  return {
    timestamp: new Date(Date.now() - idx * 86_400_000),
    open: close * 0.99,
    high: close * 1.02,
    low: close * 0.98,
    close,
    volume: 100_000 + idx * 1_000,
  };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Uppercase ticker symbols (1-5 alpha chars) */
const symbolArb = fc.stringMatching(/^[A-Z]{1,5}$/).filter((s) => s.length > 0);

/** Positive price values */
const priceArb = fc.double({ min: 0.01, max: 10_000, noNaN: true });

/** Valid time ranges */
const timeRangeArb = fc.constantFrom<TimeRange>(
  "1D",
  "1W",
  "1M",
  "3M",
  "1Y",
  "5Y",
  "Max"
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 3: Market Data Caching", () => {
  let service: MarketDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    cacheService.clear();
    rateLimiter.clearAll();
    service = new MarketDataService();
  });

  it("cached symbol data is returned without additional API calls", async () => {
    // Feature: the-open-stock, Property 3: Market Data Caching
    // **Validates: Requirements 3.4, 17.2**
    await fc.assert(
      fc.asyncProperty(symbolArb, priceArb, async (symbol, price) => {
        vi.clearAllMocks();
        cacheService.clear();
        rateLimiter.clearAll();

        const mockData = makeSymbolData(symbol, price);
        mockGetSymbolQuote.mockResolvedValue(mockData);

        // First call — should hit the API
        const first = await service.getSymbolData(symbol);
        expect(mockGetSymbolQuote).toHaveBeenCalledTimes(1);

        // Second call — should return cached data, no new API call
        const second = await service.getSymbolData(symbol);
        expect(mockGetSymbolQuote).toHaveBeenCalledTimes(1);

        // Both results must be identical
        expect(second).toEqual(first);
      }),
      { numRuns: 100 }
    );
  });

  it("cached historical data is returned without additional API calls", async () => {
    // Feature: the-open-stock, Property 3: Market Data Caching
    // **Validates: Requirements 3.4, 17.2**
    await fc.assert(
      fc.asyncProperty(
        symbolArb,
        timeRangeArb,
        priceArb,
        async (symbol, range, basePrice) => {
          vi.clearAllMocks();
          cacheService.clear();
          rateLimiter.clearAll();

          const mockData = Array.from({ length: 5 }, (_, i) =>
            makePriceData(basePrice + i, i)
          );
          mockGetHistoricalData.mockResolvedValue(mockData);

          // First call — API hit
          const first = await service.getHistoricalPrices(symbol, range);
          expect(mockGetHistoricalData).toHaveBeenCalledTimes(1);

          // Second call — cached
          const second = await service.getHistoricalPrices(symbol, range);
          expect(mockGetHistoricalData).toHaveBeenCalledTimes(1);

          expect(second).toEqual(first);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("different symbols produce independent cache entries", async () => {
    // Feature: the-open-stock, Property 3: Market Data Caching
    // **Validates: Requirements 3.4, 17.2**
    await fc.assert(
      fc.asyncProperty(
        symbolArb,
        symbolArb,
        priceArb,
        priceArb,
        async (symbolA, symbolB, priceA, priceB) => {
          // Skip when both symbols are the same
          fc.pre(symbolA !== symbolB);

          vi.clearAllMocks();
          cacheService.clear();
          rateLimiter.clearAll();

          const dataA = makeSymbolData(symbolA, priceA);
          const dataB = makeSymbolData(symbolB, priceB);

          mockGetSymbolQuote
            .mockResolvedValueOnce(dataA)
            .mockResolvedValueOnce(dataB);

          const resultA = await service.getSymbolData(symbolA);
          const resultB = await service.getSymbolData(symbolB);

          // Each symbol triggers its own API call
          expect(mockGetSymbolQuote).toHaveBeenCalledTimes(2);

          // Cached lookups return correct data per symbol
          const cachedA = await service.getSymbolData(symbolA);
          const cachedB = await service.getSymbolData(symbolB);

          expect(cachedA).toEqual(resultA);
          expect(cachedB).toEqual(resultB);
          // No additional API calls
          expect(mockGetSymbolQuote).toHaveBeenCalledTimes(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("cache invalidation forces a fresh API call on next request", async () => {
    // Feature: the-open-stock, Property 3: Market Data Caching
    // **Validates: Requirements 3.4, 17.2**
    await fc.assert(
      fc.asyncProperty(
        symbolArb,
        priceArb,
        priceArb,
        async (symbol, priceOld, priceNew) => {
          vi.clearAllMocks();
          cacheService.clear();
          rateLimiter.clearAll();

          const oldData = makeSymbolData(symbol, priceOld);
          const newData = makeSymbolData(symbol, priceNew);

          mockGetSymbolQuote
            .mockResolvedValueOnce(oldData)
            .mockResolvedValueOnce(newData);

          // Populate cache
          await service.getSymbolData(symbol);
          expect(mockGetSymbolQuote).toHaveBeenCalledTimes(1);

          // Invalidate
          await service.invalidateCache(symbol);

          // Next call must hit the API again
          const fresh = await service.getSymbolData(symbol);
          expect(mockGetSymbolQuote).toHaveBeenCalledTimes(2);
          expect(fresh.price).toBe(priceNew);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("expired cache entries trigger a new API call", async () => {
    // Feature: the-open-stock, Property 3: Market Data Caching
    // **Validates: Requirements 3.4, 17.2**
    await fc.assert(
      fc.asyncProperty(
        symbolArb,
        priceArb,
        priceArb,
        async (symbol, priceOld, priceNew) => {
          vi.clearAllMocks();
          cacheService.clear();
          rateLimiter.clearAll();
          vi.useFakeTimers();

          try {
            const oldData = makeSymbolData(symbol, priceOld);
            const newData = makeSymbolData(symbol, priceNew);

            mockGetSymbolQuote
              .mockResolvedValueOnce(oldData)
              .mockResolvedValueOnce(newData);

            // Populate cache
            const first = await service.getSymbolData(symbol);
            expect(first.price).toBe(priceOld);
            expect(mockGetSymbolQuote).toHaveBeenCalledTimes(1);

            // Advance time past TTL (300s default + 1s buffer)
            vi.advanceTimersByTime(301_000);

            // Cache should be expired — new API call
            const second = await service.getSymbolData(symbol);
            expect(mockGetSymbolQuote).toHaveBeenCalledTimes(2);
            expect(second.price).toBe(priceNew);
          } finally {
            vi.useRealTimers();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
