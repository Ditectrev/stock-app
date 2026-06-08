/**
 * GET /api/market/crypto
 * Returns cryptocurrency performance data
 * Query params: period (1D, 1W, 1M, 3M, 1Y) - defaults to 1D
 */

import { NextRequest, NextResponse } from "next/server";
import { MARKET_UI_COPY, userFacingApiError } from "@/lib/api-user-error";
import { marketDataService } from "@/services/market-data.service";
import { logger } from "@/lib/logger";

const PERIOD_MAP: Record<string, string> = {
  "1D": "1d",
  "1W": "5d",
  "1M": "1mo",
  "3M": "3mo",
  "1Y": "1y",
  "5Y": "5y",
  YTD: "ytd",
  MAX: "max",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPeriod = searchParams.get("period") || "1D";
    const period = PERIOD_MAP[rawPeriod.toUpperCase()] || "1d";

    const data = await marketDataService.getCryptoPerformance(period);

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Failed to fetch crypto performance", error as Error);

    return NextResponse.json(
      {
        success: false,
        error: userFacingApiError(error, MARKET_UI_COPY.load.cryptoPerformance),
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
