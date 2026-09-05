import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/retry", () => ({
  retryWithBackoff: async (fn: () => Promise<unknown>) => fn(),
}));

import { FinnhubService } from "@/services/finnhub.service";

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
  } as Response;
}

describe("FinnhubService.getSymbolQuote", () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FINNHUB_API_KEY = "test-finnhub-key";
    vi.stubGlobal("fetch", fetchSpy);
  });

  it("maps 52-week range and volume from metric/candles, not the daily quote high/low", async () => {
    fetchSpy.mockImplementation(async (url: string) => {
      if (url.includes("/quote?")) {
        return jsonResponse({
          c: 319.97,
          d: 1.2,
          dp: 0.38,
          h: 328.93,
          l: 317.86,
          t: 1_725_000_000,
        });
      }
      if (url.includes("/stock/profile2?")) {
        return jsonResponse({
          name: "Apple Inc",
          marketCapitalization: 4_670_000,
        });
      }
      if (url.includes("/stock/metric?")) {
        return jsonResponse({
          metric: {
            "52WeekHigh": 344.57,
            "52WeekLow": 225.95,
            "10DayAverageTradingVolume": 48.2,
          },
        });
      }
      if (url.includes("/stock/candle?")) {
        return jsonResponse({
          s: "ok",
          v: [41_000_000, 52_400_000],
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const data = await new FinnhubService().getSymbolQuote("aapl");

    expect(data.symbol).toBe("AAPL");
    expect(data.price).toBe(319.97);
    expect(data.volume).toBe(52_400_000);
    expect(data.fiftyTwoWeekHigh).toBe(344.57);
    expect(data.fiftyTwoWeekLow).toBe(225.95);
    expect(data.marketCap).toBe(4_670_000_000_000);
  });

  it("falls back to 10-day average volume when candles have no volume", async () => {
    fetchSpy.mockImplementation(async (url: string) => {
      if (url.includes("/quote?")) {
        return jsonResponse({ c: 100, d: 0, dp: 0, h: 101, l: 99, t: 1 });
      }
      if (url.includes("/stock/profile2?")) {
        return jsonResponse({ name: "Test", marketCapitalization: 10 });
      }
      if (url.includes("/stock/metric?")) {
        return jsonResponse({
          metric: {
            "52WeekHigh": 120,
            "52WeekLow": 80,
            "10DayAverageTradingVolume": 1.5,
          },
        });
      }
      if (url.includes("/stock/candle?")) {
        return jsonResponse({ s: "no_data" });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const data = await new FinnhubService().getSymbolQuote("TEST");

    expect(data.volume).toBe(1_500_000);
    expect(data.fiftyTwoWeekHigh).toBe(120);
    expect(data.fiftyTwoWeekLow).toBe(80);
  });
});
