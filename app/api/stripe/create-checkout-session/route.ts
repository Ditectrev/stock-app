import { NextRequest, NextResponse } from "next/server";
import { MARKET_UI_COPY, userFacingApiError } from "@/lib/api-user-error";
import type { PricingTier } from "@/types";
import { getAuthenticatedUser } from "@/lib/server-auth";
import { stripeBillingService } from "@/services/stripe-billing.service";

type PaidTier = Exclude<PricingTier, "FREE">;

function isPaidTier(tier: string): tier is PaidTier {
  return ["ADS_FREE", "LOCAL", "BYOK", "HOSTED_AI"].includes(tier);
}

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

    const body = (await request.json()) as { tier?: string };
    const tier = body.tier?.trim().toUpperCase();
    if (!tier || !isPaidTier(tier)) {
      return NextResponse.json(
        { success: false, error: "Valid paid tier is required" },
        { status: 400 }
      );
    }

    const session = await stripeBillingService.createCheckoutSession({
      tier,
      userId: auth.id,
      email: auth.email,
      baseUrl: getBaseUrl(request),
    });

    if (!session.url) {
      return NextResponse.json(
        { success: false, error: MARKET_UI_COPY.load.checkoutUrl },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { url: session.url },
      timestamp: new Date(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: userFacingApiError(error, MARKET_UI_COPY.load.checkout),
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
