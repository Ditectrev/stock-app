/**
 * E2E tests for Asset Screener
 * Tests filter selection, table view, heatmap view, preset selection,
 * custom preset saving, and state persistence.
 *
 * Requirements: 26.1, 26.9, 26.10, 26.12, 26.15, 26.23
 */

import { test, expect } from "./fixtures";

test.describe("Asset Screener", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // --- Screener visible on home page ---

  test("should display the Asset Screener section", async ({ page }) => {
    const hub = page.getByTestId("screener-hub");
    await expect(hub).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Asset Screener")).toBeVisible();
  });

  // --- Filter selection (Req 26.1) ---

  test("should display filter sections with valuation, growth, and dividend metrics", async ({
    page,
  }) => {
    const hub = page.getByTestId("screener-hub");
    await expect(hub).toBeVisible({ timeout: 15000 });

    await expect(page.getByText("Valuation Metrics")).toBeVisible();
    await expect(page.getByText("Growth Metrics")).toBeVisible();
    await expect(page.getByText("Dividend Metrics")).toBeVisible();
    await expect(page.getByText("P/E Ratio")).toBeVisible();
  });

  test("should display sector filter buttons", async ({ page }) => {
    const hub = page.getByTestId("screener-hub");
    await expect(hub).toBeVisible({ timeout: 15000 });

    await expect(page.getByText("Technology")).toBeVisible();
    await expect(page.getByText("Healthcare")).toBeVisible();
    await expect(page.getByText("Energy")).toBeVisible();
  });

  test("should toggle sector selection on click", async ({ page }) => {
    const hub = page.getByTestId("screener-hub");
    await expect(hub).toBeVisible({ timeout: 15000 });

    const techBtn = hub.getByText("Technology");
    await expect(techBtn).toHaveAttribute("aria-pressed", "false");

    await techBtn.click();
    await expect(techBtn).toHaveAttribute("aria-pressed", "true");

    await techBtn.click();
    await expect(techBtn).toHaveAttribute("aria-pressed", "false");
  });

  test("should accept numeric input in range filters", async ({ page }) => {
    const hub = page.getByTestId("screener-hub");
    await expect(hub).toBeVisible({ timeout: 15000 });

    const peMin = page.getByLabel("P/E Ratio minimum");
    await peMin.fill("10");
    await expect(peMin).toHaveValue("10");

    const peMax = page.getByLabel("P/E Ratio maximum");
    await peMax.fill("30");
    await expect(peMax).toHaveValue("30");
  });

  test("should show active filter count", async ({ page }) => {
    const hub = page.getByTestId("screener-hub");
    await expect(hub).toBeVisible({ timeout: 15000 });

    await page.getByLabel("P/E Ratio minimum").fill("5");
    await expect(hub.getByText("(1 filter active)")).toBeVisible();
  });

  // --- Apply Filters and Table view (Req 26.9) ---

  test("should display results in table view after applying filters", async ({
    page,
  }) => {
    const hub = page.getByTestId("screener-hub");
    await expect(hub).toBeVisible({ timeout: 15000 });

    await page.getByLabel("P/E Ratio minimum").fill("5");
    await hub.getByText("Apply Filters").click();

    // Wait for results — either a table or a "No results" message
    await expect(
      hub.locator("table, :text('No results'), :text('asset')").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("should display result count after search", async ({ page }) => {
    const hub = page.getByTestId("screener-hub");
    await expect(hub).toBeVisible({ timeout: 15000 });

    await hub.getByText("Apply Filters").click();

    await expect(hub.locator("text=/\\d+ assets? found/").first()).toBeVisible({
      timeout: 10000,
    });
  });

  // --- Table view is default (Req 26.9) ---

  test("should show Table tab as selected by default", async ({ page }) => {
    const hub = page.getByTestId("screener-hub");
    await expect(hub).toBeVisible({ timeout: 15000 });

    const tableTab = page.getByTestId("view-toggle-table");
    await expect(tableTab).toHaveAttribute("aria-selected", "true");

    const heatmapTab = page.getByTestId("view-toggle-heatmap");
    await expect(heatmapTab).toHaveAttribute("aria-selected", "false");
  });

  // --- Heatmap view toggle (Req 26.10) ---

  test("should switch to heatmap view when Heatmap tab is clicked", async ({
    page,
  }) => {
    const hub = page.getByTestId("screener-hub");
    await expect(hub).toBeVisible({ timeout: 15000 });

    // Apply filters first to get results
    await hub.getByText("Apply Filters").click();
    await page.waitForTimeout(1000);

    await page.getByTestId("view-toggle-heatmap").click();
    await expect(page.getByTestId("view-toggle-heatmap")).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.getByTestId("view-toggle-table")).toHaveAttribute(
      "aria-selected",
      "false"
    );
  });

  test("should switch back to table view", async ({ page }) => {
    const hub = page.getByTestId("screener-hub");
    await expect(hub).toBeVisible({ timeout: 15000 });

    await page.getByTestId("view-toggle-heatmap").click();
    await page.getByTestId("view-toggle-table").click();

    await expect(page.getByTestId("view-toggle-table")).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  // --- Preset selection (Req 26.12) ---

  test("should display screener presets", async ({ page }) => {
    const presets = page.getByTestId("screener-presets");
    await expect(presets).toBeVisible({ timeout: 15000 });
    await expect(presets.getByText("Presets:")).toBeVisible();
  });

  test("should load default presets from API", async ({ page }) => {
    const presets = page.getByTestId("screener-presets");
    await expect(presets).toBeVisible({ timeout: 15000 });

    // At least one preset button should be visible
    const presetsRow = page.getByTestId("presets-row");
    await expect(presetsRow).toBeVisible();
    const buttons = presetsRow.locator("button");
    await expect(buttons.first()).toBeVisible({ timeout: 5000 });
  });

  test("should highlight selected preset", async ({ page }) => {
    const presetsRow = page.getByTestId("presets-row");
    await expect(presetsRow).toBeVisible({ timeout: 15000 });

    const firstPreset = presetsRow.locator("button").first();
    await expect(firstPreset).toHaveAttribute("aria-pressed", "false");

    await firstPreset.click();
    await expect(firstPreset).toHaveAttribute("aria-pressed", "true");
  });

  // --- Custom preset saving (Req 26.15) ---

  test("should show save button disabled when no filters active", async ({
    page,
  }) => {
    const saveBtn = page.getByTestId("save-preset-btn");
    await expect(saveBtn).toBeVisible({ timeout: 15000 });
    await expect(saveBtn).toBeDisabled();
  });

  test("should enable save button when filters are active", async ({
    page,
  }) => {
    const hub = page.getByTestId("screener-hub");
    await expect(hub).toBeVisible({ timeout: 15000 });

    // Apply a filter first
    await page.getByLabel("P/E Ratio minimum").fill("10");
    await hub.getByText("Apply Filters").click();
    await page.waitForTimeout(1000);

    const saveBtn = page.getByTestId("save-preset-btn");
    await expect(saveBtn).toBeEnabled();
  });

  test("should open save form and save a custom preset", async ({ page }) => {
    const hub = page.getByTestId("screener-hub");
    await expect(hub).toBeVisible({ timeout: 15000 });

    // Set a filter and apply
    await page.getByLabel("P/E Ratio minimum").fill("10");
    await hub.getByText("Apply Filters").click();
    await page.waitForTimeout(1000);

    // Open save form
    await page.getByTestId("save-preset-btn").click();
    await expect(page.getByTestId("save-preset-form")).toBeVisible();

    // Fill in name and save
    await page.getByTestId("preset-name-input").fill("My E2E Preset");
    await page.getByTestId("preset-description-input").fill("Test preset");
    await page.getByTestId("save-preset-confirm").click();

    // Custom preset should appear in the list
    await expect(page.getByText("My E2E Preset")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should cancel save form without saving", async ({ page }) => {
    const hub = page.getByTestId("screener-hub");
    await expect(hub).toBeVisible({ timeout: 15000 });

    await page.getByLabel("P/E Ratio minimum").fill("10");
    await hub.getByText("Apply Filters").click();
    await page.waitForTimeout(1000);

    await page.getByTestId("save-preset-btn").click();
    await expect(page.getByTestId("save-preset-form")).toBeVisible();

    await page.getByTestId("save-preset-cancel").click();
    await expect(page.getByTestId("save-preset-form")).not.toBeVisible();
  });

  // --- State persistence (Req 26.23) ---

  test("should persist filters across page reload", async ({ page }) => {
    const hub = page.getByTestId("screener-hub");
    await expect(hub).toBeVisible({ timeout: 15000 });

    // Set filters and apply
    await page.getByLabel("P/E Ratio minimum").fill("15");
    await hub.getByText("Technology").click();
    await hub.getByText("Apply Filters").click();
    await page.waitForTimeout(1000);

    // Reload the page
    await page.reload();

    // Wait for screener to load
    await expect(hub).toBeVisible({ timeout: 15000 });

    // Filters should be restored from localStorage
    await expect(page.getByLabel("P/E Ratio minimum")).toHaveValue("15");
    await expect(hub.getByText("Technology")).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  // --- Clear All ---

  test("should clear all filters and results on Clear All", async ({
    page,
  }) => {
    const hub = page.getByTestId("screener-hub");
    await expect(hub).toBeVisible({ timeout: 15000 });

    await page.getByLabel("P/E Ratio minimum").fill("10");
    await hub.getByText("Technology").click();
    await hub.getByText("Apply Filters").click();
    await page.waitForTimeout(1000);

    await hub.getByText("Clear All").click();

    await expect(page.getByLabel("P/E Ratio minimum")).toHaveValue("");
    await expect(hub.getByText("Technology")).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });
});
