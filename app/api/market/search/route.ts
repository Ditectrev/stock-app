/**
 * Symbol Search API Route
 * GET /api/market/search?q=query
 */

import { NextRequest, NextResponse } from "next/server";
import { MARKET_UI_COPY, userFacingApiError } from "@/lib/api-user-error";
import { marketDataService } from "@/services/market-data.service";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (query === null) {
      return NextResponse.json(
        { success: false, error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    if (query.trim().length === 0) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    const results = await marketDataService.searchSymbols(query);

    return NextResponse.json(
      {
        success: true,
        data: results,
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Symbol search failed", error as Error, {
      query: request.nextUrl.searchParams.get("q"),
    });

    return NextResponse.json(
      {
        success: false,
        error: userFacingApiError(error, MARKET_UI_COPY.search.failed),
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
