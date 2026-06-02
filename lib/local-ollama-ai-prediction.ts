"use client";

import {
  generateWithBrowserLocalOllama,
  isAppOpenedOnLoopbackHost,
  shouldUseBrowserLocalOllama,
} from "@/lib/browser-local-ollama";
import {
  AI_PREDICTION_MAX_OUTPUT_TOKENS,
  buildAIPredictionPrompt,
  type AIPredictionMarketSnapshot,
} from "@/lib/ai-prediction";
import { getAIProviderHeaders } from "@/lib/explanation-provider";
import { MARKET_UI_COPY } from "@/lib/market-ui-copy";
import type { AIPredictionReport, PricingTier } from "@/types";

type PredictionApiResponse = {
  data?: AIPredictionReport;
  error?: string;
};

type SnapshotApiResponse = {
  data?: AIPredictionMarketSnapshot;
  error?: string;
};

export async function fetchAIPredictionForCurrentProvider(
  symbol: string,
  pricingTier: PricingTier | null
): Promise<AIPredictionReport | null> {
  const useLocalOllama = shouldUseBrowserLocalOllama(pricingTier);
  if (useLocalOllama && !isAppOpenedOnLoopbackHost()) {
    return fetchAIPredictionWithBrowserLocalOllama(symbol);
  }

  return fetchAIPredictionViaServerGet(symbol);
}

async function fetchAIPredictionViaServerGet(
  symbol: string
): Promise<AIPredictionReport | null> {
  const response = await fetch(`/api/market/ai-prediction/${symbol}`, {
    headers: getAIProviderHeaders(),
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(body.error ?? MARKET_UI_COPY.load.aiPrediction);
  }

  const result = (await response.json()) as PredictionApiResponse;
  return result.data ?? null;
}

async function fetchAIPredictionWithBrowserLocalOllama(
  symbol: string
): Promise<AIPredictionReport | null> {
  const snapshotResponse = await fetch(
    `/api/market/ai-prediction/${symbol}/snapshot`,
    {
      headers: getAIProviderHeaders(),
      credentials: "include",
      cache: "no-store",
    }
  );

  if (!snapshotResponse.ok) {
    const body = (await snapshotResponse.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(body.error ?? MARKET_UI_COPY.load.aiPredictionMarketData);
  }

  const snapshotResult = (await snapshotResponse.json()) as SnapshotApiResponse;
  const snapshot = snapshotResult.data;
  if (!snapshot) {
    throw new Error("Market data for AI prediction was empty.");
  }

  const prompt = buildAIPredictionPrompt(snapshot);
  const raw = await generateWithBrowserLocalOllama(prompt, {
    timeoutMs: 120000,
    numPredict: AI_PREDICTION_MAX_OUTPUT_TOKENS,
    jsonFormat: true,
  });

  const response = await fetch(`/api/market/ai-prediction/${symbol}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ai-provider": "OLLAMA",
    },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(body.error ?? MARKET_UI_COPY.load.aiPredictionValidate);
  }

  const result = (await response.json()) as PredictionApiResponse;
  return result.data ?? null;
}
