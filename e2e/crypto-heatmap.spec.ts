import { test, expect } from "./fixtures";

test.describe("Crypto Heatmap", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the crypto heatmap container", async ({ page }) => {
    const cryptoHeatmap = page.getByTestId("crypto-heatmap");
    await expect(cryptoHeatmap).toBeVisible({ timeout: 15000 });
  });

  test("should render crypto tiles with symbols and percentages", async ({
    page,
  }) => {
    const cryptoHeatmap = page.getByTestId("crypto-heatmap");
    await expect(cryptoHeatmap).toBeVisible({ timeout: 15000 });

    const grid = page.getByTestId("heatmap-grid").last();
    await expect(grid).toBeVisible();

    const tiles = grid.locator("[data-testid^='heatmap-tile-']");
    await expect(tiles.first()).toBeVisible();
    expect(await tiles.count()).toBeGreaterThan(0);

    // Each tile should show a percentage
    const percentText = grid.locator("text=/[+-]?\\d+\\.\\d+%/").first();
    await expect(percentText).toBeVisible();
  });

  test("should display category filter buttons (Req 25.8)", async ({
    page,
  }) => {
    const cryptoHeatmap = page.getByTestId("crypto-heatmap");
    await expect(cryptoHeatmap).toBeVisible({ timeout: 15000 });

    const categoryFilter = page.getByTestId("crypto-category-filter");
    await expect(categoryFilter).toBeVisible();

    const allBtn = page.getByTestId("crypto-category-all");
    await expect(allBtn).toBeVisible();
    await expect(allBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("should filter cryptos when a category button is clicked", async ({
    page,
  }) => {
    const cryptoHeatmap = page.getByTestId("crypto-heatmap");
    await expect(cryptoHeatmap).toBeVisible({ timeout: 15000 });

    const grid = cryptoHeatmap.getByTestId("heatmap-grid");
    await expect(grid).toBeVisible();

    const initialCount = await grid
      .locator("[data-testid^='heatmap-tile-']")
      .count();

    // Click a category button (skip "All")
    const categoryButtons = page
      .getByTestId("crypto-category-filter")
      .locator("button");
    const buttonCount = await categoryButtons.count();

    if (buttonCount > 1) {
      await categoryButtons.nth(1).click();

      const filteredCount = await grid
        .locator("[data-testid^='heatmap-tile-']")
        .count();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);

      await expect(categoryButtons.nth(1)).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      await expect(page.getByTestId("crypto-category-all")).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    }
  });

  test("should return to all cryptos when 'All' is clicked after filtering", async ({
    page,
  }) => {
    const cryptoHeatmap = page.getByTestId("crypto-heatmap");
    await expect(cryptoHeatmap).toBeVisible({ timeout: 15000 });

    const grid = cryptoHeatmap.getByTestId("heatmap-grid");
    await expect(grid).toBeVisible();

    const initialCount = await grid
      .locator("[data-testid^='heatmap-tile-']")
      .count();

    const categoryButtons = page
      .getByTestId("crypto-category-filter")
      .locator("button");

    if ((await categoryButtons.count()) > 1) {
      await categoryButtons.nth(1).click();
      await page.getByTestId("crypto-category-all").click();

      const restoredCount = await grid
        .locator("[data-testid^='heatmap-tile-']")
        .count();
      expect(restoredCount).toBe(initialCount);
    }
  });

  test("should display all time period buttons", async ({ page }) => {
    const cryptoHeatmap = page.getByTestId("crypto-heatmap");
    await expect(cryptoHeatmap).toBeVisible({ timeout: 15000 });

    for (const period of ["1D", "1W", "1M", "3M", "1Y", "5Y", "YTD", "MAX"]) {
      await expect(
        cryptoHeatmap.getByTestId(`heatmap-period-${period}`)
      ).toBeVisible();
    }
  });

  test("should switch time period on click", async ({ page }) => {
    const cryptoHeatmap = page.getByTestId("crypto-heatmap");
    await expect(cryptoHeatmap).toBeVisible({ timeout: 15000 });

    await cryptoHeatmap.getByTestId("heatmap-period-1M").click();
    await expect(
      cryptoHeatmap.getByTestId("heatmap-period-1M")
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      cryptoHeatmap.getByTestId("heatmap-period-1D")
    ).toHaveAttribute("aria-pressed", "false");
  });

  test("should have accessible category filter group", async ({ page }) => {
    const cryptoHeatmap = page.getByTestId("crypto-heatmap");
    await expect(cryptoHeatmap).toBeVisible({ timeout: 15000 });

    const group = page.getByTestId("crypto-category-filter");
    await expect(group).toHaveAttribute("role", "group");
    await expect(group).toHaveAttribute("aria-label", "Crypto category filter");
  });
});
