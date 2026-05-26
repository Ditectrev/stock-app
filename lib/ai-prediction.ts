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

/** Prompt asks for 2+; parser accepts 1+ so smaller local models still work. */
const MIN_BULLETS = 1;
const MAX_BULLETS = 4;

const LEGACY_FACTOR_KEYS: Record<string, AIPredictionFactorId> = {
  politicalFactors: "macro",
  financialTrendFactors: "valuation",
  geopoliticalFactors: "globalMarkets",
  riskFactors: "risks",
};

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
- Each fixed factor array (technical, valuation, sentiment, macro, globalMarkets, risks): exactly 2 concise bullets (max 30 words each), grounded in the inputs. All six arrays are required.
- symbolSpecific: optional; use null unless there is a clear symbol-specific catalyst.
- Output must be one complete JSON object. Do not wrap in markdown. Do not omit any required array.

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

function extractPredictionJson(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const candidates: string[] = [];

  const codeBlock = trimmed.match(/```json\s*([\s\S]*?)```/i)?.[1];
  if (codeBlock) candidates.push(codeBlock.trim());

  const braceMatch = trimmed.match(/\{[\s\S]*\}/)?.[0];
  if (braceMatch) candidates.push(braceMatch);

  if (trimmed.startsWith("{")) candidates.push(trimmed);

  for (const candidate of candidates) {
    const parsed = tryParseJsonObject(candidate);
    if (parsed) return parsed;
  }

  return extractFirstJsonObject(text);
}

function tryParseJsonObject(candidate: string): Record<string, unknown> | null {
  try {
    return JSON.parse(candidate) as Record<string, unknown>;
  } catch {
    const openBraces = (candidate.match(/\{/g) ?? []).length;
    const closeBraces = (candidate.match(/\}/g) ?? []).length;
    const openBrackets = (candidate.match(/\[/g) ?? []).length;
    const closeBrackets = (candidate.match(/\]/g) ?? []).length;
    const repaired =
      candidate +
      "]".repeat(Math.max(0, openBrackets - closeBrackets)) +
      "}".repeat(Math.max(0, openBraces - closeBraces));

    try {
      return JSON.parse(repaired) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function normalizePredictionRecord(
  value: Record<string, unknown>
): Record<string, unknown> {
  const nested =
    value.factors &&
    typeof value.factors === "object" &&
    !Array.isArray(value.factors)
      ? (value.factors as Record<string, unknown>)
      : null;

  const merged: Record<string, unknown> = { ...value, ...(nested ?? {}) };

  for (const [legacyKey, factorId] of Object.entries(LEGACY_FACTOR_KEYS)) {
    if (merged[factorId] === undefined && merged[legacyKey] !== undefined) {
      merged[factorId] = merged[legacyKey];
    }
  }

  return merged;
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
  let numeric: number | null = null;
  if (typeof value === "number" && Number.isFinite(value)) {
    numeric = value;
  } else if (typeof value === "string") {
    const parsed = Number.parseFloat(value.trim());
    if (Number.isFinite(parsed)) numeric = parsed;
  }
  if (numeric === null) return null;

  let confidence = numeric;
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
  const parsed = normalizePredictionRecord(value as Record<string, unknown>);

  const recommendation = normalizeRecommendation(parsed.recommendation);
  const confidence = normalizeConfidence(parsed.confidence);
  const summary =
    typeof parsed.summary === "string" ? parsed.summary.trim() : "";
  if (!recommendation || confidence === null || summary.length < 12) {
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
  const json = extractPredictionJson(raw);
  if (!json) return null;
  return parseAIPredictionFromJson(json);
}

/** Human-readable hint when validation fails (for API error messages). */
export function explainAIPredictionParseFailure(raw: string): string {
  const json = extractPredictionJson(raw);
  if (!json) {
    return "The model response was not valid JSON. Try a model with stronger JSON output (e.g. llama3.2) or enable JSON mode in Ollama.";
  }

  const parsed = normalizePredictionRecord(json);
  const missingFactors = AI_PREDICTION_FACTOR_IDS.filter(
    (id) => parseBulletArray(parsed[id]) === null
  );
  if (missingFactors.length > 0) {
    return `The model JSON is missing or has too few bullets for: ${missingFactors.join(", ")}. All six factor arrays are required.`;
  }

  if (!normalizeRecommendation(parsed.recommendation)) {
    return 'The model JSON must include recommendation: "buy", "hold", or "sell".';
  }

  if (normalizeConfidence(parsed.confidence) === null) {
    return "The model JSON must include confidence as a number between 0 and 1.";
  }

  const summary =
    typeof parsed.summary === "string" ? parsed.summary.trim() : "";
  if (summary.length < 12) {
    return "The model JSON summary is missing or too short.";
  }

  return "The model JSON did not match the required prediction schema.";
}
