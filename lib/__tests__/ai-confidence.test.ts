import { describe, expect, it } from "vitest";
import { scoreToConfidence } from "@/lib/ai-confidence";

describe("scoreToConfidence", () => {
  it("maps zero strength to 0%", () => {
    expect(scoreToConfidence(0)).toBe(0);
  });

  it("maps full strength to 100%", () => {
    expect(scoreToConfidence(1)).toBe(1);
    expect(scoreToConfidence(-1)).toBe(1);
  });

  it("scales linearly between 0 and maxStrength", () => {
    expect(scoreToConfidence(0.5)).toBe(0.5);
  });

  it("clamps values above maxStrength to 100%", () => {
    expect(scoreToConfidence(2, 1)).toBe(1);
  });
});
