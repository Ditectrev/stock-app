import { describe, expect, it } from "vitest";
import {
  isValidMarketSymbol,
  normalizeMarketSymbol,
} from "@/lib/market-symbol";

describe("market-symbol", () => {
  it("normalizes valid symbols", () => {
    expect(normalizeMarketSymbol(" aapl ")).toBe("AAPL");
    expect(normalizeMarketSymbol("brk.b")).toBe("BRK.B");
  });

  it("rejects empty or invalid symbols", () => {
    expect(normalizeMarketSymbol("")).toBeNull();
    expect(normalizeMarketSymbol("   ")).toBeNull();
    expect(normalizeMarketSymbol(null)).toBeNull();
    expect(normalizeMarketSymbol("AAPL;DROP")).toBeNull();
    expect(normalizeMarketSymbol("../etc")).toBeNull();
  });

  it("validates symbol pattern", () => {
    expect(isValidMarketSymbol("AAPL")).toBe(true);
    expect(isValidMarketSymbol("")).toBe(false);
  });
});
