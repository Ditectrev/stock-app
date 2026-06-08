import { test, expect } from "./fixtures";

/**
 * Error Handling & Loading States — E2E Tests
 *
 * Validates loading indicators (Req 14.1), error messages (Req 14.2),
 * symbol-not-found (Req 14.3), connectivity errors (Req 14.4),
 * and retry functionality (Req 14.5) in the running application.
 */

test.describe("Error Handling & Loading States", () => {
  // ---------------------------------------------------------------------------
  // Req 14.1 — Loading indicators
  // ---------------------------------------------------------------------------
  test.describe("Req 14.1: Loading indicators", () => {
    test("should show component-level loading spinners on initial load", async ({
      page,
    }) => {
      // Block all API calls so the page stays in loading state
      await page.route("**/*", async (route) => {
        const url = route.request().url();
        // Let the page itself load, but block API calls
        if (url.includes("/api/")) {
          await new Promise((r) => setTimeout(r, 5000));
          await route.continue();
        } else {
          await route.continue();
        }
      });

      await page.goto("/");
      // Individual dashboard sections show their own loading spinners (Req 14.1)
      await expect(page.getByText("Loading Fear & Greed...")).toBeVisible({
        timeout: 5000,
      });
    });

    test("should show loading spinner for Fear & Greed while data is fetched", async ({
      page,
    }) => {
      await page.route("**/api/market/fear-greed*", async (route) => {
        await new Promise((r) => setTimeout(r, 3000));
        await route.continue();
      });

      await page.goto("/");
      await expect(page.getByTestId("fear-greed-loading")).toBeVisible({
        timeout: 5000,
      });
    });

    test("should show loading spinner for World Markets while data is fetched", async ({
      page,
    }) => {
      await page.route("**/api/market/world-markets*", async (route) => {
        await new Promise((r) => setTimeout(r, 3000));
        await route.continue();
      });

      await page.goto("/");
      await expect(page.getByTestId("world-markets-loading")).toBeVisible({
        timeout: 5000,
      });
    });

    test("should show loading spinner for Sector Hub while data is fetched", async ({
      page,
    }) => {
      await page.route("**/api/market/sectors*", async (route) => {
        await new Promise((r) => setTimeout(r, 3000));
        await route.continue();
      });

      await page.goto("/");
      await expect(page.getByTestId("sector-hub-loading")).toBeVisible({
        timeout: 5000,
      });
    });

    test("should show loading spinner when fetching symbol data", async ({
      page,
    }) => {
      await page.route("**/api/market/symbol/**", async (route) => {
        await new Promise((r) => setTimeout(r, 3000));
        await route.continue();
      });

      await page.goto("/");
      const searchInput = page.getByPlaceholder(/search stocks/i);
      await searchInput.fill("AAPL");
      await searchInput.press("Enter");

      await expect(page.getByTestId("loading-spinner")).toBeVisible({
        timeout: 5000,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Req 14.2 — User-friendly error messages for API failures
  // ---------------------------------------------------------------------------
  test.describe("Req 14.2: Error messages on API failure", () => {
    test("should show error message when Fear & Greed API fails", async ({
      page,
    }) => {
      await page.route("**/api/market/fear-greed*", (route) =>
        route.fulfill({ status: 500, body: "Internal Server Error" })
      );

      await page.goto("/");
      await expect(page.getByTestId("fear-greed-error")).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.getByTestId("fear-greed-error").getByTestId("error-message")
      ).toBeVisible();
    });

    test("should show error message when World Markets API fails", async ({
      page,
    }) => {
      await page.route("**/api/market/world-markets*", (route) =>
        route.fulfill({ status: 500, body: "Internal Server Error" })
      );

      await page.goto("/");
      await expect(page.getByTestId("world-markets-error")).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.getByTestId("world-markets-error").getByTestId("error-message")
      ).toBeVisible();
    });

    test("should show error message when Sectors API fails", async ({
      page,
    }) => {
      await page.route("**/api/market/sectors*", (route) =>
        route.fulfill({ status: 500, body: "Internal Server Error" })
      );

      await page.goto("/");
      await expect(page.getByTestId("sector-hub-error")).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.getByTestId("sector-hub-error").getByTestId("error-message")
      ).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Req 14.3 — "Symbol not found" message
  // ---------------------------------------------------------------------------
  test.describe("Req 14.3: Symbol not found", () => {
    test("should show error when an invalid symbol is searched", async ({
      page,
    }) => {
      await page.route("**/api/market/symbol/**", (route) =>
        route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ success: false, error: "Symbol not found" }),
        })
      );

      await page.goto("/");
      const searchInput = page.getByPlaceholder(/search stocks/i);
      await searchInput.fill("ZZZZZ");
      await searchInput.press("Enter");

      // The home page shows an error block for symbol loading failures
      await expect(page.getByText("Error Loading Symbol")).toBeVisible({
        timeout: 10000,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Req 14.4 — Connectivity error
  // ---------------------------------------------------------------------------
  test.describe("Req 14.4: Connectivity errors", () => {
    test("should show error when network request is aborted", async ({
      page,
    }) => {
      await page.route("**/api/market/fear-greed*", (route) => route.abort());

      await page.goto("/");
      await expect(page.getByTestId("fear-greed-error")).toBeVisible({
        timeout: 10000,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Req 14.5 — Retry functionality
  // ---------------------------------------------------------------------------
  test.describe("Req 14.5: Retry functionality", () => {
    test("Fear & Greed: retry button re-fetches and recovers", async ({
      page,
    }) => {
      // First request fails
      await page.route("**/api/market/fear-greed*", (route) =>
        route.fulfill({ status: 500, body: "Internal Server Error" })
      );

      await page.goto("/");
      await expect(page.getByTestId("fear-greed-error")).toBeVisible({
        timeout: 10000,
      });

      const retryButton = page
        .getByTestId("fear-greed-error")
        .getByText("Try again");
      await expect(retryButton).toBeVisible();

      // Unroute so the next request hits the real server
      await page.unroute("**/api/market/fear-greed*");

      await retryButton.click();

      // Should recover and show the gauge
      await expect(page.getByTestId("fear-greed-gauge")).toBeVisible({
        timeout: 15000,
      });
    });

    test("World Markets: retry button re-fetches and recovers", async ({
      page,
    }) => {
      await page.route("**/api/market/world-markets*", (route) =>
        route.fulfill({ status: 500, body: "Internal Server Error" })
      );

      await page.goto("/");
      await expect(page.getByTestId("world-markets-error")).toBeVisible({
        timeout: 10000,
      });

      const retryButton = page
        .getByTestId("world-markets-error")
        .getByText("Try again");
      await expect(retryButton).toBeVisible();

      await page.unroute("**/api/market/world-markets*");

      await retryButton.click();

      await expect(page.getByTestId("world-markets")).toBeVisible({
        timeout: 15000,
      });
    });

    test("Sector Hub: retry button re-fetches and recovers", async ({
      page,
    }) => {
      await page.route("**/api/market/sectors*", (route) =>
        route.fulfill({ status: 500, body: "Internal Server Error" })
      );

      await page.goto("/");
      await expect(page.getByTestId("sector-hub-error")).toBeVisible({
        timeout: 10000,
      });

      const retryButton = page
        .getByTestId("sector-hub-error")
        .getByText("Try again");
      await expect(retryButton).toBeVisible();

      await page.unroute("**/api/market/sectors*");

      await retryButton.click();

      await expect(page.getByTestId("sector-hub")).toBeVisible({
        timeout: 15000,
      });
    });
  });
});
