import { test, expect } from "./fixtures";

test.describe("Symbol Detail on Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test("should display welcome message when no symbol selected", async ({
    page,
  }) => {
    await expect(page.getByText("Search for a Stock Symbol")).toBeVisible();
    await expect(
      page.getByText("Use the search bar above to find and analyze stocks")
    ).toBeVisible();
  });

  test("should display symbol header after selecting a symbol", async ({
    page,
  }) => {
    // Search for a symbol
    const searchInput = page.getByPlaceholder(/search stocks/i);
    await searchInput.fill("AAPL");
    await searchInput.press("Enter");

    // Wait for symbol header to appear
    await expect(page.getByRole("heading", { name: /AAPL/i })).toBeVisible();
  });

  test("should display current price with change indicators", async ({
    page,
  }) => {
    // Select a symbol
    const searchInput = page.getByPlaceholder(/search stocks/i);
    await searchInput.fill("AAPL");
    await searchInput.press("Enter");

    // Check for price display
    await expect(page.getByText(/\$/)).toBeVisible();

    // Check for change percentage (either positive or negative)
    const changeText = page.locator("text=/[+-]?\\d+\\.\\d+%/").first();
    await expect(changeText).toBeVisible();
  });

  test("should display tab navigation", async ({ page }) => {
    // Select a symbol
    const searchInput = page.getByPlaceholder(/search stocks/i);
    await searchInput.fill("TSLA");
    await searchInput.press("Enter");

    // Check for all tabs
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Financials" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Technicals" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Forecasts" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Seasonals" })).toBeVisible();
  });

  test("should display Overview tab by default", async ({ page }) => {
    // Select a symbol
    const searchInput = page.getByPlaceholder(/search stocks/i);
    await searchInput.fill("MSFT");
    await searchInput.press("Enter");

    // Overview tab should be active
    const overviewTab = page.getByRole("tab", { name: "Overview" });
    await expect(overviewTab).toHaveAttribute("aria-selected", "true");
  });

  test("should display key metrics in Overview tab", async ({ page }) => {
    // Select a symbol
    const searchInput = page.getByPlaceholder(/search stocks/i);
    await searchInput.fill("NVDA");
    await searchInput.press("Enter");

    // Check for key metrics
    await expect(page.getByText("Key Metrics")).toBeVisible();
    await expect(page.getByText("Market Cap")).toBeVisible();
    await expect(page.getByText("Volume")).toBeVisible();
    await expect(page.getByText("52-Week High")).toBeVisible();
    await expect(page.getByText("52-Week Low")).toBeVisible();
  });

  test("should display price chart in Overview tab", async ({ page }) => {
    // Select a symbol
    const searchInput = page.getByPlaceholder(/search stocks/i);
    await searchInput.fill("GOOGL");
    await searchInput.press("Enter");

    // Check for chart heading
    await expect(page.getByText("Price Chart")).toBeVisible();
  });

  test("should switch between tabs", async ({ page }) => {
    // Select a symbol
    const searchInput = page.getByPlaceholder(/search stocks/i);
    await searchInput.fill("AMZN");
    await searchInput.press("Enter");

    // Click on Financials tab
    await page.getByRole("tab", { name: "Financials" }).click();
    await expect(page.getByText("Financials")).toBeVisible();

    // Click on Technicals tab
    await page.getByRole("tab", { name: "Technicals" }).click();
    await expect(page.getByText("Technical Indicators")).toBeVisible();

    // Click back to Overview
    await page.getByRole("tab", { name: "Overview" }).click();
    await expect(page.getByText("Key Metrics")).toBeVisible();
  });

  test("should handle different symbols", async ({ page }) => {
    // First symbol
    let searchInput = page.getByPlaceholder(/search stocks/i);
    await searchInput.fill("AAPL");
    await searchInput.press("Enter");
    await expect(page.getByRole("heading", { name: /AAPL/i })).toBeVisible();

    // Second symbol
    searchInput = page.getByPlaceholder(/search stocks/i);
    await searchInput.fill("TSLA");
    await searchInput.press("Enter");
    await expect(page.getByRole("heading", { name: /TSLA/i })).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Select a symbol
    const searchInput = page.getByPlaceholder(/search stocks/i);
    await searchInput.fill("NFLX");
    await searchInput.press("Enter");

    // Check that content is visible on mobile
    await expect(page.getByRole("heading", { name: /NFLX/i })).toBeVisible();
    await expect(page.getByText("Key Metrics")).toBeVisible();
  });

  test("should display tooltips on metric hover", async ({ page }) => {
    // Select a symbol
    const searchInput = page.getByPlaceholder(/search stocks/i);
    await searchInput.fill("AMD");
    await searchInput.press("Enter");

    // Wait for metrics to load
    await expect(page.getByText("Market Cap")).toBeVisible();

    // Hover over a metric to show tooltip
    const marketCapMetric = page.locator("text=Market Cap").locator("..");
    await marketCapMetric.hover();

    // Tooltip should appear (checking for tooltip content)
    await expect(
      page.getByText(/Market Capitalization is the total value/i)
    ).toBeVisible({ timeout: 2000 });
  });

  test("should display time range selector in chart", async ({ page }) => {
    // Select a symbol
    const searchInput = page.getByPlaceholder(/search stocks/i);
    await searchInput.fill("INTC");
    await searchInput.press("Enter");

    // Wait for chart to load
    await expect(page.getByText("Price Chart")).toBeVisible();

    // Check for time range buttons
    await expect(page.getByRole("button", { name: "1D" })).toBeVisible();
    await expect(page.getByRole("button", { name: "1W" })).toBeVisible();
    await expect(page.getByRole("button", { name: "1M" })).toBeVisible();
    await expect(page.getByRole("button", { name: "1Y" })).toBeVisible();
  });
});
