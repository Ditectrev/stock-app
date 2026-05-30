"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SymbolData,
  PriceData,
  TechnicalIndicators,
  ForecastData,
  SeasonalData,
  FinancialData,
  TimeRange,
  AIPredictionReport,
  StockOfTheDayResult,
} from "@/types";
import { SymbolHeader } from "@/components/SymbolHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { HOME_PRIMARY_BUTTON } from "@/lib/home-ui";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { usePricingTier } from "@/lib/use-pricing-tier";
import { EXPLANATIONS_PROVIDER_CHANGED_EVENT } from "@/lib/explanation-provider";
import { fetchAIPredictionForCurrentProvider } from "@/lib/local-ollama-ai-prediction";
import { fetchStockOfTheDayForCurrentProvider } from "@/lib/local-ollama-stock-of-the-day";
import { AIPredictionPanel } from "@/components/AIPredictionPanel";
import { HomeHub } from "@/components/HomeHub";
import { StockOfTheDayPanel } from "@/components/StockOfTheDayPanel";
const OverviewTab = dynamic(
  () => import("@/components/OverviewTab").then((m) => m.OverviewTab),
  {
    loading: () => <LoadingSpinner size="md" message="Loading overview..." />,
    ssr: false,
  }
);

const TechnicalIndicatorsDisplay = dynamic(
  () =>
    import("@/components/TechnicalIndicatorsDisplay").then(
      (m) => m.TechnicalIndicatorsDisplay
    ),
  {
    loading: () => <LoadingSpinner size="md" message="Loading technicals..." />,
    ssr: false,
  }
);

const ForecastDisplay = dynamic(
  () => import("@/components/ForecastDisplay").then((m) => m.ForecastDisplay),
  {
    loading: () => <LoadingSpinner size="md" message="Loading forecasts..." />,
    ssr: false,
  }
);

const SeasonalHeatmap = dynamic(
  () => import("@/components/SeasonalHeatmap").then((m) => m.SeasonalHeatmap),
  {
    loading: () => <LoadingSpinner size="md" message="Loading seasonals..." />,
    ssr: false,
  }
);

const FinancialsTable = dynamic(
  () => import("@/components/FinancialsTable").then((m) => m.FinancialsTable),
  {
    loading: () => <LoadingSpinner size="md" message="Loading financials..." />,
    ssr: false,
  }
);

const FearGreedGauge = dynamic(
  () => import("@/components/FearGreedGauge").then((m) => m.FearGreedGauge),
  {
    loading: () => (
      <div style={{ minHeight: 320 }}>
        <LoadingSpinner size="md" message="Loading Fear & Greed..." />
      </div>
    ),
    ssr: false,
  }
);

const WorldMarkets = dynamic(
  () => import("@/components/WorldMarkets").then((m) => m.WorldMarkets),
  {
    loading: () => (
      <div style={{ minHeight: 300 }}>
        <LoadingSpinner size="md" message="Loading world markets..." />
      </div>
    ),
    ssr: false,
  }
);

type TabType =
  | "overview"
  | "financials"
  | "technicals"
  | "forecasts"
  | "seasonals";

export function HomePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pricingTier = usePricingTier();
  const [serverTier, setServerTier] = useState<
    "FREE" | "ADS_FREE" | "LOCAL" | "BYOK" | "HOSTED_AI" | null
  >(null);
  const [serverBYOKAccess, setServerBYOKAccess] = useState<boolean | null>(
    null
  );
  const symbolFromUrl = searchParams.get("symbol");
  const effectiveTier = serverTier ?? pricingTier;
  const hasTierAccess =
    effectiveTier === "LOCAL" ||
    effectiveTier === "BYOK" ||
    effectiveTier === "HOSTED_AI";
  const hasAIAccess = hasTierAccess || serverBYOKAccess === true;

  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [symbolData, setSymbolData] = useState<SymbolData | null>(null);
  const [historicalData, setHistoricalData] = useState<PriceData[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("1M");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [technicalIndicators, setTechnicalIndicators] =
    useState<TechnicalIndicators | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [seasonalData, setSeasonalData] = useState<SeasonalData | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData | null>(
    null
  );
  const [aiPrediction, setAIPrediction] = useState<AIPredictionReport | null>(
    null
  );
  const [aiPredictionLoading, setAIPredictionLoading] = useState(false);
  const [aiPredictionError, setAIPredictionError] = useState<string | null>(
    null
  );
  const [stockOfTheDay, setStockOfTheDay] =
    useState<StockOfTheDayResult | null>(null);
  const [stockOfTheDayLoading, setStockOfTheDayLoading] = useState(false);
  const [stockOfTheDayError, setStockOfTheDayError] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (symbolFromUrl && symbolFromUrl.trim()) {
      setSelectedSymbol(symbolFromUrl.trim().toUpperCase());
    } else {
      setSelectedSymbol(null);
    }
  }, [symbolFromUrl]);

  const clearSymbol = () => {
    setSelectedSymbol(null);
    router.replace("/", { scroll: false });
  };

  useEffect(() => {
    const fetchSymbolData = async () => {
      if (!selectedSymbol) return;

      setLoading(true);
      setError(null);

      try {
        const symbolResponse = await fetch(
          `/api/market/symbol/${selectedSymbol}`
        );
        if (!symbolResponse.ok) {
          const body = (await symbolResponse.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? "Failed to fetch symbol data");
        }
        const symbolResult = await symbolResponse.json();
        setSymbolData(symbolResult.data);

        const historicalResponse = await fetch(
          `/api/market/historical/${selectedSymbol}?range=${timeRange}`
        );
        if (!historicalResponse.ok) {
          throw new Error("Failed to fetch historical data");
        }
        const historicalResult = await historicalResponse.json();
        setHistoricalData(historicalResult.data);

        const indicatorsResponse = await fetch(
          `/api/market/indicators/${selectedSymbol}`
        );
        if (indicatorsResponse.ok) {
          const indicatorsResult = await indicatorsResponse.json();
          setTechnicalIndicators(indicatorsResult.data);
        }

        const forecastResponse = await fetch(
          `/api/market/forecast/${selectedSymbol}`
        );
        if (forecastResponse.ok) {
          const forecastResult = await forecastResponse.json();
          setForecastData(forecastResult.data);
        }

        const seasonalResponse = await fetch(
          `/api/market/seasonal/${selectedSymbol}`
        );
        if (seasonalResponse.ok) {
          const seasonalResult = await seasonalResponse.json();
          setSeasonalData(seasonalResult.data);
        }

        const financialsResponse = await fetch(
          `/api/market/financials/${selectedSymbol}`
        );
        if (financialsResponse.ok) {
          const financialsResult = await financialsResponse.json();
          setFinancialData(financialsResult.data);
        }
      } catch (err) {
        console.error("Error fetching symbol data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load symbol data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSymbolData();
  }, [selectedSymbol, timeRange]);

  useEffect(() => {
    const loadTier = async () => {
      try {
        const response = await fetch("/api/subscription/current", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) {
          setServerTier("FREE");
          return;
        }
        const data = (await response.json()) as {
          data?: {
            tier?: "FREE" | "ADS_FREE" | "LOCAL" | "BYOK" | "HOSTED_AI";
          };
        };
        setServerTier(data.data?.tier ?? "FREE");
      } catch {
        setServerTier("FREE");
      }
    };

    void loadTier();
    const onAuthChanged = () => void loadTier();
    if (typeof window !== "undefined") {
      window.addEventListener("auth-state-changed", onAuthChanged);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("auth-state-changed", onAuthChanged);
      }
    };
  }, []);

  useEffect(() => {
    const loadBYOKAccess = async () => {
      try {
        const response = await fetch("/api/ai/keys", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        setServerBYOKAccess(response.ok);
      } catch {
        setServerBYOKAccess(false);
      }
    };
    void loadBYOKAccess();
    const onAuthChanged = () => void loadBYOKAccess();
    if (typeof window !== "undefined") {
      window.addEventListener("auth-state-changed", onAuthChanged);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("auth-state-changed", onAuthChanged);
      }
    };
  }, []);

  const [aiProviderVersion, setAiProviderVersion] = useState(0);

  useEffect(() => {
    const onProviderChanged = () => setAiProviderVersion((v) => v + 1);
    window.addEventListener(
      EXPLANATIONS_PROVIDER_CHANGED_EVENT,
      onProviderChanged
    );
    return () =>
      window.removeEventListener(
        EXPLANATIONS_PROVIDER_CHANGED_EVENT,
        onProviderChanged
      );
  }, []);

  useEffect(() => {
    const fetchAIPrediction = async () => {
      if (!selectedSymbol || !hasAIAccess) {
        setAIPrediction(null);
        setAIPredictionError(null);
        return;
      }

      setAIPredictionLoading(true);
      try {
        const data = await fetchAIPredictionForCurrentProvider(
          selectedSymbol,
          effectiveTier
        );
        setAIPrediction(data);
        setAIPredictionError(null);
      } catch (error) {
        setAIPrediction(null);
        setAIPredictionError(
          error instanceof Error
            ? error.message
            : "Failed to fetch AI prediction"
        );
      } finally {
        setAIPredictionLoading(false);
      }
    };

    fetchAIPrediction();
  }, [selectedSymbol, hasAIAccess, aiProviderVersion, effectiveTier]);

  useEffect(() => {
    const fetchStockOfTheDay = async () => {
      if (!hasAIAccess || selectedSymbol) {
        setStockOfTheDay(null);
        setStockOfTheDayError(null);
        return;
      }

      setStockOfTheDayLoading(true);
      try {
        const data = await fetchStockOfTheDayForCurrentProvider(effectiveTier);
        setStockOfTheDay(data);
        setStockOfTheDayError(null);
      } catch (error) {
        setStockOfTheDay(null);
        setStockOfTheDayError(
          error instanceof Error
            ? error.message
            : "Failed to fetch stock of the day"
        );
      } finally {
        setStockOfTheDayLoading(false);
      }
    };

    fetchStockOfTheDay();
  }, [hasAIAccess, selectedSymbol, aiProviderVersion, effectiveTier]);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  return (
    <>
      {selectedSymbol && (
        <div className="mt-4 sm:mt-6 md:mt-8 lg:mt-10">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner
                size="lg"
                message={`Loading ${selectedSymbol}...`}
              />
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-12">
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 max-w-md mx-auto">
                <h2 className="text-xl font-semibold mb-2">
                  Error Loading Symbol
                </h2>
                <p className="mb-4">{error}</p>
                <button onClick={clearSymbol} className={HOME_PRIMARY_BUTTON}>
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {symbolData && !loading && !error && (
            <>
              <SymbolHeader symbolData={symbolData} />

              <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

              <div className="mt-6">
                {activeTab === "overview" && (
                  <OverviewTab
                    symbolData={symbolData}
                    historicalData={historicalData}
                    timeRange={timeRange}
                    onTimeRangeChange={handleTimeRangeChange}
                  />
                )}
                {activeTab === "financials" && (
                  <FinancialsTable financials={financialData} />
                )}
                {activeTab === "technicals" && (
                  <TechnicalIndicatorsDisplay
                    indicators={technicalIndicators}
                  />
                )}
                {activeTab === "forecasts" && (
                  <ForecastDisplay forecast={forecastData} />
                )}
                {activeTab === "seasonals" && (
                  <SeasonalHeatmap data={seasonalData} />
                )}
              </div>

              <AIPredictionPanel
                prediction={aiPrediction}
                loading={aiPredictionLoading}
                locked={!hasAIAccess}
                error={aiPredictionError}
                pricingTier={effectiveTier}
              />
            </>
          )}
        </div>
      )}

      {!selectedSymbol && (
        <div className="mt-6 sm:mt-8 md:mt-10 lg:mt-12">
          <HomeHub
            onSymbolSelect={(symbol) =>
              router.push(`/?symbol=${encodeURIComponent(symbol)}`)
            }
            fearGreed={<FearGreedGauge />}
            worldMarkets={<WorldMarkets />}
            stockOfTheDay={
              <StockOfTheDayPanel
                embedded
                showTitle={false}
                item={stockOfTheDay}
                loading={stockOfTheDayLoading}
                locked={!hasAIAccess}
                error={stockOfTheDayError}
                pricingTier={effectiveTier}
              />
            }
          />
        </div>
      )}
    </>
  );
}
