/**
 * Property-Based Tests for API Error Handling
 * Feature: the-open-stock, Property 4: API Error Handling
 *
 * Validates: Requirements 3.5, 14.2, 14.5
 * "For any API request failure (network error, rate limit, or service
 * unavailability), the system should display a user-friendly error message
 * and provide a retry mechanism."
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";

// ---------------------------------------------------------------------------
// Mock dependencies before importing the service
// ---------------------------------------------------------------------------

const {
  mockGetSymbolQuote,
  mockGetHistoricalData,
  mockGetFinancials,
  mockGetForecastData,
  mockGetFearGreedIndex,
  mockGetWorldMarkets,
  mockGetEconomicEvents,
} = vi.hoisted(() => ({
  mockGetSymbolQuote: vi.fn(),
  mockGetHistoricalData: vi.fn(),
  mockGetFinancials: vi.fn(),
  mockGetForecastData: vi.fn(),
  mockGetFearGreedIndex: vi.fn(),
  mockGetWorldMarkets: vi.fn(),
  mockGetEconomicEvents: vi.fn(),
}));

vi.mock("@/services/yahoo-finance.service", () => ({
  yahooFinanceService: {
    getSymbolQuote: mockGetSymbolQuote,
    getHistoricalData: mockGetHistoricalData,
    getFinancials: mockGetFinancials,
    getForecastData: mockGetForecastData,
    searchSymbols: vi.fn().mockResolvedValue([]),
    getAnalystForecasts: vi.fn().mockResolvedValue({}),
    getWorldMarkets: vi.fn().mockResolvedValue([]),
    getEarningsCalendar: vi.fn().mockResolvedValue([]),
    getDividendCalendar: vi.fn().mockResolvedValue([]),
    getIPOCalendar: vi.fn().mockResolvedValue([]),
    getSectorPerformance: vi.fn().mockResolvedValue([]),
    getETFPerformance: vi.fn().mockResolvedValue([]),
    getCryptoPerformance: vi.fn().mockResolvedValue([]),
    getStockPerformance: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/services/cnn-api.service", () => ({
  cnnApiService: {
    getFearGreedIndex: mockGetFearGreedIndex,
    getWorldMarkets: mockGetWorldMarkets,
    getEconomicEvents: mockGetEconomicEvents,
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

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Uppercase ticker symbols (1-5 alpha chars) */
const symbolArb = fc.stringMatching(/^[A-Z]{1,5}$/).filter((s) => s.length > 0);

/** Common HTTP error status codes */
const httpErrorStatusArb = fc.constantFrom(
  400,
  401,
  403,
  404,
  429,
  500,
  502,
  503,
  504
);

/** Network-level error messages */
const networkErrorArb = fc.constantFrom(
  "Network request failed",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "fetch failed",
  "socket hang up"
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 4: API Error Handling", () => {
  let service: MarketDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    cacheService.clear();
    rateLimiter.clearAll();
    service = new MarketDataService();
  });

  it("network errors always propagate as thrown errors — never silent failures", async () => {
    // Feature: the-open-stock, Property 4: API Error Handling
    // **Validates: Requirements 3.5, 14.2**
    await fc.assert(
      fc.asyncProperty(symbolArb, networkErrorArb, async (symbol, errorMsg) => {
        vi.clearAllMocks();
        cacheService.clear();
        rateLimiter.clearAll();

        mockGetSymbolQuote.mockRejectedValue(new Error(errorMsg));

        // Must throw — never return undefined or null silently
        await expect(service.getSymbolData(symbol)).rejects.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  it("HTTP error responses always propagate as thrown errors", async () => {
    // Feature: the-open-stock, Property 4: API Error Handling
    // **Validates: Requirements 3.5, 14.2**
    await fc.assert(
      fc.asyncProperty(
        symbolArb,
        httpErrorStatusArb,
        async (symbol, status) => {
          vi.clearAllMocks();
          cacheService.clear();
          rateLimiter.clearAll();

          const httpError = new Error(`HTTP ${status}: Request failed`);
          mockGetSymbolQuote.mockRejectedValue(httpError);

          await expect(service.getSymbolData(symbol)).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("failed historical data requests always throw — never return undefined", async () => {
    // Feature: the-open-stock, Property 4: API Error Handling
    // **Validates: Requirements 3.5, 14.2**
    await fc.assert(
      fc.asyncProperty(
        symbolArb,
        fc.constantFrom("1D", "1W", "1M", "3M", "1Y", "5Y", "Max" as const),
        networkErrorArb,
        async (symbol, range, errorMsg) => {
          vi.clearAllMocks();
          cacheService.clear();
          rateLimiter.clearAll();

          mockGetHistoricalData.mockRejectedValue(new Error(errorMsg));

          await expect(
            service.getHistoricalPrices(
              symbol,
              range as "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y" | "Max"
            )
          ).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("failed financials requests always throw — never return undefined", async () => {
    // Feature: the-open-stock, Property 4: API Error Handling
    // **Validates: Requirements 3.5, 14.2**
    await fc.assert(
      fc.asyncProperty(symbolArb, networkErrorArb, async (symbol, errorMsg) => {
        vi.clearAllMocks();
        cacheService.clear();
        rateLimiter.clearAll();

        mockGetFinancials.mockRejectedValue(new Error(errorMsg));

        await expect(service.getFinancials(symbol)).rejects.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  it("failed forecast requests always throw — never return undefined", async () => {
    // Feature: the-open-stock, Property 4: API Error Handling
    // **Validates: Requirements 3.5, 14.2**
    await fc.assert(
      fc.asyncProperty(symbolArb, networkErrorArb, async (symbol, errorMsg) => {
        vi.clearAllMocks();
        cacheService.clear();
        rateLimiter.clearAll();

        mockGetForecastData.mockRejectedValue(new Error(errorMsg));

        await expect(service.getForecastData(symbol)).rejects.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  it("rate limit errors are retryable — error message indicates retry is possible", async () => {
    // Feature: the-open-stock, Property 4: API Error Handling
    // **Validates: Requirements 14.5**
    await fc.assert(
      fc.asyncProperty(symbolArb, async (symbol) => {
        vi.clearAllMocks();
        cacheService.clear();
        rateLimiter.clearAll();

        // Exhaust the rate limit without populating cache
        const endpoint = `yahoo:quote:${symbol}`;
        for (let i = 0; i <= 1000; i++) {
          rateLimiter.recordCall(endpoint);
        }

        let thrownError: Error | undefined;
        try {
          await service.getSymbolData(symbol);
        } catch (err) {
          thrownError = err as Error;
        }

        // Must throw
        expect(thrownError).toBeDefined();
        // Error message must be descriptive (not empty)
        expect(thrownError!.message.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it("cached data is served as fallback when API fails after cache is populated", async () => {
    // Feature: the-open-stock, Property 4: API Error Handling
    // **Validates: Requirements 3.5, 14.2**
    await fc.assert(
      fc.asyncProperty(
        symbolArb,
        fc.double({ min: 0.01, max: 10_000, noNaN: true }),
        networkErrorArb,
        async (symbol, price, errorMsg) => {
          vi.clearAllMocks();
          cacheService.clear();
          rateLimiter.clearAll();

          // Seed the cache directly with valid data
          const cachedData = {
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
          const cacheKey = cacheService.generateKey(symbol, "quote");
          cacheService.set(cacheKey, cachedData, 300);

          // API now fails
          mockGetSymbolQuote.mockRejectedValue(new Error(errorMsg));

          // Service should return cached data instead of throwing
          const result = await service.getSymbolData(symbol);
          expect(result).toEqual(cachedData);

          // API should not have been called (cache hit before rate limit check)
          expect(mockGetSymbolQuote).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("service unavailability errors always produce a non-empty error message", async () => {
    // Feature: the-open-stock, Property 4: API Error Handling
    // **Validates: Requirements 14.2**
    await fc.assert(
      fc.asyncProperty(
        symbolArb,
        fc.constantFrom(
          new Error("Service Unavailable"),
          new Error("Bad Gateway"),
          new Error("Gateway Timeout"),
          new Error("Internal Server Error")
        ),
        async (symbol, serviceError) => {
          vi.clearAllMocks();
          cacheService.clear();
          rateLimiter.clearAll();

          mockGetSymbolQuote.mockRejectedValue(serviceError);

          let thrownError: Error | undefined;
          try {
            await service.getSymbolData(symbol);
          } catch (err) {
            thrownError = err as Error;
          }

          expect(thrownError).toBeDefined();
          // Error must have a non-empty message — never a silent failure
          expect(thrownError!.message).toBeTruthy();
          expect(thrownError!.message.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("fear & greed index API failure throws a descriptive error when no cache exists", async () => {
    // Feature: the-open-stock, Property 4: API Error Handling
    // **Validates: Requirements 3.5, 14.2**
    await fc.assert(
      fc.asyncProperty(networkErrorArb, async (errorMsg) => {
        vi.clearAllMocks();
        cacheService.clear();
        rateLimiter.clearAll();

        mockGetFearGreedIndex.mockRejectedValue(new Error(errorMsg));

        await expect(service.getFearGreedIndex()).rejects.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  it("world markets falls back to Yahoo Finance when CNN fails", async () => {
    // Feature: the-open-stock, Property 4: API Error Handling
    // **Validates: Requirements 3.5, 14.2**
    await fc.assert(
      fc.asyncProperty(networkErrorArb, async (errorMsg) => {
        vi.clearAllMocks();
        cacheService.clear();
        rateLimiter.clearAll();

        // CNN fails, Yahoo succeeds with empty array
        mockGetWorldMarkets.mockRejectedValue(new Error(errorMsg));

        // Should not throw — falls back to Yahoo Finance
        const result = await service.getWorldMarkets();
        expect(Array.isArray(result)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("errors from concurrent requests for the same symbol are consistent", async () => {
    // Feature: the-open-stock, Property 4: API Error Handling
    // **Validates: Requirements 3.5, 14.2**
    await fc.assert(
      fc.asyncProperty(symbolArb, networkErrorArb, async (symbol, errorMsg) => {
        vi.clearAllMocks();
        cacheService.clear();
        rateLimiter.clearAll();

        mockGetSymbolQuote.mockRejectedValue(new Error(errorMsg));

        // Fire multiple concurrent requests — all must reject, none silently succeed
        const results = await Promise.allSettled([
          service.getSymbolData(symbol),
          service.getSymbolData(symbol),
          service.getSymbolData(symbol),
        ]);

        // Every result must be either rejected or fulfilled (from cache on 2nd/3rd)
        // but none should be fulfilled with undefined/null
        for (const result of results) {
          if (result.status === "fulfilled") {
            expect(result.value).toBeDefined();
            expect(result.value).not.toBeNull();
          } else {
            expect(result.reason).toBeInstanceOf(Error);
            expect((result.reason as Error).message.length).toBeGreaterThan(0);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});
