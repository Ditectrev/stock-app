import { NextRequest, NextResponse } from "next/server";
import { createServerSessionClient } from "@/lib/appwrite";
import { getSessionCookieClearOptions } from "@/lib/auth/session-cookie";

export async function POST(request: NextRequest) {
  const sessionSecret = request.cookies.get("appwrite_session")?.value;

  if (sessionSecret) {
    try {
      const { account } = createServerSessionClient(sessionSecret);
      await account.deleteSession("current");
    } catch {
      // Best-effort signout; still clear local cookie.
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    "appwrite_session",
    "",
    getSessionCookieClearOptions(request)
  );
  return response;
}
