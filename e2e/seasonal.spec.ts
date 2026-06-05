import { test, expect } from "./fixtures";

test.describe("Seasonals Tab", () => {
  /**
   * Helper: search for a symbol and navigate to the Seasonals tab
   */
  async function goToSeasonals(
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
    await page.getByRole("tab", { name: "Seasonals" }).click();
  }

  test("should display Seasonal Patterns heading when Seasonals tab is clicked", async ({
    page,
  }) => {
    await goToSeasonals(page, "AAPL");
    await expect(page.getByText("Seasonal Patterns")).toBeVisible();
  });

  test("should display month column headers", async ({ page }) => {
    await goToSeasonals(page, "AAPL");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    for (const month of months) {
      await expect(page.getByText(month, { exact: true })).toBeVisible();
    }
  });

  test("should display the past performance disclaimer", async ({ page }) => {
    await goToSeasonals(page, "MSFT");
    await expect(
      page.getByText("Past seasonality does not guarantee future performance")
    ).toBeVisible();
  });

  test("should display the legend", async ({ page }) => {
    await goToSeasonals(page, "MSFT");
    await expect(page.getByText("Legend:")).toBeVisible();
    await expect(page.getByText("Strong positive")).toBeVisible();
    await expect(page.getByText("Mild positive")).toBeVisible();
    await expect(page.getByText("Mild negative")).toBeVisible();
    await expect(page.getByText("Strong negative")).toBeVisible();
  });

  // Navigation
  test("should switch back to Overview tab from Seasonals", async ({
    page,
  }) => {
    await goToSeasonals(page, "AAPL");
    await expect(page.getByText("Seasonal Patterns")).toBeVisible();
    await page.getByRole("tab", { name: "Overview" }).click();
    await expect(page.getByText("Key Metrics")).toBeVisible();
  });

  // Responsive
  test("should be responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await goToSeasonals(page, "NFLX");
    await expect(page.getByText("Seasonal Patterns")).toBeVisible();
  });
});
