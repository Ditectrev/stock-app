/**
 * Unit tests for Market Data API Routes
 * Tests successful data retrieval, caching, rate limiting, and error responses
 * Task 5.13 - Requirements: 3.5, 14.2
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock env
vi.mock("@/lib/env", () => ({
  env: {
    cache: {
      ttlSeconds: 300,
      rateLimitMaxRequests: 100,
      rateLimitWindowSeconds: 60,
    },
    apis: {
      yahooFinanceUrl: "https://query1.finance.yahoo.com",
      cnnDatavizUrl: "https://production.dataviz.cnn.io",
    },
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock market data service
vi.mock("@/services/market-data.service", () => ({
  marketDataService: {
    getSymbolData: vi.fn(),
    getHistoricalPrices: vi.fn(),
    getTechnicalIndicators: vi.fn(),
    getForecastData: vi.fn(),
    getSeasonalPatterns: vi.fn(),
    getFinancials: vi.fn(),
    getFearGreedIndex: vi.fn(),
    getWorldMarkets: vi.fn(),
    getSectorPerformance: vi.fn(),
    getETFPerformance: vi.fn(),
    getCryptoPerformance: vi.fn(),
    getStockPerformance: vi.fn(),
    searchSymbols: vi.fn(),
  },
}));

import { marketDataService } from "@/services/market-data.service";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeRequest(url: string): NextRequest {
  return new NextRequest(url);
}

function makeParams(symbol: string): { params: Promise<{ symbol: string }> } {
  return { params: Promise.resolve({ symbol }) };
}

// ─── Mock data ──────────────────────────────────────────────────────────────

const mockSymbolData = {
  symbol: "AAPL",
  name: "Apple Inc.",
  price: 185.5,
  change: 2.3,
  changePercent: 1.25,
  marketCap: 2900000000000,
  volume: 55000000,
  fiftyTwoWeekHigh: 199.62,
  fiftyTwoWeekLow: 124.17,
  lastUpdated: new Date(),
};

const mockHistoricalData = [
  {
    timestamp: new Date("2024-01-01"),
    open: 180,
    high: 185,
    low: 179,
    close: 184,
    volume: 50000000,
  },
  {
    timestamp: new Date("2024-01-02"),
    open: 184,
    high: 186,
    low: 183,
    close: 185,
    volume: 48000000,
  },
];

const mockFearGreedData = {
  value: 65,
  label: "Greed",
  previousClose: 62,
  timeline: [],
};

const mockWorldMarketsData = [
  { name: "S&P 500", value: 5200, change: 0.5, region: "Americas" },
  { name: "FTSE 100", value: 8100, change: -0.2, region: "Europe" },
];

const mockSectorData = [
  { name: "Technology", changePercent: 1.5, marketCap: 15000000000000 },
  { name: "Healthcare", changePercent: -0.3, marketCap: 8000000000000 },
];

const mockIndicatorsData = {
  rsi: { value: 55, signal: "neutral" },
  macd: { value: 1.2, signal: "bullish" },
};

const mockForecastData = {
  targetLow: 160,
  targetMean: 200,
  targetHigh: 240,
  ratings: { buy: 20, hold: 10, sell: 5 },
};

const mockSeasonalData = {
  patterns: [{ month: "January", avgReturn: 2.5 }],
};

const mockFinancialsData = {
  revenue: 394000000000,
  netIncome: 97000000000,
  peRatio: 30.5,
};

// ═══════════════════════════════════════════════════════════════════════════
// 1. Successful Data Retrieval
// ═══════════════════════════════════════════════════════════════════════════

describe("Successful Data Retrieval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/market/symbol/[symbol]", () => {
    it("should return symbol data with success shape", async () => {
      vi.mocked(marketDataService.getSymbolData).mockResolvedValue(
        mockSymbolData
      );

      const { GET } = await import("@/app/api/market/symbol/[symbol]/route");
      const req = makeRequest("http://localhost:3000/api/market/symbol/AAPL");
      const response = await GET(req, makeParams("AAPL"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.symbol).toBe("AAPL");
      expect(data.data.price).toBe(185.5);
      expect(data.timestamp).toBeDefined();
    });

    it("should call marketDataService.getSymbolData with correct symbol", async () => {
      vi.mocked(marketDataService.getSymbolData).mockResolvedValue(
        mockSymbolData
      );

      const { GET } = await import("@/app/api/market/symbol/[symbol]/route");
      const req = makeRequest("http://localhost:3000/api/market/symbol/TSLA");
      await GET(req, makeParams("TSLA"));

      expect(marketDataService.getSymbolData).toHaveBeenCalledWith("TSLA");
    });
  });

  describe("GET /api/market/historical/[symbol]", () => {
    it("should return historical data for valid symbol", async () => {
      vi.mocked(marketDataService.getHistoricalPrices).mockResolvedValue(
        mockHistoricalData
      );

      const { GET } =
        await import("@/app/api/market/historical/[symbol]/route");
      const req = makeRequest(
        "http://localhost:3000/api/market/historical/AAPL?range=1Y"
      );
      const response = await GET(req, makeParams("AAPL"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.timestamp).toBeDefined();
    });

    it("should pass range parameter to service", async () => {
      vi.mocked(marketDataService.getHistoricalPrices).mockResolvedValue(
        mockHistoricalData
      );

      const { GET } =
        await import("@/app/api/market/historical/[symbol]/route");
      const req = makeRequest(
        "http://localhost:3000/api/market/historical/AAPL?range=3M"
      );
      await GET(req, makeParams("AAPL"));

      expect(marketDataService.getHistoricalPrices).toHaveBeenCalledWith(
        "AAPL",
        "3M"
      );
    });

    it("should default range to 1Y when not provided", async () => {
      vi.mocked(marketDataService.getHistoricalPrices).mockResolvedValue(
        mockHistoricalData
      );

      const { GET } =
        await import("@/app/api/market/historical/[symbol]/route");
      const req = makeRequest(
        "http://localhost:3000/api/market/historical/AAPL"
      );
      await GET(req, makeParams("AAPL"));

      expect(marketDataService.getHistoricalPrices).toHaveBeenCalledWith(
        "AAPL",
        "1Y"
      );
    });
  });

  describe("GET /api/market/fear-greed", () => {
    it("should return fear and greed data", async () => {
      vi.mocked(marketDataService.getFearGreedIndex).mockResolvedValue(
        mockFearGreedData
      );

      const { GET } = await import("@/app/api/market/fear-greed/route");
      const req = makeRequest("http://localhost:3000/api/market/fear-greed");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.value).toBe(65);
      expect(data.timestamp).toBeDefined();
    });

    it("should pass limit parameter", async () => {
      vi.mocked(marketDataService.getFearGreedIndex).mockResolvedValue(
        mockFearGreedData
      );

      const { GET } = await import("@/app/api/market/fear-greed/route");
      const req = makeRequest(
        "http://localhost:3000/api/market/fear-greed?limit=10"
      );
      await GET(req);

      expect(marketDataService.getFearGreedIndex).toHaveBeenCalledWith(10);
    });
  });

  describe("GET /api/market/world-markets", () => {
    it("should return world markets data", async () => {
      vi.mocked(marketDataService.getWorldMarkets).mockResolvedValue(
        mockWorldMarketsData
      );

      const { GET } = await import("@/app/api/market/world-markets/route");
      const req = makeRequest("http://localhost:3000/api/market/world-markets");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });
  });

  describe("GET /api/market/sectors", () => {
    it("should return sector performance data", async () => {
      vi.mocked(marketDataService.getSectorPerformance).mockResolvedValue(
        mockSectorData
      );

      const { GET } = await import("@/app/api/market/sectors/route");
      const req = makeRequest("http://localhost:3000/api/market/sectors");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    it("should pass period parameter to service", async () => {
      vi.mocked(marketDataService.getSectorPerformance).mockResolvedValue(
        mockSectorData
      );

      const { GET } = await import("@/app/api/market/sectors/route");
      const req = makeRequest(
        "http://localhost:3000/api/market/sectors?period=1M"
      );
      await GET(req);

      expect(marketDataService.getSectorPerformance).toHaveBeenCalledWith(
        "1mo"
      );
    });
  });

  describe("GET /api/market/indicators/[symbol]", () => {
    it("should return technical indicators", async () => {
      vi.mocked(marketDataService.getTechnicalIndicators).mockResolvedValue(
        mockIndicatorsData
      );

      const { GET } =
        await import("@/app/api/market/indicators/[symbol]/route");
      const req = makeRequest(
        "http://localhost:3000/api/market/indicators/AAPL"
      );
      const response = await GET(req, makeParams("AAPL"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockIndicatorsData);
    });
  });

  describe("GET /api/market/forecast/[symbol]", () => {
    it("should return forecast data", async () => {
      vi.mocked(marketDataService.getForecastData).mockResolvedValue(
        mockForecastData
      );

      const { GET } = await import("@/app/api/market/forecast/[symbol]/route");
      const req = makeRequest("http://localhost:3000/api/market/forecast/AAPL");
      const response = await GET(req, makeParams("AAPL"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.targetMean).toBe(200);
    });
  });

  describe("GET /api/market/seasonal/[symbol]", () => {
    it("should return seasonal pattern data", async () => {
      vi.mocked(marketDataService.getSeasonalPatterns).mockResolvedValue(
        mockSeasonalData
      );

      const { GET } = await import("@/app/api/market/seasonal/[symbol]/route");
      const req = makeRequest("http://localhost:3000/api/market/seasonal/AAPL");
      const response = await GET(req, makeParams("AAPL"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.patterns).toHaveLength(1);
    });
  });

  describe("GET /api/market/financials/[symbol]", () => {
    it("should return financial data", async () => {
      vi.mocked(marketDataService.getFinancials).mockResolvedValue(
        mockFinancialsData
      );

      const { GET } =
        await import("@/app/api/market/financials/[symbol]/route");
      const req = makeRequest(
        "http://localhost:3000/api/market/financials/AAPL"
      );
      const response = await GET(req, makeParams("AAPL"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.revenue).toBe(394000000000);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Caching Behavior
// ═══════════════════════════════════════════════════════════════════════════

describe("Caching Behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should serve cached data when service returns cached result", async () => {
    // The service layer handles caching internally. When called twice,
    // the route should return the same data shape both times.
    vi.mocked(marketDataService.getSymbolData).mockResolvedValue(
      mockSymbolData
    );

    const { GET } = await import("@/app/api/market/symbol/[symbol]/route");
    const req1 = makeRequest("http://localhost:3000/api/market/symbol/AAPL");
    const res1 = await GET(req1, makeParams("AAPL"));
    const data1 = await res1.json();

    const req2 = makeRequest("http://localhost:3000/api/market/symbol/AAPL");
    const res2 = await GET(req2, makeParams("AAPL"));
    const data2 = await res2.json();

    expect(data1.success).toBe(true);
    expect(data2.success).toBe(true);
    expect(data1.data.symbol).toBe(data2.data.symbol);
    expect(marketDataService.getSymbolData).toHaveBeenCalledTimes(2);
  });

  it("should include timestamp in every response for cache freshness", async () => {
    vi.mocked(marketDataService.getFearGreedIndex).mockResolvedValue(
      mockFearGreedData
    );

    const { GET } = await import("@/app/api/market/fear-greed/route");
    const req = makeRequest("http://localhost:3000/api/market/fear-greed");
    const response = await GET(req);
    const data = await response.json();

    expect(data.timestamp).toBeDefined();
    const ts = new Date(data.timestamp);
    expect(ts.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("should return consistent data shape across multiple calls", async () => {
    vi.mocked(marketDataService.getWorldMarkets).mockResolvedValue(
      mockWorldMarketsData
    );

    const { GET } = await import("@/app/api/market/world-markets/route");

    const responses = await Promise.all(
      [1, 2, 3].map(async () => {
        const req = makeRequest(
          "http://localhost:3000/api/market/world-markets"
        );
        const res = await GET(req);
        return res.json();
      })
    );

    for (const data of responses) {
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockWorldMarketsData);
      expect(data.timestamp).toBeDefined();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Rate Limiting
// ═══════════════════════════════════════════════════════════════════════════

describe("Rate Limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should propagate rate limit error from service as 502", async () => {
    vi.mocked(marketDataService.getSymbolData).mockRejectedValue(
      new Error("Rate limit exceeded and no cached data available")
    );

    const { GET } = await import("@/app/api/market/symbol/[symbol]/route");
    const req = makeRequest("http://localhost:3000/api/market/symbol/AAPL");
    const response = await GET(req, makeParams("AAPL"));
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Rate limit exceeded");
  });

  it("should return 500 with rate limit error for fear-greed route", async () => {
    vi.mocked(marketDataService.getFearGreedIndex).mockRejectedValue(
      new Error("Rate limit exceeded and no cached data available")
    );

    const { GET } = await import("@/app/api/market/fear-greed/route");
    const req = makeRequest("http://localhost:3000/api/market/fear-greed");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Rate limit exceeded");
  });

  it("should return 500 with rate limit error for world-markets route", async () => {
    vi.mocked(marketDataService.getWorldMarkets).mockRejectedValue(
      new Error("Rate limit exceeded and no cached data available")
    );

    const { GET } = await import("@/app/api/market/world-markets/route");
    const req = makeRequest("http://localhost:3000/api/market/world-markets");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Rate limit exceeded");
  });

  it("should return 500 with rate limit error for sectors route", async () => {
    vi.mocked(marketDataService.getSectorPerformance).mockRejectedValue(
      new Error("Rate limit exceeded and no cached data available")
    );

    const { GET } = await import("@/app/api/market/sectors/route");
    const req = makeRequest("http://localhost:3000/api/market/sectors");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Rate limit exceeded");
  });

  it("should return 500 with rate limit error for indicators route", async () => {
    vi.mocked(marketDataService.getTechnicalIndicators).mockRejectedValue(
      new Error("Rate limit exceeded and no cached data available")
    );

    const { GET } = await import("@/app/api/market/indicators/[symbol]/route");
    const req = makeRequest("http://localhost:3000/api/market/indicators/AAPL");
    const response = await GET(req, makeParams("AAPL"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Rate limit exceeded");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Error Responses
// ═══════════════════════════════════════════════════════════════════════════

describe("Error Responses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("User-friendly error messages (Req 3.5, 14.2)", () => {
    it("should return descriptive error for fear-greed API failure", async () => {
      vi.mocked(marketDataService.getFearGreedIndex).mockRejectedValue(
        new Error("Network timeout")
      );

      const { GET } = await import("@/app/api/market/fear-greed/route");
      const req = makeRequest("http://localhost:3000/api/market/fear-greed");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Network timeout");
      expect(data.timestamp).toBeDefined();
    });

    it("should return descriptive error for world-markets API failure", async () => {
      vi.mocked(marketDataService.getWorldMarkets).mockRejectedValue(
        new Error("Service unavailable")
      );

      const { GET } = await import("@/app/api/market/world-markets/route");
      const req = makeRequest("http://localhost:3000/api/market/world-markets");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Service unavailable");
    });

    it("should return descriptive error for sectors API failure", async () => {
      vi.mocked(marketDataService.getSectorPerformance).mockRejectedValue(
        new Error("External API error")
      );

      const { GET } = await import("@/app/api/market/sectors/route");
      const req = makeRequest("http://localhost:3000/api/market/sectors");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("External API error");
    });

    it("should return descriptive error for indicators API failure", async () => {
      vi.mocked(marketDataService.getTechnicalIndicators).mockRejectedValue(
        new Error("Failed to calculate indicators")
      );

      const { GET } =
        await import("@/app/api/market/indicators/[symbol]/route");
      const req = makeRequest(
        "http://localhost:3000/api/market/indicators/AAPL"
      );
      const response = await GET(req, makeParams("AAPL"));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        "We couldn't load technical indicators. Try again."
      );
    });

    it("should return descriptive error for forecast API failure", async () => {
      vi.mocked(marketDataService.getForecastData).mockRejectedValue(
        new Error("Forecast data unavailable")
      );

      const { GET } = await import("@/app/api/market/forecast/[symbol]/route");
      const req = makeRequest("http://localhost:3000/api/market/forecast/AAPL");
      const response = await GET(req, makeParams("AAPL"));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Forecast data unavailable");
    });

    it("should return descriptive error for seasonal API failure", async () => {
      vi.mocked(marketDataService.getSeasonalPatterns).mockRejectedValue(
        new Error("Seasonal data unavailable")
      );

      const { GET } = await import("@/app/api/market/seasonal/[symbol]/route");
      const req = makeRequest("http://localhost:3000/api/market/seasonal/AAPL");
      const response = await GET(req, makeParams("AAPL"));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Seasonal data unavailable");
    });

    it("should return descriptive error for financials API failure", async () => {
      vi.mocked(marketDataService.getFinancials).mockRejectedValue(
        new Error("Financial data unavailable")
      );

      const { GET } =
        await import("@/app/api/market/financials/[symbol]/route");
      const req = makeRequest(
        "http://localhost:3000/api/market/financials/AAPL"
      );
      const response = await GET(req, makeParams("AAPL"));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Financial data unavailable");
    });
  });

  describe("Non-Error object handling", () => {
    it("should return fallback message for non-Error throws in fear-greed", async () => {
      vi.mocked(marketDataService.getFearGreedIndex).mockRejectedValue(
        "string error"
      );

      const { GET } = await import("@/app/api/market/fear-greed/route");
      const req = makeRequest("http://localhost:3000/api/market/fear-greed");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        "We couldn't load the Fear & Greed index. Try again."
      );
    });

    it("should return fallback message for non-Error throws in world-markets", async () => {
      vi.mocked(marketDataService.getWorldMarkets).mockRejectedValue(42);

      const { GET } = await import("@/app/api/market/world-markets/route");
      const req = makeRequest("http://localhost:3000/api/market/world-markets");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("We couldn't load world markets. Try again.");
    });

    it("should return fallback message for non-Error throws in sectors", async () => {
      vi.mocked(marketDataService.getSectorPerformance).mockRejectedValue(null);

      const { GET } = await import("@/app/api/market/sectors/route");
      const req = makeRequest("http://localhost:3000/api/market/sectors");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        "We couldn't load sector performance. Try again."
      );
    });
  });

  describe("Symbol route live data errors", () => {
    it("should return a 502 when symbol API fails", async () => {
      vi.mocked(marketDataService.getSymbolData).mockRejectedValue(
        new Error("API unavailable")
      );

      const { GET } = await import("@/app/api/market/symbol/[symbol]/route");
      const req = makeRequest("http://localhost:3000/api/market/symbol/AAPL");
      const response = await GET(req, makeParams("AAPL"));
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.success).toBe(false);
      expect(data.error).toContain("API unavailable");
    });

    it("should return a 502 when historical API fails", async () => {
      vi.mocked(marketDataService.getHistoricalPrices).mockRejectedValue(
        new Error("API unavailable")
      );

      const { GET } =
        await import("@/app/api/market/historical/[symbol]/route");
      const req = makeRequest(
        "http://localhost:3000/api/market/historical/AAPL?range=1M"
      );
      const response = await GET(req, makeParams("AAPL"));
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.success).toBe(false);
      expect(data.error).toContain("API unavailable");
    });
  });

  describe("Response shape consistency", () => {
    it("should always include success, data, and timestamp on success", async () => {
      vi.mocked(marketDataService.getSectorPerformance).mockResolvedValue(
        mockSectorData
      );

      const { GET } = await import("@/app/api/market/sectors/route");
      const req = makeRequest("http://localhost:3000/api/market/sectors");
      const response = await GET(req);
      const data = await response.json();

      expect(data).toHaveProperty("success", true);
      expect(data).toHaveProperty("data");
      expect(data).toHaveProperty("timestamp");
    });

    it("should always include success, error, and timestamp on failure", async () => {
      vi.mocked(marketDataService.getFearGreedIndex).mockRejectedValue(
        new Error("Failure")
      );

      const { GET } = await import("@/app/api/market/fear-greed/route");
      const req = makeRequest("http://localhost:3000/api/market/fear-greed");
      const response = await GET(req);
      const data = await response.json();

      expect(data).toHaveProperty("success", false);
      expect(data).toHaveProperty("error");
      expect(data).toHaveProperty("timestamp");
    });
  });
});
