/**
 * CNN Dataviz API Client
 * Handles Fear & Greed Index, world markets, and economic calendar data
 */

import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { retryWithBackoff } from "@/lib/retry";
import { FearGreedData, MarketIndex, EconomicEvent } from "@/types";

const CNN_BROWSER_HEADERS = {
  Accept: "application/json, text/plain, */*",
  Origin: "https://www.cnn.com",
  Referer: "https://www.cnn.com/markets/fear-and-greed",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

const CNN_FEAR_GREED_HISTORY_START = "2021-02-01";

function fearGreedLabelFromScore(value: number): FearGreedData["label"] {
  if (value <= 25) return "Extreme Fear";
  if (value <= 45) return "Fear";
  if (value <= 55) return "Neutral";
  if (value <= 75) return "Greed";
  return "Extreme Greed";
}

function fearGreedLabelFromRating(
  rating: unknown,
  score: number
): FearGreedData["label"] {
  const normalized = String(rating ?? "")
    .trim()
    .toLowerCase();
  if (normalized === "extreme fear") return "Extreme Fear";
  if (normalized === "fear") return "Fear";
  if (normalized === "neutral") return "Neutral";
  if (normalized === "greed") return "Greed";
  if (normalized === "extreme greed") return "Extreme Greed";
  return fearGreedLabelFromScore(score);
}

export class CNNApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = env.apis.cnnDatavizUrl;
  }

  /**
   * Fetch the CNN stock-market Fear & Greed Index (not the crypto index).
   * @param limit Number of historical data points to keep (0 = all available)
   */
  async getFearGreedIndex(limit: number = 30): Promise<FearGreedData> {
    return retryWithBackoff(async () => {
      try {
        const wantsFullHistory = limit === 0 || limit > 365;
        const url = wantsFullHistory
          ? `${this.baseUrl}/index/fearandgreed/graphdata/${CNN_FEAR_GREED_HISTORY_START}`
          : `${this.baseUrl}/index/fearandgreed/graphdata`;

        const response = await fetch(url, { headers: CNN_BROWSER_HEADERS });

        if (!response.ok) {
          throw new Error(
            `CNN Fear & Greed API error: ${response.status} ${response.statusText}`
          );
        }

        const json = await response.json();
        return this.parseFearGreedResponse(json, limit);
      } catch (error) {
        logger.error("Failed to fetch Fear & Greed Index", error as Error);
        throw error;
      }
    }, "CNN:FearGreedIndex");
  }

  /**
   * Fetch world markets data
   */
  async getWorldMarkets(): Promise<MarketIndex[]> {
    return retryWithBackoff(async () => {
      try {
        const response = await fetch(`${this.baseUrl}/world-markets`, {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `CNN API error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        return this.parseWorldMarketsResponse(data);
      } catch (error) {
        logger.error("Failed to fetch world markets", error as Error, {
          baseUrl: this.baseUrl,
        });
        throw error;
      }
    }, "CNN:WorldMarkets");
  }

  /**
   * Fetch economic calendar events
   */
  async getEconomicEvents(
    country?: string,
    importance?: "high" | "medium" | "low"
  ): Promise<EconomicEvent[]> {
    return retryWithBackoff(async () => {
      try {
        const params = new URLSearchParams();
        if (country) params.append("country", country);
        if (importance) params.append("importance", importance);

        const url = `${this.baseUrl}/economic-events${params.toString() ? `?${params.toString()}` : ""}`;

        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `CNN API error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        return this.parseEconomicEventsResponse(data);
      } catch (error) {
        logger.error("Failed to fetch economic events", error as Error, {
          baseUrl: this.baseUrl,
          country,
          importance,
        });
        throw error;
      }
    }, "CNN:EconomicEvents");
  }

  /**
   * Parse CNN Fear & Greed graphdata (stock-market index).
   */
  private parseFearGreedResponse(data: any, limit: number = 30): FearGreedData {
    const snapshot = data.fear_and_greed ?? data;
    const rawScore = snapshot.score ?? data.score ?? 50;
    const value = Math.round(Number(rawScore));
    const label = fearGreedLabelFromRating(snapshot.rating, value);

    const historicalEntries =
      data.fear_and_greed_historical?.data ||
      data.fear_and_greed?.history ||
      data.history ||
      [];

    const history = (historicalEntries as any[])
      .map((item) => {
        const timestamp = item.x ?? item.date ?? item.timestamp;
        const pointValue = item.y ?? item.score ?? item.value;
        return {
          date: new Date(timestamp),
          value: Math.round(Number(pointValue)),
        };
      })
      .filter(
        (item) =>
          !Number.isNaN(item.date.getTime()) && Number.isFinite(item.value)
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const trimmedHistory =
      limit > 0 ? history.slice(Math.max(0, history.length - limit)) : history;

    const snapshotTime = snapshot.timestamp
      ? new Date(snapshot.timestamp)
      : trimmedHistory.at(-1)?.date || new Date();

    return {
      value: Number.isFinite(value) ? value : 50,
      label,
      timestamp: snapshotTime,
      history: trimmedHistory,
    };
  }

  /**
   * Parse world markets response
   */
  private parseWorldMarketsResponse(data: any): MarketIndex[] {
    const markets = data.markets || data.indices || [];

    return markets.map((market: any) => {
      let region: MarketIndex["region"] = "Americas";

      // Determine region based on market name or symbol
      const name = (market.name || "").toLowerCase();
      const symbol = (market.symbol || "").toLowerCase();

      if (
        name.includes("asia") ||
        name.includes("nikkei") ||
        name.includes("hang seng") ||
        symbol.includes("hsi") ||
        symbol.includes("nikkei")
      ) {
        region = "Asia-Pacific";
      } else if (
        name.includes("europe") ||
        name.includes("ftse") ||
        name.includes("dax") ||
        symbol.includes("ftse") ||
        symbol.includes("dax")
      ) {
        region = "Europe";
      }

      return {
        name: market.name || market.indexName,
        symbol: market.symbol || market.ticker,
        value: parseFloat(market.value || market.price || 0),
        change: parseFloat(market.change || market.changeAmount || 0),
        changePercent: parseFloat(
          market.changePercent || market.changePct || 0
        ),
        region,
      };
    });
  }

  /**
   * Parse economic events response
   */
  private parseEconomicEventsResponse(data: any): EconomicEvent[] {
    const events = data.events || data.calendar || [];

    return events.map((event: any, index: number) => ({
      id: event.id || `event-${index}`,
      name: event.name || event.title || event.event,
      country: event.country || "US",
      date: new Date(event.date || event.timestamp),
      time: event.time,
      importance: event.importance || "medium",
      description: event.description || event.details || "",
      previous: event.previous,
      forecast: event.forecast || event.estimate,
      actual: event.actual,
    }));
  }
}

// Export singleton instance
export const cnnApiService = new CNNApiService();
