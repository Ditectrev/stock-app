import { expect, type Page } from "@playwright/test";

/** Search for a symbol and wait until the overview chart is ready. */
export async function selectSymbol(page: Page, symbol: string) {
  const searchInput = page.getByPlaceholder(/search stocks/i);
  await searchInput.fill(symbol);
  await searchInput.press("Enter");

  await expect(
    page.getByRole("heading", { level: 1, name: symbol })
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("price-chart-panel")).toBeVisible({
    timeout: 15000,
  });
}

/** Wait until chart trail reveal and load splash finish (stable for screenshots). */
export async function waitForChartReveal(page: Page) {
  const panel = page.getByTestId("price-chart-panel");
  await expect(panel).toBeVisible({ timeout: 15000 });
  await expect(panel.locator(".chart-sparkle-sweep--loading")).toHaveCount(0, {
    timeout: 15000,
  });
}
