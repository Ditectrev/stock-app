/**
 * GET /api/subscription/current
 * Returns the current user's subscription tier.
 * Requirements: 22.8
 */

import { NextRequest, NextResponse } from "next/server";
import { subscriptionService } from "@/services/subscription.service";
import { logger } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      // Anonymous visitors are FREE tier; 200 avoids noisy 401s in DevTools on every page load.
      return NextResponse.json({
        success: true,
        data: {
          tier: "FREE",
          authenticated: false,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          status: null,
        },
        timestamp: new Date(),
      });
    }

    const tier = await subscriptionService.getCurrentTier(auth.id);
    const record = await subscriptionService.getSubscriptionRecord(auth.id);

    return NextResponse.json({
      success: true,
      data: {
        tier,
        authenticated: true,
        currentPeriodEnd: record?.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: record?.cancelAtPeriodEnd ?? false,
        status: record?.status ?? null,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Failed to fetch current subscription", error as Error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch current subscription",
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
