import { describe, it, expect } from "vitest";
import { appwriteOAuthErrorToAuthCode } from "../parse-oauth-callback-error";

describe("appwriteOAuthErrorToAuthCode", () => {
  it("detects missing client secret from Appwrite JSON error", () => {
    const raw = JSON.stringify({
      message:
        "Failed to obtain access token. The Google OAuth2 provider returned an error: invalid_request: client_secret is missing.",
      type: "user_oauth2_bad_request",
      code: 400,
    });
    expect(appwriteOAuthErrorToAuthCode(raw)).toBe(
      "google_client_secret_missing"
    );
  });

  it("falls back for unknown errors", () => {
    expect(appwriteOAuthErrorToAuthCode("something else")).toBe(
      "google_oauth_failed"
    );
  });
});
