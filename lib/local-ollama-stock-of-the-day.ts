"use client";

import {
  generateWithBrowserLocalOllama,
  isAppOpenedOnLoopbackHost,
  shouldUseBrowserLocalOllama,
} from "@/lib/browser-local-ollama";
import { getAIProviderHeaders } from "@/lib/explanation-provider";
import {
  parseStockOfTheDayCandidates,
  STOCK_OF_THE_DAY_CANDIDATES_PROMPT,
} from "@/lib/stock-of-the-day-ai";
import { MARKET_UI_COPY } from "@/lib/market-ui-copy";
import type { PricingTier, StockOfTheDayResult } from "@/types";

type StockOfTheDayApiResponse = {
  data?: StockOfTheDayResult;
  error?: string;
};

export { shouldUseBrowserLocalOllama };

export async function fetchStockOfTheDayForCurrentProvider(
  pricingTier: PricingTier | null
): Promise<StockOfTheDayResult | null> {
  const useLocalOllama = shouldUseBrowserLocalOllama(pricingTier);
  if (useLocalOllama && !isAppOpenedOnLoopbackHost()) {
    return fetchStockOfTheDayWithBrowserLocalOllama();
  }

  return fetchStockOfTheDayViaServerGet();
}

async function fetchStockOfTheDayViaServerGet(): Promise<StockOfTheDayResult | null> {
  const response = await fetch("/api/market/stock-of-the-day", {
    headers: getAIProviderHeaders(),
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(body.error ?? MARKET_UI_COPY.load.stockOfTheDay);
  }

  const result = (await response.json()) as StockOfTheDayApiResponse;
  return result.data ?? null;
}

async function fetchStockOfTheDayWithBrowserLocalOllama(): Promise<StockOfTheDayResult | null> {
  const raw = await generateWithBrowserLocalOllama(
    STOCK_OF_THE_DAY_CANDIDATES_PROMPT
  );
  const candidates = parseStockOfTheDayCandidates(raw);

  const response = await fetch("/api/market/stock-of-the-day", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ai-provider": "OLLAMA",
    },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(candidates),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(body.error ?? MARKET_UI_COPY.load.stockOfTheDayValidate);
  }

  const result = (await response.json()) as StockOfTheDayApiResponse;
  return result.data ?? null;
}
