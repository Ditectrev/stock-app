"use client";

import { useEffect, useState } from "react";
import { usePricingTier } from "@/lib/use-pricing-tier";
import { EXPLANATIONS_PROVIDER_CHANGED_EVENT } from "@/lib/explanation-provider";
import { fetchStockOfTheDayForCurrentProvider } from "@/lib/local-ollama-stock-of-the-day";
import { MARKET_UI_COPY } from "@/lib/market-ui-copy";
import { DNA_BODY_SECONDARY, DNA_DISPLAY, DNA_PAGE_STACK } from "@/lib/design-dna";
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
          err instanceof Error ? err.message : MARKET_UI_COPY.load.stockOfTheDay
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
    <div className={DNA_PAGE_STACK} data-testid="stock-of-the-day-page">
      <header className="space-y-2">
        <h1 className={DNA_DISPLAY}>Stock of the day</h1>
        <p className={DNA_BODY_SECONDARY}>
          AI-ranked daily opportunity across stocks and select liquid assets.
        </p>
      </header>

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
