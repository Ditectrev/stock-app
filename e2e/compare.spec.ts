import { test, expect } from "./fixtures";

test.describe("Compare pages", () => {
  test("hub lists major competitors", async ({ page }) => {
    await page.goto("/compare");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /The Open Stock vs Finviz, TradingView, Yahoo Finance/i,
      })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /The Open Stock vs Finviz/i }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /The Open Stock vs OpenStock/i }).first()
    ).toBeVisible();
  });

  test("Finviz comparison is indexable and answers the query", async ({
    page,
  }) => {
    await page.goto("/compare/finviz");
    await expect(
      page.getByRole("heading", { level: 1, name: /The Open Stock vs Finviz/i })
    ).toBeVisible();
    await expect(page.getByText(/free Finviz alternative/i)).toBeVisible();
    await expect(
      page.getByRole("table", { name: /The Open Stock versus Finviz/i })
    ).toBeVisible();
    const jsonLdCount = await page
      .locator('script[type="application/ld+json"]')
      .count();
    expect(jsonLdCount).toBeGreaterThanOrEqual(2);
  });

  test("unknown slug returns 404", async ({ page }) => {
    const response = await page.goto("/compare/not-a-real-competitor");
    expect(response?.status()).toBe(404);
  });
});
