"use client";

/**
 * TrialBanner Component
 * Displays trial status, remaining time, and authentication options when expired.
 * Integrates TrialTimer and AuthPrompt.
 * Requirements: 21.12, 21.13
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { TrialTimer } from "@/components/TrialTimer";
import { AuthPrompt } from "@/components/AuthPrompt";
import { trialApiService } from "@/services/trial-api.service";
import {
  postEmailOtpSend,
  postEmailOtpVerify,
} from "@/lib/auth/trial-auth-navigation";
import { describeAuthQueryError } from "@/lib/auth/auth-query-messages";
import { AUTH_UI_COPY } from "@/lib/auth-ui-copy";
import { OPEN_AUTH_PROMPT_EVENT } from "@/lib/open-auth-prompt";
import {
  HOME_CALLOUT,
  HOME_PRIMARY_BUTTON,
  HOME_SUBTLE_TEXT,
} from "@/lib/home-ui";
/** Re-sync countdown with server so tab background / clock skew cannot shorten the trial. */
const TRIAL_STATUS_SYNC_MS = 30_000;

export interface TrialBannerProps {
  /** Called when user successfully authenticates */
  onAuthenticated?: () => void;
}

export function TrialBanner({ onAuthenticated }: TrialBannerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isActive, setIsActive] = useState(false);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);
  const requiresAuthLock = !isActive && hasUsedTrial && !isAuthenticated;

  const openAuthModal = useCallback((clearMessages = true) => {
    if (clearMessages) {
      setAuthError(null);
      setAuthInfo(null);
    }
    setAuthLoading(false);
    setShowAuth(true);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        // Auto-start trial if this is a first-time visitor
        const status = await trialApiService.getTrialStatus();
        if (!status.isActive && !status.hasUsedTrial) {
          try {
            await trialApiService.startTrial();
          } catch (err) {
            // Already used, Appwrite misconfig, or network — check devtools / server logs.
            if (process.env.NODE_ENV === "development") {
              console.warn("[trial] startTrial failed:", err);
            }
          }
        }

        // Read final status after potential startTrial()
        const finalStatus = await trialApiService.getTrialStatus();
        setRemainingSeconds(finalStatus.remainingSeconds);
        setIsActive(finalStatus.isActive);
        setHasUsedTrial(finalStatus.hasUsedTrial);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[trial] getTrialStatus / init failed:", err);
        }
        // Fail closed if trial status cannot be loaded from the server.
        setRemainingSeconds(0);
        setIsActive(false);
        setHasUsedTrial(true);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!isActive || isAuthenticated) return;

    const syncStatus = async () => {
      try {
        const status = await trialApiService.getTrialStatus();
        setRemainingSeconds(status.remainingSeconds);
        setIsActive(status.isActive);
        setHasUsedTrial(status.hasUsedTrial);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[trial] periodic status sync failed:", err);
        }
      }
    };

    const interval = setInterval(() => {
      void syncStatus();
    }, TRIAL_STATUS_SYNC_MS);

    return () => clearInterval(interval);
  }, [isActive, isAuthenticated]);

  useEffect(() => {
    const openAuth = () => openAuthModal(true);
    if (typeof window !== "undefined") {
      window.addEventListener(OPEN_AUTH_PROMPT_EVENT, openAuth);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(OPEN_AUTH_PROMPT_EVENT, openAuth);
      }
    };
  }, [openAuthModal]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("signin") === "1") {
      openAuthModal(true);
    }
    const authErrorCode = params.get("auth_error");
    if (authErrorCode) {
      setAuthError(
        describeAuthQueryError(authErrorCode, window.location.hostname)
      );
      setAuthLoading(false);
      setShowAuth(true);
      params.delete("auth_error");
      const query = params.toString();
      const next = `${window.location.pathname}${query ? `?${query}` : ""}`;
      window.history.replaceState({}, "", next);
    }

    if (params.get("auth_success") === "true") {
      params.delete("auth_success");
      const query = params.toString();
      const next = `${window.location.pathname}${query ? `?${query}` : ""}`;
      window.history.replaceState({}, "", next);
      void (async () => {
        try {
          const res = await fetch("/api/auth/me", {
            credentials: "include",
          });
          setIsAuthenticated(res.ok);
          if (res.ok) {
            setShowAuth(false);
            setAuthError(null);
            onAuthenticated?.();
            window.dispatchEvent(new Event("auth-state-changed"));
          }
        } catch {
          setIsAuthenticated(false);
        }
      })();
    }
  }, [openAuthModal, onAuthenticated]);

  useEffect(() => {
    const syncAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });
        setIsAuthenticated(res.ok);
        if (res.ok) {
          // User is signed in; hide trial auth prompts.
          setShowAuth(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setAuthChecked(true);
      }
    };

    void syncAuth();
    const onAuthChanged = () => void syncAuth();
    if (typeof window !== "undefined") {
      window.addEventListener("auth-state-changed", onAuthChanged);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("auth-state-changed", onAuthChanged);
      }
    };
  }, []);

  useEffect(() => {
    if (requiresAuthLock) {
      setShowAuth(true);
    }
  }, [requiresAuthLock]);

  useEffect(() => {
    if (authChecked && !isAuthenticated && !isActive && hasUsedTrial) {
      setShowAuth(true);
    }
  }, [authChecked, isAuthenticated, isActive, hasUsedTrial]);

  const prevShowAuthRef = useRef(showAuth);
  useEffect(() => {
    const opening = showAuth && !prevShowAuthRef.current;
    prevShowAuthRef.current = showAuth;
    if (opening) {
      setAuthLoading(false);
    }
  }, [showAuth]);

  const handleExpired = useCallback(() => {
    setIsActive(false);
    void trialApiService.endTrial();
    openAuthModal(true);
  }, [openAuthModal]);

  const handleAuthClose = useCallback(() => {
    if (requiresAuthLock) {
      return;
    }
    setShowAuth(false);
    setAuthError(null);
    setAuthInfo(null);
    setAuthLoading(false);
  }, [requiresAuthLock]);

  const handleEmailSubmit = useCallback(async (email: string) => {
    setAuthError(null);
    setAuthInfo(null);
    setAuthLoading(true);
    try {
      const result = await postEmailOtpSend(email);
      if (!result.ok) {
        const err = result.error ?? AUTH_UI_COPY.genericFailed;
        setAuthError(err);
        return { ok: false as const, error: err };
      }
      if (!result.userId) {
        const err = AUTH_UI_COPY.verificationStartFailed;
        setAuthError(err);
        return { ok: false as const, error: err };
      }
      setAuthInfo(AUTH_UI_COPY.emailSentInfo);
      return { ok: true as const, userId: result.userId };
    } catch {
      setAuthError(AUTH_UI_COPY.networkFailed);
      return {
        ok: false as const,
        error: AUTH_UI_COPY.networkFailed,
      };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const handleEmailVerify = useCallback(
    async (userId: string, secret: string) => {
      setAuthError(null);
      setAuthLoading(true);
      try {
        const result = await postEmailOtpVerify(userId, secret);
        if (!result.ok) {
          const err = result.error ?? AUTH_UI_COPY.invalidCode;
          setAuthError(err);
          return { ok: false as const, error: err };
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth-state-changed"));
        }
        setAuthInfo(null);
        onAuthenticated?.();
        setShowAuth(false);
        return { ok: true as const };
      } catch {
        setAuthError("Network error. Please try again.");
        return {
          ok: false as const,
          error: "Network error. Please try again.",
        };
      } finally {
        setAuthLoading(false);
      }
    },
    [onAuthenticated]
  );

  return (
    <>
      {isActive && !isAuthenticated && (
        <div
          className={`sticky top-0 z-[10001] flex w-full items-center justify-between border-b border-stone-200 px-4 py-2 ${HOME_CALLOUT}`}
          role="status"
          aria-label="Trial session active"
          data-testid="trial-banner"
        >
          <span className={`text-sm font-medium ${HOME_SUBTLE_TEXT}`}>
            Trial session
          </span>
          <div className="flex items-center gap-3">
            <TrialTimer
              remainingSeconds={remainingSeconds}
              onExpired={handleExpired}
            />
            <button
              type="button"
              onClick={() => openAuthModal(true)}
              className={`${HOME_PRIMARY_BUTTON} px-3 py-1 text-xs`}
              data-testid="trial-sign-in-btn"
            >
              Sign in
            </button>
          </div>
        </div>
      )}

      {!isActive && hasUsedTrial && !isAuthenticated && (
        <div
          className={`sticky top-0 z-[10001] flex w-full items-center justify-center border-b border-stone-300 px-4 py-2 ${HOME_CALLOUT}`}
          role="alert"
          data-testid="trial-expired-banner"
        >
          <span className={`text-sm ${HOME_SUBTLE_TEXT}`}>
            Trial expired.{" "}
            <button
              type="button"
              onClick={() => openAuthModal(true)}
              className="font-medium underline hover:no-underline"
              data-testid="trial-expired-sign-in"
            >
              Sign in
            </button>{" "}
            to continue.
          </span>
        </div>
      )}

      <AuthPrompt
        open={showAuth}
        onClose={handleAuthClose}
        dismissible={!requiresAuthLock}
        trialExpired={requiresAuthLock}
        onEmailSubmit={handleEmailSubmit}
        onEmailVerify={handleEmailVerify}
        loading={authLoading}
        error={authError}
        infoMessage={authInfo}
      />
    </>
  );
}
