/**
 * Screener Search API Route
 * POST /api/screener/search
 * Accepts filters and returns matching screener results
 */

import { NextRequest, NextResponse } from "next/server";
import { MARKET_UI_COPY, userFacingApiError } from "@/lib/api-user-error";
import { screenerService } from "@/services/screener.service";
import { logger } from "@/lib/logger";
import type { ScreenerFilter } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filters = [], preset } = body as {
      filters?: ScreenerFilter[];
      preset?: string;
    };

    let appliedFilters = filters;

    if (preset) {
      const presets = screenerService.getDefaultPresets();
      const matched = presets.find((p) => p.id === preset);
      if (matched) {
        appliedFilters = matched.filters;
      }
    }

    const results = await screenerService.fetchScreenerData(appliedFilters);

    return NextResponse.json(
      {
        success: true,
        data: results,
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Screener search failed", error as Error);

    return NextResponse.json(
      {
        success: false,
        error: userFacingApiError(error, MARKET_UI_COPY.load.screenerResults),
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
