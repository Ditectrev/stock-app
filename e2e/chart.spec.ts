/**
 * E2E tests for Chart Component
 * Tests chart interactions, time range switching, and visual rendering
 */

import { test, expect } from "./fixtures";
import { selectSymbol } from "./helpers";

test.describe("Chart Component E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await selectSymbol(page, "AAPL");
  });

  test("should load the chart page successfully", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(nav).toContainText(/The Open Stock|Open Stock/);
    await expect(page.getByTestId("price-chart-panel")).toBeVisible();
  });

  test("should display all chart type buttons", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Area" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Candles" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Line" })).toHaveCount(0);
  });

  test("should display all time range buttons", async ({ page }) => {
    await expect(page.getByRole("button", { name: "1D" })).toBeVisible();
    await expect(page.getByRole("button", { name: "1W" })).toBeVisible();
    await expect(page.getByRole("button", { name: "1M" })).toBeVisible();
    await expect(page.getByRole("button", { name: "3M" })).toBeVisible();
    await expect(page.getByRole("button", { name: "1Y" })).toBeVisible();
    await expect(page.getByRole("button", { name: "5Y" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Max" })).toBeVisible();
  });

  test("should switch chart type to Area", async ({ page }) => {
    const areaButton = page.getByRole("button", { name: "Area" });
    await areaButton.click();
    await expect(areaButton).toHaveClass(/bg-stone-900|dark:bg-stone-100/);
  });

  test("should switch chart type to Candlestick", async ({ page }) => {
    const candlesButton = page.getByRole("button", { name: "Candles" });
    await candlesButton.click();
    await expect(candlesButton).toHaveClass(/bg-stone-900|dark:bg-stone-100/);
  });

  test("should switch time range to 1W", async ({ page }) => {
    const oneWeekButton = page.getByRole("button", { name: "1W" });
    await oneWeekButton.click();
    await expect(oneWeekButton).toHaveClass(/bg-stone-900|dark:bg-stone-100/);
  });

  test("should switch time range to 1Y", async ({ page }) => {
    const oneYearButton = page.getByRole("button", { name: "1Y" });
    await oneYearButton.click();
    await expect(oneYearButton).toHaveClass(/bg-stone-900|dark:bg-stone-100/);
  });

  test("should display chart section heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Chart" })).toBeVisible();
    await expect(page.getByText(/Price trend/i)).toBeVisible();
  });

  test("should display chart instructions", async ({ page }) => {
    await expect(
      page.getByText(/Use mouse wheel to zoom, drag to pan, hover for details/)
    ).toBeVisible();
  });

  test("should handle multiple chart type switches", async ({ page }) => {
    await page.getByRole("button", { name: "Area" }).click();
    await page.getByRole("button", { name: "Candles" }).click();
    await page.getByRole("button", { name: "Area" }).click();

    await expect(page.getByRole("button", { name: "Area" })).toHaveClass(
      /bg-stone-900|dark:bg-stone-100/
    );
  });

  test("should handle multiple time range switches", async ({ page }) => {
    await page.getByRole("button", { name: "1W" }).click();
    await page.getByRole("button", { name: "1M" }).click();
    await page.getByRole("button", { name: "1Y" }).click();

    await expect(page.getByRole("button", { name: "1Y" })).toHaveClass(
      /bg-stone-900|dark:bg-stone-100/
    );
  });

  test("should render chart canvas", async ({ page }) => {
    await expect(page.locator(".chart-wrapper")).toBeVisible();
  });

  test("should be responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator(".chart-wrapper")).toBeVisible();
    await expect(page.getByRole("button", { name: "Area" })).toBeVisible();
  });

  test("should be responsive on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator(".chart-wrapper")).toBeVisible();
  });

  test("should maintain state after page interaction", async ({ page }) => {
    await page.getByRole("button", { name: "Area" }).click();
    await page.getByRole("button", { name: "1Y" }).click();

    await expect(page.getByRole("button", { name: "Area" })).toHaveClass(
      /bg-stone-900|dark:bg-stone-100/
    );
    await expect(page.getByRole("button", { name: "1Y" })).toHaveClass(
      /bg-stone-900|dark:bg-stone-100/
    );
  });
});
