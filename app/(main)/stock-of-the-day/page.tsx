"use client";

import { useEffect, useState } from "react";
import { usePricingTier } from "@/lib/use-pricing-tier";
import { EXPLANATIONS_PROVIDER_CHANGED_EVENT } from "@/lib/explanation-provider";
import { fetchStockOfTheDayForCurrentProvider } from "@/lib/local-ollama-stock-of-the-day";
import { StockOfTheDayPanel } from "@/components/StockOfTheDayPanel";
import type { StockOfTheDayResult } from "@/types";

export default function StockOfTheDayPage() {
  const pricingTier = usePricingTier();
  const [serverBYOKAccess, setServerBYOKAccess] = useState<boolean | null>(
    null
  );
  const hasTierAccess =
    pricingTier === "LOCAL" ||
    pricingTier === "BYOK" ||
    pricingTier === "HOSTED_AI";
  const hasAIAccess = hasTierAccess || serverBYOKAccess === true;

  const [item, setItem] = useState<StockOfTheDayResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
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
    const load = async () => {
      if (!hasAIAccess) {
        setItem(null);
        setLoadError(null);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchStockOfTheDayForCurrentProvider(pricingTier);
        setItem(data);
        setLoadError(null);
      } catch (err) {
        setItem(null);
        setLoadError(
          err instanceof Error ? err.message : "Failed to load stock of the day"
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [hasAIAccess, aiProviderVersion, pricingTier]);

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

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:text-3xl">
        Stock of the day
      </h1>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        AI-ranked daily opportunity across stocks and select liquid assets.
      </p>

      <StockOfTheDayPanel
        item={item}
        loading={loading}
        locked={!hasAIAccess}
        error={loadError}
        pricingTier={pricingTier}
      />
    </div>
  );
}
