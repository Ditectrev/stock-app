import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AppwriteException } from "node-appwrite";
import { createServerClient } from "@/lib/appwrite";
import { getAppwriteServerEnv } from "@/lib/appwrite-server-env";
import { getSessionCookieOptions } from "@/lib/auth/session-cookie";
import { logger } from "@/lib/logger";

export type OAuthSessionCreateResult =
  | { ok: true; sessionSecret?: string }
  | { ok: false; error: string; status: number };

export async function createOAuthSessionFromCallback(
  userId: string,
  secret: string
): Promise<OAuthSessionCreateResult> {
  const appwrite = getAppwriteServerEnv();
  if (!appwrite.endpoint || !appwrite.projectId || !appwrite.apiKey) {
    return {
      ok: false,
      error: "appwrite_not_configured",
      status: 503,
    };
  }

  try {
    const { account } = createServerClient();
    const session = await account.createSession(userId, secret);
    logger.info("OAuth session created", { userId });
    return { ok: true, sessionSecret: session.secret ?? undefined };
  } catch (err) {
    logger.error(
      "OAuth session creation failed",
      err instanceof Error ? err : new Error(String(err)),
      { userId }
    );
    const message =
      err instanceof AppwriteException
        ? err.message
        : err instanceof Error
          ? err.message
          : "oauth_session_failed";
    return { ok: false, error: message, status: 400 };
  }
}

/** Redirect home and set httpOnly appwrite_session cookie. */
export async function completeOAuthSessionRedirect(
  request: NextRequest,
  userId: string,
  secret: string
): Promise<NextResponse> {
  const result = await createOAuthSessionFromCallback(userId, secret);
  if (!result.ok) {
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(result.error)}`, request.url)
    );
  }

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
}
