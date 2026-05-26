import { scoreToConfidence } from "@/lib/ai-confidence";
import {
  AI_PREDICTION_MAX_OUTPUT_TOKENS,
  buildAIPredictionPrompt,
  parseAIPredictionFromModelText,
  type AIPredictionMarketSnapshot,
} from "@/lib/ai-prediction";
import { marketDataService } from "@/services/market-data.service";
import { AIIntegrationService } from "@/services/ai-integration.service";
import { logger } from "@/lib/logger";
import {
  parseStockOfTheDayCandidates,
  STOCK_OF_THE_DAY_CANDIDATES_PROMPT,
  STOCK_OF_THE_DAY_MAX_OUTPUT_TOKENS,
  type AIStockCandidate,
  type StockOfTheDayCandidates,
} from "@/lib/stock-of-the-day-ai";
import type {
  AIPredictionReport,
  AIProvider,
  ForecastData,
  StockOfTheDay,
  StockOfTheDayResult,
  TechnicalIndicators,
} from "@/types";

type AssetType = AIPredictionReport["assetType"];
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
    llmConfig: LLMConfig
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

    const assetType = detectAssetType(symbol);
    const snapshot: AIPredictionMarketSnapshot = {
      symbol: symbol.toUpperCase(),
      assetType,
      quote: {
        name: quote.name,
        price: quote.price,
        changePercent: quote.changePercent,
        marketCap: quote.marketCap,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      },
      indicators: {
        rsi: indicators.rsi.value,
        rsiSignal: indicators.rsi.signal,
        macdHistogram: indicators.macd.histogram,
        macdTrend: indicators.macd.trend,
        overallSentiment: indicators.overallSentiment,
        ma50: indicators.movingAverages.ma50,
        ma200: indicators.movingAverages.ma200,
      },
      forecast: {
        averageTarget: forecast.priceTargets.average,
        lowTarget: forecast.priceTargets.low,
        highTarget: forecast.priceTargets.high,
        strongBuy: forecast.analystRatings.strongBuy,
        buy: forecast.analystRatings.buy,
        hold: forecast.analystRatings.hold,
        sell: forecast.analystRatings.sell,
        strongSell: forecast.analystRatings.strongSell,
      },
      fearGreed: {
        value: fearGreed.value,
        label: fearGreed.label,
      },
      worldMarkets: worldMarkets.map((m) => ({
        region: m.region,
        changePercent: m.changePercent,
      })),
    };

    const prompt = buildAIPredictionPrompt(snapshot);
    const service = new AIIntegrationService();
    await service.setAIProvider(llmConfig.provider, {
      provider: llmConfig.provider,
      apiKey: llmConfig.apiKey,
      model: llmConfig.model,
      settings: {},
    });

    const raw = await service.runRawPrompt(prompt, {
      maxOutputTokens: AI_PREDICTION_MAX_OUTPUT_TOKENS,
    });
    const parsed = parseAIPredictionFromModelText(raw);
    if (!parsed) {
      throw new Error(
        "AI returned an invalid prediction format. Try again or switch models."
      );
    }

    return {
      symbol: symbol.toUpperCase(),
      assetType,
      generatedAt: new Date(),
      ...parsed,
    };
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
}

export const aiMarketInsightsService = new AIMarketInsightsService();
