import { getConfiguredSiteOrigin } from "@/lib/auth/oauth-redirect-origin";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  apple_sign_in_unavailable:
    "Apple Sign-In is not available yet. Use Google or email sign-in.",
  google_oauth_failed:
    "Google sign-in was cancelled or failed. Please try again.",
  google_client_secret_missing:
    "Google sign-in failed: Appwrite is missing the Google Client Secret. In Appwrite Console → Auth → Settings → Google, paste your Google Cloud Client ID (*.apps.googleusercontent.com) and Client Secret (GOCSPX-…, not the client ID). Save, then try again.",
  google_oauth_invalid_client:
    "Google sign-in failed: check Appwrite Google OAuth — Client ID and Client Secret must match Google Cloud and must not be swapped.",
  google_oauth_bad_request:
    "Google sign-in failed in Appwrite. Check Auth → Google provider settings and try again.",
  oauth_redirect_not_whitelisted:
    "Sign-in failed: this site hostname is not registered in Appwrite. In Appwrite Console → your project → Auth → Platforms, add a Web platform whose hostname matches this site exactly (e.g. theopenstock.com, not localhost). Also add www.theopenstock.com if you use www. Then try Google sign-in again.",
  appwrite_not_configured:
    "Sign-in is not configured on this server. Try email sign-in or contact support.",
  oauth_start_failed: "Could not start Google sign-in. Please try again.",
  sso_temporarily_disabled:
    "Social sign-in is temporarily unavailable. Use email sign-in.",
  missing_credentials:
    "Sign-in did not complete (no session from Google). Try again or use email sign-in.",
  oauth_session_failed:
    "Could not create your session after Google sign-in. Try again.",
  server_error: "Sign-in failed due to a server error. Please try again.",
};

function oauthPlatformHostname(browserHostname?: string): string | undefined {
  const configured = getConfiguredSiteOrigin();
  if (configured) {
    try {
      return new URL(configured).hostname;
    } catch {
      /* fall through */
    }
  }
  return browserHostname;
}

export function describeAuthQueryError(
  code: string,
  browserHostname?: string
): string {
  if (code === "oauth_redirect_not_whitelisted") {
    const hostname = oauthPlatformHostname(browserHostname);
    if (!hostname) {
      return AUTH_ERROR_MESSAGES.oauth_redirect_not_whitelisted;
    }
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim();
    const projectNote = projectId
      ? ` Use Appwrite project ${projectId} (same as NEXT_PUBLIC_APPWRITE_PROJECT_ID on Vercel).`
      : "";
    const isLocal =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".localhost");
    if (isLocal) {
      return (
        `Sign-in failed: add a Web platform in Appwrite with hostname "localhost" ` +
        `(Auth → Platforms → Add platform).${projectNote} ` +
        `OAuth callback: http://localhost:3000/auth/callback/google (use your dev port if different). ` +
        `Do not rely on *.theopenstock.com for local dev.`
      );
    }
    return (
      `Sign-in failed: Appwrite must allow hostname "${hostname}". ` +
      `Wildcard platforms like *.${hostname} do not include the apex domain—add a separate Web platform with hostname "${hostname}" ` +
      `(not only *.${hostname}).${projectNote} ` +
      `OAuth callback: https://${hostname}/auth/callback/google.`
    );
  }
  const known = AUTH_ERROR_MESSAGES[code];
  if (known) return known;

  if (/session|secret|expired|invalid/i.test(code)) {
    return AUTH_ERROR_MESSAGES.oauth_session_failed;
  }

  if (code.length > 0 && code.length < 120) {
    return `Sign-in failed: ${code}`;
  }

  return "Sign-in failed. Please try again.";
}
