/**
 * Completes email OTP: POST { userId, secret } → Appwrite createSession (same as OAuth callback).
 */

import { NextRequest, NextResponse } from "next/server";
import { AppwriteException } from "node-appwrite";
import { createServerClient } from "@/lib/appwrite";
import { getAppwriteServerEnv } from "@/lib/appwrite-server-env";
import { logger } from "@/lib/logger";
import { getSessionCookieOptions } from "@/lib/auth/session-cookie";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const raw =
    typeof body === "object" &&
    body !== null &&
    "userId" in body &&
    "secret" in body
      ? (body as { userId: unknown; secret: unknown })
      : null;

  const userId = raw && typeof raw.userId === "string" ? raw.userId.trim() : "";
  const secretRaw = raw && typeof raw.secret === "string" ? raw.secret : "";
  const secret = secretRaw.replace(/\D/g, "");

  if (!userId || !secret) {
    return NextResponse.json(
      { error: "Enter the verification code from your email." },
      { status: 400 }
    );
  }

  const appwrite = getAppwriteServerEnv();
  if (!appwrite.endpoint || !appwrite.projectId || !appwrite.apiKey) {
    return NextResponse.json(
      {
        error:
          "Sign-in is not configured on this server. Set NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, and APPWRITE_API_KEY on the server.",
      },
      { status: 503 }
    );
  }

  try {
    const { account } = createServerClient();
    const session = await account.createSession(userId, secret);
    logger.info("Email OTP session created", { userId });
    const response = NextResponse.json({ ok: true });
    if (session.secret) {
      response.cookies.set(
        "appwrite_session",
        session.secret,
        getSessionCookieOptions(request)
      );
    }
    return response;
  } catch (err) {
    logger.error(
      "Email OTP verify failed",
      err instanceof Error ? err : new Error(String(err)),
      { userId }
    );
    const message =
      err instanceof AppwriteException
        ? err.message
        : err instanceof Error
          ? err.message
          : "Verification failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
