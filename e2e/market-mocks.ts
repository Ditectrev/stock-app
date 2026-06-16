import type { Page } from "@playwright/test";

const STABLE_TS = "2024-01-15T12:00:00.000Z";

/** Enough daily bars for chart trail animation in E2E. */
export function buildStableHistorical(pointCount = 90) {
  const data: Array<{
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }> = [];
  const end = new Date(STABLE_TS);

  for (let i = pointCount; i >= 0; i--) {
    const day = new Date(end);
    day.setDate(day.getDate() - i);
    const close = 180 + (pointCount - i) * 0.15 + Math.sin(i / 5) * 2;
    data.push({
      timestamp: day.toISOString(),
      open: close - 0.5,
      high: close + 1,
      low: close - 1,
      close,
      volume: 40_000_000,
    });
  }

  return data;
}

const STABLE_HISTORICAL = buildStableHistorical();

const STABLE_INDICATORS = {
  rsi: { value: 72.5, signal: "overpriced" as const },
  macd: {
    value: 1.2345,
    signal: 0.9876,
    histogram: 0.2469,
    trend: "underpriced" as const,
  },
  movingAverages: { ma50: 155.0, ma200: 140.0, signal: "fair" as const },
  bollingerBands: {
    upper: 170.0,
    middle: 150.0,
    lower: 130.0,
    signal: "overpriced" as const,
  },
  overallSentiment: "overpriced" as const,
};

const STABLE_SEASONAL = {
  heatmap: Array.from({ length: 24 }, (_, i) => ({
    year: 2023 + Math.floor(i / 12),
    month: (i % 12) + 1,
    return: (i % 5) - 2,
  })),
  averageByMonth: {
    1: 2.25,
    2: -2.3,
    3: 3.0,
    4: 1.1,
    5: 0.5,
    6: -1.65,
    7: 2.0,
    8: 1.2,
    9: -0.8,
    10: 2.5,
    11: 1.8,
    12: 2.2,
  },
};

const STABLE_FORECAST = {
  priceTargets: { low: 120.0, average: 165.0, high: 210.0 },
  analystRatings: {
    strongBuy: 8,
    buy: 12,
    hold: 6,
    sell: 2,
    strongSell: 1,
  },
  epsForecasts: [
    { quarter: "Q1 2025", estimate: 1.42 },
    { quarter: "Q2 2025", estimate: 1.55 },
  ],
  revenueForecasts: [
    { quarter: "Q1 2025", estimate: 94_000_000_000 },
    { quarter: "Q2 2025", estimate: 96_500_000_000 },
  ],
};

const STABLE_FINANCIALS = {
  keyFacts: {
    revenue: 394_000_000_000,
    netIncome: 97_000_000_000,
    profitMargin: 24.6,
  },
  valuation: { peRatio: 30.5, pbRatio: 45.2, pegRatio: 2.1 },
  growth: { revenueGrowth: 8.2, earningsGrowth: 11.4 },
  profitability: { roe: 147.5, roa: 28.4, operatingMargin: 30.1 },
};

/** Stable symbol + historical mocks so E2E does not hit external market APIs. */
export async function installMarketDataMocks(page: Page) {
  await page.route("**/api/market/symbol/**", async (route) => {
    const match = route
      .request()
      .url()
      .match(/\/symbol\/([^/?]+)/);
    const symbol = decodeURIComponent(match?.[1] ?? "AAPL").toUpperCase();

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          symbol,
          name: `${symbol} Test Co.`,
          price: 189.42,
          change: 1.25,
          changePercent: 0.66,
          marketCap: 2_900_000_000_000,
          volume: 48_500_000,
          fiftyTwoWeekHigh: 199.62,
          fiftyTwoWeekLow: 164.08,
          lastUpdated: STABLE_TS,
        },
        timestamp: STABLE_TS,
      }),
    });
  });

  await page.route("**/api/market/historical/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: STABLE_HISTORICAL,
        timestamp: STABLE_TS,
      }),
    });
  });

  await page.route("**/api/market/search*", async (route) => {
    const q = new URL(route.request().url()).searchParams.get("q") ?? "";
    const symbol = q.trim().toUpperCase();

    if (!symbol || symbol === "ZZZZNOTFOUND" || symbol.includes("INVALID")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [],
          timestamp: STABLE_TS,
        }),
      });
      return;
    }

    if (symbol === "AA") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            { symbol: "AAPL", name: "Apple Inc.", type: "equity" },
            { symbol: "AAL", name: "American Airlines Group", type: "equity" },
            { symbol: "AA", name: "Alcoa Corporation", type: "equity" },
          ],
          timestamp: STABLE_TS,
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: symbol
          ? [{ symbol, name: `${symbol} Test Co.`, type: "equity" }]
          : [],
        timestamp: STABLE_TS,
      }),
    });
  });

  await page.route(
    /\/api\/market\/(indicators|forecast|seasonal|financials)\//,
    async (route) => {
      const url = route.request().url();
      let data: unknown = null;

      if (url.includes("/indicators/")) {
        data = STABLE_INDICATORS;
      } else if (url.includes("/seasonal/")) {
        data = STABLE_SEASONAL;
      } else if (url.includes("/forecast/")) {
        data = STABLE_FORECAST;
      } else if (url.includes("/financials/")) {
        data = STABLE_FINANCIALS;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data,
          timestamp: STABLE_TS,
        }),
      });
    }
  );
}
