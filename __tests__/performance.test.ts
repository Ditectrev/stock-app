import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

function readMainAppSources(): string {
  const root = path.resolve(__dirname, "../app/(main)");
  const files = [
    "home-page-client.tsx",
    "layout.tsx",
    "page.tsx",
    "sectors/page.tsx",
    "heatmaps/page.tsx",
    "screener/page.tsx",
    "calendars/page.tsx",
    "pricing/page.tsx",
  ];
  return files
    .map((f) => fs.readFileSync(path.join(root, f), "utf-8"))
    .join("\n");
}

describe("Bundle size limits (Req 15.5)", () => {
  it("should keep package.json dependencies count reasonable", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf-8")
    );
    const depCount = Object.keys(pkg.dependencies).length;
    // Keeping production dependencies lean reduces bundle size
    expect(depCount).toBeLessThanOrEqual(20);
  });

  it("should not include heavy utility libraries as production dependencies", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf-8")
    );
    const deps = Object.keys(pkg.dependencies);
    const heavyLibs = [
      "lodash",
      "moment",
      "moment-timezone",
      "jquery",
      "underscore",
      "rxjs",
    ];
    const found = deps.filter((d) => heavyLibs.includes(d));
    expect(found).toEqual([]);
  });

  it("should have @next/bundle-analyzer available for size auditing", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf-8")
    );
    expect(pkg.devDependencies["@next/bundle-analyzer"]).toBeDefined();
  });

  it("should have an analyze script in package.json", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf-8")
    );
    expect(pkg.scripts.analyze).toBeDefined();
    expect(pkg.scripts.analyze).toContain("ANALYZE=true");
  });

  it("should enable bundle analyzer only when ANALYZE env is set", async () => {
    const { default: nextConfig } = await import("../next.config");
    // In test env ANALYZE is not set, so the config should still be a valid object
    expect(nextConfig).toBeDefined();
    expect(typeof nextConfig).toBe("object");
  });
});

describe("Lazy loading behavior (Req 15.2)", () => {
  let pageSource: string;

  beforeAll(() => {
    pageSource = readMainAppSources();
  });

  const dynamicComponents = [
    "OverviewTab",
    "TechnicalIndicatorsDisplay",
    "ForecastDisplay",
    "SeasonalHeatmap",
    "FinancialsTable",
    "FearGreedGauge",
    "WorldMarkets",
    "SectorHub",
    "HeatmapHub",
    "ScreenerHub",
    "CalendarHub",
    "PricingPage",
    "Footer",
  ];

  it("should use next/dynamic for code splitting", () => {
    expect(pageSource).toContain('import dynamic from "next/dynamic"');
  });

  for (const component of dynamicComponents) {
    it(`should lazy-load ${component} via dynamic()`, () => {
      const pattern = new RegExp(`const\\s+${component}\\s*=\\s*dynamic\\(`);
      expect(pageSource).toMatch(pattern);
    });
  }

  it("should disable SSR for all dynamically imported components", () => {
    // Every dynamic() call should include ssr: false
    const dynamicCallCount = (pageSource.match(/=\s*dynamic\(/g) || []).length;
    const ssrFalseCount = (pageSource.match(/ssr:\s*false/g) || []).length;
    expect(ssrFalseCount).toBe(dynamicCallCount);
  });

  it("should provide a loading fallback for heavy dynamic components", () => {
    // All dynamic components except Footer should have a loading fallback
    const loadingCount = (pageSource.match(/loading:\s*\(\)\s*=>/g) || [])
      .length;
    const dynamicCount = (pageSource.match(/=\s*dynamic\(/g) || []).length;
    // Footer is lightweight and doesn't need a loading fallback
    expect(loadingCount).toBeGreaterThanOrEqual(dynamicCount - 1);
  });

  it("should not statically import any lazy-loaded component", () => {
    // Ensure none of the dynamically loaded components are also statically imported
    for (const component of dynamicComponents) {
      const staticImportPattern = new RegExp(
        `^import\\s+.*\\b${component}\\b.*from`,
        "m"
      );
      expect(pageSource).not.toMatch(staticImportPattern);
    }
  });

  it("should only statically import lightweight shell components", () => {
    // These are the small components that form the app shell and should load eagerly
    const staticImports = pageSource.match(
      /^import\s+\{[^}]+\}\s+from\s+"@\/components\/[^"]+"/gm
    );
    expect(staticImports).not.toBeNull();

    const allowedStatic = [
      "Navigation",
      "SearchBar",
      "ThemeToggle",
      "SymbolHeader",
      "TabNavigation",
      "LoadingSpinner",
      "AdBanner",
      "LazySection",
      "AIPredictionPanel",
      "HomeHub",
      "StockOfTheDayPanel",
    ];

    for (const imp of staticImports!) {
      const componentMatch = imp.match(/from\s+"@\/components\/(\w+)"/);
      if (componentMatch) {
        expect(allowedStatic).toContain(componentMatch[1]);
      }
    }
  });

  it("should defer heavy hubs with LazySection", () => {
    const lazySections = ["HeatmapHub", "ScreenerHub", "CalendarHub"];
    for (const component of lazySections) {
      const pattern = new RegExp(
        `<LazySection[^>]*>[\\s\\S]*?<${component}[\\s\\S]*?<\\/LazySection>`
      );
      expect(pageSource).toMatch(pattern);
    }
  });

  it("should use IntersectionObserver in LazySection for viewport-based loading", () => {
    const lazySectionSource = fs.readFileSync(
      path.resolve(__dirname, "../components/LazySection.tsx"),
      "utf-8"
    );
    expect(lazySectionSource).toContain("IntersectionObserver");
    expect(lazySectionSource).toContain("rootMargin");
  });
});

describe("Next.js performance configuration (Req 15.2, 15.5)", () => {
  it("should enable reactStrictMode", async () => {
    const { default: nextConfig } = await import("../next.config");
    expect(nextConfig.reactStrictMode).toBe(true);
  });

  it("should configure optimizePackageImports for heavy libraries", async () => {
    const { default: nextConfig } = await import("../next.config");
    const optimized = (nextConfig as Record<string, unknown>).experimental as
      | { optimizePackageImports?: string[] }
      | undefined;
    expect(optimized?.optimizePackageImports).toBeDefined();
    expect(optimized!.optimizePackageImports).toContain("lightweight-charts");
  });
});
