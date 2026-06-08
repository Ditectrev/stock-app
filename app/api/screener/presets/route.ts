/**
 * Screener Presets API Route
 * GET /api/screener/presets - Returns default presets
 * POST /api/screener/presets - Saves a custom preset
 */

import { NextRequest, NextResponse } from "next/server";
import { MARKET_UI_COPY, userFacingApiError } from "@/lib/api-user-error";
import { screenerService } from "@/services/screener.service";
import { logger } from "@/lib/logger";
import type { ScreenerFilter, ScreenerPreset } from "@/types";

export async function GET() {
  try {
    const presets = screenerService.getDefaultPresets();

    return NextResponse.json(
      {
        success: true,
        data: presets,
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Failed to fetch screener presets", error as Error);

    return NextResponse.json(
      {
        success: false,
        error: userFacingApiError(
          error,
          MARKET_UI_COPY.load.screenerPresetsLoad
        ),
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, filters } = body as {
      name?: string;
      description?: string;
      filters?: ScreenerFilter[];
    };

    if (!name || !filters || filters.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and at least one filter are required",
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    const preset: ScreenerPreset = {
      id: `custom-${name.toLowerCase().replace(/\s+/g, "-")}`,
      name,
      description: description || "",
      filters,
      isDefault: false,
      createdAt: new Date(),
    };

    return NextResponse.json(
      {
        success: true,
        data: preset,
        timestamp: new Date(),
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Failed to save screener preset", error as Error);

    return NextResponse.json(
      {
        success: false,
        error: userFacingApiError(
          error,
          MARKET_UI_COPY.load.screenerPresetsSave
        ),
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
