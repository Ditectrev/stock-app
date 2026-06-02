/**
 * GET /api/calendar/earnings
 * Returns earnings calendar events
 * Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
 */

import { NextRequest, NextResponse } from "next/server";
import { MARKET_UI_COPY, userFacingApiError } from "@/lib/api-user-error";
import { marketDataService } from "@/services/market-data.service";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const data = await marketDataService.getEarningsEvents(startDate, endDate);

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Failed to fetch earnings events", error as Error);

    return NextResponse.json(
      {
        success: false,
        error: userFacingApiError(error, MARKET_UI_COPY.load.earningsCalendar),
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
