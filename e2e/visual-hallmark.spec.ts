import { test, expect } from "./fixtures";
import { waitForChartReveal } from "./helpers";
import type { PricingTierInfo } from "../types";

const STABLE_PRICING_TIERS: PricingTierInfo[] = [
  {
    tier: "FREE",
    name: "Free",
    description: "Market data with ads.",
    features: ["Search", "Charts"],
    price: 0,
    billingPeriod: "monthly",
  },
  {
    tier: "ADS_FREE",
    name: "Ads-free",
    description: "No ads.",
    features: ["All Free features", "No ads"],
    price: 4.99,
    billingPeriod: "monthly",
  },
  {
    tier: "LOCAL",
    name: "Local AI",
    description: "Ollama on device.",
    features: ["Local model"],
    price: 9.99,
    billingPeriod: "monthly",
  },
  {
    tier: "BYOK",
    name: "BYOK",
    description: "Your API keys.",
    features: ["BYOK"],
    price: 14.99,
    billingPeriod: "monthly",
  },
  {
    tier: "HOSTED_AI",
    name: "Hosted AI",
    description: "Managed AI.",
    features: ["Hosted"],
    price: 19.99,
    billingPeriod: "monthly",
  },
];

const STABLE_SYMBOL = {
  symbol: "AAPL",
  name: "Apple Inc.",
  price: 189.42,
  change: 1.25,
  changePercent: 0.66,
  marketCap: 2_900_000_000_000,
  volume: 48_500_000,
  fiftyTwoWeekHigh: 199.62,
  fiftyTwoWeekLow: 164.08,
  lastUpdated: "2024-01-15T12:00:00.000Z",
};

const STABLE_HISTORICAL = [
  {
    timestamp: "2024-01-14T00:00:00.000Z",
    open: 187.5,
    high: 189.0,
    low: 186.8,
    close: 188.17,
    volume: 42_000_000,
  },
  {
    timestamp: "2024-01-15T00:00:00.000Z",
    open: 188.17,
    high: 190.1,
    low: 187.9,
    close: 189.42,
    volume: 48_500_000,
  },
];

const STABLE_FEAR_GREED = {
  value: 42,
  label: "Fear" as const,
  timestamp: "2024-01-15T12:00:00.000Z",
  history: [
    { date: "2024-01-01T00:00:00.000Z", value: 38 },
    { date: "2024-01-08T00:00:00.000Z", value: 40 },
    { date: "2024-01-15T00:00:00.000Z", value: 42 },
  ],
};

async function mockHomePulseApis(page: import("@playwright/test").Page) {
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
        data: [],
        timestamp: "2024-01-15T12:00:00.000Z",
      }),
    })
  );
}

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
];

const STABLE_STOCK_OF_THE_DAY = {
  generatedAt: "2024-01-15T12:00:00.000Z",
  buy: {
    generatedAt: "2024-01-15T12:00:00.000Z",
    symbol: "RKLB",
    name: "Rocket Lab USA",
    assetType: "stock",
    recommendation: "buy",
    confidence: 0.72,
    rationale: [
      "Launch cadence is improving with backlog visibility.",
      "Liquidity supports tactical entries on pullbacks.",
    ],
  },
  sell: {
    generatedAt: "2024-01-15T12:00:00.000Z",
    symbol: "INTC",
    name: "Intel Corporation",
    assetType: "stock",
    recommendation: "sell",
    confidence: 0.64,
    rationale: [
      "Margin pressure persists into the next print.",
      "Relative strength lags peers in the semiconductor group.",
    ],
  },
};

const STABLE_AI_PREDICTION = {
  symbol: "AAPL",
  assetType: "stock",
  generatedAt: "2024-01-15T12:00:00.000Z",
  recommendation: "hold",
  confidence: 0.68,
  summary:
    "Balanced setup: price holds above the 50-day average while momentum stays neutral.",
  factors: {
    technical: [
      "RSI near neutral with price above the 50-day average.",
      "Volume is in line with the 20-day average.",
    ],
    valuation: [
      "Analyst consensus clusters around fair value for the current cycle.",
    ],
    sentiment: ["Fear and greed index sits in neutral territory."],
    macro: ["Rates stable; no imminent policy shock on the horizon."],
    globalMarkets: ["Major indices show mixed performance across regions."],
    risks: ["Earnings revision risk into the next quarterly report."],
  },
  symbolSpecific: {
    title: "Symbol focus",
    bullets: [
      "iPhone cycle remains the primary revenue driver this quarter.",
      "Services mix continues to support gross margin stability.",
    ],
  },
};

async function mockPricingApis(page: import("@playwright/test").Page) {
  await page.route("**/api/subscription/tiers*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: STABLE_PRICING_TIERS,
        timestamp: "2024-01-15T12:00:00.000Z",
      }),
    })
  );
  await mockFreeSubscription(page);
}

async function mockSymbolMarketRoutes(
  page: import("@playwright/test").Page,
  options: { failSymbol?: boolean } = {}
) {
  const ts = "2024-01-15T12:00:00.000Z";
  await page.route(/\/api\/market\//, async (route) => {
    const url = route.request().url();
    if (url.includes("/symbol/")) {
      if (options.failSymbol) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            error: "Symbol not found",
            timestamp: ts,
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: STABLE_SYMBOL,
          timestamp: ts,
        }),
      });
      return;
    }
    if (url.includes("/historical/")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: STABLE_HISTORICAL,
          timestamp: ts,
        }),
      });
      return;
    }
    if (url.includes("/ai-prediction/")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: STABLE_AI_PREDICTION,
          timestamp: ts,
        }),
      });
      return;
    }
    if (/\/(indicators|forecast|seasonal|financials)\//.test(url)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: null, timestamp: ts }),
      });
      return;
    }
    await route.continue();
  });
}

async function mockHostedAiSubscription(page: import("@playwright/test").Page) {
  await page.route("**/api/subscription/current*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          tier: "HOSTED_AI",
          authenticated: true,
          currentPeriodEnd: "2025-12-31T00:00:00.000Z",
          cancelAtPeriodEnd: false,
          status: "active",
        },
        timestamp: "2024-01-15T12:00:00.000Z",
      }),
    })
  );
}

async function mockSignedInUser(page: import("@playwright/test").Page) {
  await page.route("**/api/auth/me*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        user: {
          id: "user-visual-1",
          email: "investor@example.com",
          name: "Visual Investor",
        },
      }),
    })
  );
}

async function mockNoByokKeys(page: import("@playwright/test").Page) {
  await page.route("**/api/ai/keys*", (route) =>
    route.fulfill({ status: 401, contentType: "application/json", body: "{}" })
  );
}

async function mockStockOfTheDayApi(page: import("@playwright/test").Page) {
  await page.route("**/api/market/stock-of-the-day*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: STABLE_STOCK_OF_THE_DAY,
        timestamp: "2024-01-15T12:00:00.000Z",
      }),
    })
  );
}

function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

async function mockCalendarApis(page: import("@playwright/test").Page) {
  await page.route("**/api/calendar/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: [] }),
    })
  );
}

async function mockCalendarTabFixtures(page: import("@playwright/test").Page) {
  const inRange = isoDaysFromToday(1);

  await page.route("**/api/calendar/economic*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: "eco-1",
            name: "Consumer Price Index",
            country: "US",
            date: inRange,
            time: "08:30",
            importance: "high",
            description: "Monthly inflation gauge",
            previous: "3.1%",
            forecast: "3.0%",
          },
        ],
      }),
    })
  );
  await page.route("**/api/calendar/earnings*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: "earn-1",
            symbol: "AAPL",
            companyName: "Apple Inc.",
            date: inRange,
            time: "AMC",
            epsEstimate: 1.43,
            epsActual: 1.52,
            epsSurprise: 0.09,
            epsSurprisePercent: 6.29,
          },
        ],
      }),
    })
  );
  await page.route("**/api/calendar/dividends*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: "div-1",
            symbol: "KO",
            companyName: "Coca-Cola",
            amount: 0.46,
            exDividendDate: inRange,
            paymentDate: inRange,
            yield: 3.1,
            frequency: "quarterly",
          },
        ],
      }),
    })
  );
  await page.route("**/api/calendar/ipos*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: "ipo-1",
            companyName: "Acme Corp",
            symbol: "ACME",
            expectedDate: inRange,
            priceRangeLow: 18,
            priceRangeHigh: 22,
            sharesOffered: 12_000_000,
            exchange: "NASDAQ",
          },
        ],
      }),
    })
  );
}

async function mockProfileProviderStorage(
  page: import("@playwright/test").Page
) {
  await page.addInitScript(() => {
    localStorage.setItem("explanations_provider", "HOSTED");
  });
}

async function mockHeatmapApis(page: import("@playwright/test").Page) {
  await page.route("**/api/market/etfs*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: [] }),
    })
  );
}

async function mockSectorApis(page: import("@playwright/test").Page) {
  await page.route("**/api/market/sectors*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: STABLE_SECTORS,
        timestamp: "2024-01-15T12:00:00.000Z",
      }),
    })
  );
}

async function mockScreenerApis(page: import("@playwright/test").Page) {
  await page.route("**/api/screener/**", async (route) => {
    const body = JSON.stringify({ success: true, data: [] });
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body,
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body,
    });
  });
}

async function mockFreeSubscription(page: import("@playwright/test").Page) {
  await page.route("**/api/subscription/current*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          tier: "FREE",
          authenticated: false,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          status: null,
        },
        timestamp: "2024-01-15T12:00:00.000Z",
      }),
    })
  );
}

test.describe("Hallmark visual regression", () => {
  test("main navigation matches baseline", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav[aria-label='Main navigation']");
    await expect(nav).toBeVisible();
    await expect(nav).toHaveScreenshot("main-navigation.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("home dashboard hero matches baseline", async ({ page }) => {
    await mockHomePulseApis(page);
    await page.goto("/");
    const hero = page.getByTestId("home-dashboard-hero");
    await expect(hero).toBeVisible();
    await expect(hero).toHaveScreenshot("home-dashboard-hero.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("pricing comparison matches baseline", async ({ page }) => {
    await mockPricingApis(page);
    await page.goto("/pricing");
    await expect(
      page.getByRole("heading", { name: /Simple, transparent pricing/i })
    ).toBeVisible({
      timeout: 15000,
    });
    const pricing = page.locator('section[aria-labelledby="pricing-heading"]');
    await expect(pricing).toBeVisible({ timeout: 15000 });
    await expect(pricing).toHaveScreenshot("pricing-page.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("symbol header matches baseline", async ({ page }) => {
    await mockSymbolMarketRoutes(page);
    await page.goto("/?symbol=AAPL");

    const closeOverlay = page.getByTestId("product-overlay-close");
    if (await closeOverlay.isVisible().catch(() => false)) {
      await closeOverlay.click();
    }

    const header = page.locator('[aria-label="AAPL - Apple Inc."]');
    await expect(header).toBeVisible({ timeout: 30000 });
    await expect(header).toHaveScreenshot("symbol-header.png", {
      maxDiffPixelRatio: 0.03,
    });

    const chart = page.getByTestId("price-chart-panel");
    await expect(chart).toBeVisible({ timeout: 15000 });
    await waitForChartReveal(page);
    await expect(chart).toHaveScreenshot("symbol-price-chart.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("subscription gate on home AI outlook matches baseline", async ({
    page,
  }) => {
    await mockHomePulseApis(page);
    await mockFreeSubscription(page);
    await page.goto("/");
    const gate = page
      .getByTestId("home-ai-outlook")
      .getByTestId("product-gate");
    await expect(gate).toBeVisible({ timeout: 15000 });
    await expect(gate).toHaveScreenshot("subscription-gate.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("main navigation dark mode matches baseline", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    const nav = page.locator("nav[aria-label='Main navigation']");
    await expect(nav).toBeVisible();
    await expect(nav).toHaveScreenshot("main-navigation-dark.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("home dashboard hero dark mode matches baseline", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await mockHomePulseApis(page);
    await page.goto("/");
    const hero = page.getByTestId("home-dashboard-hero");
    await expect(hero).toBeVisible();
    await expect(hero).toHaveScreenshot("home-dashboard-hero-dark.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("auth prompt overlay matches baseline", async ({ page }) => {
    await mockPricingApis(page);
    await page.goto("/pricing?signin=1");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });
    await expect(dialog).toHaveScreenshot("auth-prompt.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("screener hub matches baseline", async ({ page }) => {
    await mockScreenerApis(page);
    await page.goto("/screener");
    const hub = page.getByTestId("screener-hub");
    await expect(hub).toBeVisible({ timeout: 20000 });
    await expect(hub).toHaveScreenshot("screener-hub.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("pricing comparison dark mode matches baseline", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await mockPricingApis(page);
    await page.goto("/pricing");
    const pricing = page.locator('section[aria-labelledby="pricing-heading"]');
    await expect(pricing).toBeVisible({ timeout: 15000 });
    await expect(pricing).toHaveScreenshot("pricing-page-dark.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("symbol header and chart dark mode match baseline", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await mockSymbolMarketRoutes(page);
    await page.goto("/?symbol=AAPL");

    const closeOverlay = page.getByTestId("product-overlay-close");
    if (await closeOverlay.isVisible().catch(() => false)) {
      await closeOverlay.click();
    }

    const header = page.locator('[aria-label="AAPL - Apple Inc."]');
    await expect(header).toBeVisible({ timeout: 30000 });
    await expect(header).toHaveScreenshot("symbol-header-dark.png", {
      maxDiffPixelRatio: 0.03,
    });

    const chart = page.getByTestId("price-chart-panel");
    await expect(chart).toBeVisible({ timeout: 15000 });
    await waitForChartReveal(page);
    await expect(chart).toHaveScreenshot("symbol-price-chart-dark.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("symbol load error gate matches baseline", async ({ page }) => {
    await mockSymbolMarketRoutes(page, { failSymbol: true });
    await page.goto("/?symbol=BADSYM");
    const gate = page.getByTestId("symbol-load-error");
    await expect(gate).toBeVisible({ timeout: 30000 });
    await expect(gate).toHaveScreenshot("symbol-load-error-gate.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("calendar hub matches baseline", async ({ page }) => {
    await mockCalendarApis(page);
    await page.goto("/calendars");
    const hub = page.getByTestId("calendar-hub");
    await expect(hub).toBeVisible({ timeout: 20000 });
    await expect(hub).toHaveScreenshot("calendar-hub.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("calendar hub dark mode matches baseline", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await mockCalendarApis(page);
    await page.goto("/calendars");
    const hub = page.getByTestId("calendar-hub");
    await expect(hub).toBeVisible({ timeout: 20000 });
    await expect(hub).toHaveScreenshot("calendar-hub-dark.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("economic calendar tab matches baseline", async ({ page }) => {
    await mockCalendarTabFixtures(page);
    await page.goto("/calendars");
    await expect(page.getByTestId("economic-calendar")).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByTestId("economic-calendar")).toHaveScreenshot(
      "economic-calendar-tab.png",
      { maxDiffPixelRatio: 0.03 }
    );
  });

  test("earnings calendar tab matches baseline", async ({ page }) => {
    await mockCalendarTabFixtures(page);
    await page.goto("/calendars");
    await page.getByTestId("calendar-tab-earnings").click();
    const panel = page.getByTestId("earnings-calendar");
    await expect(panel).toBeVisible({ timeout: 20000 });
    await expect(panel.getByText("AAPL")).toBeVisible({ timeout: 15000 });
    await expect(panel).toHaveScreenshot("earnings-calendar-tab.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("dividend calendar tab matches baseline", async ({ page }) => {
    await mockCalendarTabFixtures(page);
    await page.goto("/calendars");
    await page.getByTestId("calendar-tab-dividends").click();
    const panel = page.getByTestId("dividend-calendar");
    await expect(panel).toBeVisible({ timeout: 20000 });
    await expect(panel.getByText("KO")).toBeVisible({ timeout: 15000 });
    await expect(panel).toHaveScreenshot("dividend-calendar-tab.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("IPO calendar tab matches baseline", async ({ page }) => {
    await mockCalendarTabFixtures(page);
    await page.goto("/calendars");
    await page.getByTestId("calendar-tab-ipos").click();
    const panel = page.getByTestId("ipo-calendar");
    await expect(panel).toBeVisible({ timeout: 20000 });
    await expect(panel.getByText("Acme Corp")).toBeVisible({ timeout: 15000 });
    await expect(panel).toHaveScreenshot("ipo-calendar-tab.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("heatmap hub matches baseline", async ({ page }) => {
    await mockHeatmapApis(page);
    await page.goto("/heatmaps");
    const hub = page.getByTestId("heatmap-hub");
    await expect(hub).toBeVisible({ timeout: 20000 });
    await expect(hub).toHaveScreenshot("heatmap-hub.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("heatmap hub dark mode matches baseline", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await mockHeatmapApis(page);
    await page.goto("/heatmaps");
    const hub = page.getByTestId("heatmap-hub");
    await expect(hub).toBeVisible({ timeout: 20000 });
    await expect(hub).toHaveScreenshot("heatmap-hub-dark.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("sector hub matches baseline", async ({ page }) => {
    await mockSectorApis(page);
    await page.goto("/sectors");
    const hub = page.getByTestId("sector-hub");
    await expect(hub).toBeVisible({ timeout: 20000 });
    await expect(hub).toHaveScreenshot("sector-hub.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("sector hub dark mode matches baseline", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await mockSectorApis(page);
    await page.goto("/sectors");
    const hub = page.getByTestId("sector-hub");
    await expect(hub).toBeVisible({ timeout: 20000 });
    await expect(hub).toHaveScreenshot("sector-hub-dark.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("profile signed-out matches baseline", async ({ page }) => {
    await page.route("**/api/auth/me*", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ success: false }),
      })
    );
    await mockFreeSubscription(page);
    await page.goto("/profile");
    const header = page.getByTestId("profile-hub-header");
    await expect(header).toBeVisible({ timeout: 15000 });
    await expect(header).toHaveScreenshot("profile-hub-header.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("profile signed-out dark mode matches baseline", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.route("**/api/auth/me*", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ success: false }),
      })
    );
    await mockFreeSubscription(page);
    await page.goto("/profile");
    const header = page.getByTestId("profile-hub-header");
    await expect(header).toBeVisible({ timeout: 15000 });
    await expect(header).toHaveScreenshot("profile-hub-header-dark.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("profile signed-in account section matches baseline", async ({
    page,
  }) => {
    await mockProfileProviderStorage(page);
    await mockSignedInUser(page);
    await mockHostedAiSubscription(page);
    await page.goto("/profile");
    const section = page.getByTestId("profile-hub-signed-in");
    await expect(section).toBeVisible({ timeout: 15000 });
    await expect(section).toHaveScreenshot("profile-hub-signed-in.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("profile signed-in account section dark mode matches baseline", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await mockProfileProviderStorage(page);
    await mockSignedInUser(page);
    await mockHostedAiSubscription(page);
    await page.goto("/profile");
    const section = page.getByTestId("profile-hub-signed-in");
    await expect(section).toBeVisible({ timeout: 15000 });
    await expect(section).toHaveScreenshot("profile-hub-signed-in-dark.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("AI prediction panel matches baseline", async ({ page }) => {
    await mockHostedAiSubscription(page);
    await mockNoByokKeys(page);
    await mockSymbolMarketRoutes(page);
    await page.goto("/?symbol=AAPL");

    const closeOverlay = page.getByTestId("product-overlay-close");
    if (await closeOverlay.isVisible().catch(() => false)) {
      await closeOverlay.click();
    }

    const panel = page.getByTestId("ai-prediction-panel");
    await expect(panel).toBeVisible({ timeout: 30000 });
    await expect(panel.getByText(/Balanced setup/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(panel).toHaveScreenshot("ai-prediction-panel.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("AI prediction panel dark mode matches baseline", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await mockHostedAiSubscription(page);
    await mockNoByokKeys(page);
    await mockSymbolMarketRoutes(page);
    await page.goto("/?symbol=AAPL");

    const closeOverlay = page.getByTestId("product-overlay-close");
    if (await closeOverlay.isVisible().catch(() => false)) {
      await closeOverlay.click();
    }

    const panel = page.getByTestId("ai-prediction-panel");
    await expect(panel).toBeVisible({ timeout: 30000 });
    await expect(panel.getByText(/Balanced setup/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(panel).toHaveScreenshot("ai-prediction-panel-dark.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("stock of the day panel matches baseline", async ({ page }) => {
    await mockHostedAiSubscription(page);
    await mockNoByokKeys(page);
    await mockStockOfTheDayApi(page);
    await page.goto("/stock-of-the-day");

    const panel = page.getByTestId("stock-of-the-day-panel");
    await expect(panel).toBeVisible({ timeout: 20000 });
    await expect(panel.getByText("RKLB")).toBeVisible({ timeout: 15000 });
    await expect(panel).toHaveScreenshot("stock-of-the-day-panel.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("stock of the day panel dark mode matches baseline", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await mockHostedAiSubscription(page);
    await mockNoByokKeys(page);
    await mockStockOfTheDayApi(page);
    await page.goto("/stock-of-the-day");

    const panel = page.getByTestId("stock-of-the-day-panel");
    await expect(panel).toBeVisible({ timeout: 20000 });
    await expect(panel.getByText("RKLB")).toBeVisible({ timeout: 15000 });
    await expect(panel).toHaveScreenshot("stock-of-the-day-panel-dark.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("stock of the day page matches baseline", async ({ page }) => {
    await mockHostedAiSubscription(page);
    await mockNoByokKeys(page);
    await mockStockOfTheDayApi(page);
    await page.goto("/stock-of-the-day");

    const pageRoot = page.getByTestId("stock-of-the-day-page");
    await expect(pageRoot).toBeVisible({ timeout: 20000 });
    await expect(
      pageRoot.getByRole("heading", { name: /stock of the day/i })
    ).toBeVisible();
    await expect(pageRoot).toHaveScreenshot("stock-of-the-day-page.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("stock of the day page dark mode matches baseline", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await mockHostedAiSubscription(page);
    await mockNoByokKeys(page);
    await mockStockOfTheDayApi(page);
    await page.goto("/stock-of-the-day");

    const pageRoot = page.getByTestId("stock-of-the-day-page");
    await expect(pageRoot).toBeVisible({ timeout: 20000 });
    await expect(pageRoot).toHaveScreenshot("stock-of-the-day-page-dark.png", {
      maxDiffPixelRatio: 0.03,
    });
  });
});
