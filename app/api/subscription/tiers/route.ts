/**
 * GET /api/subscription/tiers
 * Returns all available pricing tiers.
 * Requirements: 22.1, 22.3
 */

import { NextResponse } from "next/server";
import { MARKET_UI_COPY } from "@/lib/api-user-error";
import { subscriptionService } from "@/services/subscription.service";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const tiers = subscriptionService.getPricingTiers();

    return NextResponse.json({
      success: true,
      data: tiers,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Failed to fetch pricing tiers", error as Error);

    return NextResponse.json(
      {
        success: false,
        error: MARKET_UI_COPY.load.pricingDetails,
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
