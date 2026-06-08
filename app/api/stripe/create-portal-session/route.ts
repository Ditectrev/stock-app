import { NextRequest, NextResponse } from "next/server";
import { MARKET_UI_COPY, userFacingApiError } from "@/lib/api-user-error";
import { getAuthenticatedUser } from "@/lib/server-auth";
import { stripeBillingService } from "@/services/stripe-billing.service";

function getBaseUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const result = await stripeBillingService.createBillingPortalSession({
      userId: auth.id,
      baseUrl: getBaseUrl(request),
    });

    return NextResponse.json({
      success: true,
      data: { url: result.url },
      timestamp: new Date(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: userFacingApiError(error, MARKET_UI_COPY.billing.portalFailed),
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
