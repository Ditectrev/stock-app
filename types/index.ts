/**
 * Shared TypeScript types and interfaces
 * Core types used throughout the application
 */

// ============================================================================
// User and Authentication Types
// ============================================================================

export type AuthProvider = "apple" | "google" | "email";

export interface User {
  id: string;
  email: string;
  name?: string;
  authProvider: AuthProvider;
  pricingTier: PricingTier;
  subscription?: Subscription;
  preferences: UserPreferences;
  watchlist: string[];
  createdAt: Date;
  lastLoginAt: Date;
}

export interface UserPreferences {
  defaultTimeRange: TimeRange;
  defaultChartType: ChartType;
  enabledIndicators: string[];
  theme: "light" | "dark" | "auto";
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  earnings: boolean;
  dividends: boolean;
  priceAlerts: boolean;
  economicEvents: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  sessionSecret?: string;
  error?: string;
}

// ============================================================================
// Market Data Types
// ============================================================================

export type TimeRange = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y" | "YTD" | "Max";
export type ChartType = "line" | "area" | "candlestick";

export interface SymbolData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  volume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  lastUpdated: Date;
}

export interface PriceData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: {
    value: number;
    signal: "overpriced" | "underpriced" | "fair";
  };
  macd: {
    value: number;
    signal: number;
    histogram: number;
    trend: "overpriced" | "underpriced" | "fair";
  };
  movingAverages: {
    ma50: number;
    ma200: number;
    signal: "overpriced" | "underpriced" | "fair";
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    signal: "overpriced" | "underpriced" | "fair";
  };
  overallSentiment: "overpriced" | "underpriced" | "fair";
}

export interface ForecastData {
  priceTargets: {
    low: number;
    average: number;
    high: number;
  };
  analystRatings: {
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  };
  epsForecasts: Array<{
    quarter: string;
    estimate: number;
    actual?: number;
    surprise?: number;
    surprisePercent?: number;
  }>;
  revenueForecasts: Array<{
    quarter: string;
    estimate: number;
    actual?: number;
  }>;
}

export interface SeasonalData {
  heatmap: Array<{
    year: number;
    month: number;
    return: number;
  }>;
  averageByMonth: Record<number, number>;
}

export interface FinancialData {
  keyFacts: {
    revenue: number;
    netIncome: number;
    profitMargin: number;
  };
  valuation: {
    peRatio: number;
    pbRatio: number;
    pegRatio: number;
  };
  growth: {
    revenueGrowth: number;
    earningsGrowth: number;
  };
  profitability: {
    roe: number;
    roa: number;
    operatingMargin: number;
  };
}

export interface FearGreedData {
  value: number;
  label: "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed";
  timestamp: Date;
  history: Array<{
    date: Date;
    value: number;
  }>;
}

export interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  region: "Americas" | "Asia-Pacific" | "Europe";
}

export interface SectorData {
  sector: string;
  performance: number;
  changePercent: number;
  constituents: number;
  topHoldings?: string[];
}

// ============================================================================
// Trial Types
// ============================================================================

export interface TrialSession {
  id: string;
  deviceFingerprint: string;
  ipAddress?: string;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  createdAt: Date;
}

export interface TrialStatus {
  isActive: boolean;
  remainingSeconds: number;
  hasUsedTrial: boolean;
}

// ============================================================================
// Subscription and Pricing Types
// ============================================================================

export type PricingTier = "FREE" | "ADS_FREE" | "LOCAL" | "BYOK" | "HOSTED_AI";

export interface PricingTierInfo {
  tier: PricingTier;
  name: string;
  description: string;
  features: string[];
  price: number;
  billingPeriod: "monthly" | "yearly";
}

export interface Subscription {
  id: string;
  userId: string;
  tier: PricingTier;
  status: "active" | "cancelled" | "expired" | "past_due";
  startDate: Date;
  endDate?: Date;
  billingPeriod: "monthly" | "yearly";
  amount: number;
  currency: string;
  paymentMethod: string;
  aiConfig?: AIConfig;
}

export type AIProvider =
  | "OLLAMA"
  | "OPENAI"
  | "GEMINI"
  | "MISTRAL"
  | "DEEPSEEK"
  | "HOSTED";

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  settings: Record<string, any>;
}

// ============================================================================
// Calendar Types
// ============================================================================

export interface EconomicEvent {
  id: string;
  name: string;
  country: string;
  date: Date;
  time?: string;
  importance: "high" | "medium" | "low";
  description: string;
  previous?: string;
  forecast?: string;
  actual?: string;
}

export interface EarningsEvent {
  id: string;
  symbol: string;
  companyName: string;
  date: Date;
  time?: string;
  epsEstimate?: number;
  epsActual?: number;
  epsSurprise?: number;
  epsSurprisePercent?: number;
  revenueEstimate?: number;
  revenueActual?: number;
}

export interface DividendEvent {
  id: string;
  symbol: string;
  companyName: string;
  amount: number;
  exDividendDate: Date;
  paymentDate: Date;
  recordDate?: Date;
  yield: number;
  frequency: "monthly" | "quarterly" | "semi-annual" | "annual";
  country?: string;
  timezone?: string;
}

export interface IPOEvent {
  id: string;
  companyName: string;
  symbol?: string;
  expectedDate: Date;
  priceRangeLow?: number;
  priceRangeHigh?: number;
  sharesOffered?: number;
  exchange: string;
  underwriters?: string[];
}

// ============================================================================
// Heatmap and Screener Types
// ============================================================================

export interface HeatmapData {
  symbol: string;
  name: string;
  value: number;
  changePercent: number;
  sector?: string;
  category?: string;
  marketCap?: number;
}

export interface ETFData {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  category: string;
  marketCap?: number;
}

export interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  category: string;
  marketCap?: number;
}

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  sector: string;
  marketCap?: number;
  volume?: number;
  peRatio?: number;
  pbRatio?: number;
  pegRatio?: number;
  dividendYield?: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
}

export type ValuationContext = "overpriced" | "underpriced" | "fair";

export interface ScreenerFilter {
  field: string;
  operator: "gt" | "lt" | "eq" | "gte" | "lte" | "between" | "in";
  value: number | string | [number, number] | string[];
  label: string;
}

export interface ScreenerPreset {
  id: string;
  name: string;
  description: string;
  filters: ScreenerFilter[];
  isDefault: boolean;
  userId?: string;
  createdAt: Date;
}

export interface ScreenerResult {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio?: number;
  pbRatio?: number;
  pegRatio?: number;
  dividendYield?: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
  valuationContext: ValuationContext;
  matchScore: number;
}

// ============================================================================
// Chart and Visualization Types
// ============================================================================

export interface ChartIndicator {
  type: "MA" | "EMA" | "RSI" | "MACD" | "BB";
  period?: number;
  color?: string;
  visible: boolean;
}

export interface VisualAnnotation {
  type: "highlight" | "arrow" | "circle" | "label";
  target: string;
  position: { x: number; y: number };
  label?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface CachedData<T> {
  data: T;
  cachedAt: Date;
  expiresAt: Date;
}

export interface AIPredictionFactors {
  technical: string[];
  valuation: string[];
  sentiment: string[];
  macro: string[];
  globalMarkets: string[];
  risks: string[];
}

export interface AIPredictionSymbolSpecific {
  title: string;
  bullets: string[];
}

export interface AIPredictionReport {
  symbol: string;
  assetType: "stock" | "crypto" | "commodity" | "forex" | "etf" | "unknown";
  generatedAt: Date;
  recommendation: "buy" | "hold" | "sell";
  confidence: number;
  summary: string;
  factors: AIPredictionFactors;
  symbolSpecific?: AIPredictionSymbolSpecific | null;
}

export interface StockOfTheDay {
  generatedAt: Date;
  symbol: string;
  name: string;
  assetType: "stock" | "crypto" | "commodity" | "forex" | "etf" | "unknown";
  recommendation: "buy" | "hold" | "sell";
  confidence: number;
  rationale: string[];
}

export interface StockOfTheDayResult {
  generatedAt: Date;
  buy: StockOfTheDay;
  sell: StockOfTheDay;
}
