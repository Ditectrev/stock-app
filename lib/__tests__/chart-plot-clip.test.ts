import { describe, expect, it } from "vitest";
import {
  computePlotClipPath,
  computePlotClipPathFromRatio,
  computePlotClipPathFromX,
  HIDDEN_PLOT_CLIP,
  revealRatio,
} from "@/lib/chart-plot-clip";

describe("revealRatio", () => {
  it("maps revealed count to 0–1", () => {
    expect(revealRatio(50, 100)).toBe(0.5);
    expect(revealRatio(0, 100)).toBe(0);
    expect(revealRatio(100, 100)).toBe(1);
  });
});

describe("computePlotClipPath", () => {
  it("returns hidden clip for zero reveal", () => {
    expect(computePlotClipPath(0, 100, null)).toBe(HIDDEN_PLOT_CLIP);
  });

  it("uses linear ratio polygon clip", () => {
    const plot = { clientWidth: 400 } as HTMLElement;
    expect(computePlotClipPath(50, 100, plot)).toBe(
      "polygon(0 0, 200px 0, 200px 100%, 0 100%)"
    );
    expect(computePlotClipPathFromRatio(0.5, plot)).toBe(
      "polygon(0 0, 200px 0, 200px 100%, 0 100%)"
    );
    expect(computePlotClipPathFromX(200, plot)).toBe(
      "polygon(0 0, 200px 0, 200px 100%, 0 100%)"
    );
  });
});
