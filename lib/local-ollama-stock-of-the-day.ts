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
const LOCAL_OLLAMA_TAGS_URL = "http://localhost:11434/api/tags";

type StockOfTheDayApiResponse = {
  data?: StockOfTheDayResult;
  error?: string;
};

type OllamaGenerateResponse = {
  response?: string;
};

type OllamaTagsResponse = {
  models?: Array<{ name?: string; modified_at?: string }>;
};

export function shouldUseBrowserLocalOllama(
  pricingTier: PricingTier | null
): boolean {
  const provider = readStoredExplanationProvider();
  return (
    pricingTier === "LOCAL" || (pricingTier === "BYOK" && provider === "OLLAMA")
  );
}

/**
 * When the app runs on `localhost` / `127.0.0.1`, the Next server can reach
 * `http://localhost:11434` without browser CORS. AI prediction already uses
 * that path; match it here so dev does not require Ollama CORS headers.
 *
 * On a deployed origin (e.g. Vercel), the server cannot see the user's Ollama,
 * so we call Ollama from the browser instead (requires Ollama to allow that origin).
 */
function isAppOpenedOnLoopbackHost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1";
}

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
    const model = await resolveBrowserLocalOllamaModel(controller.signal);
    const response = await fetch(LOCAL_OLLAMA_GENERATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
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
    const corsHint =
      'If you opened the app from a deployed URL, allow that origin in Ollama and restart Ollama. Example on macOS/Linux shell: OLLAMA_ORIGINS="https://theopenstock.com" ollama serve. If you see \'127.0.0.1:11434: bind: address already in use\', Ollama is already running; quit the existing process/app or see https://github.com/ollama/ollama/issues/707. For the Ollama desktop app on macOS: launchctl setenv OLLAMA_ORIGINS "https://theopenstock.com", then fully restart Ollama. Or run the app on http://localhost so the server can call Ollama instead.';
    throw new Error(
      `Could not reach local Ollama at http://localhost:11434 from the browser (${detail}). ${corsHint}`
    );
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function resolveBrowserLocalOllamaModel(
  signal: AbortSignal
): Promise<string> {
  const response = await fetch(LOCAL_OLLAMA_TAGS_URL, { signal });
  if (!response.ok) {
    throw new Error(`Local Ollama model list returned HTTP ${response.status}`);
  }

  const data = (await response.json()) as OllamaTagsResponse;
  const models = (data.models ?? [])
    .filter((model): model is { name: string; modified_at?: string } =>
      Boolean(model.name)
    )
    .sort((a, b) => {
      const aTime = Date.parse(a.modified_at ?? "");
      const bTime = Date.parse(b.modified_at ?? "");
      return (
        (Number.isFinite(bTime) ? bTime : 0) -
        (Number.isFinite(aTime) ? aTime : 0)
      );
    });
  const selected = models[0]?.name;

  if (!selected) {
    throw new Error(
      "No Ollama models are installed. Install one with `ollama pull llama3.2` or another model, then refresh the page."
    );
  }

  return selected;
}
