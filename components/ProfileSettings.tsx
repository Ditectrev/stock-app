"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import APIKeyManager from "@/components/APIKeyManager";
import {
  EXPLANATIONS_PROVIDER_STORAGE_KEY,
  getDefaultProviderForTier,
  isProviderAllowedForTier,
  PROVIDER_OPTIONS,
  readStoredExplanationProvider,
  saveExplanationProvider,
  type ExplanationProvider,
  type Tier,
} from "@/lib/explanation-provider";

type StatusMessage = {
  text: string;
  tone: "success" | "error" | "info";
};

function loadStoredProvider(): ExplanationProvider {
  return readStoredExplanationProvider() ?? "OLLAMA";
}

function StatusNotice({ message }: { message: StatusMessage }) {
  return (
    <p
      className={`text-sm ${
        message.tone === "error"
          ? "text-red-600 dark:text-red-400"
          : message.tone === "success"
            ? "text-green-700 dark:text-green-400"
            : "text-gray-600 dark:text-gray-300"
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
  const [selectedProvider, setSelectedProvider] = useState<
    "OPENAI" | "GEMINI" | "MISTRAL" | "DEEPSEEK"
  >("OPENAI");
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

  useEffect(() => {
    const stored = loadStoredProvider();
    setSavedExplanationProvider(stored);
    setPendingExplanationProvider(stored);
  }, []);

  useEffect(() => {
    const { tier } = subscription;
    const syncForTier = (current: ExplanationProvider): ExplanationProvider => {
      if (isProviderAllowedForTier(current, tier)) return current;
      const next = getDefaultProviderForTier(tier);
      if (!next) {
        localStorage.removeItem(EXPLANATIONS_PROVIDER_STORAGE_KEY);
        return current;
      }
      return next;
    };

    setSavedExplanationProvider((saved) => {
      const next = syncForTier(saved);
      if (next !== saved) saveExplanationProvider(next);
      return next;
    });
    setPendingExplanationProvider((pending) => syncForTier(pending));
  }, [subscription.tier]);

  const tier = subscription.tier;
  const hasPaidPlan = tier !== "FREE";
  const canManageApiKeys = tier === "BYOK";
  const hasAiTier = ["LOCAL", "BYOK", "HOSTED_AI"].includes(tier);

  const hasUnsavedProvider =
    pendingExplanationProvider !== savedExplanationProvider;

  function handleSelectProvider(provider: ExplanationProvider) {
    if (!isProviderAllowedForTier(provider, tier)) {
      setProviderStatusMessage({
        text: "This provider is not available on your current plan.",
        tone: "error",
      });
      return;
    }
    setPendingExplanationProvider(provider);
    if (providerStatusMessage?.tone === "success") {
      setProviderStatusMessage(null);
    }
  }

  function handleSaveExplanationProvider() {
    if (!isProviderAllowedForTier(pendingExplanationProvider, tier)) {
      setProviderStatusMessage({
        text: "This provider is not available on your current plan.",
        tone: "error",
      });
      return;
    }
    saveExplanationProvider(pendingExplanationProvider);
    setSavedExplanationProvider(pendingExplanationProvider);
    setProviderStatusMessage({
      text: `Saved ${PROVIDER_OPTIONS.find((p) => p.id === pendingExplanationProvider)?.name ?? pendingExplanationProvider} as your explanations provider.`,
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
          text: data.error ?? "Failed to cancel subscription.",
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
          text: data.error ?? "Failed to open billing portal.",
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
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Loading profile…
      </p>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          User Profile
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Sign in to manage your subscription, AI providers, and API keys.
        </p>
        <Link
          href="/pricing?signin=1"
          className="inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          User Profile
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
        {user.name && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user.name}
          </p>
        )}
      </header>

      <section className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Subscription
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Current plan</dt>
            <dd className="font-medium text-blue-600 dark:text-blue-400">
              {tier}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Active until</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100">
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
          <Link
            href="/pricing"
            className="inline-flex items-center rounded-md border border-blue-500 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            Change plan
          </Link>
          {hasPaidPlan && (
            <>
              <button
                type="button"
                onClick={() => void handleOpenBillingPortal()}
                disabled={openingBilling}
                className="inline-flex items-center rounded-md border border-blue-500 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50"
              >
                {openingBilling ? "Opening…" : "Manage billing"}
              </button>
              {!subscription.cancelAtPeriodEnd && (
                <button
                  type="button"
                  onClick={() => void handleCancelSubscription()}
                  disabled={cancelling}
                  className="inline-flex items-center rounded-md border border-red-500 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
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

      <section className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Explanations provider
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Choose which AI powers metric explanations and chart analysis, then
            click Save to apply your choice across the app.
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
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-500"
                    : "border-gray-200 dark:border-gray-700"
                } ${
                  !allowed
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-blue-400"
                }`}
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {provider.name}
                  {isActive && (
                    <span className="ml-2 text-xs font-normal text-blue-600 dark:text-blue-400">
                      Active
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {provider.subtitle}
                </p>
              </button>
            );
          })}
        </div>
        {hasAiTier && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleSaveExplanationProvider}
              disabled={!hasUnsavedProvider}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save explanations provider
            </button>
            {hasUnsavedProvider && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You have unsaved changes.
              </p>
            )}
          </div>
        )}
        {providerStatusMessage && (
          <StatusNotice message={providerStatusMessage} />
        )}
      </section>

      <section className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          API keys
        </h2>
        {canManageApiKeys ? (
          <APIKeyManager
            selectedProvider={selectedProvider}
            onProviderSelect={setSelectedProvider}
          />
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            API key management is available on the BYOK plan.
          </p>
        )}
      </section>
    </div>
  );
}
