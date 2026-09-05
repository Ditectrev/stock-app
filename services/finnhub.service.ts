import { logger } from "@/lib/logger";
import { retryWithBackoff } from "@/lib/retry";
import { PriceData, SymbolData, TimeRange } from "@/types";

const FINNHUB_BASE_URL =
  process.env.FINNHUB_BASE_URL?.trim() || "https://finnhub.io/api/v1";

function getFinnhubApiKey(): string | null {
  const key = process.env.FINNHUB_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

function requireFinnhubApiKey(): string {
  const apiKey = getFinnhubApiKey();
  if (!apiKey) {
    throw new Error(
      "Finnhub API key is not configured. Set FINNHUB_API_KEY to enable high-quality live quotes."
    );
  }
  return apiKey;
}

function toUnixSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/** Finnhub reports average trading volume in millions of shares. */
function averageVolumeToShares(value: unknown): number {
  const numeric = asFiniteNumber(value);
  if (numeric == null || numeric <= 0) return 0;
  return Math.round(numeric * 1_000_000);
}

function getRangeWindow(range: TimeRange): {
  from: number;
  to: number;
  resolution: string;
} {
  const now = new Date();
  const to = toUnixSeconds(now);
  const fromDate = new Date(now);

  switch (range) {
    case "1D":
      fromDate.setDate(now.getDate() - 1);
      return { from: toUnixSeconds(fromDate), to, resolution: "5" };
    case "1W":
      fromDate.setDate(now.getDate() - 7);
      return { from: toUnixSeconds(fromDate), to, resolution: "15" };
    case "1M":
      fromDate.setMonth(now.getMonth() - 1);
      return { from: toUnixSeconds(fromDate), to, resolution: "60" };
    case "3M":
      fromDate.setMonth(now.getMonth() - 3);
      return { from: toUnixSeconds(fromDate), to, resolution: "D" };
    case "1Y":
      fromDate.setFullYear(now.getFullYear() - 1);
      return { from: toUnixSeconds(fromDate), to, resolution: "D" };
    case "5Y":
      fromDate.setFullYear(now.getFullYear() - 5);
      return { from: toUnixSeconds(fromDate), to, resolution: "D" };
    case "YTD":
      fromDate.setMonth(0, 1);
      fromDate.setHours(0, 0, 0, 0);
      return { from: toUnixSeconds(fromDate), to, resolution: "D" };
    case "Max":
      fromDate.setFullYear(now.getFullYear() - 20);
      return { from: toUnixSeconds(fromDate), to, resolution: "M" };
    default:
      fromDate.setFullYear(now.getFullYear() - 1);
      return { from: toUnixSeconds(fromDate), to, resolution: "D" };
  }
}

export class FinnhubService {
  isConfigured(): boolean {
    return Boolean(getFinnhubApiKey());
  }

  async searchSymbols(
    query: string
  ): Promise<
    Array<{ symbol: string; name: string; type: string; exchange: string }>
  > {
    return retryWithBackoff(async () => {
      const apiKey = requireFinnhubApiKey();
      const response = await fetch(
        `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(query)}&token=${encodeURIComponent(apiKey)}`
      );
      if (!response.ok) {
        throw new Error(`Finnhub search failed: ${response.status}`);
      }
      const data = (await response.json()) as {
        result?: Array<{
          symbol?: string;
          description?: string;
          type?: string;
          mic?: string;
        }>;
      };

      const items = data.result ?? [];
      return items
        .filter((item) => Boolean(item.symbol))
        .slice(0, 20)
        .map((item) => ({
          symbol: item.symbol as string,
          name: item.description || item.symbol || "",
          type: item.type || "EQUITY",
          exchange: item.mic || "",
        }));
    }, `Finnhub:Search:${query}`);
  }

  async getSymbolQuote(symbol: string): Promise<SymbolData> {
    return retryWithBackoff(async () => {
      const apiKey = requireFinnhubApiKey();
      const upperSymbol = symbol.trim().toUpperCase();
      const token = encodeURIComponent(apiKey);
      const encodedSymbol = encodeURIComponent(upperSymbol);
      const candleFrom = toUnixSeconds(
        new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      );
      const candleTo = toUnixSeconds(new Date());

      const [quoteRes, profileRes, metricRes, candleRes] = await Promise.all([
        fetch(
          `${FINNHUB_BASE_URL}/quote?symbol=${encodedSymbol}&token=${token}`
        ),
        fetch(
          `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodedSymbol}&token=${token}`
        ),
        fetch(
          `${FINNHUB_BASE_URL}/stock/metric?symbol=${encodedSymbol}&metric=all&token=${token}`
        ),
        fetch(
          `${FINNHUB_BASE_URL}/stock/candle?symbol=${encodedSymbol}&resolution=D&from=${candleFrom}&to=${candleTo}&token=${token}`
        ),
      ]);

      if (!quoteRes.ok) {
        throw new Error(`Finnhub quote failed: ${quoteRes.status}`);
      }

      const quote = (await quoteRes.json()) as {
        c?: number;
        d?: number;
        dp?: number;
        h?: number;
        l?: number;
        pc?: number;
        t?: number;
      };

      const profile = profileRes.ok
        ? ((await profileRes.json()) as {
            name?: string;
            marketCapitalization?: number;
          })
        : {};

      const metricPayload = metricRes.ok
        ? ((await metricRes.json()) as {
            metric?: Record<string, unknown>;
          })
        : {};
      const metric = metricPayload.metric ?? {};

      const candles = candleRes.ok
        ? ((await candleRes.json()) as {
            s?: string;
            v?: number[];
          })
        : {};
      const latestCandleVolume =
        candles.s === "ok" && Array.isArray(candles.v)
          ? [...candles.v]
              .reverse()
              .find(
                (value) =>
                  asFiniteNumber(value) != null && (value as number) > 0
              )
          : undefined;

      if (!quote.c || quote.c <= 0) {
        throw new Error(`Finnhub returned no valid quote for ${upperSymbol}`);
      }

      const fiftyTwoWeekHigh =
        asFiniteNumber(metric["52WeekHigh"]) ??
        asFiniteNumber(metric["52WeekHighPrice"]) ??
        0;
      const fiftyTwoWeekLow =
        asFiniteNumber(metric["52WeekLow"]) ??
        asFiniteNumber(metric["52WeekLowPrice"]) ??
        0;
      const volume =
        asFiniteNumber(latestCandleVolume) ??
        averageVolumeToShares(metric["10DayAverageTradingVolume"]);

      return {
        symbol: upperSymbol,
        name: profile.name || upperSymbol,
        price: quote.c ?? 0,
        change: quote.d ?? 0,
        changePercent: quote.dp ?? 0,
        marketCap: profile.marketCapitalization
          ? Math.round(profile.marketCapitalization * 1_000_000)
          : 0,
        volume: volume ?? 0,
        fiftyTwoWeekHigh,
        fiftyTwoWeekLow,
        lastUpdated: quote.t ? new Date(quote.t * 1000) : new Date(),
      };
    }, `Finnhub:Quote:${symbol}`);
  }

  async getHistoricalData(
    symbol: string,
    range: TimeRange
  ): Promise<PriceData[]> {
    return retryWithBackoff(async () => {
      const apiKey = requireFinnhubApiKey();
      const upperSymbol = symbol.trim().toUpperCase();
      const { from, to, resolution } = getRangeWindow(range);
      const response = await fetch(
        `${FINNHUB_BASE_URL}/stock/candle?symbol=${encodeURIComponent(upperSymbol)}&resolution=${encodeURIComponent(resolution)}&from=${from}&to=${to}&token=${encodeURIComponent(apiKey)}`
      );

      if (!response.ok) {
        throw new Error(`Finnhub candles failed: ${response.status}`);
      }

      const data = (await response.json()) as {
        s?: string;
        t?: number[];
        o?: number[];
        h?: number[];
        l?: number[];
        c?: number[];
        v?: number[];
      };

      if (data.s !== "ok" || !data.t || !data.c) {
        throw new Error(
          `Finnhub returned no historical data for ${upperSymbol}`
        );
      }

      const points: PriceData[] = [];
      for (let i = 0; i < data.t.length; i++) {
        const close = data.c[i];
        if (close == null || !Number.isFinite(close) || close <= 0) continue;
        points.push({
          timestamp: new Date(data.t[i] * 1000),
          open: data.o?.[i] ?? close,
          high: data.h?.[i] ?? close,
          low: data.l?.[i] ?? close,
          close,
          volume: data.v?.[i] ?? 0,
        });
      }

      if (points.length === 0) {
        throw new Error(`Finnhub returned empty candles for ${upperSymbol}`);
      }

      return points;
    }, `Finnhub:Historical:${symbol}:${range}`);
  }
}

export const finnhubService = new FinnhubService();
