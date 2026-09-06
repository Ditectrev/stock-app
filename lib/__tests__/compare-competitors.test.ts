import { describe, expect, it } from "vitest";
import {
  COMPARISONS,
  comparisonPath,
  comparisonSitemapPaths,
  getCompetitor,
  listComparisons,
} from "@/lib/compare-competitors";
import { buildComparePageJsonLd, comparisonTitle } from "@/lib/compare-json-ld";

describe("compare competitors catalog", () => {
  it("has unique slugs", () => {
    const slugs = listComparisons().map((item) => item.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every related slug exists", () => {
    for (const item of COMPARISONS) {
      for (const related of item.relatedSlugs) {
        expect(getCompetitor(related), related).toBeDefined();
      }
    }
  });

  it("every page has a citeable verdict, table, and FAQ", () => {
    for (const item of COMPARISONS) {
      expect(item.verdict.split(" ").length).toBeGreaterThan(20);
      expect(item.features.length).toBeGreaterThanOrEqual(4);
      expect(item.faqs.length).toBeGreaterThanOrEqual(1);
      expect(item.theyWin.length).toBeGreaterThanOrEqual(2);
      expect(item.weWin.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("looks up finviz and openstock", () => {
    expect(getCompetitor("finviz")?.name).toBe("Finviz");
    expect(getCompetitor("openstock")?.alsoKnownAs).toContain(
      "OpenStock alternative"
    );
    expect(comparisonPath("yahoo-finance")).toBe("/compare/yahoo-finance");
  });

  it("includes hub and slug paths in the sitemap list", () => {
    const paths = comparisonSitemapPaths();
    expect(paths).toContain("/compare");
    expect(paths).toContain("/compare/tradingview");
    expect(paths.length).toBe(COMPARISONS.length + 1);
  });

  it("builds FAQ JSON-LD for a competitor page", () => {
    const finviz = getCompetitor("finviz");
    expect(finviz).toBeDefined();
    const jsonLd = buildComparePageJsonLd(finviz!);
    const types = jsonLd["@graph"].map(
      (node: { "@type": string }) => node["@type"]
    );
    expect(types).toContain("FAQPage");
    expect(types).toContain("WebPage");
    expect(comparisonTitle("Finviz")).toBe("The Open Stock vs Finviz");
  });
});
