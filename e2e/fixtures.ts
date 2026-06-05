import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

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
        ],
        timestamp: "2024-01-15T12:00:00.000Z",
      }),
    })
  );
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await installE2eMocks(page);
    await use(page);
  },
});

export { expect };
