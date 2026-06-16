import { describe, expect, it } from "vitest";
import {
  getMarketChartColors,
  marketChartAtmosphereGradient,
  marketChartSignedColor,
  marketSentimentGaugeColor,
  marketSentimentGaugeArcSegments,
  marketSentimentLegendRanges,
  MARKET_CHART_DOWN_LIGHT,
  MARKET_CHART_UP_LIGHT,
} from "@/lib/market-semantics";

describe("market chart colors", () => {
  it("uses emerald and rose hex values in light mode", () => {
    const colors = getMarketChartColors(false);
    expect(colors.up).toBe(MARKET_CHART_UP_LIGHT);
    expect(colors.down).toBe(MARKET_CHART_DOWN_LIGHT);
    expect(colors.series).toBe(MARKET_CHART_UP_LIGHT);
    expect(colors.up).not.toBe("#26a69a");
    expect(colors.down).not.toBe("#ef5350");
  });

  it("returns signed colors for volume and MACD histograms", () => {
    expect(marketChartSignedColor(true, false)).toBe(MARKET_CHART_UP_LIGHT);
    expect(marketChartSignedColor(false, true)).not.toBe(MARKET_CHART_UP_LIGHT);
  });

  it("uses performance-based signed palette for area and line charts", () => {
    const upArea = getMarketChartColors(false, {
      signed: true,
      isPositive: true,
      variant: "area",
    });
    const downArea = getMarketChartColors(false, {
      signed: true,
      isPositive: false,
      variant: "area",
    });
    const upLine = getMarketChartColors(false, {
      signed: true,
      isPositive: true,
      variant: "line",
    });

    expect(upArea.series).toBe(MARKET_CHART_UP_LIGHT);
    expect(downArea.series).toBe(MARKET_CHART_DOWN_LIGHT);
    expect(upArea.areaTop).toContain("0.55");
    expect(upLine.areaTop).toBe("transparent");
    expect(upLine.lineWidth).toBeGreaterThan(upArea.lineWidth);
  });

  it("exposes diagonal atmosphere gradients for chart backdrops", () => {
    expect(marketChartAtmosphereGradient(true, true)).toContain(
      "linear-gradient"
    );
    expect(marketChartAtmosphereGradient(false, true)).toContain("244, 63, 94");
  });

  it("maps fear and greed extremes to rose and emerald", () => {
    expect(marketSentimentGaugeColor(10, false)).toBe(MARKET_CHART_DOWN_LIGHT);
    expect(marketSentimentGaugeColor(90, false)).toBe(MARKET_CHART_UP_LIGHT);
    expect(marketSentimentGaugeColor(10, false)).not.toBe("#eab308");
  });

  it("uses stone neutral in legend swatches", () => {
    const neutral = marketSentimentLegendRanges(false).find(
      (r) => r.label === "Neutral"
    );
    expect(neutral?.color).toBe("#78716c");
    expect(neutral?.color).not.toBe("#eab308");
  });

  it("exposes arc segments from the same palette", () => {
    const segments = marketSentimentGaugeArcSegments(false);
    expect(segments).toHaveLength(5);
    expect(segments[2]?.color).toBe("#78716c");
  });
});
