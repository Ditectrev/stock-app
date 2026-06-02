/**
 * PUT /api/subscription/upgrade
 * Upgrades the user to a higher pricing tier. Takes effect immediately.
 * Requirements: 22.24, 22.26
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
    const { newTier, paymentMethod } = body as {
      newTier: PricingTier;
      paymentMethod?: string;
    };

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

    const result = await subscriptionService.upgradeTier(
      auth.id,
      newTier,
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
    logger.error("Failed to upgrade subscription", error as Error);

    return NextResponse.json(
      {
        success: false,
        error: MARKET_UI_COPY.account.upgrade,
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
