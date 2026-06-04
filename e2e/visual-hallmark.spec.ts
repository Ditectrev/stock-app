import { test, expect } from "@playwright/test";
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

    await page.goto("/");
    const home = page.locator("#section-home");
    await expect(home).toBeVisible();
    await expect(home.getByTestId("fear-greed-gauge")).toBeVisible({
      timeout: 15000,
    });
    await expect(home).toHaveScreenshot("home-dashboard.png", {
      maxDiffPixelRatio: 0.03,
    });
  });

  test("pricing comparison matches baseline", async ({ page }) => {
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
});
