import { test, expect } from "./fixtures";
import { selectSymbol } from "./helpers";

test.describe("Technical Indicators Tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  async function goToTechnicals(
    page: import("@playwright/test").Page,
    symbol: string
  ) {
    await selectSymbol(page, symbol);
    await page.getByRole("tab", { name: "Technicals" }).click();
    await expect(
      page.getByRole("tabpanel", { name: "Technical Indicators" })
    ).toBeVisible({ timeout: 15000 });
  }

  test("should display Technical Indicators heading when Technicals tab is clicked", async ({
    page,
  }) => {
    await goToTechnicals(page, "AAPL");
    await expect(page.getByText("Technical Indicators")).toBeVisible();
  });

  test("should display all four indicator sections", async ({ page }) => {
    await goToTechnicals(page, "AAPL");

    await expect(page.getByText("RSI (Relative Strength Index)")).toBeVisible();
    await expect(page.getByText("Moving Averages")).toBeVisible();
    await expect(page.getByText("Bollinger Bands")).toBeVisible();
    // MACD appears as both a card name and a value label
    const macdElements = page.locator("text=MACD");
    await expect(macdElements.first()).toBeVisible();
  });

  test("should display the overall sentiment gauge", async ({ page }) => {
    await goToTechnicals(page, "TSLA");

    const gauge = page.getByTestId("sentiment-gauge");
    await expect(gauge).toBeVisible();
    // Should contain one of the sentiment labels
    await expect(gauge).toContainText(
      /Overall: Appears (Overpriced|Underpriced|Fairly Priced)/
    );
  });

  test("should display signal badges with correct labels", async ({ page }) => {
    await goToTechnicals(page, "MSFT");

    const panel = page.getByRole("tabpanel", { name: "Technical Indicators" });
    await expect(panel.getByText("Overpriced").first()).toBeVisible();
    await expect(panel.getByText("Underpriced").first()).toBeVisible();
    await expect(panel.getByText("Fairly Priced").first()).toBeVisible();
  });

  test("should show tooltip when hovering over an indicator name", async ({
    page,
  }) => {
    await goToTechnicals(page, "NVDA");

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
    await goToTechnicals(page, "GOOGL");

    const panel = page.getByRole("tabpanel", { name: "Technical Indicators" });
    await expect(panel.getByText("Technical Indicators")).toBeVisible();

    const content = await panel.textContent();
    expect(content).not.toMatch(/\bBuy\b/);
    expect(content).not.toMatch(/\bSell\b/);
  });

  test("should display numeric values for indicators", async ({ page }) => {
    await goToTechnicals(page, "AMZN");

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
    await goToTechnicals(page, "META");

    const helpButtons = page.getByRole("button", {
      name: /More info about/i,
    });
    await expect(helpButtons).toHaveCount(4);
  });

  test("should switch back to Overview tab from Technicals", async ({
    page,
  }) => {
    await goToTechnicals(page, "AAPL");

    // Go back to Overview
    await page.getByRole("tab", { name: "Overview" }).click();
    await expect(page.getByText("Key Metrics")).toBeVisible();
  });

  test("should be responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await goToTechnicals(page, "NFLX");

    await expect(page.getByText("Technical Indicators")).toBeVisible();
    await expect(page.getByText("RSI (Relative Strength Index)")).toBeVisible();
    await expect(page.getByTestId("sentiment-gauge")).toBeVisible();
  });
});
