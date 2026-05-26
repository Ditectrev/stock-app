import { describe, expect, it } from "vitest";
import {
  AI_PREDICTION_FACTOR_IDS,
  buildAIPredictionPrompt,
  explainAIPredictionParseFailure,
  parseAIPredictionFromJson,
  parseAIPredictionFromModelText,
} from "@/lib/ai-prediction";

function validPayload() {
  const factors = Object.fromEntries(
    AI_PREDICTION_FACTOR_IDS.map((id) => [
      id,
      [`${id} point one`, `${id} point two`],
    ])
  );

  return {
    recommendation: "buy",
    confidence: 0.72,
    summary:
      "The setup favors accumulation with balanced risk/reward near current levels.",
    ...factors,
    symbolSpecific: null,
  };
}

describe("parseAIPredictionFromJson", () => {
  it("accepts a valid hybrid-taxonomy payload", () => {
    const parsed = parseAIPredictionFromJson(validPayload());
    expect(parsed).not.toBeNull();
    expect(parsed?.recommendation).toBe("buy");
    expect(parsed?.confidence).toBe(0.72);
    expect(parsed?.factors.risks).toHaveLength(2);
    expect(parsed?.symbolSpecific).toBeNull();
  });

  it("normalizes recommendation aliases and percent confidence", () => {
    const parsed = parseAIPredictionFromJson({
      ...validPayload(),
      recommendation: "bullish",
      confidence: 65,
    });
    expect(parsed?.recommendation).toBe("buy");
    expect(parsed?.confidence).toBe(0.65);
  });

  it("parses optional symbolSpecific section", () => {
    const parsed = parseAIPredictionFromJson({
      ...validPayload(),
      symbolSpecific: {
        title: "Earnings catalyst",
        bullets: ["Guidance risk", "Margin pressure"],
      },
    });
    expect(parsed?.symbolSpecific?.title).toBe("Earnings catalyst");
    expect(parsed?.symbolSpecific?.bullets).toHaveLength(2);
  });

  it("rejects payloads missing required factor arrays", () => {
    const incomplete = { ...validPayload() };
    delete (incomplete as Record<string, unknown>).risks;
    expect(parseAIPredictionFromJson(incomplete)).toBeNull();
  });

  it("accepts a single bullet per section for smaller models", () => {
    const parsed = parseAIPredictionFromJson({
      ...validPayload(),
      technical: ["only one"],
    });
    expect(parsed?.factors.technical).toEqual(["only one"]);
  });

  it("maps legacy factor keys to the hybrid taxonomy", () => {
    const payload = validPayload();
    const parsed = parseAIPredictionFromJson({
      recommendation: payload.recommendation,
      confidence: payload.confidence,
      summary: payload.summary,
      politicalFactors: ["policy risk", "rates"],
      financialTrendFactors: ["target gap", "ratings mix"],
      geopoliticalFactors: ["EU weak", "Asia mixed"],
      riskFactors: ["headline risk", "liquidity"],
      technical: payload.technical,
      sentiment: payload.sentiment,
      symbolSpecific: null,
    });
    expect(parsed?.factors.macro).toHaveLength(2);
    expect(parsed?.factors.risks).toHaveLength(2);
  });
});

describe("parseAIPredictionFromModelText", () => {
  it("extracts JSON from markdown fences", () => {
    const raw = "```json\n" + JSON.stringify(validPayload()) + "\n```";
    expect(parseAIPredictionFromModelText(raw)?.recommendation).toBe("buy");
  });

  it("repairs truncated JSON missing closing braces", () => {
    const partial =
      '{"recommendation":"hold","confidence":0.8,"summary":"Neutral stance with mixed signals.","technical":["RSI fair","MA trend flat"]';
    expect(parseAIPredictionFromModelText(partial)).toBeNull();
    expect(explainAIPredictionParseFailure(partial)).toContain("valuation");
  });
});

describe("explainAIPredictionParseFailure", () => {
  it("names missing factor arrays", () => {
    const message = explainAIPredictionParseFailure(
      JSON.stringify({
        recommendation: "hold",
        confidence: 0.8,
        summary: "Neutral stance with mixed signals across factors.",
        technical: ["a", "b"],
      })
    );
    expect(message).toContain("valuation");
  });
});

describe("buildAIPredictionPrompt", () => {
  it("includes fixed factor ids and market snapshot fields", () => {
    const prompt = buildAIPredictionPrompt({
      symbol: "AAPL",
      assetType: "stock",
      quote: {
        name: "Apple Inc.",
        price: 190,
        changePercent: 1.2,
        marketCap: 3e12,
        fiftyTwoWeekHigh: 200,
        fiftyTwoWeekLow: 150,
      },
      indicators: {
        rsi: 55,
        rsiSignal: "fair",
        macdHistogram: 0.1,
        macdTrend: "fair",
        overallSentiment: "fair",
        ma50: 180,
        ma200: 170,
      },
      forecast: {
        averageTarget: 200,
        lowTarget: 180,
        highTarget: 220,
        strongBuy: 5,
        buy: 10,
        hold: 8,
        sell: 2,
        strongSell: 0,
      },
      fearGreed: { value: 50, label: "Neutral" },
      worldMarkets: [{ region: "US", changePercent: 0.5 }],
    });

    expect(prompt).toContain('"technical"');
    expect(prompt).toContain('"risks"');
    expect(prompt).toContain("symbol: AAPL");
    expect(prompt).toContain("US: +0.50%");
  });
});
