/**
 * Property-Based Tests for Symbol Data Fetching
 * Feature: the-open-stock, Property 22: Symbol Data Fetching
 *
 * Validates: Requirements 3.1
 * "For any valid stock symbol, requesting symbol data should either return
 * current market data or return a cached version if within TTL, but should
 * never fail silently."
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
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
import type { SymbolData } from "@/types";

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

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Uppercase ticker symbols (1-5 alpha chars) */
const symbolArb = fc.stringMatching(/^[A-Z]{1,5}$/).filter((s) => s.length > 0);

/** Positive price values */
const priceArb = fc.double({ min: 0.01, max: 10_000, noNaN: true });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 22: Symbol Data Fetching", () => {
  let service: MarketDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    cacheService.clear();
    rateLimiter.clearAll();
    service = new MarketDataService();
  });

  it("fetching a valid symbol always returns well-formed SymbolData", async () => {
    // Feature: the-open-stock, Property 22: Symbol Data Fetching
    // **Validates: Requirements 3.1**
    await fc.assert(
      fc.asyncProperty(symbolArb, priceArb, async (symbol, price) => {
        vi.clearAllMocks();
        cacheService.clear();
        rateLimiter.clearAll();

        const mockData = makeSymbolData(symbol, price);
        mockGetSymbolQuote.mockResolvedValue(mockData);

        const result = await service.getSymbolData(symbol);

        // Must return a complete SymbolData object — never undefined/null
        expect(result).toBeDefined();
        expect(result.symbol).toBe(symbol.toUpperCase());
        expect(typeof result.price).toBe("number");
        expect(typeof result.change).toBe("number");
        expect(typeof result.changePercent).toBe("number");
        expect(typeof result.marketCap).toBe("number");
        expect(typeof result.volume).toBe("number");
        expect(typeof result.fiftyTwoWeekHigh).toBe("number");
        expect(typeof result.fiftyTwoWeekLow).toBe("number");
        expect(result.lastUpdated).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it("fetching symbol data never fails silently — errors always propagate", async () => {
    // Feature: the-open-stock, Property 22: Symbol Data Fetching
    // **Validates: Requirements 3.1**
    await fc.assert(
      fc.asyncProperty(symbolArb, async (symbol) => {
        vi.clearAllMocks();
        cacheService.clear();
        rateLimiter.clearAll();

        const apiError = new Error(`Symbol not found: ${symbol}`);
        mockGetSymbolQuote.mockRejectedValue(apiError);

        // Must throw — never return undefined or swallow the error
        await expect(service.getSymbolData(symbol)).rejects.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  it("returns cached data when within TTL instead of calling API again", async () => {
    // Feature: the-open-stock, Property 22: Symbol Data Fetching
    // **Validates: Requirements 3.1**
    await fc.assert(
      fc.asyncProperty(symbolArb, priceArb, async (symbol, price) => {
        vi.clearAllMocks();
        cacheService.clear();
        rateLimiter.clearAll();

        const mockData = makeSymbolData(symbol, price);
        mockGetSymbolQuote.mockResolvedValue(mockData);

        // First call populates cache
        const first = await service.getSymbolData(symbol);

        // Second call should use cache — API not called again
        const second = await service.getSymbolData(symbol);

        expect(mockGetSymbolQuote).toHaveBeenCalledTimes(1);
        expect(second).toEqual(first);
      }),
      { numRuns: 100 }
    );
  });

  it("returned data matches what the API provided — no silent data corruption", async () => {
    // Feature: the-open-stock, Property 22: Symbol Data Fetching
    // **Validates: Requirements 3.1**
    await fc.assert(
      fc.asyncProperty(symbolArb, priceArb, async (symbol, price) => {
        vi.clearAllMocks();
        cacheService.clear();
        rateLimiter.clearAll();

        const mockData = makeSymbolData(symbol, price);
        mockGetSymbolQuote.mockResolvedValue(mockData);

        const result = await service.getSymbolData(symbol);

        // The service must faithfully return the API data
        expect(result.symbol).toBe(mockData.symbol);
        expect(result.name).toBe(mockData.name);
        expect(result.price).toBe(mockData.price);
        expect(result.change).toBe(mockData.change);
        expect(result.changePercent).toBe(mockData.changePercent);
        expect(result.marketCap).toBe(mockData.marketCap);
        expect(result.volume).toBe(mockData.volume);
      }),
      { numRuns: 100 }
    );
  });

  it("rate-limited requests with no cache throw rather than fail silently", async () => {
    // Feature: the-open-stock, Property 22: Symbol Data Fetching
    // **Validates: Requirements 3.1**
    await fc.assert(
      fc.asyncProperty(symbolArb, async (symbol) => {
        vi.clearAllMocks();
        cacheService.clear();
        rateLimiter.clearAll();

        // Exhaust the rate limiter for this symbol's endpoint
        const endpoint = `yahoo:quote:${symbol}`;
        for (let i = 0; i < 1000; i++) {
          rateLimiter.recordCall(endpoint);
        }

        // No cached data and rate limited — must throw, not return undefined
        await expect(service.getSymbolData(symbol)).rejects.toThrow();
      }),
      { numRuns: 100 }
    );
  });
});
