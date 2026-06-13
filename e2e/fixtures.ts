import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { installMarketDataMocks } from "./market-mocks";

const STABLE_TS = "2024-01-15T12:00:00.000Z";

const STABLE_SCREENER_RESULTS = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    sector: "Technology",
    price: 175.5,
    changePercent: 1.2,
    volume: 50_000_000,
    marketCap: 2_800_000_000_000,
    peRatio: 28,
    pbRatio: 45,
    pegRatio: 2.5,
    valuationContext: "overpriced",
    matchScore: 0,
  },
];

const STABLE_SCREENER_PRESETS = [
  {
    id: "day-gainers",
    name: "Day Gainers",
    description: "Stocks with the highest daily gains",
    filters: [
      {
        field: "changePercent",
        operator: "gt",
        value: 3,
        label: "Change > 3%",
      },
    ],
    isDefault: true,
    createdAt: STABLE_TS,
  },
];

const STABLE_SECTORS = [
  {
    sector: "Technology",
    performance: 2.1,
    changePercent: 1.2,
    constituents: 120,
  },
  {
    sector: "Financial",
    performance: -0.8,
    changePercent: -0.4,
    constituents: 95,
  },
  {
    sector: "Healthcare",
    performance: 0.5,
    changePercent: 0.3,
    constituents: 80,
  },
];

const STABLE_TRIAL_STATUS = {
  isActive: true,
  remainingSeconds: 3600,
  hasUsedTrial: false,
};

const STABLE_FEAR_GREED = {
  value: 42,
  label: "Fear" as const,
  timestamp: "2024-01-15T12:00:00.000Z",
  history: [
    { date: "2024-01-01T00:00:00.000Z", value: 38 },
    { date: "2024-01-15T00:00:00.000Z", value: 42 },
  ],
};

/** Stable API mocks so CI E2E does not depend on Appwrite or external market APIs. */
export async function installE2eMocks(page: Page) {
  await page.route("**/api/trial/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/status")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: STABLE_TRIAL_STATUS,
          timestamp: new Date().toISOString(),
        }),
      });
    }
    if (path.endsWith("/eligibility")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { eligible: true },
          timestamp: new Date().toISOString(),
        }),
      });
    }
    if (path.endsWith("/start")) {
      const now = new Date();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "e2e-trial",
            deviceFingerprint: "e2e",
            startTime: now.toISOString(),
            endTime: new Date(now.getTime() + 3_600_000).toISOString(),
            isActive: true,
            userAgent: "Playwright",
            screenResolution: "1280x720",
            timezone: "UTC",
            createdAt: now.toISOString(),
          },
          timestamp: now.toISOString(),
        }),
      });
    }
    if (path.endsWith("/end")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { ended: true },
          timestamp: new Date().toISOString(),
        }),
      });
    }
    await route.continue();
  });

  await page.route("**/api/auth/me*", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ success: false }),
    })
  );

  await page.route("**/api/market/fear-greed*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: STABLE_FEAR_GREED,
        timestamp: "2024-01-15T12:00:00.000Z",
      }),
    })
  );

  await page.route("**/api/market/world-markets*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: [
          {
            symbol: "SPX",
            name: "S&P 500",
            region: "Americas",
            value: 7592.71,
            change: 12.34,
            changePercent: 0.16,
          },
          {
            symbol: "N225",
            name: "Nikkei 225",
            region: "Asia-Pacific",
            value: 38400.5,
            change: -120.2,
            changePercent: -0.31,
          },
          {
            symbol: "FTSE",
            name: "FTSE 100",
            region: "Europe",
            value: 8120.4,
            change: 8.5,
            changePercent: 0.1,
          },
        ],
        timestamp: STABLE_TS,
      }),
    })
  );

  await page.route("**/api/market/sectors*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: STABLE_SECTORS,
        timestamp: STABLE_TS,
      }),
    })
  );

  await page.route("**/api/screener/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes("/presets")) {
      if (method === "POST") {
        const body = route.request().postDataJSON() as {
          name?: string;
          description?: string;
        };
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              id: "custom-e2e",
              name: body.name ?? "Custom Preset",
              description: body.description ?? "",
              filters: [],
              isDefault: false,
              createdAt: STABLE_TS,
            },
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
          data: STABLE_SCREENER_PRESETS,
          timestamp: STABLE_TS,
        }),
      });
      return;
    }

    if (url.includes("/search") && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: STABLE_SCREENER_RESULTS,
          timestamp: STABLE_TS,
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: [], timestamp: STABLE_TS }),
    });
  });

  await installMarketDataMocks(page);
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await installE2eMocks(page);
    await use(page);
  },
});

export { expect };
