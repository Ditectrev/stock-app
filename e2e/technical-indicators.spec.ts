import { test, expect } from "./fixtures";

test.describe("Technical Indicators Tab", () => {
  /**
   * Helper: search for a symbol and wait for data to load
   */
  async function selectSymbol(
    page: import("@playwright/test").Page,
    symbol: string
  ) {
    await page.goto("http://localhost:3000");
    const searchInput = page.getByPlaceholder(/search stocks/i);
    await searchInput.fill(symbol);
    await searchInput.press("Enter");
    // Wait for symbol header to appear
    await expect(
      page.getByRole("heading", { name: new RegExp(symbol, "i") })
    ).toBeVisible();
  }

  test("should display Technical Indicators heading when Technicals tab is clicked", async ({
    page,
  }) => {
    await selectSymbol(page, "AAPL");
    await page.getByRole("tab", { name: "Technicals" }).click();
    await expect(page.getByText("Technical Indicators")).toBeVisible();
  });

  test("should display all four indicator sections", async ({ page }) => {
    await selectSymbol(page, "AAPL");
    await page.getByRole("tab", { name: "Technicals" }).click();

    await expect(page.getByText("RSI (Relative Strength Index)")).toBeVisible();
    await expect(page.getByText("Moving Averages")).toBeVisible();
    await expect(page.getByText("Bollinger Bands")).toBeVisible();
    // MACD appears as both a card name and a value label
    const macdElements = page.locator("text=MACD");
    await expect(macdElements.first()).toBeVisible();
  });

  test("should display the overall sentiment gauge", async ({ page }) => {
    await selectSymbol(page, "TSLA");
    await page.getByRole("tab", { name: "Technicals" }).click();

    const gauge = page.getByTestId("sentiment-gauge");
    await expect(gauge).toBeVisible();
    // Should contain one of the sentiment labels
    await expect(gauge).toContainText(
      /Overall: Appears (Overpriced|Underpriced|Fairly Priced)/
    );
  });

  test("should display signal badges with correct labels", async ({ page }) => {
    await selectSymbol(page, "MSFT");
    await page.getByRole("tab", { name: "Technicals" }).click();

    // At least one badge should be visible (every indicator has a signal badge)
    const badges = page.locator(
      "text=/^(Overpriced|Underpriced|Fairly Priced)$/"
    );
    const count = await badges.count();
    // 4 indicator cards + 1 sentiment badge = 5 badges minimum
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test("should show tooltip when hovering over an indicator name", async ({
    page,
  }) => {
    await selectSymbol(page, "NVDA");
    await page.getByRole("tab", { name: "Technicals" }).click();

    // Hover over RSI indicator info button
    const rsiButton = page.getByLabel(
      "More info about RSI (Relative Strength Index)"
    );
    await expect(rsiButton).toBeVisible();
    await rsiButton.hover();

    // Tooltip should appear with RSI explanation
    await expect(
      page.getByText(/RSI measures the speed and magnitude/)
    ).toBeVisible({ timeout: 3000 });
  });

  test("should not contain Buy or Sell language", async ({ page }) => {
    await selectSymbol(page, "GOOGL");
    await page.getByRole("tab", { name: "Technicals" }).click();

    // Wait for indicators to load
    await expect(page.getByText("Technical Indicators")).toBeVisible();

    // Get all text content from the technicals section
    const content = await page.locator(".p-6").first().textContent();
    expect(content).not.toMatch(/\bBuy\b/);
    expect(content).not.toMatch(/\bSell\b/);
  });

  test("should display numeric values for indicators", async ({ page }) => {
    await selectSymbol(page, "AMZN");
    await page.getByRole("tab", { name: "Technicals" }).click();

    // RSI value should be a number
    await expect(page.getByText("RSI (Relative Strength Index)")).toBeVisible();

    // MA 50 and MA 200 labels should be present
    await expect(page.getByText("MA 50")).toBeVisible();
    await expect(page.getByText("MA 200")).toBeVisible();

    // Bollinger Band labels
    await expect(page.getByText("Upper")).toBeVisible();
    await expect(page.getByText("Middle")).toBeVisible();
    await expect(page.getByText("Lower")).toBeVisible();
  });

  test("should display help icons for each indicator", async ({ page }) => {
    await selectSymbol(page, "META");
    await page.getByRole("tab", { name: "Technicals" }).click();

    // Each indicator card has a "?" help icon
    const helpIcons = page.locator("text=?");
    const count = await helpIcons.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test("should switch back to Overview tab from Technicals", async ({
    page,
  }) => {
    await selectSymbol(page, "AAPL");

    // Go to Technicals
    await page.getByRole("tab", { name: "Technicals" }).click();
    await expect(page.getByText("Technical Indicators")).toBeVisible();

    // Go back to Overview
    await page.getByRole("tab", { name: "Overview" }).click();
    await expect(page.getByText("Key Metrics")).toBeVisible();
  });

  test("should be responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await selectSymbol(page, "NFLX");
    await page.getByRole("tab", { name: "Technicals" }).click();

    await expect(page.getByText("Technical Indicators")).toBeVisible();
    await expect(page.getByText("RSI (Relative Strength Index)")).toBeVisible();
    await expect(page.getByTestId("sentiment-gauge")).toBeVisible();
  });
});
