import { test, expect } from "@playwright/test";

test.describe("World Markets", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the World Markets section on the home page", async ({
    page,
  }) => {
    const worldMarkets = page.getByTestId("world-markets");
    await expect(worldMarkets).toBeVisible({ timeout: 10000 });
    await expect(worldMarkets.getByText("World Markets")).toBeVisible();
  });

  test("should display indices grouped by region (Req 10.1)", async ({
    page,
  }) => {
    const worldMarkets = page.getByTestId("world-markets");
    await expect(worldMarkets).toBeVisible({ timeout: 10000 });

    // Verify region headers exist
    await expect(worldMarkets.getByText("Americas")).toBeVisible();
    await expect(worldMarkets.getByText("Asia-Pacific")).toBeVisible();
    await expect(worldMarkets.getByText("Europe")).toBeVisible();
  });

  test("should display index names, values, and percentage changes (Req 10.2)", async ({
    page,
  }) => {
    const worldMarkets = page.getByTestId("world-markets");
    await expect(worldMarkets).toBeVisible({ timeout: 10000 });

    // At least one index should show a numeric value and a percentage change
    const changeLocator = worldMarkets
      .locator("text=/[+-]?\\d+\\.\\d+%/")
      .first();
    await expect(changeLocator).toBeVisible();
  });

  test("should color-code positive changes green and negative changes red (Req 10.3)", async ({
    page,
  }) => {
    const worldMarkets = page.getByTestId("world-markets");
    await expect(worldMarkets).toBeVisible({ timeout: 10000 });

    const emeraldCount = await worldMarkets
      .locator(".text-emerald-600")
      .count();
    const roseCount = await worldMarkets.locator(".text-rose-600").count();

    expect(emeraldCount + roseCount).toBeGreaterThan(0);
  });

  test("should show loading state before data arrives", async ({ page }) => {
    // Intercept the API call and delay it
    await page.route("**/api/market/world-markets", async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.continue();
    });

    await page.goto("/");
    const loading = page.getByTestId("world-markets-loading");
    await expect(loading).toBeVisible({ timeout: 5000 });
  });

  test("should hide World Markets when a symbol is selected", async ({
    page,
  }) => {
    const worldMarkets = page.getByTestId("world-markets");
    await expect(worldMarkets).toBeVisible({ timeout: 10000 });

    // Select a symbol to navigate away from the home view
    const searchInput = page.getByPlaceholder(/search stocks/i);
    await searchInput.fill("AAPL");
    await searchInput.press("Enter");

    // World Markets should no longer be visible
    await expect(worldMarkets).not.toBeVisible({ timeout: 5000 });
  });
});
