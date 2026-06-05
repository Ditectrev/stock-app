import { test, expect } from "./fixtures";

test.describe("Forecasts Tab", () => {
  /**
   * Helper: search for a symbol and navigate to the Forecasts tab
   */
  async function goToForecasts(
    page: import("@playwright/test").Page,
    symbol: string
  ) {
    await page.goto("http://localhost:3000");
    const searchInput = page.getByPlaceholder(/search stocks/i);
    await searchInput.fill(symbol);
    await searchInput.press("Enter");
    await expect(
      page.getByRole("heading", { name: new RegExp(symbol, "i") })
    ).toBeVisible();
    await page.getByRole("tab", { name: "Forecasts" }).click();
  }

  test("should display Forecast Data heading when Forecasts tab is clicked", async ({
    page,
  }) => {
    await goToForecasts(page, "AAPL");
    await expect(page.getByText("Forecast Data")).toBeVisible();
  });

  // Requirement 6.1: Price targets
  test("should display Price Targets section with low, average, and high", async ({
    page,
  }) => {
    await goToForecasts(page, "AAPL");
    await expect(page.getByText("Price Targets")).toBeVisible();
    await expect(page.getByText("Low")).toBeVisible();
    await expect(page.getByText("Average")).toBeVisible();
    await expect(page.getByText("High")).toBeVisible();
  });

  test("should display the price target visual range bar", async ({ page }) => {
    await goToForecasts(page, "MSFT");
    await expect(page.getByTestId("price-target-range")).toBeVisible();
    await expect(page.getByTestId("price-target-marker")).toBeVisible();
  });

  // Requirement 6.2: Analyst ratings
  test("should display Analyst Ratings section with all rating labels", async ({
    page,
  }) => {
    await goToForecasts(page, "AAPL");
    await expect(page.getByText("Analyst Ratings")).toBeVisible();
    await expect(page.getByText("Strong Buy")).toBeVisible();
    await expect(page.getByText("Buy")).toBeVisible();
    await expect(page.getByText("Hold")).toBeVisible();
    await expect(page.getByText("Sell")).toBeVisible();
    await expect(page.getByText("Strong Sell")).toBeVisible();
  });

  // Requirement 6.3: EPS and revenue forecasts
  test("should display EPS Forecasts section", async ({ page }) => {
    await goToForecasts(page, "TSLA");
    await expect(page.getByText("EPS Forecasts")).toBeVisible();
  });

  test("should display Revenue Forecasts section", async ({ page }) => {
    await goToForecasts(page, "TSLA");
    await expect(page.getByText("Revenue Forecasts")).toBeVisible();
  });

  // Requirement 6.5: Tooltips
  test("should show tooltip when hovering over Price Targets heading", async ({
    page,
  }) => {
    await goToForecasts(page, "NVDA");
    const hoverTarget = page.getByLabel("More info about Price Targets");
    await expect(hoverTarget).toBeVisible();
    await hoverTarget.hover();
    await expect(page.getByText(/Analyst price targets represent/)).toBeVisible(
      { timeout: 3000 }
    );
  });

  test("should show tooltip when hovering over Analyst Ratings heading", async ({
    page,
  }) => {
    await goToForecasts(page, "NVDA");
    const hoverTarget = page.getByLabel("More info about Analyst Ratings");
    await expect(hoverTarget).toBeVisible();
    await hoverTarget.hover();
    await expect(
      page.getByText(/Analyst ratings show the distribution/)
    ).toBeVisible({ timeout: 3000 });
  });

  test("should show tooltip when hovering over EPS Forecasts heading", async ({
    page,
  }) => {
    await goToForecasts(page, "GOOGL");
    const hoverTarget = page.getByLabel("More info about EPS Forecasts");
    await expect(hoverTarget).toBeVisible();
    await hoverTarget.hover();
    await expect(page.getByText(/Earnings Per Share/)).toBeVisible({
      timeout: 3000,
    });
  });

  test("should show tooltip when hovering over Revenue Forecasts heading", async ({
    page,
  }) => {
    await goToForecasts(page, "GOOGL");
    const hoverTarget = page.getByLabel("More info about Revenue Forecasts");
    await expect(hoverTarget).toBeVisible();
    await hoverTarget.hover();
    await expect(
      page.getByText(/Revenue forecasts compare analyst estimates/)
    ).toBeVisible({ timeout: 3000 });
  });

  test("should display help icons for each section", async ({ page }) => {
    await goToForecasts(page, "AMZN");
    const helpIcons = page.locator("text=?");
    const count = await helpIcons.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  // Navigation
  test("should switch back to Overview tab from Forecasts", async ({
    page,
  }) => {
    await goToForecasts(page, "AAPL");
    await expect(page.getByText("Forecast Data")).toBeVisible();
    await page.getByRole("tab", { name: "Overview" }).click();
    await expect(page.getByText("Key Metrics")).toBeVisible();
  });

  // Responsive
  test("should be responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await goToForecasts(page, "NFLX");
    await expect(page.getByText("Forecast Data")).toBeVisible();
    await expect(page.getByText("Price Targets")).toBeVisible();
    await expect(page.getByText("Analyst Ratings")).toBeVisible();
  });
});
