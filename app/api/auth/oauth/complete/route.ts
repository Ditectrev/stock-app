/**
 * Completes Google OAuth after the browser callback page receives userId + secret.
 */

import { NextRequest, NextResponse } from "next/server";
import { createOAuthSessionFromCallback } from "@/lib/auth/complete-oauth-session";
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
  const secret = raw && typeof raw.secret === "string" ? raw.secret.trim() : "";

  if (!userId || !secret) {
    return NextResponse.json({ error: "missing_credentials" }, { status: 400 });
  }

  const result = await createOAuthSessionFromCallback(userId, secret);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  const response = NextResponse.json({ ok: true });
  if (result.sessionSecret) {
    response.cookies.set(
      "appwrite_session",
      result.sessionSecret,
      getSessionCookieOptions(request)
    );
  }
  return response;
}
