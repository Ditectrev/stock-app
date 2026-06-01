/**
 * GET /api/market/world-markets
 * Returns global market indices
 */

import { NextRequest, NextResponse } from "next/server";
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
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch world markets",
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
