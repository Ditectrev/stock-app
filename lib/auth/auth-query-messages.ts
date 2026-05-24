const AUTH_ERROR_MESSAGES: Record<string, string> = {
  apple_sign_in_unavailable:
    "Apple Sign-In is not available yet. Use Google or email sign-in.",
  google_oauth_failed:
    "Google sign-in was cancelled or failed. Please try again.",
  oauth_redirect_not_whitelisted:
    "Sign-in failed: this site hostname is not registered in Appwrite. In Appwrite Console → your project → Auth → Platforms, add a Web platform whose hostname matches this site exactly (e.g. theopenstock.com, not localhost). Also add www.theopenstock.com if you use www. Then try Google sign-in again.",
  appwrite_not_configured:
    "Sign-in is not configured on this server. Try email sign-in or contact support.",
  oauth_start_failed: "Could not start Google sign-in. Please try again.",
  sso_temporarily_disabled:
    "Social sign-in is temporarily unavailable. Use email sign-in.",
  missing_credentials: "Sign-in did not complete. Please try again.",
  server_error: "Sign-in failed due to a server error. Please try again.",
};

export function describeAuthQueryError(
  code: string,
  hostname?: string
): string {
  if (code === "oauth_redirect_not_whitelisted" && hostname) {
    return `Sign-in failed: add "${hostname}" as a Web platform in Appwrite (Console → your project → Auth → Platforms → Add platform). If you also use www, add that hostname separately. Required return URLs: https://${hostname}/api/auth/callback/google and https://${hostname}/?auth_error=google_oauth_failed`;
  }
  return AUTH_ERROR_MESSAGES[code] ?? "Sign-in failed. Please try again.";
}
