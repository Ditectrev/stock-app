import { test, expect } from "./fixtures";

test.describe("Market Heatmap", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the heatmap section on the home page", async ({
    page,
  }) => {
    const heatmap = page.getByTestId("heatmap");
    await expect(heatmap).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Market Heatmap")).toBeVisible();
  });

  test("should render tiles with symbols and percentages (Req 25.3, 25.6)", async ({
    page,
  }) => {
    const grid = page.getByTestId("heatmap-grid");
    await expect(grid).toBeVisible({ timeout: 15000 });

    const tiles = grid.locator("[data-testid^='heatmap-tile-']");
    await expect(tiles.first()).toBeVisible();
    expect(await tiles.count()).toBeGreaterThan(0);

    // Each tile should show a percentage
    const percentText = grid.locator("text=/[+-]?\\d+\\.\\d+%/").first();
    await expect(percentText).toBeVisible();
  });

  test("should display time period selector with all periods (Req 25.12)", async ({
    page,
  }) => {
    const heatmap = page.getByTestId("heatmap");
    await expect(heatmap).toBeVisible({ timeout: 15000 });

    for (const period of ["1D", "1W", "1M", "3M", "1Y", "5Y", "YTD", "MAX"]) {
      await expect(page.getByTestId(`heatmap-period-${period}`)).toBeVisible();
    }
  });

  test("should highlight the active time period", async ({ page }) => {
    const heatmap = page.getByTestId("heatmap");
    await expect(heatmap).toBeVisible({ timeout: 15000 });

    const activeBtn = page.getByTestId("heatmap-period-1D");
    await expect(activeBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("should switch time period on click (Req 25.13)", async ({ page }) => {
    const heatmap = page.getByTestId("heatmap");
    await expect(heatmap).toBeVisible({ timeout: 15000 });

    await page.getByTestId("heatmap-period-1W").click();
    await expect(page.getByTestId("heatmap-period-1W")).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(page.getByTestId("heatmap-period-1D")).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  test("should display sort controls (Req 25.18)", async ({ page }) => {
    const heatmap = page.getByTestId("heatmap");
    await expect(heatmap).toBeVisible({ timeout: 15000 });

    await expect(page.getByTestId("heatmap-sort-changePercent")).toBeVisible();
    await expect(page.getByTestId("heatmap-sort-marketCap")).toBeVisible();
    await expect(page.getByTestId("heatmap-sort-name")).toBeVisible();
  });

  test("should display sector filter dropdown (Req 25.17)", async ({
    page,
  }) => {
    const heatmap = page.getByTestId("heatmap");
    await expect(heatmap).toBeVisible({ timeout: 15000 });

    const filter = page.getByTestId("heatmap-sector-filter");
    await expect(filter).toBeVisible();
    await expect(filter).toHaveValue("");
  });

  test("should show tooltip on tile hover (Req 25.14)", async ({ page }) => {
    const grid = page.getByTestId("heatmap-grid");
    await expect(grid).toBeVisible({ timeout: 15000 });

    const firstTile = grid.locator("[data-testid^='heatmap-tile-']").first();
    await firstTile.hover();

    const tooltip = grid.locator("[data-testid^='heatmap-tooltip-']").first();
    await expect(tooltip).toBeVisible({ timeout: 3000 });
  });

  test("should display color legend (Req 25.19)", async ({ page }) => {
    const heatmap = page.getByTestId("heatmap");
    await expect(heatmap).toBeVisible({ timeout: 15000 });

    const legend = page.getByTestId("heatmap-legend");
    await expect(legend).toBeVisible();
    await expect(legend.getByText("Strong decline")).toBeVisible();
    await expect(legend.getByText("Strong gain")).toBeVisible();
  });

  test("should show loading state while data is fetching", async ({ page }) => {
    await page.route("**/api/market/sectors*", async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.continue();
    });

    await page.goto("/");
    const loading = page.getByTestId("heatmap-loading");
    await expect(loading).toBeVisible({ timeout: 5000 });
  });
});
