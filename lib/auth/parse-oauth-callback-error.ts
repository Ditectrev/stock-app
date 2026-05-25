/** Map Appwrite OAuth `error` query param (often JSON) to an auth_error code. */
export function appwriteOAuthErrorToAuthCode(
  errorParam: string | null
): string {
  if (!errorParam?.trim()) {
    return "google_oauth_failed";
  }

  let message = errorParam;
  let type = "";

  try {
    const parsed = JSON.parse(errorParam) as {
      message?: string;
      type?: string;
    };
    message = parsed.message ?? errorParam;
    type = parsed.type ?? "";
  } catch {
    /* plain string */
  }

  if (/client_secret is missing/i.test(message)) {
    return "google_client_secret_missing";
  }
  if (/invalid_client|client_id/i.test(message)) {
    return "google_oauth_invalid_client";
  }
  if (type === "user_oauth2_bad_request") {
    return "google_oauth_bad_request";
  }

  return "google_oauth_failed";
}
