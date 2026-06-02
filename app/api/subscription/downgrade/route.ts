/**
 * PUT /api/subscription/downgrade
 * Downgrades the user to a lower tier, effective at end of billing period.
 * Requirements: 22.27
 */

import { NextRequest, NextResponse } from "next/server";
import { MARKET_UI_COPY } from "@/lib/api-user-error";
import { subscriptionService } from "@/services/subscription.service";
import { logger } from "@/lib/logger";
import { PricingTier } from "@/types";
import { getAuthenticatedUser } from "@/lib/server-auth";

export async function PUT(request: NextRequest) {
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
    const { newTier } = body as { newTier: PricingTier };

    if (!newTier) {
      return NextResponse.json(
        {
          success: false,
          error: "newTier is required",
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    const result = await subscriptionService.downgradeTier(auth.id, newTier);

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
    logger.error("Failed to downgrade subscription", error as Error);

    return NextResponse.json(
      {
        success: false,
        error: MARKET_UI_COPY.account.downgrade,
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
