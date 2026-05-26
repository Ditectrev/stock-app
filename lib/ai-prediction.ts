import { extractFirstJsonObject } from "@/lib/stock-of-the-day-ai";
import type { AIPredictionFactors, AIPredictionReport } from "@/types";

/** Default BYOK `max_tokens` (512) truncates structured prediction JSON. */
export const AI_PREDICTION_MAX_OUTPUT_TOKENS = 4096;

export const AI_PREDICTION_FACTOR_IDS = [
  "technical",
  "valuation",
  "sentiment",
  "macro",
  "globalMarkets",
  "risks",
] as const;

export type AIPredictionFactorId = (typeof AI_PREDICTION_FACTOR_IDS)[number];

export const AI_PREDICTION_SECTIONS: ReadonlyArray<{
  id: AIPredictionFactorId;
  label: string;
}> = [
  { id: "technical", label: "Technical setup" },
  { id: "valuation", label: "Valuation & analyst consensus" },
  { id: "sentiment", label: "Market sentiment" },
  { id: "macro", label: "Macro & policy" },
  { id: "globalMarkets", label: "Global markets" },
  { id: "risks", label: "Key risks" },
];

const MIN_BULLETS = 2;
const MAX_BULLETS = 4;

export type AIPredictionMarketSnapshot = {
  symbol: string;
  assetType: AIPredictionReport["assetType"];
  quote: {
    name: string;
    price: number;
    changePercent: number;
    marketCap: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
  };
  indicators: {
    rsi: number;
    rsiSignal: string;
    macdHistogram: number;
    macdTrend: string;
    overallSentiment: string;
    ma50: number;
    ma200: number;
  };
  forecast: {
    averageTarget: number;
    lowTarget: number;
    highTarget: number;
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  };
  fearGreed: { value: number; label: string };
  worldMarkets: Array<{ region: string; changePercent: number }>;
};

export function buildAIPredictionPrompt(
  snapshot: AIPredictionMarketSnapshot
): string {
  const targetUpside =
    snapshot.quote.price > 0
      ? (
          ((snapshot.forecast.averageTarget - snapshot.quote.price) /
            snapshot.quote.price) *
          100
        ).toFixed(1)
      : "N/A";

  const worldLines =
    snapshot.worldMarkets.length > 0
      ? snapshot.worldMarkets
          .map(
            (m) =>
              `- ${m.region}: ${m.changePercent >= 0 ? "+" : ""}${m.changePercent.toFixed(2)}%`
          )
          .join("\n")
      : "- No regional index data available";

  return `You are a senior equity analyst producing a premium AI prediction for a single symbol.
Return ONLY valid JSON (no markdown, no commentary) in this exact shape:
{
  "recommendation": "buy" | "hold" | "sell",
  "confidence": number,
  "summary": string,
  "technical": string[],
  "valuation": string[],
  "sentiment": string[],
  "macro": string[],
  "globalMarkets": string[],
  "risks": string[],
  "symbolSpecific": { "title": string, "bullets": string[] } | null
}

Task:
- Choose recommendation (buy/hold/sell) and confidence (0.0–1.0) from the market snapshot below.
- confidence reflects conviction in the stance (not probability of profit).
- summary: 2–3 sentences explaining the stance; you may use buy/hold/sell wording.
- Each fixed factor array (technical, valuation, sentiment, macro, globalMarkets, risks): ${MIN_BULLETS}–${MAX_BULLETS} concise bullets grounded in the inputs. Do not invent precise prices or dates not implied by the data.
- symbolSpecific: optional extra section only when there is a clear symbol-specific catalyst; otherwise null. If set, title is a short heading and bullets are 1–3 items.

Factor taxonomy (fixed labels — you only fill bullets):
- technical: price action, indicators, trend
- valuation: analyst targets, ratings, relative value
- sentiment: fear/greed, positioning, flow tone
- macro: rates, policy, inflation, regulation
- globalMarkets: regional indices and cross-market context
- risks: downside scenarios and what could invalidate the call

Market snapshot:
symbol: ${snapshot.symbol}
assetType: ${snapshot.assetType}
name: ${snapshot.quote.name}
price: ${snapshot.quote.price}
changePercent: ${snapshot.quote.changePercent}
marketCap: ${snapshot.quote.marketCap}
52wHigh: ${snapshot.quote.fiftyTwoWeekHigh}
52wLow: ${snapshot.quote.fiftyTwoWeekLow}

Technical:
- RSI: ${snapshot.indicators.rsi.toFixed(1)} (${snapshot.indicators.rsiSignal})
- MACD histogram: ${snapshot.indicators.macdHistogram.toFixed(4)} (trend: ${snapshot.indicators.macdTrend})
- MA50/MA200: ${snapshot.indicators.ma50}/${snapshot.indicators.ma200}
- Overall sentiment: ${snapshot.indicators.overallSentiment}

Valuation:
- Targets low/avg/high: ${snapshot.forecast.lowTarget}/${snapshot.forecast.averageTarget}/${snapshot.forecast.highTarget}
- Implied upside to avg target: ${targetUpside}%
- Ratings strongBuy/buy/hold/sell/strongSell: ${snapshot.forecast.strongBuy}/${snapshot.forecast.buy}/${snapshot.forecast.hold}/${snapshot.forecast.sell}/${snapshot.forecast.strongSell}

Sentiment:
- Fear & Greed: ${snapshot.fearGreed.value} (${snapshot.fearGreed.label})

Global markets:
${worldLines}`;
}

function parseBulletArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const bullets = value
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_BULLETS);
  if (bullets.length < MIN_BULLETS) return null;
  return bullets;
}

function normalizeRecommendation(
  value: unknown
): AIPredictionReport["recommendation"] | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "buy" ||
    normalized === "bullish" ||
    normalized === "long"
  ) {
    return "buy";
  }
  if (
    normalized === "sell" ||
    normalized === "bearish" ||
    normalized === "short"
  ) {
    return "sell";
  }
  if (normalized === "hold" || normalized === "neutral") {
    return "hold";
  }
  return null;
}

function normalizeConfidence(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  let confidence = value;
  if (confidence > 1 && confidence <= 100) {
    confidence = confidence / 100;
  }
  if (confidence < 0 || confidence > 1) return null;
  return Number(Math.min(1, Math.max(0, confidence)).toFixed(2));
}

function parseSymbolSpecific(
  value: unknown
): AIPredictionReport["symbolSpecific"] {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const title = typeof record.title === "string" ? record.title.trim() : "";
  const bullets = parseBulletArray(record.bullets);
  if (!title || !bullets || bullets.length > 3) return null;
  return { title, bullets: bullets.slice(0, 3) };
}

export function parseAIPredictionFromJson(
  value: unknown
): Pick<
  AIPredictionReport,
  "recommendation" | "confidence" | "summary" | "factors" | "symbolSpecific"
> | null {
  if (!value || typeof value !== "object") return null;
  const parsed = value as Record<string, unknown>;

  const recommendation = normalizeRecommendation(parsed.recommendation);
  const confidence = normalizeConfidence(parsed.confidence);
  const summary =
    typeof parsed.summary === "string" ? parsed.summary.trim() : "";
  if (!recommendation || confidence === null || summary.length < 20) {
    return null;
  }

  const factors = {} as AIPredictionFactors;
  for (const id of AI_PREDICTION_FACTOR_IDS) {
    const bullets = parseBulletArray(parsed[id]);
    if (!bullets) return null;
    factors[id] = bullets;
  }

  const symbolSpecific = parseSymbolSpecific(parsed.symbolSpecific);

  return {
    recommendation,
    confidence,
    summary,
    factors,
    symbolSpecific,
  };
}

export function parseAIPredictionFromModelText(
  raw: string
): ReturnType<typeof parseAIPredictionFromJson> {
  const json = extractFirstJsonObject(raw);
  if (!json) return null;
  return parseAIPredictionFromJson(json);
}
