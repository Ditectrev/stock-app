import { test, expect } from "./fixtures";
import { selectSymbol } from "./helpers";

test.describe("Symbol Detail on Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display dashboard quick links when no symbol selected", async ({
    page,
  }) => {
    await expect(page.getByText("Compare sector performance")).toBeVisible();
    await expect(page.getByText("Visual market overview")).toBeVisible();
    await expect(page.getByText("Filter and find assets")).toBeVisible();
  });

  test("should display symbol header after selecting a symbol", async ({
    page,
  }) => {
    await selectSymbol(page, "AAPL");
    await expect(page.getByText("AAPL Test Co.")).toBeVisible();
  });

  test("should display current price with change indicators", async ({
    page,
  }) => {
    await selectSymbol(page, "AAPL");
    await expect(page.getByLabel(/Current price: \$189\.42/)).toBeVisible();
    await expect(page.getByLabel(/Change: \+1\.25 \(\+0\.66%\)/)).toBeVisible();
  });

  test("should display tab navigation", async ({ page }) => {
    await selectSymbol(page, "TSLA");
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Financials" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Technicals" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Forecasts" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Seasonals" })).toBeVisible();
  });

  test("should display Overview tab by default", async ({ page }) => {
    await selectSymbol(page, "MSFT");
    await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  test("should display key metrics in Overview tab", async ({ page }) => {
    await selectSymbol(page, "NVDA");
    await expect(page.getByText("Key Metrics")).toBeVisible();
    await expect(page.getByText("Market Cap")).toBeVisible();
    await expect(page.getByText("Volume")).toBeVisible();
    await expect(page.getByText("52-Week High")).toBeVisible();
    await expect(page.getByText("52-Week Low")).toBeVisible();
  });

  test("should display price chart in Overview tab", async ({ page }) => {
    await selectSymbol(page, "GOOGL");
    await expect(page.getByRole("heading", { name: "Chart" })).toBeVisible();
    await expect(page.getByTestId("price-chart-panel")).toBeVisible();
  });

  test("should switch between tabs", async ({ page }) => {
    await selectSymbol(page, "AMZN");

    await page.getByRole("tab", { name: "Financials" }).click();
    await expect(page.getByRole("tab", { name: "Financials" })).toHaveAttribute(
      "aria-selected",
      "true"
    );

    await page.getByRole("tab", { name: "Technicals" }).click();
    await expect(page.getByRole("tab", { name: "Technicals" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  test("should handle different symbols", async ({ page }) => {
    await selectSymbol(page, "AAPL");
    await expect(
      page.getByRole("heading", { level: 1, name: "AAPL" })
    ).toBeVisible();

    const searchInput = page.getByPlaceholder(/search stocks/i);
    await searchInput.fill("TSLA");
    await searchInput.press("Enter");
    await expect(
      page.getByRole("heading", { level: 1, name: "TSLA" })
    ).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await selectSymbol(page, "NFLX");
    await expect(page.getByTestId("price-chart-panel")).toBeVisible();
  });

  test("should display tooltips on metric hover", async ({ page }) => {
    await selectSymbol(page, "AMD");
    const marketCapLabel = page.getByText("Market Cap").first();
    await marketCapLabel.hover();
    await expect(page.getByRole("tooltip")).toBeVisible();
  });

  test("should display time range selector in chart", async ({ page }) => {
    await selectSymbol(page, "INTC");
    await expect(page.getByRole("button", { name: "1M" })).toBeVisible();
    await expect(page.getByRole("button", { name: "3M" })).toBeVisible();
  });
});
