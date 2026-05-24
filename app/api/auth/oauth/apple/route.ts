/**
 * Apple Sign-In is not enabled yet (Appwrite + Apple developer setup).
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.redirect(
    new URL("/?auth_error=apple_sign_in_unavailable", request.url)
  );
}
