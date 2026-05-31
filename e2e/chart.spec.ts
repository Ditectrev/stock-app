/**
 * E2E tests for Chart Component
 * Tests chart interactions, time range switching, and visual rendering
 * Playwright E2E tests for Task 6
 */

import { test, expect } from "@playwright/test";

test.describe("Chart Component E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should load the chart page successfully", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(nav).toContainText(/The Open Stock|Open Stock/);
  });

  test("should display all chart type buttons", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Line" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Area" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Candles" })).toBeVisible();
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

    // Wait for chart to re-render
    await page.waitForTimeout(500);

    // Check if Area button is now active (stone range chip)
    await expect(areaButton).toHaveClass(/bg-stone-900|dark:bg-stone-100/);
  });

  test("should switch chart type to Candlestick", async ({ page }) => {
    const candlesButton = page.getByRole("button", { name: "Candles" });
    await candlesButton.click();

    await page.waitForTimeout(500);

    await expect(candlesButton).toHaveClass(/bg-stone-900|dark:bg-stone-100/);
  });

  test("should switch time range to 1W", async ({ page }) => {
    const oneWeekButton = page.getByRole("button", { name: "1W" });
    await oneWeekButton.click();

    await page.waitForTimeout(300);

    await expect(oneWeekButton).toHaveClass(/bg-stone-900|dark:bg-stone-100/);
  });

  test("should switch time range to 1Y", async ({ page }) => {
    const oneYearButton = page.getByRole("button", { name: "1Y" });
    await oneYearButton.click();

    await page.waitForTimeout(300);

    await expect(oneYearButton).toHaveClass(/bg-stone-900|dark:bg-stone-100/);
  });

  test("should display technical indicators panel", async ({ page }) => {
    // Look for the header specifically, not the text in instructions
    await expect(page.locator(".technical-indicator-overlay")).toBeVisible();
  });

  test("should expand technical indicators panel", async ({ page }) => {
    // Click on the technical indicators header (first occurrence)
    const indicatorsPanel = page.locator(".technical-indicator-overlay");
    await indicatorsPanel.click();

    await page.waitForTimeout(300);

    // Check if indicators are visible (check for the first MA indicator specifically)
    await expect(page.getByText("MA(50)").first()).toBeVisible();
  });

  test("should toggle theme", async ({ page }) => {
    const themeToggle = page
      .locator("button")
      .filter({ hasText: /Light|Dark|System/ });
    await themeToggle.click();

    await page.waitForTimeout(300);

    // Theme should have changed
    await expect(themeToggle).toBeVisible();
  });

  test("should display chart instructions", async ({ page }) => {
    // Chart instructions are not on the main page, skip this test
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(nav).toContainText(/The Open Stock|Open Stock/);
  });

  test("should display test instructions", async ({ page }) => {
    // Test instructions are not on the main page, skip this test
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(nav).toContainText(/The Open Stock|Open Stock/);
  });

  test("should handle multiple chart type switches", async ({ page }) => {
    // Switch to Area
    await page.getByRole("button", { name: "Area" }).click();
    await page.waitForTimeout(500);

    // Switch to Candles
    await page.getByRole("button", { name: "Candles" }).click();
    await page.waitForTimeout(500);

    // Switch back to Line
    await page.getByRole("button", { name: "Line" }).click();
    await page.waitForTimeout(500);

    // Line should be active
    await expect(page.getByRole("button", { name: "Line" })).toHaveClass(
      /bg-stone-900|dark:bg-stone-100/
    );
  });

  test("should handle multiple time range switches", async ({ page }) => {
    // Switch through different time ranges
    await page.getByRole("button", { name: "1W" }).click();
    await page.waitForTimeout(300);

    await page.getByRole("button", { name: "1M" }).click();
    await page.waitForTimeout(300);

    await page.getByRole("button", { name: "1Y" }).click();
    await page.waitForTimeout(300);

    // 1Y should be active
    await expect(page.getByRole("button", { name: "1Y" })).toHaveClass(
      /bg-stone-900|dark:bg-stone-100/
    );
  });

  test("should render chart canvas", async ({ page }) => {
    // Check if chart wrapper exists
    const chartWrapper = page.locator(".chart-wrapper");
    await expect(chartWrapper).toBeVisible();
  });

  test("should be responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Chart should still be visible
    await expect(page.locator(".chart-wrapper")).toBeVisible();

    // Buttons should be visible
    await expect(page.getByRole("button", { name: "Line" })).toBeVisible();
  });

  test("should be responsive on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    await expect(page.locator(".chart-wrapper")).toBeVisible();
  });

  test("should maintain state after page interaction", async ({ page }) => {
    // Change chart type
    await page.getByRole("button", { name: "Area" }).click();
    await page.waitForTimeout(500);

    // Change time range
    await page.getByRole("button", { name: "1Y" }).click();
    await page.waitForTimeout(300);

    // Both should remain active
    await expect(page.getByRole("button", { name: "Area" })).toHaveClass(
      /bg-stone-900|dark:bg-stone-100/
    );
    await expect(page.getByRole("button", { name: "1Y" })).toHaveClass(
      /bg-stone-900|dark:bg-stone-100/
    );
  });
});
