import { test, expect } from "./fixtures";

test.describe("Sectors Hub", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sectors");
  });

  test("should display the Sectors Hub section on the home page", async ({
    page,
  }) => {
    const sectorHub = page.getByTestId("sector-hub");
    await expect(sectorHub).toBeVisible({ timeout: 15000 });
    await expect(
      sectorHub.getByRole("heading", { name: "Sectors" })
    ).toBeVisible();
  });

  test("should display sector cards with performance percentages (Req 23.1, 23.3)", async ({
    page,
  }) => {
    const sectorHub = page.getByTestId("sector-hub");
    await expect(sectorHub).toBeVisible({ timeout: 15000 });

    // At least one sector should show a percentage
    const changeLocator = sectorHub.locator("text=/[+-]?\\d+\\.\\d+%/").first();
    await expect(changeLocator).toBeVisible();
  });

  test("should color-code performance with emerald and rose semantics (Req 23.4)", async ({
    page,
  }) => {
    const sectorHub = page.getByTestId("sector-hub");
    await expect(sectorHub).toBeVisible({ timeout: 15000 });

    const changeCells = sectorHub.locator('[data-testid^="change-"]');
    await expect(changeCells.first()).toBeVisible();
    const count = await changeCells.count();
    expect(count).toBeGreaterThan(0);

    let hasSemanticColor = false;
    for (let i = 0; i < count; i++) {
      const cls = (await changeCells.nth(i).getAttribute("class")) ?? "";
      if (cls.includes("emerald") || cls.includes("rose")) {
        hasSemanticColor = true;
        break;
      }
    }
    expect(hasSemanticColor).toBe(true);
  });

  test("should display time period selector (Req 23.7)", async ({ page }) => {
    const sectorHub = page.getByTestId("sector-hub");
    await expect(sectorHub).toBeVisible({ timeout: 15000 });

    await expect(page.getByTestId("period-1D")).toBeVisible();
    await expect(page.getByTestId("period-1W")).toBeVisible();
    await expect(page.getByTestId("period-1M")).toBeVisible();
    await expect(page.getByTestId("period-1Y")).toBeVisible();
    await expect(page.getByTestId("period-YTD")).toBeVisible();
  });

  test("should show comparison view when sectors are clicked (Req 23.5)", async ({
    page,
  }) => {
    const sectorHub = page.getByTestId("sector-hub");
    await expect(sectorHub).toBeVisible({ timeout: 15000 });

    // Click the first sector card in the grid
    const firstSector = sectorHub
      .getByTestId("sector-grid")
      .locator("[data-testid^='sector-']")
      .first();
    await firstSector.click();

    await expect(page.getByTestId("comparison-view")).toBeVisible();
  });

  test("should show tooltip on sector hover (Req 23.8)", async ({ page }) => {
    const sectorHub = page.getByTestId("sector-hub");
    await expect(sectorHub).toBeVisible({ timeout: 15000 });

    const firstSector = sectorHub
      .getByTestId("sector-grid")
      .locator("[data-testid^='sector-']")
      .first();
    await firstSector.hover();

    const tooltip = sectorHub.locator("[role='tooltip']").first();
    await expect(tooltip).toBeVisible({ timeout: 3000 });
  });

  test("should sort sectors when sort button is clicked (Req 23.12)", async ({
    page,
  }) => {
    const sectorHub = page.getByTestId("sector-hub");
    await expect(sectorHub).toBeVisible({ timeout: 15000 });

    await page.getByTestId("sort-name").click();

    // After sorting by name, first sector alphabetically should be first
    const firstSector = sectorHub
      .getByTestId("sector-grid")
      .locator("[data-testid^='sector-']")
      .first();
    const testId = await firstSector.getAttribute("data-testid");
    expect(testId).toBe("sector-Financial");
  });

  test("should show loading state before data arrives", async ({ page }) => {
    await page.route("**/api/market/sectors*", async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              sector: "Technology",
              performance: 2.1,
              changePercent: 1.2,
              constituents: 120,
            },
          ],
          timestamp: "2024-01-15T12:00:00.000Z",
        }),
      });
    });

    await page.goto("/sectors");
    const loading = page.getByTestId("sector-hub-loading");
    await expect(loading).toBeVisible({ timeout: 5000 });
  });
});
