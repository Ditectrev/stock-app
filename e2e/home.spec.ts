import { test, expect } from "./fixtures";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should render the main navigation bar", async ({ page }) => {
    const nav = page.locator("nav[aria-label='Main navigation']");
    await expect(nav).toBeVisible();
    await expect(nav).toContainText(/The Open Stock|Open Stock/);
  });

  test("should display navigation links for all sections", async ({ page }) => {
    const nav = page.locator("nav[aria-label='Main navigation']");
    await expect(nav.getByText("Home")).toBeVisible();
    await expect(nav.getByText("Sectors")).toBeVisible();
    await expect(nav.getByText("Calendars")).toBeVisible();
    await expect(nav.getByText("Heatmaps")).toBeVisible();
    await expect(nav.getByText("Screener")).toBeVisible();
  });

  test("should display quick link cards on the dashboard", async ({ page }) => {
    const home = page.locator("#section-home");
    await expect(home).toBeVisible();
    await expect(home.getByText("Compare sector performance")).toBeVisible();
    await expect(home.getByText("Visual market overview")).toBeVisible();
    await expect(home.getByText("Filter and find assets")).toBeVisible();
    await expect(home.getByText("Earnings, dividends & IPOs")).toBeVisible();
  });

  test("should display Fear & Greed gauge on the home page (Req 9.1)", async ({
    page,
  }) => {
    const gauge = page.getByTestId("fear-greed-gauge");
    await expect(gauge).toBeVisible({ timeout: 15000 });
  });

  test("should display World Markets section on the home page (Req 10.1)", async ({
    page,
  }) => {
    const worldMarkets = page.getByTestId("world-markets");
    await expect(worldMarkets).toBeVisible({ timeout: 15000 });
  });

  test("should navigate to the Sectors page when Sectors nav link is clicked", async ({
    page,
  }) => {
    const nav = page.locator("nav[aria-label='Main navigation']");
    await nav.getByText("Sectors").click();

    await expect(page).toHaveURL(/\/sectors$/);
    const sectorHub = page.getByTestId("sector-hub");
    await expect(sectorHub).toBeVisible({ timeout: 15000 });
  });

  test("should show symbol detail view when a symbol is searched", async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("AAPL");
    await searchInput.press("Enter");

    // Dashboard quick links should disappear
    await expect(page.getByText("Compare sector performance")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("should display the footer", async ({ page }) => {
    const footer = page.locator("footer[aria-label='Site footer']");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
  });
});
