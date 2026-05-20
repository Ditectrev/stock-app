import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Lighthouse CI configuration", () => {
  it("should have a lighthouserc.js config file at the project root", () => {
    const configPath = path.resolve(__dirname, "../lighthouserc.js");
    expect(fs.existsSync(configPath)).toBe(true);
  });

  it("should assert performance score >= 0.8", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require("../lighthouserc.js");
    const perfAssertion = config.ci.assert.assertions["categories:performance"];
    expect(perfAssertion).toBeDefined();
    // assertion format: ["error", { minScore: 0.8 }]
    expect(perfAssertion[0]).toBe("error");
    expect(perfAssertion[1].minScore).toBeGreaterThanOrEqual(0.8);
  });

  it("should configure at least one URL to audit", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require("../lighthouserc.js");
    expect(config.ci.collect.url).toBeDefined();
    expect(config.ci.collect.url.length).toBeGreaterThan(0);
  });

  it("should use temporary-public-storage as upload target", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require("../lighthouserc.js");
    expect(config.ci.upload.target).toBe("temporary-public-storage");
  });

  it("should have a lighthouse script in package.json", () => {
    const pkgPath = path.resolve(__dirname, "../package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    expect(pkg.scripts.lighthouse).toBeDefined();
    expect(pkg.scripts.lighthouse).toContain("lhci");
  });

  it("should have @lhci/cli as a dev dependency", () => {
    const pkgPath = path.resolve(__dirname, "../package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    expect(pkg.devDependencies["@lhci/cli"]).toBeDefined();
  });
});

describe("Lighthouse-recommended meta tags in layout", () => {
  let layoutContent: string;

  beforeAll(() => {
    const layoutPath = path.resolve(__dirname, "../app/layout.tsx");
    layoutContent = fs.readFileSync(layoutPath, "utf-8");
  });

  it("should include a viewport meta tag", () => {
    expect(layoutContent).toContain('name="viewport"');
  });

  it("should include root metadata from site SEO helper", () => {
    expect(layoutContent).toContain("buildRootMetadata");
    const siteSeoPath = path.resolve(__dirname, "../lib/site-seo.ts");
    const siteSeoContent = fs.readFileSync(siteSeoPath, "utf-8");
    expect(siteSeoContent).toContain("description:");
    expect(siteSeoContent).toContain("DEFAULT_DESCRIPTION");
  });

  it("should include preconnect hints for external API domains", () => {
    expect(layoutContent).toContain('rel="preconnect"');
  });

  it("should include dns-prefetch hints for external API domains", () => {
    expect(layoutContent).toContain('rel="dns-prefetch"');
  });
});
