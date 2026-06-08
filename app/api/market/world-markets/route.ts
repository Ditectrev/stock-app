/**
 * GET /api/market/world-markets
 * Returns global market indices
 */

import { NextRequest, NextResponse } from "next/server";
import { MARKET_UI_COPY, userFacingApiError } from "@/lib/api-user-error";
import { marketDataService } from "@/services/market-data.service";
import { logger } from "@/lib/logger";

export async function GET(_request: NextRequest) {
  try {
    const data = await marketDataService.getWorldMarkets();

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Failed to fetch world markets", error as Error);

    return NextResponse.json(
      {
        success: false,
        error: userFacingApiError(error, MARKET_UI_COPY.load.worldMarkets),
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
