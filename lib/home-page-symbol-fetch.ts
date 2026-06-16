import { MARKET_UI_COPY } from "@/lib/market-ui-copy";
import type {
  FinancialData,
  ForecastData,
  PriceData,
  SeasonalData,
  SymbolData,
  TechnicalIndicators,
  TimeRange,
} from "@/types";

type MarketJsonResponse<T> = {
  data?: T;
  error?: string;
};

async function fetchMarketJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const body = (await response.json()) as MarketJsonResponse<T>;
    return body.data ?? null;
  } catch (error) {
    console.warn(`Market fetch failed (${url}):`, error);
    return null;
  }
}

export async function fetchHistoricalData(
  symbol: string,
  timeRange: TimeRange
): Promise<PriceData[]> {
  const response = await fetch(
    `/api/market/historical/${encodeURIComponent(symbol)}?range=${encodeURIComponent(timeRange)}`
  );

  if (!response.ok) {
    throw new Error(MARKET_UI_COPY.load.historicalData);
  }

  const body = (await response.json()) as MarketJsonResponse<PriceData[]>;
  return body.data ?? [];
}

export async function fetchPrimarySymbolData(
  symbol: string,
  timeRange: TimeRange
): Promise<{ symbolData: SymbolData; historicalData: PriceData[] }> {
  const [symbolResponse, historicalResponse] = await Promise.all([
    fetch(`/api/market/symbol/${encodeURIComponent(symbol)}`),
    fetch(
      `/api/market/historical/${encodeURIComponent(symbol)}?range=${encodeURIComponent(timeRange)}`
    ),
  ]);

  if (!symbolResponse.ok) {
    const body = (await symbolResponse.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(body.error ?? MARKET_UI_COPY.load.symbolData);
  }

  if (!historicalResponse.ok) {
    throw new Error(MARKET_UI_COPY.load.historicalData);
  }

  const [symbolResult, historicalResult] = await Promise.all([
    symbolResponse.json() as Promise<MarketJsonResponse<SymbolData>>,
    historicalResponse.json() as Promise<MarketJsonResponse<PriceData[]>>,
  ]);

  if (!symbolResult.data) {
    throw new Error(MARKET_UI_COPY.load.symbolData);
  }

  return {
    symbolData: symbolResult.data,
    historicalData: historicalResult.data ?? [],
  };
}

export type SecondarySymbolData = {
  technicalIndicators: TechnicalIndicators | null;
  forecastData: ForecastData | null;
  seasonalData: SeasonalData | null;
  financialData: FinancialData | null;
};

/** Best-effort secondary loads — one failure must not block the others. */
export async function fetchSecondarySymbolData(
  symbol: string
): Promise<SecondarySymbolData> {
  const encoded = encodeURIComponent(symbol);
  const [technicalIndicators, forecastData, seasonalData, financialData] =
    await Promise.all([
      fetchMarketJson<TechnicalIndicators>(`/api/market/indicators/${encoded}`),
      fetchMarketJson<ForecastData>(`/api/market/forecast/${encoded}`),
      fetchMarketJson<SeasonalData>(`/api/market/seasonal/${encoded}`),
      fetchMarketJson<FinancialData>(`/api/market/financials/${encoded}`),
    ]);

  return {
    technicalIndicators,
    forecastData,
    seasonalData,
    financialData,
  };
}
