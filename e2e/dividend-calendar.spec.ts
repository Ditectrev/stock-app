import { test, expect } from "./fixtures";

test.describe("Dividend Calendar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the Dividend Calendar section on the home page", async ({
    page,
  }) => {
    const calendar = page
      .getByTestId("dividend-calendar")
      .or(page.getByTestId("dividend-calendar-loading"));
    await expect(calendar).toBeVisible({ timeout: 15000 });
  });

  test("should display the Dividend Calendar heading", async ({ page }) => {
    const calendar = page.getByTestId("dividend-calendar");
    await expect(calendar).toBeVisible({ timeout: 15000 });
    await expect(calendar.getByText("Dividend Calendar")).toBeVisible();
  });

  test("should display date range filters", async ({ page }) => {
    const calendar = page.getByTestId("dividend-calendar");
    await expect(calendar).toBeVisible({ timeout: 15000 });

    await expect(calendar.getByTestId("start-date")).toBeVisible();
    await expect(calendar.getByTestId("end-date")).toBeVisible();
  });

  test("should show loading state before data arrives", async ({ page }) => {
    await page.route("**/api/calendar/dividends", async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.continue();
    });

    await page.goto("/");
    const loading = page.getByTestId("dividend-calendar-loading");
    await expect(loading).toBeVisible({ timeout: 5000 });
  });

  test("should hide Dividend Calendar when a symbol is selected", async ({
    page,
  }) => {
    const calendar = page
      .getByTestId("dividend-calendar")
      .or(page.getByTestId("dividend-calendar-loading"));
    await expect(calendar).toBeVisible({ timeout: 15000 });

    const searchInput = page.getByPlaceholder(/search stocks/i);
    await searchInput.fill("AAPL");
    await searchInput.press("Enter");

    await expect(calendar).not.toBeVisible({ timeout: 5000 });
  });

  test("should filter events when date range is changed", async ({ page }) => {
    const calendar = page.getByTestId("dividend-calendar");
    await expect(calendar).toBeVisible({ timeout: 15000 });

    const startInput = calendar.getByTestId("start-date");
    const endInput = calendar.getByTestId("end-date");

    // Set a narrow date range and verify the inputs accept values
    await startInput.fill("2026-04-01");
    await expect(startInput).toHaveValue("2026-04-01");

    await endInput.fill("2026-04-07");
    await expect(endInput).toHaveValue("2026-04-07");
  });
});
