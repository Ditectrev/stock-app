import type { NextRequest } from "next/server";

/** True for local dev hosts — OAuth must use the live origin, not NEXT_PUBLIC_SITE_URL. */
export function isLocalDevHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".localhost")
  );
}

/** Canonical site origin from NEXT_PUBLIC_SITE_URL, if set at build time. */
export function getConfiguredSiteOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return null;
  try {
    const href =
      raw.startsWith("http://") || raw.startsWith("https://")
        ? raw
        : `https://${raw}`;
    return new URL(href.replace(/\/$/, "")).origin;
  } catch {
    return null;
  }
}

/**
 * Origin used for Appwrite OAuth success/failure URLs.
 * On localhost, always uses the request origin (ignores NEXT_PUBLIC_SITE_URL).
 * In production, prefers NEXT_PUBLIC_SITE_URL so apex vs www matches Appwrite.
 */
export function getOAuthRedirectOrigin(request: NextRequest): string {
  const requestOrigin = new URL(request.url).origin;
  const { hostname } = new URL(request.url);
  if (isLocalDevHostname(hostname)) {
    return requestOrigin;
  }
  return getConfiguredSiteOrigin() ?? requestOrigin;
}

/** OAuth return URL — client page reads query/hash and completes session on the server. */
export function getGoogleOAuthCallbackUrl(origin: string): string {
  return `${origin}/auth/callback/google`;
}

export function getGoogleOAuthRedirectUrls(request: NextRequest): {
  origin: string;
  success: string;
  failure: string;
} {
  const origin = getOAuthRedirectOrigin(request);
  const callback = getGoogleOAuthCallbackUrl(origin);
  return {
    origin,
    success: callback,
    failure: callback,
  };
}

/** Browser OAuth: on localhost use the page origin; in prod prefer NEXT_PUBLIC_SITE_URL. */
export function getBrowserOAuthRedirectOrigin(): string | null {
  if (typeof window === "undefined") return null;
  if (isLocalDevHostname(window.location.hostname)) {
    return window.location.origin;
  }
  return getConfiguredSiteOrigin() ?? window.location.origin;
}
