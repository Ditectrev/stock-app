"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { PricingTier, PricingTierInfo } from "@/types";
import { AUTH_UI_COPY } from "@/lib/auth-ui-copy";
import { DNA_BODY } from "@/lib/design-dna";
import { MARKET_UP_TEXT } from "@/lib/market-semantics";
import { MARKET_UI_COPY } from "@/lib/market-ui-copy";

const PricingPage = dynamic(
  () => import("@/components/PricingPage").then((m) => m.PricingPage),
  {
    loading: () => <LoadingSpinner size="md" message="Loading pricing..." />,
    ssr: false,
  }
);

function PricingRouteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tiers, setTiers] = useState<PricingTierInfo[]>([]);
  const [currentTier, setCurrentTier] = useState<PricingTier>("FREE");
  const [message, setMessage] = useState<{
    text: string;
    tone: "success" | "warning";
  } | null>(null);

  const paidTierSet = useMemo(
    () => new Set<PricingTier>(["ADS_FREE", "LOCAL", "BYOK", "HOSTED_AI"]),
    []
  );

  const loadSubscriptionData = useCallback(async () => {
    try {
      const [tiersRes, currentRes] = await Promise.all([
        fetch("/api/subscription/tiers", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/subscription/current", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      if (tiersRes.ok) {
        const tiersData = (await tiersRes.json()) as {
          data?: PricingTierInfo[];
        };
        setTiers(tiersData.data ?? []);
      }
      if (currentRes.ok) {
        const currentData = (await currentRes.json()) as {
          data?: { tier?: PricingTier };
        };
        setCurrentTier(currentData.data?.tier ?? "FREE");
      }
    } catch {
      setMessage({
        text: MARKET_UI_COPY.load.pricingDetails,
        tone: "warning",
      });
    }
  }, []);

  useEffect(() => {
    void loadSubscriptionData();
  }, [loadSubscriptionData]);

  const checkoutSessionId = searchParams.get("session_id")?.trim() ?? "";

  useEffect(() => {
    if (!checkoutSessionId) return;

    let cancelled = false;

    const confirmAndRefresh = async () => {
      try {
        const res = await fetch("/api/stripe/confirm-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sessionId: checkoutSessionId }),
        });
        const payload = (await res.json()) as {
          success?: boolean;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !payload.success) {
          setMessage({
            text: payload.error ?? AUTH_UI_COPY.subscriptionConfirmFailed,
            tone: "warning",
          });
          return;
        }
        await loadSubscriptionData();
        if (!cancelled) {
          setMessage({
            text: "Subscription active. Thank you!",
            tone: "success",
          });
        }
      } catch {
        if (!cancelled) {
          setMessage({
            text: AUTH_UI_COPY.checkoutConfirmFailed,
            tone: "warning",
          });
        }
      } finally {
        if (!cancelled) {
          router.replace("/pricing", { scroll: false });
        }
      }
    };

    void confirmAndRefresh();
    return () => {
      cancelled = true;
    };
  }, [router, checkoutSessionId, loadSubscriptionData]);

  const handleSelectTier = async (tier: PricingTier) => {
    if (!paidTierSet.has(tier)) {
      setMessage({
        text: "Free tier is already active by default.",
        tone: "warning",
      });
      return;
    }
    setMessage(null);
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tier }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        data?: { url?: string };
        error?: string;
      };
      if (!response.ok || !payload.data?.url) {
        setMessage({
          text: payload.error ?? MARKET_UI_COPY.load.checkout,
          tone: "warning",
        });
        return;
      }
      window.location.assign(payload.data.url);
    } catch {
      setMessage({ text: MARKET_UI_COPY.load.checkout, tone: "warning" });
    }
  };

  return (
    <div className="mt-6 sm:mt-8 lg:mt-10">
      <PricingPage
        tiers={tiers}
        currentTier={currentTier}
        onSelectTier={handleSelectTier}
      />
      {message && (
        <p
          className={`mt-4 text-center ${DNA_BODY} ${
            message.tone === "success"
              ? MARKET_UP_TEXT
              : "text-amber-600 dark:text-amber-400"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}

export default function PricingRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="mt-6 sm:mt-8 lg:mt-10 flex justify-center py-16">
          <LoadingSpinner size="md" message="Loading pricing..." />
        </div>
      }
    >
      <PricingRouteContent />
    </Suspense>
  );
}
