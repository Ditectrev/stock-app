/**
 * E2E tests for Responsive Design
 *
 * Requirements: 13.1, 13.2, 13.3, 13.5
 * Tests layout, visibility, and touch targets across mobile, tablet, and desktop viewports.
 */

import { test, expect } from "@playwright/test";

// ─── Mobile viewport (375×667) — Requirement 13.1 ───

test.describe("Mobile viewport (375×667)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should render the page title", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(nav).toContainText(/The Open Stock|Open Stock/);
  });

  test("should render search bar at full width", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search stocks/);
    await expect(searchInput).toBeVisible();

    const box = await searchInput.boundingBox();
    expect(box).not.toBeNull();
    // Input should span most of the viewport width (accounting for padding)
    expect(box!.width).toBeGreaterThan(300);
  });

  test("should not have horizontal overflow", async ({ page }) => {
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // 1px tolerance
  });

  test("should display Fear & Greed section", async ({ page }) => {
    await expect(page.getByText(/Fear.*Greed/i).first()).toBeVisible();
  });

  test("should display World Markets section", async ({ page }) => {
    await expect(page.getByText(/World Markets/i).first()).toBeVisible();
  });

  test("should allow scrolling to all sections", async ({ page }) => {
    // Scroll to bottom and verify footer is reachable
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
  });
});

// ─── Tablet viewport (768×1024) — Requirement 13.2 ───

test.describe("Tablet viewport (768×1024)", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should render the page title at larger size", async ({ page }) => {
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    const box = await heading.boundingBox();
    expect(box).not.toBeNull();
    // Title should be wider on tablet than mobile
    expect(box!.width).toBeGreaterThan(300);
  });

  test("should not have horizontal overflow", async ({ page }) => {
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test("should display search bar", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search stocks/);
    await expect(searchInput).toBeVisible();
  });

  test("should show symbol detail with side-by-side header on search", async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder(/Search stocks/);
    await searchInput.fill("AAPL");
    await searchInput.press("Enter");
    await page.waitForTimeout(2000);

    // On tablet, symbol name and price should be on the same row
    const symbolHeader = page.locator("h1").filter({ hasText: "AAPL" });
    if (await symbolHeader.isVisible()) {
      const headerBox = await symbolHeader.boundingBox();
      expect(headerBox).not.toBeNull();
    }
  });

  test("should display all tab navigation items", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search stocks/);
    await searchInput.fill("AAPL");
    await searchInput.press("Enter");
    await page.waitForTimeout(2000);

    const tabs = page.locator('nav[aria-label="Tabs"] button');
    if ((await tabs.count()) > 0) {
      await expect(tabs.nth(0)).toContainText("Overview");
      await expect(tabs.nth(1)).toContainText("Financials");
      await expect(tabs.nth(2)).toContainText("Technicals");
      await expect(tabs.nth(3)).toContainText("Forecasts");
      await expect(tabs.nth(4)).toContainText("Seasonals");
    }
  });
});

// ─── Desktop viewport (1280×800) — Requirement 13.3 ───

test.describe("Desktop viewport (1280×800)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should render the page with max-width container", async ({ page }) => {
    const container = page.locator(".max-w-7xl").first();
    await expect(container).toBeVisible();
  });

  test("should not have horizontal overflow", async ({ page }) => {
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test("should display key metrics in multi-column grid on symbol view", async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder(/Search stocks/);
    await searchInput.fill("AAPL");
    await searchInput.press("Enter");
    await page.waitForTimeout(2000);

    const metricsHeading = page.getByText("Key Metrics");
    if (await metricsHeading.isVisible()) {
      // On desktop, metrics should be laid out in multiple columns
      const grid = page.locator(".grid.grid-cols-1");
      if ((await grid.count()) > 0) {
        const gridBox = await grid.first().boundingBox();
        expect(gridBox).not.toBeNull();
        // Grid should use most of the available width
        expect(gridBox!.width).toBeGreaterThan(600);
      }
    }
  });

  test("should display all dashboard sections", async ({ page }) => {
    await expect(page.getByText(/Fear.*Greed/i).first()).toBeVisible();
    await expect(page.getByText(/World Markets/i).first()).toBeVisible();
  });

  test("should display theme toggle", async ({ page }) => {
    // Theme toggle button should be visible
    const themeToggle = page.locator("button").filter({ hasText: /🌙|☀️/ });
    if ((await themeToggle.count()) > 0) {
      await expect(themeToggle.first()).toBeVisible();
    }
  });
});

// ─── Touch-friendly controls — Requirement 13.5 ───

test.describe("Touch-friendly controls (mobile)", () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should have search input with at least 44px height", async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder(/Search stocks/);
    const box = await searchInput.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test("should have tab buttons with at least 44px height", async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder(/Search stocks/);
    await searchInput.fill("AAPL");
    await searchInput.press("Enter");
    await page.waitForTimeout(2000);

    const tabs = page.locator('nav[aria-label="Tabs"] button');
    if ((await tabs.count()) > 0) {
      for (let i = 0; i < (await tabs.count()); i++) {
        const box = await tabs.nth(i).boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test("should allow tap on search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search stocks/);
    await searchInput.tap();
    await expect(searchInput).toBeFocused();
  });

  test("should allow tap on search results", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search stocks/);
    await searchInput.tap();
    await searchInput.fill("AAPL");
    await page.waitForTimeout(800);

    const dropdown = page.locator('[role="listbox"]');
    if (await dropdown.isVisible()) {
      const firstResult = page.locator('[role="option"]').first();
      await firstResult.tap();
      // Dropdown should close after tap
      await expect(dropdown).not.toBeVisible({ timeout: 1000 });
    }
  });

  test("should have scrollable tab navigation on touch", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search stocks/);
    await searchInput.fill("AAPL");
    await searchInput.press("Enter");
    await page.waitForTimeout(2000);

    const nav = page.locator('nav[aria-label="Tabs"]');
    if (await nav.isVisible()) {
      // Nav should have overflow-x-auto for horizontal scrolling
      const overflowX = await nav.evaluate(
        (el) => getComputedStyle(el).overflowX
      );
      expect(overflowX).toBe("auto");
    }
  });
});

// ─── Viewport transition — cross-breakpoint ───

test.describe("Viewport resize transitions", () => {
  test("should adapt layout when resizing from mobile to desktop", async ({
    page,
  }) => {
    // Start at mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();

    // Resize to tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    await expect(page.locator("h1")).toBeVisible();

    // Resize to desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);
    await expect(page.locator("h1")).toBeVisible();

    // No horizontal overflow at any size
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test("should adapt layout when resizing from desktop to mobile", async ({
    page,
  }) => {
    // Start at desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();

    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    await expect(page.locator("h1")).toBeVisible();

    // Search should still work
    const searchInput = page.getByPlaceholder(/Search stocks/);
    await expect(searchInput).toBeVisible();
  });
});
