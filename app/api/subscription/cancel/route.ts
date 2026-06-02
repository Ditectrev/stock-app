/**
 * DELETE /api/subscription/cancel
 * Cancels the user's subscription. Access maintained until billing period ends.
 * Requirements: 22.27
 */

import { NextRequest, NextResponse } from "next/server";
import { subscriptionService } from "@/services/subscription.service";
import { logger } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/server-auth";
import { stripeBillingService } from "@/services/stripe-billing.service";
import { MARKET_UI_COPY } from "@/lib/api-user-error";

export async function DELETE(request: NextRequest) {
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

    const result = await subscriptionService.cancelSubscription(auth.id);

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

    try {
      await stripeBillingService.cancelActiveSubscription(auth.id);
    } catch (error) {
      logger.error("Failed to cancel Stripe subscription", error as Error, {
        userId: auth.id,
      });
      return NextResponse.json(
        {
          success: false,
          error: MARKET_UI_COPY.billing.cancelFailed,
          timestamp: new Date(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message:
          "Subscription cancelled. Access maintained until end of billing period.",
      },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Failed to cancel subscription", error as Error);

    return NextResponse.json(
      {
        success: false,
        error: MARKET_UI_COPY.billing.cancelFailed,
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
