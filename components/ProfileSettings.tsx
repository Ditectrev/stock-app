"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import APIKeyManager from "@/components/APIKeyManager";
import {
  HOME_INSTRUMENT_PANEL,
  HOME_MUTED_TEXT,
  HOME_PANEL_TITLE,
  HOME_PRIMARY_BUTTON,
  HOME_SECONDARY_BUTTON,
  HOME_SECTION_LABEL,
  HOME_SUBTLE_TEXT,
} from "@/lib/home-ui";
import {
  getDefaultProviderForTier,
  isProviderAllowedForTier,
  PROVIDER_OPTIONS,
  readStoredExplanationProvider,
  saveExplanationProvider,
  type ExplanationProvider,
  type Tier,
} from "@/lib/explanation-provider";
import { MARKET_DOWN_TEXT, MARKET_UP_TEXT } from "@/lib/market-semantics";
import { MARKET_UI_COPY } from "@/lib/market-ui-copy";
import {
  readSelectedBYOKProvider,
  saveSelectedBYOKProvider,
  type BYOKProvider,
} from "@/services/api-key-manager.service";

type StatusMessage = {
  text: string;
  tone: "success" | "error" | "info";
};

function StatusNotice({ message }: { message: StatusMessage }) {
  return (
    <p
      className={`text-sm ${
        message.tone === "error"
          ? MARKET_DOWN_TEXT
          : message.tone === "success"
            ? MARKET_UP_TEXT
            : HOME_MUTED_TEXT
      }`}
      role="status"
    >
      {message.text}
    </p>
  );
}

type AuthUser = {
  id: string;
  email: string;
  name?: string;
};

type SubscriptionSnapshot = {
  tier: Tier;
  activeUntil: string | null;
  cancelAtPeriodEnd: boolean;
};

export function ProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionSnapshot>({
    tier: "FREE",
    activeUntil: null,
    cancelAtPeriodEnd: false,
  });
  const [savedExplanationProvider, setSavedExplanationProvider] =
    useState<ExplanationProvider>("OLLAMA");
  const [pendingExplanationProvider, setPendingExplanationProvider] =
    useState<ExplanationProvider>("OLLAMA");
  const [selectedProvider, setSelectedProvider] = useState<BYOKProvider>(() =>
    typeof window === "undefined" ? "OPENAI" : readSelectedBYOKProvider()
  );
  const [providerStatusMessage, setProviderStatusMessage] =
    useState<StatusMessage | null>(null);
  const [subscriptionStatusMessage, setSubscriptionStatusMessage] =
    useState<StatusMessage | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [openingBilling, setOpeningBilling] = useState(false);

  const refreshAuthState = useCallback(async () => {
    setLoading(true);
    try {
      const authRes = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });
      if (!authRes.ok) {
        setUser(null);
        setSubscription({
          tier: "FREE",
          activeUntil: null,
          cancelAtPeriodEnd: false,
        });
        return;
      }
      const authData = (await authRes.json()) as { user?: AuthUser };
      if (!authData.user) {
        setUser(null);
        return;
      }
      setUser(authData.user);

      const tierRes = await fetch("/api/subscription/current", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (tierRes.ok) {
        const tierData = (await tierRes.json()) as {
          data?: {
            tier?: Tier;
            currentPeriodEnd?: string | null;
            cancelAtPeriodEnd?: boolean;
          };
        };
        setSubscription({
          tier: tierData.data?.tier ?? "FREE",
          activeUntil: tierData.data?.currentPeriodEnd ?? null,
          cancelAtPeriodEnd: tierData.data?.cancelAtPeriodEnd === true,
        });
      } else {
        setSubscription({
          tier: "FREE",
          activeUntil: null,
          cancelAtPeriodEnd: false,
        });
      }
    } catch {
      setUser(null);
      setSubscription({
        tier: "FREE",
        activeUntil: null,
        cancelAtPeriodEnd: false,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAuthState();
    const onAuthChanged = () => void refreshAuthState();
    window.addEventListener("auth-state-changed", onAuthChanged);
    return () =>
      window.removeEventListener("auth-state-changed", onAuthChanged);
  }, [refreshAuthState]);

  const applyStoredExplanationProvider = useCallback(() => {
    const tier = subscription.tier;
    const stored = readStoredExplanationProvider() ?? "OLLAMA";

    let resolved = stored;
    if (!isProviderAllowedForTier(stored, tier)) {
      const fallback = getDefaultProviderForTier(tier);
      if (fallback) {
        resolved = fallback;
        saveExplanationProvider(fallback);
      }
    }

    setSavedExplanationProvider(resolved);
    setPendingExplanationProvider(resolved);
  }, [subscription.tier]);

  useEffect(() => {
    if (loading) return;
    applyStoredExplanationProvider();
  }, [loading, applyStoredExplanationProvider]);

  useEffect(() => {
    const onProviderChanged = () => applyStoredExplanationProvider();
    window.addEventListener("explanations-provider-changed", onProviderChanged);
    return () =>
      window.removeEventListener(
        "explanations-provider-changed",
        onProviderChanged
      );
  }, [applyStoredExplanationProvider]);

  function handleBYOKProviderSelect(provider: BYOKProvider) {
    setSelectedProvider(provider);
    saveSelectedBYOKProvider(provider);
  }

  const tier = subscription.tier;
  const hasPaidPlan = tier !== "FREE";
  const canManageApiKeys = tier === "BYOK";
  const hasAiTier = ["LOCAL", "BYOK", "HOSTED_AI"].includes(tier);

  function handleSelectProvider(provider: ExplanationProvider) {
    if (!isProviderAllowedForTier(provider, tier)) {
      setProviderStatusMessage({
        text: "This provider is not available on your current plan.",
        tone: "error",
      });
      return;
    }
    saveExplanationProvider(provider);
    setSavedExplanationProvider(provider);
    setPendingExplanationProvider(provider);
    setProviderStatusMessage({
      text: `${PROVIDER_OPTIONS.find((p) => p.id === provider)?.name ?? provider} is now your explanations provider.`,
      tone: "success",
    });
  }

  async function handleCancelSubscription() {
    if (!user || !hasPaidPlan) return;
    setCancelling(true);
    setSubscriptionStatusMessage(null);
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setSubscriptionStatusMessage({
          text: data.error ?? MARKET_UI_COPY.billing.cancelFailed,
          tone: "error",
        });
        return;
      }
      setSubscriptionStatusMessage({
        text: "Subscription cancelled. Access remains until the end of your billing period.",
        tone: "success",
      });
      await refreshAuthState();
    } finally {
      setCancelling(false);
    }
  }

  async function handleOpenBillingPortal() {
    if (!user || !hasPaidPlan) return;
    setOpeningBilling(true);
    setSubscriptionStatusMessage(null);
    try {
      const res = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        data?: { url?: string };
        error?: string;
      };
      if (!res.ok || !data.data?.url) {
        setSubscriptionStatusMessage({
          text: data.error ?? MARKET_UI_COPY.billing.portalFailed,
          tone: "error",
        });
        return;
      }
      window.location.assign(data.data.url);
    } finally {
      setOpeningBilling(false);
    }
  }

  if (loading) {
    return <p className={`text-sm ${HOME_SUBTLE_TEXT}`}>Loading profile…</p>;
  }

  if (!user) {
    return (
      <div className={`${HOME_INSTRUMENT_PANEL} space-y-4`}>
        <h1 className={HOME_PANEL_TITLE}>User Profile</h1>
        <p className={`text-sm ${HOME_MUTED_TEXT}`}>
          Sign in to manage your subscription, AI providers, and API keys.
        </p>
        <Link href="/pricing?signin=1" className={HOME_PRIMARY_BUTTON}>
          Sign in
        </Link>
      </div>
    );
  }

  const profileSectionClass =
    "border-l-2 border-stone-900 pl-5 dark:border-stone-100";

  return (
    <div className="space-y-10 max-w-3xl">
      <header className="space-y-1">
        <p className={HOME_SECTION_LABEL}>Account</p>
        <h1 className={`text-2xl ${HOME_PANEL_TITLE}`}>User Profile</h1>
        <p className={`text-sm ${HOME_MUTED_TEXT}`}>{user.email}</p>
        {user.name && (
          <p className={`text-sm ${HOME_SUBTLE_TEXT}`}>{user.name}</p>
        )}
      </header>

      <section
        className={`${profileSectionClass} space-y-3`}
        aria-labelledby="profile-subscription-heading"
      >
        <p className={HOME_SECTION_LABEL}>Plan</p>
        <h2
          id="profile-subscription-heading"
          className={`text-lg ${HOME_PANEL_TITLE}`}
        >
          Subscription
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className={HOME_SUBTLE_TEXT}>Current plan</dt>
            <dd className={`font-medium ${HOME_MUTED_TEXT}`}>{tier}</dd>
          </div>
          <div>
            <dt className={HOME_SUBTLE_TEXT}>Active until</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-50">
              {subscription.activeUntil
                ? new Date(subscription.activeUntil).toLocaleDateString()
                : hasPaidPlan
                  ? "End of current billing period"
                  : "No active paid plan"}
            </dd>
          </div>
        </dl>
        {subscription.cancelAtPeriodEnd && hasPaidPlan && (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Your subscription is set to cancel at the end of this billing
            period.
          </p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href="/pricing" className={HOME_SECONDARY_BUTTON}>
            Change plan
          </Link>
          {hasPaidPlan && (
            <>
              <button
                type="button"
                onClick={() => void handleOpenBillingPortal()}
                disabled={openingBilling}
                className={`${HOME_SECONDARY_BUTTON} disabled:opacity-50`}
              >
                {openingBilling ? "Opening…" : "Manage billing"}
              </button>
              {!subscription.cancelAtPeriodEnd && (
                <button
                  type="button"
                  onClick={() => void handleCancelSubscription()}
                  disabled={cancelling}
                  className={`${HOME_SECONDARY_BUTTON} border-rose-300/90 text-rose-800 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/30 disabled:opacity-50`}
                >
                  {cancelling ? "Cancelling…" : "Cancel subscription"}
                </button>
              )}
            </>
          )}
        </div>
        {subscriptionStatusMessage && (
          <StatusNotice message={subscriptionStatusMessage} />
        )}
      </section>

      <section
        className={`${profileSectionClass} space-y-4`}
        aria-labelledby="profile-provider-heading"
      >
        <p className={HOME_SECTION_LABEL}>AI model</p>
        <div>
          <h2
            id="profile-provider-heading"
            className={`text-lg ${HOME_PANEL_TITLE}`}
          >
            Explanations provider
          </h2>
          <p className={`mt-1 text-sm ${HOME_SUBTLE_TEXT}`}>
            Choose which AI powers metric explanations and chart analysis. Your
            selection is saved automatically and applies across the app.
          </p>
        </div>
        {!hasAiTier && (
          <p className="text-sm text-amber-700 dark:text-amber-300/90 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
            AI explanations unlock on Local AI, BYOK, or Hosted AI plans.
            Ads-free and Free tiers do not include server-side AI.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROVIDER_OPTIONS.map((provider) => {
            const allowed = provider.allowedTiers.includes(tier);
            const isPending = pendingExplanationProvider === provider.id;
            const isActive = savedExplanationProvider === provider.id;
            return (
              <button
                key={provider.id}
                type="button"
                disabled={!allowed}
                onClick={() => handleSelectProvider(provider.id)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  isPending
                    ? "border-stone-600 bg-stone-100 ring-1 ring-stone-600 dark:border-stone-400 dark:bg-stone-800 dark:ring-stone-400"
                    : "border-stone-200 dark:border-stone-700"
                } ${
                  !allowed
                    ? "cursor-not-allowed opacity-50"
                    : "hover:border-stone-400 dark:hover:border-stone-500"
                }`}
              >
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                  {provider.name}
                  {isActive && (
                    <span
                      className={`ml-2 text-xs font-normal ${HOME_SUBTLE_TEXT}`}
                    >
                      Active
                    </span>
                  )}
                </p>
                <p className={`mt-1 text-xs ${HOME_SUBTLE_TEXT}`}>
                  {provider.subtitle}
                </p>
              </button>
            );
          })}
        </div>
        {providerStatusMessage && (
          <StatusNotice message={providerStatusMessage} />
        )}
      </section>

      <section
        className={profileSectionClass}
        aria-labelledby="profile-keys-heading"
      >
        <p className={HOME_SECTION_LABEL}>BYOK</p>
        <h2
          id="profile-keys-heading"
          className={`mb-3 text-lg ${HOME_PANEL_TITLE}`}
        >
          API keys
        </h2>
        {canManageApiKeys ? (
          <APIKeyManager
            selectedProvider={selectedProvider}
            onProviderSelect={handleBYOKProviderSelect}
          />
        ) : (
          <p className={`text-sm ${HOME_SUBTLE_TEXT}`}>
            API key management is available on the BYOK plan.
          </p>
        )}
      </section>
    </div>
  );
}
