/**
 * GET /api/market/forecast/[symbol]
 * Returns analyst forecasts and estimates
 */

import { NextRequest, NextResponse } from "next/server";
import { MARKET_UI_COPY, userFacingApiError } from "@/lib/api-user-error";
import { marketDataService } from "@/services/market-data.service";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: "Symbol parameter is required" },
        { status: 400 }
      );
    }

    const data = await marketDataService.getForecastData(symbol);

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date(),
    });
  } catch (error) {
    const { symbol } = await params;
    logger.error("Failed to fetch forecast data", error as Error, {
      symbol,
    });

    return NextResponse.json(
      {
        success: false,
        error: userFacingApiError(error, MARKET_UI_COPY.load.forecast),
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
