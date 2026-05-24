import { NextRequest, NextResponse } from "next/server";
import { createServerSessionClient } from "@/lib/appwrite";
import { getSessionCookieClearOptions } from "@/lib/auth/session-cookie";

export async function GET(request: NextRequest) {
  const sessionSecret = request.cookies.get("appwrite_session")?.value;
  if (!sessionSecret) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const { account } = createServerSessionClient(sessionSecret);
    const user = await account.get();
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.$id,
        email: user.email,
        name: user.name || undefined,
      },
    });
  } catch {
    const response = NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
    response.cookies.set(
      "appwrite_session",
      "",
      getSessionCookieClearOptions(request)
    );
    return response;
  }
}
