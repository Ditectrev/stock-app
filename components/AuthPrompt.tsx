"use client";

/**
 * AuthPrompt Component
 * Modal dialog for user authentication with Apple SSO, Google SSO, and Email OTP.
 * Google OAuth starts at /api/auth/oauth/google; Appwrite returns to /auth/callback/google.
 * Rendered via portal to document.body with high z-index so nothing covers the modal.
 * Requirements: 1.6, 21.13
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  HOME_INPUT,
  HOME_INSTRUMENT_PANEL,
  HOME_MUTED_TEXT,
  HOME_PRIMARY_BUTTON,
  HOME_SECONDARY_BUTTON,
  HOME_SECTION_LABEL,
  HOME_SUBTLE_TEXT,
} from "@/lib/home-ui";

export type AuthView = "providers" | "email";

export interface AuthPromptProps {
  /** Whether the modal is visible */
  open: boolean;
  /** Called when the user dismisses the modal */
  onClose: () => void;
  /** Whether the modal can be dismissed */
  dismissible?: boolean;
  /** Optional — Apple uses /api/auth/oauth/apple unless you override behavior */
  onAppleSignIn?: () => void;
  /** Optional override for Google sign-in (default: browser OAuth via Appwrite SDK) */
  onGoogleSignIn?: () => void;
  /** Send OTP email; return userId on success so the user can enter the code */
  onEmailSubmit: (email: string) => Promise<{
    ok: boolean;
    userId?: string;
    error?: string;
  }>;
  /** Submit the code from the email (Appwrite createSession) */
  onEmailVerify: (
    userId: string,
    secret: string
  ) => Promise<{
    ok: boolean;
    error?: string;
  }>;
  /** External error message to display (Req 1.6) */
  error?: string | null;
  /** Success or informational message (e.g. email sent) */
  infoMessage?: string | null;
  /** Whether an auth action is in progress */
  loading?: boolean;
}

export function AuthPrompt({
  open,
  onClose,
  dismissible = true,
  onAppleSignIn: _onAppleSignIn,
  onGoogleSignIn,
  onEmailSubmit,
  onEmailVerify,
  error,
  infoMessage,
  loading = false,
}: AuthPromptProps) {
  const [view, setView] = useState<AuthView>("providers");
  const [emailSubStep, setEmailSubStep] = useState<"request" | "verify">(
    "request"
  );
  const [email, setEmail] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const prevOpenRef = useRef(open);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const emailFormRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    const becameVisible = open && !prevOpenRef.current;
    prevOpenRef.current = open;
    if (becameVisible) {
      setView("providers");
      setEmailSubStep("request");
      setEmail("");
      setPendingUserId(null);
      setOtp("");
      setEmailError(null);
      setLocalSubmitting(false);
    }
  }, [open]);

  const submitEmailRequest = useCallback(async () => {
    setEmailError(null);
    setLocalSubmitting(true);
    try {
      // Read live DOM value — password-manager / autofill often never fires
      // React onChange, so controlled state can remain empty.
      const fromInput = emailInputRef.current?.value.trim() ?? "";
      const trimmed = fromInput || email.trim();
      if (trimmed) {
        setEmail(trimmed);
      }

      if (!trimmed) {
        setEmailError("Please enter your email address.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setEmailError("Please enter a valid email address.");
        return;
      }

      const result = await onEmailSubmit(trimmed);
      if (!result || typeof result.ok !== "boolean") {
        setEmailError("Could not start verification. Please try again.");
        return;
      }
      if (result.ok && result.userId) {
        setPendingUserId(result.userId);
        setEmailSubStep("verify");
        setOtp("");
      } else if (result.ok && !result.userId) {
        setEmailError("Could not start verification. Please try again.");
      } else if (!result.ok && result.error) {
        setEmailError(result.error);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setEmailError(message);
    } finally {
      setLocalSubmitting(false);
    }
  }, [email, onEmailSubmit]);

  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      await submitEmailRequest();
    },
    [submitEmailRequest]
  );

  const handleVerifySubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setEmailError(null);

      const named = e.currentTarget.elements.namedItem("otp");
      const fromInput = named instanceof HTMLInputElement ? named.value : "";
      const fromFormData = String(
        new FormData(e.currentTarget).get("otp") ?? ""
      );
      const digits = (fromInput || fromFormData || otp).replace(/\D/g, "");

      if (!pendingUserId) {
        setEmailError("Session expired. Go back and request a new code.");
        return;
      }
      if (digits.length < 6) {
        setEmailError("Enter the 6-digit code from your email.");
        return;
      }

      try {
        const result = await onEmailVerify(pendingUserId, digits);
        if (!result || typeof result.ok !== "boolean") {
          setEmailError("Verification failed. Please try again.");
          return;
        }
        if (!result.ok) {
          setEmailError(
            result.error ?? "Invalid or expired code. Please try again."
          );
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.";
        setEmailError(message);
      }
    },
    [otp, pendingUserId, onEmailVerify]
  );

  if (!open) return null;

  const displayError = error || emailError;

  const isBusy = loading || localSubmitting;

  const oauthLinkClass = `${HOME_SECONDARY_BUTTON} w-full justify-center gap-2 py-3 no-underline`;

  const modal = (
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center bg-stone-950/50 p-4 pt-[12vh] sm:items-center sm:pt-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
      data-testid="auth-prompt"
    >
      <div className={`relative w-full max-w-sm ${HOME_INSTRUMENT_PANEL}`}>
        {/* Close button */}
        {dismissible && (
          <button
            type="button"
            onClick={onClose}
            className={`absolute right-3 top-3 rounded-md p-1 ${HOME_SUBTLE_TEXT} hover:text-stone-900 dark:hover:text-stone-50`}
            aria-label="Close"
            data-testid="auth-close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        <p className={HOME_SECTION_LABEL}>Account</p>
        <h2 className="mb-4 text-xl font-semibold text-stone-900 dark:text-stone-100">
          Sign in to continue
        </h2>

        {/* Error display (Req 1.6) */}
        {displayError && (
          <div
            className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
            role="alert"
            aria-live="assertive"
            data-testid="auth-error"
          >
            {displayError}
          </div>
        )}

        {infoMessage && (
          <div
            className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200"
            role="status"
            aria-live="polite"
            data-testid="auth-info"
          >
            {infoMessage}
          </div>
        )}

        {view === "providers" ? (
          <div className="space-y-3">
            <a
              href="/api/auth/oauth/google"
              className={`${oauthLinkClass} ${
                loading ? "pointer-events-none opacity-50" : ""
              }`}
              data-testid="auth-google"
              aria-disabled={loading}
              onClick={(e) => {
                if (loading) {
                  e.preventDefault();
                  return;
                }
                onGoogleSignIn?.();
              }}
            >
              <GoogleIcon />
              Continue with Google
            </a>

            <div className="space-y-1">
              <button
                type="button"
                disabled
                className={`${oauthLinkClass} cursor-not-allowed bg-black/60 text-white opacity-60 dark:bg-white/20 dark:text-white`}
                data-testid="auth-apple-disabled"
                aria-describedby="auth-apple-unavailable-note"
              >
                <AppleIcon />
                Continue with Apple
              </button>
              <p
                id="auth-apple-unavailable-note"
                className={`text-xs ${HOME_SUBTLE_TEXT}`}
                data-testid="auth-apple-unavailable-note"
              >
                Apple Sign-In is not available yet. Use Google or email below.
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
              <span className={`text-xs ${HOME_SUBTLE_TEXT}`}>or</span>
              <div className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
            </div>

            {/* Email OTP */}
            <button
              type="button"
              onClick={() => setView("email")}
              disabled={loading}
              className={`${HOME_SECONDARY_BUTTON} w-full justify-center gap-2 py-3 disabled:opacity-50`}
              data-testid="auth-email-btn"
            >
              <EmailIcon />
              Continue with Email
            </button>
          </div>
        ) : emailSubStep === "request" ? (
          <form
            ref={emailFormRef}
            onSubmit={handleEmailSubmit}
            className="space-y-4"
            noValidate
          >
            <button
              type="button"
              onClick={() => {
                setView("providers");
                setEmailError(null);
              }}
              className={`mb-2 text-sm ${HOME_MUTED_TEXT} hover:text-stone-900 dark:hover:text-stone-100`}
              data-testid="auth-back"
            >
              ← Back
            </button>

            <label
              htmlFor="auth-email"
              className="block text-sm font-medium text-stone-700 dark:text-stone-300"
            >
              Email address
            </label>
            <input
              ref={emailInputRef}
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={HOME_INPUT}
              data-testid="auth-email-input"
            />

            <button
              type="button"
              onClick={() => {
                void submitEmailRequest();
              }}
              disabled={isBusy}
              className={`${HOME_PRIMARY_BUTTON} w-full justify-center py-2.5 disabled:opacity-50`}
              data-testid="auth-email-submit"
            >
              {isBusy ? "Sending…" : "Send verification code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifySubmit} className="space-y-4" noValidate>
            <button
              type="button"
              onClick={() => {
                setEmailSubStep("request");
                setPendingUserId(null);
                setOtp("");
              }}
              className={`mb-2 text-sm ${HOME_MUTED_TEXT} hover:text-stone-900 dark:hover:text-stone-100`}
              data-testid="auth-verify-back"
            >
              ← Change email
            </button>

            <p className={`text-sm ${HOME_MUTED_TEXT}`}>
              Enter the 6-digit code sent to{" "}
              <span className="font-medium text-stone-900 dark:text-stone-100">
                {email}
              </span>
              .
            </p>

            <label
              htmlFor="auth-otp"
              className="block text-sm font-medium text-stone-700 dark:text-stone-300"
            >
              Verification code
            </label>
            <input
              id="auth-otp"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={32}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^\d\s]/g, ""))}
              placeholder="e.g. 512646"
              className={`${HOME_INPUT} text-center font-mono text-lg tracking-widest`}
              data-testid="auth-otp-input"
            />

            <button
              type="submit"
              disabled={loading}
              className={`${HOME_PRIMARY_BUTTON} w-full justify-center py-2.5 disabled:opacity-50`}
              data-testid="auth-verify-submit"
            >
              {loading ? "Verifying…" : "Verify and sign in"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setEmailError(null);
                if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                  setEmailError("Invalid email. Go back and re-enter it.");
                  return;
                }
                try {
                  const result = await onEmailSubmit(email);
                  if (result.ok && result.userId) {
                    setPendingUserId(result.userId);
                  }
                } catch (err) {
                  setEmailError(
                    err instanceof Error
                      ? err.message
                      : "Could not resend. Try again."
                  );
                }
              }}
              className={`w-full text-sm ${HOME_MUTED_TEXT} hover:text-stone-900 disabled:opacity-50 dark:hover:text-stone-100`}
              data-testid="auth-resend-code"
            >
              Resend code
            </button>
          </form>
        )}

        {loading && (
          <p
            className={`mt-3 text-center text-xs ${HOME_SUBTLE_TEXT}`}
            aria-live="polite"
          >
            Please wait…
          </p>
        )}
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(modal, document.body);
  }
  return modal;
}

/* ------------------------------------------------------------------ */
/* Inline SVG icons                                                    */
/* ------------------------------------------------------------------ */

function AppleIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}
