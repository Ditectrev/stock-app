import { scoreToConfidence } from "@/lib/ai-confidence";
import { marketDataService } from "@/services/market-data.service";
import { AIIntegrationService } from "@/services/ai-integration.service";
import { logger } from "@/lib/logger";
import {
  extractFirstJsonObject,
  parseStockOfTheDayCandidates,
  STOCK_OF_THE_DAY_CANDIDATES_PROMPT,
  STOCK_OF_THE_DAY_MAX_OUTPUT_TOKENS,
  type AIStockCandidate,
  type StockOfTheDayCandidates,
} from "@/lib/stock-of-the-day-ai";
import type {
  AIPredictionReport,
  AIProvider,
  FearGreedData,
  ForecastData,
  MarketIndex,
  StockOfTheDay,
  StockOfTheDayResult,
  TechnicalIndicators,
} from "@/types";

type PredictionEnhancement = Pick<
  AIPredictionReport,
  | "summary"
  | "politicalFactors"
  | "financialTrendFactors"
  | "geopoliticalFactors"
  | "riskFactors"
>;

type AssetType = AIPredictionReport["assetType"];
type Recommendation = AIPredictionReport["recommendation"];
type LLMConfig = {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
};

type EnrichedStockCandidate = {
  symbol: string;
  name: string;
  thesis: string;
  score: number;
  confidence: number;
  rationale: string[];
};

function detectAssetType(symbol: string): AssetType {
  if (symbol.includes("-USD")) return "crypto";
  if (symbol.endsWith("=F")) return "commodity";
  if (symbol.endsWith("=X")) return "forex";
  if (symbol.includes("ETF")) return "etf";
  return "stock";
}

function toRecommendation(score: number): Recommendation {
  if (score >= 0.2) return "buy";
  if (score <= -0.2) return "sell";
  return "hold";
}

function getLLMConfigFromEnv(): {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
} | null {
  const providerEnv = process.env.AI_PROVIDER;
  if (!providerEnv) return null;

  const provider = providerEnv.toUpperCase() as AIProvider;
  const allowed = new Set<AIProvider>([
    "OLLAMA",
    "OPENAI",
    "GEMINI",
    "MISTRAL",
    "DEEPSEEK",
    "HOSTED",
  ]);

  if (!allowed.has(provider)) return null;

  const model = process.env.AI_MODEL;

  // Ollama doesn't require an API key.
  if (provider === "OLLAMA") {
    return { provider, model };
  }

  // For now, before Appwrite/Stripe wiring, we support BYOK via env for non-Ollama providers.
  if (
    provider === "OPENAI" ||
    provider === "GEMINI" ||
    provider === "MISTRAL" ||
    provider === "DEEPSEEK"
  ) {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) return null;
    return { provider, apiKey, model };
  }

  // Hosted AI and OLLAMA can be added next; skip if not configured.
  return null;
}

export class AIMarketInsightsService {
  async generatePrediction(
    symbol: string,
    llmConfig?: LLMConfig
  ): Promise<AIPredictionReport> {
    const quote = await marketDataService
      .getSymbolData(symbol)
      .catch((error) => {
        logger.warn("Using fallback quote for AI prediction", {
          symbol,
          error: error instanceof Error ? error.message : String(error),
        });
        return {
          symbol: symbol.toUpperCase(),
          name: `${symbol.toUpperCase()} Inc.`,
          price: 100,
          change: 0,
          changePercent: 0,
          marketCap: 100000000000,
          volume: 1000000,
          fiftyTwoWeekHigh: 120,
          fiftyTwoWeekLow: 80,
          lastUpdated: new Date(),
        };
      });

    const [indicators, forecast, fearGreed, worldMarkets] = await Promise.all([
      marketDataService.getTechnicalIndicators(symbol).catch((error) => {
        logger.warn("Using fallback indicators for AI prediction", {
          symbol,
          error: error instanceof Error ? error.message : String(error),
        });
        return {
          rsi: { value: 50, signal: "fair" as const },
          macd: { value: 0, signal: 0, histogram: 0, trend: "fair" as const },
          movingAverages: { ma50: 0, ma200: 0, signal: "fair" as const },
          bollingerBands: {
            upper: 0,
            middle: 0,
            lower: 0,
            signal: "fair" as const,
          },
          overallSentiment: "fair" as const,
        };
      }),
      marketDataService.getForecastData(symbol).catch((error) => {
        logger.warn("Using fallback forecast for AI prediction", {
          symbol,
          error: error instanceof Error ? error.message : String(error),
        });
        return {
          priceTargets: {
            low: quote.price * 0.95,
            average: quote.price,
            high: quote.price * 1.05,
          },
          analystRatings: {
            strongBuy: 0,
            buy: 0,
            hold: 1,
            sell: 0,
            strongSell: 0,
          },
          epsForecasts: [],
          revenueForecasts: [],
        };
      }),
      marketDataService.getFearGreedIndex(7).catch((error) => {
        logger.warn("Using fallback fear/greed for AI prediction", {
          symbol,
          error: error instanceof Error ? error.message : String(error),
        });
        return {
          value: 50,
          label: "Neutral" as const,
          timestamp: new Date(),
          history: [],
        };
      }),
      marketDataService.getWorldMarkets().catch((error) => {
        logger.warn("Using fallback world markets for AI prediction", {
          symbol,
          error: error instanceof Error ? error.message : String(error),
        });
        return [];
      }),
    ]);

    const targetUpside =
      quote.price > 0
        ? (forecast.priceTargets.average - quote.price) / quote.price
        : 0;
    const sentimentScore =
      indicators.overallSentiment === "underpriced"
        ? 0.25
        : indicators.overallSentiment === "overpriced"
          ? -0.25
          : 0;
    const fearGreedBias =
      fearGreed.value <= 35 ? 0.1 : fearGreed.value >= 70 ? -0.1 : 0;
    const score = targetUpside + sentimentScore + fearGreedBias;
    const recommendation = toRecommendation(score);
    const confidence = scoreToConfidence(score);

    const weakestRegion = [...worldMarkets].sort(
      (a, b) => a.changePercent - b.changePercent
    )[0];
    const strongestRegion = [...worldMarkets].sort(
      (a, b) => b.changePercent - a.changePercent
    )[0];

    const assetType = detectAssetType(symbol);

    // Keep deterministic output as the baseline; enhance text fields with the LLM when configured.
    const heuristic: AIPredictionReport = {
      symbol,
      assetType,
      generatedAt: new Date(),
      recommendation,
      confidence,
      summary: `AI signals for ${symbol} currently point to a ${recommendation.toUpperCase()} stance. The model combines analyst targets, technical momentum, and macro risk proxies to estimate near-term direction.`,
      politicalFactors: [
        "Election-cycle policy uncertainty can shift sector-specific capital flows.",
        "Central bank communication remains a key catalyst for risk repricing.",
        "Regulatory headlines can move sector sentiment quickly.",
      ],
      financialTrendFactors: [
        `Average analyst target implies ${(targetUpside * 100).toFixed(1)}% relative upside from current price.`,
        `Technical model flags current sentiment as "${indicators.overallSentiment}".`,
        `Fear & Greed bias is ${fearGreed.value <= 35 ? "contrarian (slightly bullish)" : fearGreed.value >= 70 ? "cautious (slightly bearish)" : "neutral"} today.`,
      ],
      geopoliticalFactors: [
        strongestRegion
          ? `${strongestRegion.region} is currently the strongest major region (${strongestRegion.changePercent.toFixed(2)}%).`
          : "No clear regional outperformance signal.",
        weakestRegion
          ? `${weakestRegion.region} is currently the weakest major region (${weakestRegion.changePercent.toFixed(2)}%), increasing volatility risk.`
          : "No clear regional weakness signal.",
        "Cross-region risk correlations can amplify moves during regime shifts.",
      ],
      riskFactors: [
        "Unexpected macro headlines can invalidate short-horizon AI signals quickly.",
        "Market regime changes can reduce model reliability without warning.",
        "Liquidity conditions can change faster than model assumptions.",
      ],
    };

    const enhanced = await this.maybeEnhancePrediction(
      {
        symbol,
        assetType,
        recommendation,
        confidence,
        quote,
        indicators,
        forecast,
        fearGreed,
        strongestRegion,
        weakestRegion,
        targetUpside,
      },
      llmConfig
    );

    return enhanced
      ? { ...heuristic, ...enhanced, generatedAt: new Date() }
      : heuristic;
  }

  async getStockOfTheDay(llmConfig?: LLMConfig): Promise<StockOfTheDayResult> {
    const llm = llmConfig ?? getLLMConfigFromEnv();
    if (!llm) {
      throw new Error(
        "An active AI provider is required for dynamic stock-of-the-day picks."
      );
    }

    const generatedCandidates = await this.generateStockOfTheDayCandidates(llm);
    return this.enrichStockOfTheDayCandidates(generatedCandidates);
  }

  async enrichStockOfTheDayCandidates(
    generatedCandidates: StockOfTheDayCandidates
  ): Promise<StockOfTheDayResult> {
    const [buyCandidates, sellCandidates] = await Promise.all([
      this.enrichStockCandidates(generatedCandidates.buyCandidates, "buy"),
      this.enrichStockCandidates(generatedCandidates.sellCandidates, "sell"),
    ]);

    const buy = buyCandidates.sort((a, b) => b.score - a.score)[0];
    const sell = sellCandidates.sort((a, b) => b.score - a.score)[0];

    if (!buy || !sell) {
      throw new Error(
        "AI did not return enough valid public stock candidates today."
      );
    }

    const generatedAt = new Date();
    return {
      generatedAt,
      buy: this.toStockOfTheDay("buy", buy, generatedAt),
      sell: this.toStockOfTheDay("sell", sell, generatedAt),
    };
  }

  private async generateStockOfTheDayCandidates(llm: LLMConfig): Promise<{
    buyCandidates: AIStockCandidate[];
    sellCandidates: AIStockCandidate[];
  }> {
    const service = new AIIntegrationService();
    await service.setAIProvider(llm.provider, {
      provider: llm.provider,
      apiKey: llm.apiKey,
      model: llm.model,
      settings: {},
    });

    const raw = await service.runRawPrompt(STOCK_OF_THE_DAY_CANDIDATES_PROMPT, {
      maxOutputTokens: STOCK_OF_THE_DAY_MAX_OUTPUT_TOKENS,
    });
    return parseStockOfTheDayCandidates(raw);
  }

  private async enrichStockCandidates(
    candidates: AIStockCandidate[],
    direction: "buy" | "sell"
  ): Promise<EnrichedStockCandidate[]> {
    const enriched = await Promise.all(
      candidates.map(async (candidate) => {
        try {
          const [quote, indicators, forecast] = await Promise.all([
            marketDataService.getSymbolData(candidate.symbol),
            marketDataService.getTechnicalIndicators(candidate.symbol),
            marketDataService.getForecastData(candidate.symbol),
          ]);

          const score = this.scoreStockOfTheDayCandidate({
            direction,
            price: quote.price,
            changePercent: quote.changePercent,
            volume: quote.volume,
            marketCap: quote.marketCap,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
            overallSentiment: indicators.overallSentiment,
            averageTarget: forecast.priceTargets.average,
            analystRatings: forecast.analystRatings,
          });

          return {
            symbol: quote.symbol || candidate.symbol,
            name: quote.name || candidate.name || candidate.symbol,
            thesis:
              candidate.thesis ||
              (direction === "buy"
                ? "AI surfaced this as an underfollowed asymmetric-growth candidate."
                : "AI surfaced this as a structurally vulnerable candidate."),
            score,
            confidence: scoreToConfidence(score, 1.25),
            rationale: this.buildStockOfTheDayRationale(direction, {
              thesis: candidate.thesis,
              changePercent: quote.changePercent,
              marketCap: quote.marketCap,
              overallSentiment: indicators.overallSentiment,
              averageTarget: forecast.priceTargets.average,
              price: quote.price,
            }),
          };
        } catch (error) {
          logger.warn("Failed to validate AI stock-of-the-day candidate", {
            symbol: candidate.symbol,
            direction,
            error: error instanceof Error ? error.message : String(error),
          });
          return null;
        }
      })
    );

    return enriched.filter(
      (item): item is EnrichedStockCandidate => item !== null
    );
  }

  private toStockOfTheDay(
    recommendation: "buy" | "sell",
    candidate: EnrichedStockCandidate,
    generatedAt: Date
  ): StockOfTheDay {
    return {
      generatedAt,
      symbol: candidate.symbol,
      name: candidate.name,
      assetType: "stock",
      recommendation,
      confidence: candidate.confidence,
      rationale: candidate.rationale,
    };
  }

  private scoreStockOfTheDayCandidate(args: {
    direction: "buy" | "sell";
    price: number;
    changePercent: number;
    volume: number;
    marketCap: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
    overallSentiment: TechnicalIndicators["overallSentiment"];
    averageTarget: number;
    analystRatings: ForecastData["analystRatings"];
  }): number {
    const targetUpside =
      args.price > 0 ? (args.averageTarget - args.price) / args.price : 0;
    const sentiment =
      args.overallSentiment === "underpriced"
        ? 0.3
        : args.overallSentiment === "overpriced"
          ? -0.3
          : 0;
    const liquidity = Math.min(1, Math.log10(Math.max(1, args.volume)) / 8);
    const marketCapBillions = args.marketCap / 1_000_000_000;
    const smallCapRunway =
      marketCapBillions <= 0
        ? 0
        : marketCapBillions <= 30
          ? Math.max(0, 1 - marketCapBillions / 30)
          : -0.25;
    const nearHigh =
      args.fiftyTwoWeekHigh > 0 ? args.price / args.fiftyTwoWeekHigh : 0.5;
    const nearLow =
      args.fiftyTwoWeekLow > 0 ? args.price / args.fiftyTwoWeekLow : 1.5;
    const analystBias =
      (args.analystRatings.strongBuy * 1.5 +
        args.analystRatings.buy -
        args.analystRatings.sell -
        args.analystRatings.strongSell * 1.5) /
      Math.max(
        1,
        args.analystRatings.strongBuy +
          args.analystRatings.buy +
          args.analystRatings.hold +
          args.analystRatings.sell +
          args.analystRatings.strongSell
      );

    if (args.direction === "buy") {
      return (
        targetUpside * 0.35 +
        sentiment * 0.2 +
        smallCapRunway * 0.2 +
        Math.min(1, Math.max(-1, args.changePercent / 10)) * 0.1 +
        liquidity * 0.05 +
        (nearHigh >= 0.55 && nearHigh <= 0.95 ? 0.1 : -0.05) +
        analystBias * 0.1
      );
    }

    return (
      -targetUpside * 0.3 +
      -sentiment * 0.2 +
      (marketCapBillions > 20 ? 0.1 : 0) +
      Math.min(1, Math.max(-1, -args.changePercent / 10)) * 0.15 +
      (nearLow <= 1.35 ? 0.15 : 0) +
      -analystBias * 0.1 +
      liquidity * 0.05
    );
  }

  private buildStockOfTheDayRationale(
    direction: "buy" | "sell",
    args: {
      thesis?: string;
      changePercent: number;
      marketCap: number;
      overallSentiment: TechnicalIndicators["overallSentiment"];
      averageTarget: number;
      price: number;
    }
  ): string[] {
    const targetMove =
      args.price > 0
        ? (((args.averageTarget - args.price) / args.price) * 100).toFixed(1)
        : "0.0";
    const marketCapText =
      args.marketCap > 0
        ? `$${(args.marketCap / 1_000_000_000).toFixed(1)}B market cap`
        : "market cap unavailable";

    if (direction === "buy") {
      return [
        args.thesis ||
          "AI identified a differentiated growth narrative that is not a default mega-cap idea.",
        `${marketCapText} leaves more upside runway than mature mega-cap leaders if execution improves.`,
        `Live data check: ${args.changePercent.toFixed(2)}% daily move, ${args.overallSentiment} technical read, and ${targetMove}% average-target gap.`,
      ];
    }

    return [
      args.thesis ||
        "AI identified a deteriorating narrative with weaker risk/reward than the market may be pricing.",
      `${marketCapText} and current technicals point to a less attractive setup versus stronger alternatives.`,
      `Live data check: ${args.changePercent.toFixed(2)}% daily move, ${args.overallSentiment} technical read, and ${targetMove}% average-target gap.`,
    ];
  }

  private async maybeEnhancePrediction(
    args: {
      symbol: string;
      assetType: AssetType;
      recommendation: Recommendation;
      confidence: number;
      quote: { price: number; changePercent: number };
      indicators: TechnicalIndicators;
      forecast: ForecastData;
      fearGreed: FearGreedData;
      strongestRegion?: MarketIndex;
      weakestRegion?: MarketIndex;
      targetUpside: number;
    },
    llmConfig?: LLMConfig
  ): Promise<PredictionEnhancement | null> {
    const llm = llmConfig ?? getLLMConfigFromEnv();
    if (!llm) return null;

    const stance =
      args.recommendation === "buy"
        ? "bullish"
        : args.recommendation === "sell"
          ? "bearish"
          : "neutral";

    const prompt = `You are a financial analyst.
Return ONLY valid JSON (no markdown, no commentary) in this exact shape:
{
  "summary": string,
  "politicalFactors": string[],
  "financialTrendFactors": string[],
  "geopoliticalFactors": string[],
  "riskFactors": string[]
}
Rules:
- summary: 1 short paragraph; do NOT use the words "buy" or "sell" (use "bullish"/"bearish"/"neutral" instead).
- Each *_Factors array: exactly 3 short strings.

Inputs:
symbol: ${args.symbol}
assetType: ${args.assetType}
stance: ${stance}
confidence: ${args.confidence}
currentPrice: ${args.quote.price}
priceChangePercent: ${args.quote.changePercent}

Technical:
- RSI: ${args.indicators.rsi.value.toFixed(1)} (${args.indicators.rsi.signal})
- MACD histogram: ${args.indicators.macd.histogram.toFixed(4)} (trend: ${args.indicators.macd.trend})
- Overall sentiment: ${args.indicators.overallSentiment}

Forecast:
- average target: ${args.forecast.priceTargets.average}
- low/high targets: ${args.forecast.priceTargets.low}/${args.forecast.priceTargets.high}

Fear & Greed:
- value: ${args.fearGreed.value}

World markets:
${args.strongestRegion ? `Strongest: ${args.strongestRegion.region} (${args.strongestRegion.changePercent.toFixed(2)}%)` : "Strongest: N/A"}
${args.weakestRegion ? `Weakest: ${args.weakestRegion.region} (${args.weakestRegion.changePercent.toFixed(2)}%)` : "Weakest: N/A"}
targetUpsidePercent: ${(args.targetUpside * 100).toFixed(1)}
`;

    try {
      const service = new AIIntegrationService();
      await service.setAIProvider(llm.provider, {
        provider: llm.provider,
        apiKey: llm.apiKey,
        model: llm.model,
        settings: {},
      });

      const raw = await service.runRawPrompt(prompt);
      const parsed = extractFirstJsonObject(raw);

      if (!parsed) return null;

      const summary =
        typeof parsed.summary === "string" ? parsed.summary : null;
      const politicalFactors = Array.isArray(parsed.politicalFactors)
        ? parsed.politicalFactors.filter(
            (x): x is string => typeof x === "string"
          )
        : [];
      const financialTrendFactors = Array.isArray(parsed.financialTrendFactors)
        ? parsed.financialTrendFactors.filter(
            (x): x is string => typeof x === "string"
          )
        : [];
      const geopoliticalFactors = Array.isArray(parsed.geopoliticalFactors)
        ? parsed.geopoliticalFactors.filter(
            (x): x is string => typeof x === "string"
          )
        : [];
      const riskFactors = Array.isArray(parsed.riskFactors)
        ? parsed.riskFactors.filter((x): x is string => typeof x === "string")
        : [];

      if (!summary) return null;
      if (
        politicalFactors.length !== 3 ||
        financialTrendFactors.length !== 3 ||
        geopoliticalFactors.length !== 3 ||
        riskFactors.length !== 3
      ) {
        logger.warn(
          "LLM prediction enhancement returned unexpected factor lengths",
          {
            symbol: args.symbol,
          }
        );
        return null;
      }

      return {
        summary,
        politicalFactors,
        financialTrendFactors,
        geopoliticalFactors,
        riskFactors,
      };
    } catch (error) {
      logger.warn(
        "LLM prediction enhancement failed; falling back to heuristic",
        {
          symbol: args.symbol,
          error: error instanceof Error ? error.message : String(error),
        }
      );
      return null;
    }
  }
}

export const aiMarketInsightsService = new AIMarketInsightsService();
