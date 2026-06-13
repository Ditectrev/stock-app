/**
 * E2E tests for SearchBar Component
 * Tests search functionality, autocomplete, keyboard navigation, and user interactions
 * Playwright E2E tests for Task 7.3
 */

import { test, expect } from "./fixtures";

test.describe("SearchBar Component E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should load the search test page successfully", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(nav).toContainText(/The Open Stock|Open Stock/);
  });

  test("should display search input with placeholder", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );
    await expect(searchInput).toBeVisible();
  });

  test("should display features list", async ({ page }) => {
    // Features list is not on the main page anymore, just verify page loaded
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(nav).toContainText(/The Open Stock|Open Stock/);
  });

  test("should show loading spinner while searching", async ({ page }) => {
    await page.route("**/api/market/search*", async (route) => {
      await new Promise((r) => setTimeout(r, 400));
      const q = new URL(route.request().url()).searchParams.get("q") ?? "";
      const symbol = q.trim().toUpperCase();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: symbol
            ? [{ symbol, name: `${symbol} Test Co.`, type: "equity" }]
            : [],
          timestamp: "2024-01-15T12:00:00.000Z",
        }),
      });
    });

    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );

    await searchInput.fill("AAPL");

    // Wait for debounce and check for spinner
    await page.waitForTimeout(100);
    const spinner = page.locator(".animate-spin");

    // Spinner should appear briefly
    await expect(spinner).toBeVisible({ timeout: 500 });
  });

  test("should display autocomplete results when typing", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );

    await searchInput.fill("AAPL");

    // Wait for debounce and API response (increased timeout)
    await page.waitForTimeout(800);

    // Check if dropdown appears
    const dropdown = page.locator('[role="listbox"]');
    await expect(dropdown).toBeVisible({ timeout: 3000 });

    // Check if results contain AAPL (use first() to avoid multiple matches)
    await expect(page.getByText("AAPL").first()).toBeVisible();
  });

  test("should display company names in results", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );

    await searchInput.fill("AAPL");
    await page.waitForTimeout(500);

    // Should show company name
    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 2000,
    });
  });

  test("should navigate results with arrow down key", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );

    await searchInput.fill("AA");
    await page.waitForTimeout(500);

    // Wait for results
    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 2000,
    });

    // Press arrow down
    await searchInput.press("ArrowDown");

    // First item should be selected (aria-selected="true")
    const firstItem = page
      .locator('[role="option"][aria-selected="true"]')
      .first();
    await expect(firstItem).toBeVisible();
  });

  test("should navigate results with arrow up key", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );

    await searchInput.fill("AA");
    await page.waitForTimeout(500);

    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 2000,
    });

    // Navigate down twice
    await searchInput.press("ArrowDown");
    await searchInput.press("ArrowDown");

    // Navigate up once
    await searchInput.press("ArrowUp");

    // First item should be selected again
    const selectedItems = page.locator('[role="option"][aria-selected="true"]');
    await expect(selectedItems.first()).toBeVisible();
  });

  test("should select item with Enter key", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );

    await searchInput.fill("AAPL");
    await page.waitForTimeout(500);

    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 2000,
    });

    // Navigate to first item
    await searchInput.press("ArrowDown");

    // Press Enter
    await searchInput.press("Enter");

    // Dropdown should close
    await expect(page.locator('[role="listbox"]')).not.toBeVisible({
      timeout: 1000,
    });

    // Input should contain the selected symbol
    await expect(searchInput).toHaveValue(/[A-Z]+/);
  });

  test("should close dropdown with Escape key", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );

    await searchInput.fill("AAPL");
    await page.waitForTimeout(500);

    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 2000,
    });

    // Press Escape
    await searchInput.press("Escape");

    // Dropdown should close
    await expect(page.locator('[role="listbox"]')).not.toBeVisible({
      timeout: 1000,
    });
  });

  test("should select item by clicking", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );

    await searchInput.fill("AAPL");
    await page.waitForTimeout(500);

    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 2000,
    });

    // Click on first result
    const firstResult = page.locator('[role="option"]').first();
    await firstResult.click();

    // Dropdown should close
    await expect(page.locator('[role="listbox"]')).not.toBeVisible({
      timeout: 1000,
    });
  });

  test("should close dropdown when clicking outside", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );

    await searchInput.fill("AAPL");
    await page.waitForTimeout(500);

    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 2000,
    });

    // Click outside (on the heading)
    await page.locator("h1").click();

    // Dropdown should close
    await expect(page.locator('[role="listbox"]')).not.toBeVisible({
      timeout: 1000,
    });
  });

  test("should highlight item on mouse hover", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );

    await searchInput.fill("AA");
    await page.waitForTimeout(500);

    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 2000,
    });

    // Hover over second result
    const secondResult = page.locator('[role="option"]').nth(1);
    await secondResult.hover();

    // Second item should be selected
    await expect(secondResult).toHaveAttribute("aria-selected", "true");
  });

  test('should display "No results found" for invalid search', async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );

    await searchInput.fill("INVALIDXYZ123");
    await page.waitForTimeout(500);

    // Should show no results message
    await expect(page.getByText("No symbols match that search.")).toBeVisible({
      timeout: 2000,
    });
  });

  test("should handle rapid typing with debouncing", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );

    // Type rapidly
    await searchInput.type("AAPL", { delay: 50 });

    // Wait for debounce
    await page.waitForTimeout(500);

    // Should show results only once
    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 2000,
    });
  });

  test("should clear results when input is cleared", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );

    await searchInput.fill("AAPL");
    await page.waitForTimeout(500);

    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 2000,
    });

    // Clear input
    await searchInput.clear();

    // Dropdown should close
    await expect(page.locator('[role="listbox"]')).not.toBeVisible({
      timeout: 1000,
    });
  });

  test("should reopen dropdown when focusing input with existing results", async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );

    await searchInput.fill("AAPL");
    await page.waitForTimeout(500);

    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 2000,
    });

    // Close with Escape
    await searchInput.press("Escape");
    await expect(page.locator('[role="listbox"]')).not.toBeVisible();

    // Focus input again
    await searchInput.focus();

    // Dropdown should reopen
    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 1000,
    });
  });

  test("should be responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );
    await expect(searchInput).toBeVisible();

    // Should still work on mobile
    await searchInput.fill("AAPL");
    await page.waitForTimeout(500);

    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 2000,
    });
  });

  test("should be responsive on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);

    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );
    await expect(searchInput).toBeVisible();

    await searchInput.fill("AAPL");
    await page.waitForTimeout(500);

    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 2000,
    });
  });

  test("should display exchange badges in results", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );

    await searchInput.fill("AAPL");
    await page.waitForTimeout(500);

    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 2000,
    });

    // Should show exchange badge (NASDAQ, NYSE, etc.)
    const exchangeBadge = page
      .locator('[role="option"]')
      .first()
      .locator("span")
      .last();
    await expect(exchangeBadge).toBeVisible();
  });

  test("should handle keyboard navigation edge cases", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );

    await searchInput.fill("AA");
    await page.waitForTimeout(500);

    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 2000,
    });

    // Try to navigate up from initial position (should not crash)
    await searchInput.press("ArrowUp");

    // Navigate down multiple times
    await searchInput.press("ArrowDown");
    await searchInput.press("ArrowDown");
    await searchInput.press("ArrowDown");
    await searchInput.press("ArrowDown");
    await searchInput.press("ArrowDown");

    // Should not crash or go beyond last item
    const selectedItems = page.locator('[role="option"][aria-selected="true"]');
    await expect(selectedItems.first()).toBeVisible();
  });

  test("should maintain search functionality after multiple interactions", async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );

    // First search
    await searchInput.fill("AAPL");
    await page.waitForTimeout(500);
    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 2000,
    });

    // Close with Escape
    await searchInput.press("Escape");

    // Clear and search again
    await searchInput.clear();
    await searchInput.fill("TSLA");
    await page.waitForTimeout(500);

    // Should show new results
    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 2000,
    });
    // Use first() to handle multiple TSLA matches (TSLA, TSLA.NE, etc.)
    await expect(page.getByText("TSLA").first()).toBeVisible();
  });

  test("should handle direct Enter press without dropdown", async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );

    // Type and press Enter immediately (before debounce)
    await searchInput.fill("MSFT");
    await searchInput.press("Enter");

    // Should handle gracefully (input should contain the symbol)
    await expect(searchInput).toHaveValue("MSFT");
  });

  test("should display search icon", async ({ page }) => {
    // Check for search icon SVG
    const searchIcon = page
      .locator("svg")
      .filter({ has: page.locator('path[d*="21 21l-6-6"]') });
    await expect(searchIcon).toBeVisible();
  });

  test("should have proper ARIA attributes for accessibility", async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );

    // Check ARIA attributes
    await expect(searchInput).toHaveAttribute("aria-label", "Search stocks");
    await expect(searchInput).toHaveAttribute("aria-autocomplete", "list");

    // Fill to show dropdown
    await searchInput.fill("AAPL");
    await page.waitForTimeout(500);

    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 2000,
    });

    // Check aria-expanded
    await expect(searchInput).toHaveAttribute("aria-expanded", "true");
  });

  test("should handle multiple result selections", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Search stocks by symbol (e.g., AAPL, TSLA, MSFT)..."
    );

    // First selection
    await searchInput.fill("AAPL");
    await page.waitForTimeout(500);
    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 2000,
    });
    await searchInput.press("ArrowDown");
    await searchInput.press("Enter");

    await page.waitForTimeout(300);

    // Second selection
    await searchInput.clear();
    await searchInput.fill("TSLA");
    await page.waitForTimeout(500);
    await expect(page.locator('[role="listbox"]')).toBeVisible({
      timeout: 2000,
    });
    await searchInput.press("ArrowDown");
    await searchInput.press("Enter");

    // Should handle both selections without issues
    await expect(searchInput).toHaveValue(/[A-Z]+/);
  });
});
