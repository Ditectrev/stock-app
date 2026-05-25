/**
 * Google OAuth Callback Handler (server redirect).
 * Direct GET with userId/secret (createOAuth2Token flow).
 */

import { NextRequest, NextResponse } from "next/server";
import { completeOAuthSessionRedirect } from "@/lib/auth/complete-oauth-session";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");
  const error = searchParams.get("error");

  if (error) {
    logger.warn("Google OAuth returned an error", { error });
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (searchParams.get("failure")) {
    return NextResponse.redirect(
      new URL("/?auth_error=google_oauth_failed", request.url)
    );
  }

  if (!userId || !secret) {
    logger.warn("Google OAuth callback missing userId or secret");
    return NextResponse.redirect(
      new URL("/?auth_error=missing_credentials", request.url)
    );
  }

  return completeOAuthSessionRedirect(request, userId, secret);
}
