/**
 * Symbol Search API Route Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";
import { NextRequest } from "next/server";

// Mock the env module
vi.mock("@/lib/env", () => ({
  env: {
    cache: { ttlSeconds: 300 },
    apis: {
      yahooFinanceUrl: "https://query1.finance.yahoo.com",
      cnnDatavizUrl: "https://production.dataviz.cnn.io",
    },
  },
}));

// Mock the logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock the market data service
vi.mock("@/services/market-data.service", () => ({
  marketDataService: {
    searchSymbols: vi.fn(),
  },
}));

import { marketDataService } from "@/services/market-data.service";

describe("GET /api/market/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if query parameter is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/market/search");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Query parameter 'q' is required");
  });

  it("should return empty array for empty query", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/market/search?q="
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
  });

  it("should return search results for valid query", async () => {
    const mockResults = [
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        type: "EQUITY",
        exchange: "NASDAQ",
      },
    ];

    vi.mocked(marketDataService.searchSymbols).mockResolvedValue(mockResults);

    const request = new NextRequest(
      "http://localhost:3000/api/market/search?q=AAPL"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockResults);
    expect(marketDataService.searchSymbols).toHaveBeenCalledWith("AAPL");
  });

  it("should return 500 on service error", async () => {
    vi.mocked(marketDataService.searchSymbols).mockRejectedValue(
      new Error("Service error")
    );

    const request = new NextRequest(
      "http://localhost:3000/api/market/search?q=AAPL"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Service error");
  });

  it("should include timestamp in response", async () => {
    const mockResults = [
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        type: "EQUITY",
        exchange: "NASDAQ",
      },
    ];

    vi.mocked(marketDataService.searchSymbols).mockResolvedValue(mockResults);

    const request = new NextRequest(
      "http://localhost:3000/api/market/search?q=AAPL"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(data.timestamp).toBeDefined();
    expect(new Date(data.timestamp)).toBeInstanceOf(Date);
  });
});
