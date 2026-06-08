/**
 * GET /api/calendar/economic
 * Returns economic calendar events
 * Query params: country (string), importance ("high" | "medium" | "low")
 */

import { NextRequest, NextResponse } from "next/server";
import { MARKET_UI_COPY, userFacingApiError } from "@/lib/api-user-error";
import { marketDataService } from "@/services/market-data.service";
import { logger } from "@/lib/logger";

const VALID_IMPORTANCE = ["high", "medium", "low"] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const country = searchParams.get("country") || undefined;
    const rawImportance = searchParams.get("importance");
    const importance =
      rawImportance &&
      VALID_IMPORTANCE.includes(
        rawImportance as (typeof VALID_IMPORTANCE)[number]
      )
        ? (rawImportance as "high" | "medium" | "low")
        : undefined;

    const data = await marketDataService.getEconomicEvents(country, importance);

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Failed to fetch economic events", error as Error);

    return NextResponse.json(
      {
        success: false,
        error: userFacingApiError(error, MARKET_UI_COPY.load.economicCalendar),
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
