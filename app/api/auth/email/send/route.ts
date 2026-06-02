/**
 * Sends an Appwrite email OTP / magic-link token to the given address.
 */

import { NextRequest, NextResponse } from "next/server";
import { AppwriteException, ID } from "node-appwrite";
import { createServerClient } from "@/lib/appwrite";
import { getAppwriteServerEnv } from "@/lib/appwrite-server-env";
import { logger } from "@/lib/logger";
import { MARKET_UI_COPY } from "@/lib/api-user-error";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email =
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email.trim()
      : "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const appwrite = getAppwriteServerEnv();
  if (!appwrite.endpoint || !appwrite.projectId || !appwrite.apiKey) {
    logger.warn("Email OTP: Appwrite not fully configured");
    return NextResponse.json(
      {
        error:
          "Email sign-in is not configured on this server. Set NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, and APPWRITE_API_KEY (with sessions.write scope).",
      },
      { status: 503 }
    );
  }

  try {
    const { account } = createServerClient();
    const token = await account.createEmailToken(ID.unique(), email);
    logger.info("Email OTP sent", { email, userId: token.userId });
    return NextResponse.json({ ok: true, userId: token.userId });
  } catch (err) {
    logger.error(
      "Email OTP send failed",
      err instanceof Error ? err : new Error(String(err)),
      { email }
    );
    let message =
      err instanceof AppwriteException
        ? err.message
        : err instanceof Error
          ? err.message
          : MARKET_UI_COPY.auth.verificationEmail;
    if (typeof message === "string" && message.includes("sessions.write")) {
      message =
        "Appwrite API key must include the sessions.write scope. In Appwrite Console: Project → API keys → your key → Scopes → enable Sessions (write).";
    }
    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}
