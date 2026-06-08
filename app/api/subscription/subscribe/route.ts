/**
 * POST /api/subscription/subscribe
 * Creates a new subscription for the authenticated user.
 * Requirements: 22.8, 22.17
 */

import { NextRequest, NextResponse } from "next/server";
import { MARKET_UI_COPY } from "@/lib/api-user-error";
import { subscriptionService } from "@/services/subscription.service";
import { logger } from "@/lib/logger";
import { PricingTier } from "@/types";
import { getAuthenticatedUser } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          timestamp: new Date(),
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tier, paymentMethod } = body as {
      tier: PricingTier;
      paymentMethod?: string;
    };

    if (!tier) {
      return NextResponse.json(
        {
          success: false,
          error: "tier is required",
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    const result = await subscriptionService.subscribeTier(
      auth.id,
      tier,
      paymentMethod
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.subscription,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Failed to create subscription", error as Error);

    return NextResponse.json(
      {
        success: false,
        error: MARKET_UI_COPY.account.subscribe,
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
