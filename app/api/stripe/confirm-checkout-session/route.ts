import { NextRequest, NextResponse } from "next/server";
import { MARKET_UI_COPY, userFacingApiError } from "@/lib/api-user-error";
import { getAuthenticatedUser } from "@/lib/server-auth";
import { stripeBillingService } from "@/services/stripe-billing.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { sessionId?: string };
    const sessionId = body.sessionId?.trim();
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "sessionId is required" },
        { status: 400 }
      );
    }

    await stripeBillingService.confirmCheckoutSessionAfterRedirect(
      sessionId,
      auth.id
    );

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: userFacingApiError(error, MARKET_UI_COPY.load.confirmCheckout),
      },
      { status: 400 }
    );
  }
}
