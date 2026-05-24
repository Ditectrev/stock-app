import type { NextRequest } from "next/server";

/** Cookie options for the Appwrite session secret stored after sign-in. */
export function getSessionCookieOptions(request?: NextRequest) {
  const secure =
    request != null
      ? new URL(request.url).protocol === "https:"
      : process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function getSessionCookieClearOptions(request?: NextRequest) {
  return { ...getSessionCookieOptions(request), maxAge: 0 };
}
