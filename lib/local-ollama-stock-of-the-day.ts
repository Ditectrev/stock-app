"use client";

import {
  getAIProviderHeaders,
  readStoredExplanationProvider,
} from "@/lib/explanation-provider";
import {
  parseStockOfTheDayCandidates,
  STOCK_OF_THE_DAY_CANDIDATES_PROMPT,
} from "@/lib/stock-of-the-day-ai";
import type { PricingTier, StockOfTheDayResult } from "@/types";

const LOCAL_OLLAMA_GENERATE_URL = "http://localhost:11434/api/generate";
const LOCAL_OLLAMA_MODEL = "llama3.2";

type StockOfTheDayApiResponse = {
  data?: StockOfTheDayResult;
  error?: string;
};

type OllamaGenerateResponse = {
  response?: string;
};

export function shouldUseBrowserLocalOllama(
  pricingTier: PricingTier | null
): boolean {
  const provider = readStoredExplanationProvider();
  return (
    pricingTier === "LOCAL" || (pricingTier === "BYOK" && provider === "OLLAMA")
  );
}

export async function fetchStockOfTheDayForCurrentProvider(
  pricingTier: PricingTier | null
): Promise<StockOfTheDayResult | null> {
  if (shouldUseBrowserLocalOllama(pricingTier)) {
    return fetchStockOfTheDayWithBrowserLocalOllama();
  }

  const response = await fetch("/api/market/stock-of-the-day", {
    headers: getAIProviderHeaders(),
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(body.error ?? "Failed to load stock of the day");
  }

  const result = (await response.json()) as StockOfTheDayApiResponse;
  return result.data ?? null;
}

async function fetchStockOfTheDayWithBrowserLocalOllama(): Promise<StockOfTheDayResult | null> {
  const raw = await generateWithBrowserLocalOllama();
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
    throw new Error(
      body.error ?? "Failed to validate local stock-of-the-day candidates"
    );
  }

  const result = (await response.json()) as StockOfTheDayApiResponse;
  return result.data ?? null;
}

async function generateWithBrowserLocalOllama(): Promise<string> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(LOCAL_OLLAMA_GENERATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LOCAL_OLLAMA_MODEL,
        prompt: STOCK_OF_THE_DAY_CANDIDATES_PROMPT,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Local Ollama returned HTTP ${response.status}`);
    }

    const data = (await response.json()) as OllamaGenerateResponse;
    if (!data.response) {
      throw new Error("Local Ollama returned an empty response.");
    }

    return data.response;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        "Local Ollama timed out. Make sure Ollama is running at http://localhost:11434 and the model is available."
      );
    }

    const detail = error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `Could not reach local Ollama at http://localhost:11434. Make sure Ollama is running locally and allows browser requests. ${detail}`
    );
  } finally {
    window.clearTimeout(timeoutId);
  }
}
