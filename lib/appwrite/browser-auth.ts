/**
 * Client-side auth — mirrors Practice-Tests-Exams-Platform lib/appwrite/auth.ts
 * (email OTP + OAuth2). All requests go to your Appwrite endpoint (see Network tab).
 */

import { ID, OAuthProvider } from "appwrite";
import {
  getBrowserOAuthRedirectOrigin,
  getGoogleOAuthCallbackUrl,
} from "@/lib/auth/oauth-redirect-origin";
import { getBrowserAccount } from "./browser-config";

function missingConfigError(): { ok: false; error: string } {
  return {
    ok: false,
    error:
      "Appwrite is not configured. Set NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID in .env.local.",
  };
}

/**
 * Redirects the browser to Google OAuth (full page navigation to Appwrite, then Google).
 * Callback: /api/auth/callback/google
 */
export function startGoogleOAuth():
  | { ok: true }
  | { ok: false; error: string } {
  const account = getBrowserAccount();
  if (!account) {
    return missingConfigError();
  }
  if (typeof window === "undefined") {
    return { ok: false, error: "OAuth must run in the browser." };
  }
  const origin = getBrowserOAuthRedirectOrigin();
  if (!origin) {
    return { ok: false, error: "OAuth must run in the browser." };
  }
  const callback = getGoogleOAuthCallbackUrl(origin);
  try {
    account.createOAuth2Session(OAuthProvider.Google, callback, callback);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to start Google sign-in.";
    return { ok: false, error: message };
  }
  return { ok: true };
}

/**
 * Redirects the browser to Apple OAuth. Apple does not support localhost redirects.
 * Callback: /api/auth/callback/apple
 */
export function startAppleOAuth(): { ok: true } | { ok: false; error: string } {
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    const isLocalDev =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      protocol === "http:";
    if (isLocalDev) {
      return {
        ok: false,
        error:
          "Apple Sign-In needs HTTPS and a registered domain. Use Google or email on localhost, or test Apple after deployment.",
      };
    }
  }

  const account = getBrowserAccount();
  if (!account) {
    return missingConfigError();
  }
  if (typeof window === "undefined") {
    return { ok: false, error: "OAuth must run in the browser." };
  }
  const origin = window.location.origin;
  account.createOAuth2Session({
    provider: OAuthProvider.Apple,
    success: `${origin}/api/auth/callback/apple`,
    failure: `${origin}/?auth_error=apple_oauth_failed`,
  });
  return { ok: true };
}

export async function sendEmailOTP(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const account = getBrowserAccount();
  if (!account) {
    return {
      success: false,
      error:
        "Appwrite is not configured. Set NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID in .env.local.",
    };
  }

  try {
    await account.createEmailToken(ID.unique(), email);
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to send verification email. Please try again.";
    return { success: false, error: message };
  }
}
