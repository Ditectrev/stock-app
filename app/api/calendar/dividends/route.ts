/**
 * GET /api/calendar/dividends
 * Returns dividend calendar events
 * Query params: country (string), timezone (string)
 */

import { NextResponse } from "next/server";
import { MARKET_UI_COPY, userFacingApiError } from "@/lib/api-user-error";
import { marketDataService } from "@/services/market-data.service";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const data = await marketDataService.getDividendEvents();

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Failed to fetch dividend events", error as Error);

    return NextResponse.json(
      {
        success: false,
        error: userFacingApiError(error, MARKET_UI_COPY.load.dividendCalendar),
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
