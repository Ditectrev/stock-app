/**
 * Apple OAuth Callback Handler
 * Processes the redirect from Apple Sign-In and creates a session.
 * Requirements: 21.14
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticationService } from "@/services/authentication.service";
import { logger } from "@/lib/logger";
import { getSessionCookieOptions } from "@/lib/auth/session-cookie";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");
  const error = searchParams.get("error");

  // Handle provider-side errors
  if (error) {
    logger.warn("Apple OAuth returned an error", { error });
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!userId || !secret) {
    logger.warn("Apple OAuth callback missing userId or secret");
    return NextResponse.redirect(
      new URL("/?auth_error=missing_credentials", request.url)
    );
  }

  try {
    const result = await authenticationService.createOAuthSession(
      userId,
      secret
    );

    if (!result.success) {
      logger.warn("Apple OAuth session creation failed", {
        error: result.error,
      });
      return NextResponse.redirect(
        new URL(
          `/?auth_error=${encodeURIComponent(result.error || "unknown")}`,
          request.url
        )
      );
    }

    logger.info("Apple OAuth callback successful", {
      userId: result.user?.id,
    });

    const response = NextResponse.redirect(
      new URL("/?auth_success=true", request.url)
    );
    if (result.sessionSecret) {
      response.cookies.set(
        "appwrite_session",
        result.sessionSecret,
        getSessionCookieOptions(request)
      );
    }
    return response;
  } catch (err) {
    logger.error(
      "Apple OAuth callback error",
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.redirect(
      new URL("/?auth_error=server_error", request.url)
    );
  }
}
