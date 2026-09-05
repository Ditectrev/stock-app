/**
 * GET /api/market/fear-greed
 * Returns Fear and Greed Index
 */

import { NextRequest, NextResponse } from "next/server";
import { MARKET_UI_COPY, userFacingApiError } from "@/lib/api-user-error";
import { marketDataService } from "@/services/market-data.service";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const limitParam = parseInt(
      request.nextUrl.searchParams.get("limit") || "30",
      10
    );
    // 0 means "all available CNN history"
    const clampedLimit = limitParam === 0 ? 0 : Math.max(1, limitParam);
    const data = await marketDataService.getFearGreedIndex(clampedLimit);

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Failed to fetch Fear & Greed Index", error as Error);

    return NextResponse.json(
      {
        success: false,
        error: userFacingApiError(error, MARKET_UI_COPY.load.fearGreed),
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
