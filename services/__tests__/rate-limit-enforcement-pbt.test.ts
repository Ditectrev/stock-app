/**
 * Property-Based Tests for Rate Limit Enforcement
 * Feature: the-open-stock, Property 5: Rate Limit Enforcement
 *
 * Validates: Requirements 17.1, 17.4
 * "For any sequence of API requests within a time window, the number of
 * requests should not exceed the configured rate limit, and when the limit
 * is reached, cached data should be served if available."
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";

// ---------------------------------------------------------------------------
// Mock dependencies before importing modules
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

// Use a small rate limit so tests run quickly.
// Values are inlined in the vi.mock factory (hoisted — can't reference locals).
const TEST_MAX_REQUESTS = 5;
const TEST_WINDOW_SECONDS = 60;

vi.mock("@/lib/env", () => ({
  env: {
    cache: {
      ttlSeconds: 300,
      rateLimitMaxRequests: 5, // must match TEST_MAX_REQUESTS
      rateLimitWindowSeconds: 60, // must match TEST_WINDOW_SECONDS
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
// Helpers
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

const symbolArb = fc.stringMatching(/^[A-Z]{1,5}$/).filter((s) => s.length > 0);

const priceArb = fc.double({ min: 0.01, max: 10_000, noNaN: true });

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

describe("Property 5: Rate Limit Enforcement", () => {
  let service: MarketDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    cacheService.clear();
    rateLimiter.clearAll();
    service = new MarketDataService();
  });

  it("requests within the rate limit window do not exceed the configured maximum", async () => {
    // Feature: the-open-stock, Property 5: Rate Limit Enforcement
    // **Validates: Requirements 17.1, 17.4**
    await fc.assert(
      fc.asyncProperty(symbolArb, priceArb, async (symbol, price) => {
        vi.clearAllMocks();
        cacheService.clear();
        rateLimiter.clearAll();

        const mockData = makeSymbolData(symbol, price);
        mockGetSymbolQuote.mockResolvedValue(mockData);

        const endpoint = `yahoo:quote:${symbol}`;

        // Make requests up to the limit using distinct symbols per call
        // to bypass caching. We use the same endpoint key by calling
        // getSymbolData which builds the endpoint from the symbol.
        // However, after the first call the result is cached, so
        // subsequent calls for the same symbol won't hit the limiter.
        // Instead, we directly exercise the rate limiter to saturate it,
        // then verify the service respects the limit.
        for (let i = 0; i < TEST_MAX_REQUESTS; i++) {
          await rateLimiter.checkLimit(endpoint);
        }

        // The limiter should now be exhausted for this endpoint
        const remaining = rateLimiter.getRemaining(endpoint);
        expect(remaining).toBe(0);

        // The next checkLimit call should be denied
        const allowed = await rateLimiter.checkLimit(endpoint);
        expect(allowed).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("when rate limited, cached data is served instead of making API calls", async () => {
    // Feature: the-open-stock, Property 5: Rate Limit Enforcement
    // **Validates: Requirements 17.1, 17.4**
    await fc.assert(
      fc.asyncProperty(symbolArb, priceArb, async (symbol, price) => {
        vi.clearAllMocks();
        cacheService.clear();
        rateLimiter.clearAll();

        const mockData = makeSymbolData(symbol, price);
        mockGetSymbolQuote.mockResolvedValue(mockData);

        // First call populates the cache and records one API call
        const first = await service.getSymbolData(symbol);
        expect(first.price).toBe(price);
        const apiCallsAfterFirst = mockGetSymbolQuote.mock.calls.length;

        // Exhaust the rate limit for this endpoint
        const endpoint = `yahoo:quote:${symbol}`;
        for (let i = 0; i < TEST_MAX_REQUESTS + 10; i++) {
          await rateLimiter.checkLimit(endpoint);
        }

        // Invalidate cache so the service must decide between API and cache
        // Re-populate cache manually to simulate stale data being available
        const cacheKey = cacheService.generateKey(symbol, "quote");
        cacheService.set(cacheKey, mockData, 300);

        // Service should serve cached data without new API calls
        const result = await service.getSymbolData(symbol);
        expect(result).toEqual(first);
        // No additional API calls beyond the initial one
        expect(mockGetSymbolQuote.mock.calls.length).toBe(apiCallsAfterFirst);
      }),
      { numRuns: 100 }
    );
  });

  it("when rate limited with no cached data, an error is thrown", async () => {
    // Feature: the-open-stock, Property 5: Rate Limit Enforcement
    // **Validates: Requirements 17.1, 17.4**
    await fc.assert(
      fc.asyncProperty(symbolArb, priceArb, async (symbol, price) => {
        vi.clearAllMocks();
        cacheService.clear();
        rateLimiter.clearAll();

        mockGetSymbolQuote.mockResolvedValue(makeSymbolData(symbol, price));

        // Exhaust the rate limit without ever populating the cache
        const endpoint = `yahoo:quote:${symbol}`;
        for (let i = 0; i <= TEST_MAX_REQUESTS; i++) {
          await rateLimiter.checkLimit(endpoint);
        }

        // With no cached data and rate limit exceeded, service should throw
        await expect(service.getSymbolData(symbol)).rejects.toThrow(
          /rate limit/i
        );

        // API should not have been called
        expect(mockGetSymbolQuote).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  it("rate limit resets after the time window expires", async () => {
    // Feature: the-open-stock, Property 5: Rate Limit Enforcement
    // **Validates: Requirements 17.1, 17.4**
    await fc.assert(
      fc.asyncProperty(symbolArb, async (symbol) => {
        vi.clearAllMocks();
        cacheService.clear();
        rateLimiter.clearAll();
        vi.useFakeTimers();

        try {
          const endpoint = `yahoo:quote:${symbol}`;

          // Exhaust the rate limit
          for (let i = 0; i < TEST_MAX_REQUESTS; i++) {
            await rateLimiter.checkLimit(endpoint);
          }
          expect(await rateLimiter.checkLimit(endpoint)).toBe(false);

          // Advance time past the window
          vi.advanceTimersByTime((TEST_WINDOW_SECONDS + 1) * 1000);

          // Rate limit should be reset — requests allowed again
          const allowed = await rateLimiter.checkLimit(endpoint);
          expect(allowed).toBe(true);
          expect(rateLimiter.getRemaining(endpoint)).toBeGreaterThan(0);
        } finally {
          vi.useRealTimers();
        }
      }),
      { numRuns: 100 }
    );
  });

  it("different endpoints have independent rate limits", async () => {
    // Feature: the-open-stock, Property 5: Rate Limit Enforcement
    // **Validates: Requirements 17.1, 17.4**
    await fc.assert(
      fc.asyncProperty(symbolArb, symbolArb, async (symbolA, symbolB) => {
        fc.pre(symbolA !== symbolB);

        vi.clearAllMocks();
        cacheService.clear();
        rateLimiter.clearAll();

        const endpointA = `yahoo:quote:${symbolA}`;
        const endpointB = `yahoo:quote:${symbolB}`;

        // Exhaust limit for endpoint A
        for (let i = 0; i <= TEST_MAX_REQUESTS; i++) {
          await rateLimiter.checkLimit(endpointA);
        }

        // Endpoint A should be blocked
        expect(await rateLimiter.checkLimit(endpointA)).toBe(false);

        // Endpoint B should still be allowed
        expect(await rateLimiter.checkLimit(endpointB)).toBe(true);
        expect(rateLimiter.getRemaining(endpointB)).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});
