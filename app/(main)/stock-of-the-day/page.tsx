"use client";

import { useEffect, useState } from "react";
import { usePricingTier } from "@/lib/use-pricing-tier";
import {
  EXPLANATIONS_PROVIDER_CHANGED_EVENT,
  getAIProviderHeaders,
} from "@/lib/explanation-provider";
import { StockOfTheDayPanel } from "@/components/StockOfTheDayPanel";
import type { StockOfTheDay } from "@/types";

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

  const [item, setItem] = useState<StockOfTheDay | null>(null);
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
        const result = await response.json();
        setItem(result.data ?? null);
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
  }, [hasAIAccess, aiProviderVersion]);

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
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
        Stock of the day
      </h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
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
