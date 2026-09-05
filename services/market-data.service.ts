/**
 * Market Data Service
 * Orchestrates data fetching from external APIs with caching and rate limiting
 */

import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { cacheService } from "@/lib/cache";
import { rateLimiter } from "@/lib/rate-limiter";
import { yahooFinanceService } from "./yahoo-finance.service";
import { finnhubService } from "./finnhub.service";
import { cnnApiService } from "./cnn-api.service";
import { tradingEconomicsService } from "./trading-economics.service";
import {
  SymbolData,
  PriceData,
  TechnicalIndicators,
  ForecastData,
  SeasonalData,
  FinancialData,
  FearGreedData,
  MarketIndex,
  SectorData,
  ETFData,
  CryptoData,
  StockData,
  EconomicEvent,
  EarningsEvent,
  DividendEvent,
  IPOEvent,
  TimeRange,
} from "@/types";
import {
  calculateRSI as calcRSI,
  calculateSMA,
  calculateEMA,
  calculateMACD as calcMACD,
  calculateBollingerBands as calcBB,
  getRSISignal,
  getMACDSignal,
  getMASignal,
  getBollingerSignal,
  getOverallSentiment,
} from "@/lib/technical-indicators";

function quoteNeedsYahooEnrichment(data: SymbolData): boolean {
  return (
    data.volume <= 0 || data.fiftyTwoWeekHigh <= 0 || data.fiftyTwoWeekLow <= 0
  );
}

async function enrichQuoteFromYahoo(
  data: SymbolData,
  symbol: string
): Promise<SymbolData> {
  try {
    const yahoo = await yahooFinanceService.getSymbolQuote(symbol);
    return {
      ...data,
      name:
        data.name && data.name !== data.symbol
          ? data.name
          : yahoo.name || data.name,
      marketCap: data.marketCap > 0 ? data.marketCap : yahoo.marketCap,
      volume: data.volume > 0 ? data.volume : yahoo.volume,
      fiftyTwoWeekHigh:
        data.fiftyTwoWeekHigh > 0
          ? data.fiftyTwoWeekHigh
          : yahoo.fiftyTwoWeekHigh,
      fiftyTwoWeekLow:
        data.fiftyTwoWeekLow > 0 ? data.fiftyTwoWeekLow : yahoo.fiftyTwoWeekLow,
    };
  } catch (error) {
    logger.warn("Yahoo quote enrichment failed", {
      symbol,
      error: (error as Error).message,
    });
    return data;
  }
}

export class MarketDataService {
  private cacheTTL: number;

  constructor() {
    this.cacheTTL = env.cache.ttlSeconds;
  }

  /**
   * Search for symbols with caching and rate limiting
   */
  async searchSymbols(
    query: string
  ): Promise<
    Array<{ symbol: string; name: string; type: string; exchange: string }>
  > {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const normalizedQuery = query.trim().toUpperCase();
    const cacheKey = `search:${normalizedQuery}`;

    // Check cache first
    const cached =
      cacheService.get<
        Array<{ symbol: string; name: string; type: string; exchange: string }>
      >(cacheKey);
    if (cached) {
      return cached;
    }

    // Check rate limit
    const endpoint = `yahoo:search:${normalizedQuery}`;
    const allowed = await rateLimiter.checkLimit(endpoint);

    if (!allowed) {
      logger.warn(
        "Rate limit exceeded for search, serving stale cache if available",
        { query }
      );
      const stale = cacheService.get<
        Array<{
          symbol: string;
          name: string;
          type: string;
          exchange: string;
        }>
      >(cacheKey);
      if (stale) return stale;

      throw new Error("Rate limit exceeded and no cached data available");
    }

    // Fetch from API (Finnhub primary, Yahoo fallback)
    let data: Array<{
      symbol: string;
      name: string;
      type: string;
      exchange: string;
    }>;
    if (finnhubService.isConfigured()) {
      try {
        data = await finnhubService.searchSymbols(normalizedQuery);
      } catch (error) {
        logger.warn("Finnhub search failed, falling back to Yahoo", {
          query: normalizedQuery,
          error: (error as Error).message,
        });
        data = await yahooFinanceService.searchSymbols(normalizedQuery);
      }
    } else {
      data = await yahooFinanceService.searchSymbols(normalizedQuery);
    }
    rateLimiter.recordCall(endpoint);

    // Cache the result (shorter TTL for search results)
    cacheService.set(cacheKey, data, 300); // 5 minutes

    return data;
  }

  /**
   * Get symbol data with caching and rate limiting
   */
  async getSymbolData(symbol: string): Promise<SymbolData> {
    const cacheKey = cacheService.generateKey(symbol, "quote");

    // Check cache first
    const cached = cacheService.get<SymbolData>(cacheKey);
    if (cached) {
      return cached;
    }

    // Check rate limit
    const endpoint = `yahoo:quote:${symbol}`;
    const allowed = await rateLimiter.checkLimit(endpoint);

    if (!allowed) {
      logger.warn("Rate limit exceeded, serving stale cache if available", {
        symbol,
      });
      // Try to serve stale cache
      const stale = cacheService.get<SymbolData>(cacheKey);
      if (stale) return stale;

      throw new Error("Rate limit exceeded and no cached data available");
    }

    // Fetch from API (Finnhub primary, Yahoo fallback)
    let data: SymbolData;
    if (finnhubService.isConfigured()) {
      try {
        data = await finnhubService.getSymbolQuote(symbol);
        if (quoteNeedsYahooEnrichment(data)) {
          data = await enrichQuoteFromYahoo(data, symbol);
        }
      } catch (error) {
        logger.warn("Finnhub quote failed, falling back to Yahoo", {
          symbol,
          error: (error as Error).message,
        });
        data = await yahooFinanceService.getSymbolQuote(symbol);
      }
    } else {
      data = await yahooFinanceService.getSymbolQuote(symbol);
    }
    rateLimiter.recordCall(endpoint);

    // Cache the result
    cacheService.set(cacheKey, data, this.cacheTTL);

    return data;
  }

  /**
   * Get historical prices with caching and rate limiting
   */
  async getHistoricalPrices(
    symbol: string,
    range: TimeRange
  ): Promise<PriceData[]> {
    const cacheKey = cacheService.generateKey(symbol, `historical:${range}`);

    // Check cache first
    const cached = cacheService.get<PriceData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Check rate limit
    const endpoint = `yahoo:historical:${symbol}`;
    const allowed = await rateLimiter.checkLimit(endpoint);

    if (!allowed) {
      logger.warn("Rate limit exceeded, serving stale cache if available", {
        symbol,
        range,
      });
      const stale = cacheService.get<PriceData[]>(cacheKey);
      if (stale) return stale;

      throw new Error("Rate limit exceeded and no cached data available");
    }

    // Fetch from API (Finnhub primary, Yahoo fallback)
    let data: PriceData[];
    if (finnhubService.isConfigured()) {
      try {
        data = await finnhubService.getHistoricalData(symbol, range);
      } catch (error) {
        logger.warn("Finnhub historical fetch failed, falling back to Yahoo", {
          symbol,
          range,
          error: (error as Error).message,
        });
        data = await yahooFinanceService.getHistoricalData(symbol, range);
      }
    } else {
      data = await yahooFinanceService.getHistoricalData(symbol, range);
    }
    rateLimiter.recordCall(endpoint);

    // Cache the result
    cacheService.set(cacheKey, data, this.cacheTTL);

    return data;
  }

  /**
   * Get technical indicators (calculated from price data)
   */
  async getTechnicalIndicators(symbol: string): Promise<TechnicalIndicators> {
    const cacheKey = cacheService.generateKey(symbol, "indicators");

    // Check cache first
    const cached = cacheService.get<TechnicalIndicators>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get historical data to calculate indicators
    const priceData = await this.getHistoricalPrices(symbol, "1Y");

    // Calculate indicators
    const indicators = this.calculateIndicators(priceData);

    // Cache the result
    cacheService.set(cacheKey, indicators, this.cacheTTL);

    return indicators;
  }

  /**
   * Get forecast data from Yahoo Finance
   */
  async getForecastData(symbol: string): Promise<ForecastData> {
    const cacheKey = cacheService.generateKey(symbol, "forecast");

    // Check cache first
    const cached = cacheService.get<ForecastData>(cacheKey);
    if (cached) {
      return cached;
    }

    // Check rate limit
    const endpoint = `yahoo:forecast:${symbol}`;
    const allowed = await rateLimiter.checkLimit(endpoint);

    if (!allowed) {
      logger.warn("Rate limit exceeded, serving stale cache if available", {
        symbol,
      });
      const stale = cacheService.get<ForecastData>(cacheKey);
      if (stale) return stale;
      throw new Error("Rate limit exceeded and no cached data available");
    }

    // Fetch from API
    const data = await yahooFinanceService.getForecastData(symbol);
    rateLimiter.recordCall(endpoint);

    // Cache the result
    cacheService.set(cacheKey, data, this.cacheTTL);

    return data;
  }

  /**
   * Get seasonal patterns (calculated from historical data)
   */
  async getSeasonalPatterns(symbol: string): Promise<SeasonalData> {
    const cacheKey = cacheService.generateKey(symbol, "seasonal");

    // Check cache first
    const cached = cacheService.get<SeasonalData>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get max historical data
    const priceData = await this.getHistoricalPrices(symbol, "Max");

    // Calculate seasonal patterns
    const seasonal = this.calculateSeasonalPatterns(priceData);

    // Cache the result
    cacheService.set(cacheKey, seasonal, this.cacheTTL);

    return seasonal;
  }

  /**
   * Get financials with caching and rate limiting
   */
  async getFinancials(symbol: string): Promise<FinancialData> {
    const cacheKey = cacheService.generateKey(symbol, "financials");

    // Check cache first
    const cached = cacheService.get<FinancialData>(cacheKey);
    if (cached) {
      return cached;
    }

    // Check rate limit
    const endpoint = `yahoo:financials:${symbol}`;
    const allowed = await rateLimiter.checkLimit(endpoint);

    if (!allowed) {
      logger.warn("Rate limit exceeded, serving stale cache if available", {
        symbol,
      });
      const stale = cacheService.get<FinancialData>(cacheKey);
      if (stale) return stale;

      throw new Error("Rate limit exceeded and no cached data available");
    }

    // Fetch from API
    const data = await yahooFinanceService.getFinancials(symbol);
    rateLimiter.recordCall(endpoint);

    // Cache the result
    cacheService.set(cacheKey, data, this.cacheTTL);

    return data;
  }

  /**
   * Get Fear & Greed Index with caching and rate limiting
   */
  async getFearGreedIndex(limit: number = 30): Promise<FearGreedData> {
    const cacheKey = `market:fear-greed:${limit}`;

    // Check cache first
    const cached = cacheService.get<FearGreedData>(cacheKey);
    if (cached) {
      return cached;
    }

    // Check rate limit
    const endpoint = "cnn:fear-greed";
    const allowed = await rateLimiter.checkLimit(endpoint);

    if (!allowed) {
      logger.warn("Rate limit exceeded, serving stale cache if available");
      const stale = cacheService.get<FearGreedData>(cacheKey);
      if (stale) return stale;

      throw new Error("Rate limit exceeded and no cached data available");
    }

    // Fetch from API
    const data = await cnnApiService.getFearGreedIndex(limit);
    rateLimiter.recordCall(endpoint);

    // Cache the result
    cacheService.set(cacheKey, data, this.cacheTTL);

    return data;
  }

  /**
   * Get world markets with caching and rate limiting
   */
  async getWorldMarkets(): Promise<MarketIndex[]> {
    const cacheKey = "market:world-markets";

    // Check cache first
    const cached = cacheService.get<MarketIndex[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Check rate limit
    const endpoint = "cnn:world-markets";
    const allowed = await rateLimiter.checkLimit(endpoint);

    if (!allowed) {
      logger.warn("Rate limit exceeded, serving stale cache if available");
      const stale = cacheService.get<MarketIndex[]>(cacheKey);
      if (stale) return stale;

      throw new Error("Rate limit exceeded and no cached data available");
    }

    // Fetch from API (CNN primary, Yahoo Finance fallback)
    let data: MarketIndex[];
    try {
      data = await cnnApiService.getWorldMarkets();
    } catch (cnnError) {
      logger.warn(
        "CNN world markets unavailable, falling back to Yahoo Finance",
        {
          error: (cnnError as Error).message,
        }
      );
      data = await yahooFinanceService.getWorldMarkets();
    }
    rateLimiter.recordCall(endpoint);

    // Cache the result
    cacheService.set(cacheKey, data, this.cacheTTL);

    return data;
  }

  /**
   * Get economic calendar events with caching and rate limiting
   */
  async getEconomicEvents(
    country?: string,
    importance?: "high" | "medium" | "low"
  ): Promise<EconomicEvent[]> {
    const cacheKey = `market:economic-events:${country || "all"}:${importance || "all"}`;

    // Check cache first
    const cached = cacheService.get<EconomicEvent[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Check rate limit
    const endpoint = "cnn:economic-events";
    const allowed = await rateLimiter.checkLimit(endpoint);

    if (!allowed) {
      logger.warn("Rate limit exceeded, serving stale cache if available", {
        country,
        importance,
      });
      const stale = cacheService.get<EconomicEvent[]>(cacheKey);
      if (stale) return stale;

      throw new Error("Rate limit exceeded and no cached data available");
    }

    // Fetch from API (CNN primary, Trading Economics fallback)
    let data: EconomicEvent[];
    try {
      data = await cnnApiService.getEconomicEvents(country, importance);
    } catch (cnnError) {
      logger.warn(
        "CNN economic events unavailable, falling back to Trading Economics",
        {
          error: (cnnError as Error).message,
        }
      );
      try {
        data = await tradingEconomicsService.getEconomicEvents(
          country,
          importance
        );
      } catch (teError) {
        logger.warn(
          "Trading Economics also unavailable, returning empty list",
          {
            error: (teError as Error).message,
          }
        );
        data = [];
      }
    }
    rateLimiter.recordCall(endpoint);

    // Cache the result
    cacheService.set(cacheKey, data, this.cacheTTL);

    return data;
  }

  /**
   * Get earnings calendar events with caching and rate limiting
   */
  async getEarningsEvents(
    startDate?: string,
    endDate?: string
  ): Promise<EarningsEvent[]> {
    const cacheKey = `market:earnings-events:${startDate || "default"}:${endDate || "default"}`;

    // Check cache first
    const cached = cacheService.get<EarningsEvent[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Check rate limit
    const endpoint = "yahoo:earnings-events";
    const allowed = await rateLimiter.checkLimit(endpoint);

    if (!allowed) {
      logger.warn("Rate limit exceeded, serving stale cache if available", {
        startDate,
        endDate,
      });
      const stale = cacheService.get<EarningsEvent[]>(cacheKey);
      if (stale) return stale;

      throw new Error("Rate limit exceeded and no cached data available");
    }

    // Fetch from API
    const data = await yahooFinanceService.getEarningsCalendar(
      startDate,
      endDate
    );
    rateLimiter.recordCall(endpoint);

    // Cache the result
    cacheService.set(cacheKey, data, this.cacheTTL);

    return data;
  }

  /**
   * Get dividend calendar events with caching and rate limiting
   */
  async getDividendEvents(): Promise<DividendEvent[]> {
    const cacheKey = "market:dividend-events";

    const cached = cacheService.get<DividendEvent[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const endpoint = "yahoo:dividend-events";
    const allowed = await rateLimiter.checkLimit(endpoint);

    if (!allowed) {
      logger.warn(
        "Rate limit exceeded for dividend events, serving stale cache if available"
      );
      const stale = cacheService.get<DividendEvent[]>(cacheKey);
      if (stale) return stale;

      throw new Error("Rate limit exceeded and no cached data available");
    }

    const data = await yahooFinanceService.getDividendCalendar();
    rateLimiter.recordCall(endpoint);

    cacheService.set(cacheKey, data, this.cacheTTL);

    return data;
  }

  /**
   * Get IPO calendar events with caching and rate limiting
   */
  async getIPOEvents(
    startDate?: string,
    endDate?: string
  ): Promise<IPOEvent[]> {
    const cacheKey = `market:ipo-events:${startDate || "default"}:${endDate || "default"}`;

    const cached = cacheService.get<IPOEvent[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const endpoint = "yahoo:ipo-events";
    const allowed = await rateLimiter.checkLimit(endpoint);

    if (!allowed) {
      logger.warn(
        "Rate limit exceeded for IPO events, serving stale cache if available"
      );
      const stale = cacheService.get<IPOEvent[]>(cacheKey);
      if (stale) return stale;

      throw new Error("Rate limit exceeded and no cached data available");
    }

    const data = await yahooFinanceService.getIPOCalendar(startDate, endDate);
    rateLimiter.recordCall(endpoint);

    cacheService.set(cacheKey, data, this.cacheTTL);

    return data;
  }

  /**
   * Get sector performance (placeholder - would integrate with sector data API)
   */
  async getSectorPerformance(period: string = "1d"): Promise<SectorData[]> {
    const cacheKey = `market:sectors:${period}`;

    const cached = cacheService.get<SectorData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await yahooFinanceService.getSectorPerformance(period);

    cacheService.set(cacheKey, data, this.cacheTTL);

    return data;
  }

  /**
   * Get ETF performance data grouped by category
   */
  async getETFPerformance(period: string = "1d"): Promise<ETFData[]> {
    const cacheKey = `market:etfs:${period}`;

    const cached = cacheService.get<ETFData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await yahooFinanceService.getETFPerformance(period);

    cacheService.set(cacheKey, data, this.cacheTTL);

    return data;
  }

  /**
   * Get cryptocurrency performance data
   */
  async getCryptoPerformance(period: string = "1d"): Promise<CryptoData[]> {
    const cacheKey = `market:crypto:${period}`;

    const cached = cacheService.get<CryptoData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await yahooFinanceService.getCryptoPerformance(period);

    cacheService.set(cacheKey, data, this.cacheTTL);

    return data;
  }

  async getStockPerformance(period: string = "1d"): Promise<StockData[]> {
    const cacheKey = `market:stocks:${period}`;

    const cached = cacheService.get<StockData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await yahooFinanceService.getStockPerformance(period);

    cacheService.set(cacheKey, data, this.cacheTTL);

    return data;
  }

  /**
   * Invalidate cache for a symbol
   */
  async invalidateCache(symbol: string): Promise<void> {
    cacheService.invalidateSymbol(symbol);
    logger.info("Cache invalidated for symbol", { symbol });
  }

  /**
   * Calculate technical indicators from price data
   */
  private calculateIndicators(priceData: PriceData[]): TechnicalIndicators {
    if (priceData.length === 0) {
      return this.getDefaultIndicators();
    }

    const closes = priceData.map((p) => p.close);
    const currentPrice = closes[closes.length - 1];

    // Calculate indicators using dedicated module
    const rsi = calcRSI(closes);
    const ma50 = calculateSMA(closes, 50);
    const ma200 = calculateSMA(closes, 200);
    const macd = calcMACD(closes);
    const bb = calcBB(closes);

    // Determine signals
    const rsiSignal = getRSISignal(rsi);
    const macdSignal = getMACDSignal(macd.histogram);
    const maSignal = getMASignal(currentPrice, ma50);
    const bbSignal = getBollingerSignal(currentPrice, bb.upper, bb.lower);

    const overallSentiment = getOverallSentiment([
      rsiSignal,
      macdSignal,
      maSignal,
      bbSignal,
    ]);

    return {
      rsi: { value: rsi, signal: rsiSignal },
      macd: {
        value: macd.value,
        signal: macd.signal,
        histogram: macd.histogram,
        trend: macdSignal,
      },
      movingAverages: { ma50, ma200, signal: maSignal },
      bollingerBands: {
        upper: bb.upper,
        middle: bb.middle,
        lower: bb.lower,
        signal: bbSignal,
      },
      overallSentiment,
    };
  }

  /**
   * Calculate seasonal patterns from historical data
   */
  private calculateSeasonalPatterns(priceData: PriceData[]): SeasonalData {
    const heatmap: Array<{ year: number; month: number; return: number }> = [];
    const monthlyReturns: Record<number, number[]> = {};

    // Group by year and month
    for (let i = 1; i < priceData.length; i++) {
      const date = new Date(priceData[i].timestamp);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const prevClose = priceData[i - 1].close;
      const currClose = priceData[i].close;
      const returnPct = ((currClose - prevClose) / prevClose) * 100;

      heatmap.push({ year, month, return: returnPct });

      if (!monthlyReturns[month]) monthlyReturns[month] = [];
      monthlyReturns[month].push(returnPct);
    }

    // Calculate average by month
    const averageByMonth: Record<number, number> = {};
    for (const month in monthlyReturns) {
      const returns = monthlyReturns[month];
      averageByMonth[month] =
        returns.reduce((sum, val) => sum + val, 0) / returns.length;
    }

    return { heatmap, averageByMonth };
  }

  /**
   * Get default indicators when data is insufficient
   */
  private getDefaultIndicators(): TechnicalIndicators {
    return {
      rsi: { value: 50, signal: "fair" },
      macd: { value: 0, signal: 0, histogram: 0, trend: "fair" },
      movingAverages: { ma50: 0, ma200: 0, signal: "fair" },
      bollingerBands: { upper: 0, middle: 0, lower: 0, signal: "fair" },
      overallSentiment: "fair",
    };
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService();
