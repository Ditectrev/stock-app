/**
 * GET /api/market/historical/[symbol]?range=1Y
 * Returns historical price data
 */

import { NextRequest, NextResponse } from "next/server";
import { MARKET_UI_COPY, userFacingApiError } from "@/lib/api-user-error";
import { marketDataService } from "@/services/market-data.service";
import { logger } from "@/lib/logger";
import { TimeRange } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const searchParams = request.nextUrl.searchParams;
    const range = (searchParams.get("range") || "1Y") as TimeRange;

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: "Symbol parameter is required" },
        { status: 400 }
      );
    }

    const data = await marketDataService.getHistoricalPrices(symbol, range);

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date(),
    });
  } catch (error) {
    const { symbol } = await params;
    logger.error("Failed to fetch historical data", error as Error, {
      symbol,
    });
    return NextResponse.json(
      {
        success: false,
        error: userFacingApiError(error, MARKET_UI_COPY.load.liveHistorical),
        timestamp: new Date(),
      },
      { status: 502 }
    );
  }
}
