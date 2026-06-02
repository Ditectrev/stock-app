/**
 * Screener Export API Route
 * GET /api/screener/export - Exports screener results as CSV
 */

import { NextRequest, NextResponse } from "next/server";
import { MARKET_UI_COPY, userFacingApiError } from "@/lib/api-user-error";
import { screenerService } from "@/services/screener.service";
import { logger } from "@/lib/logger";
import type { ScreenerFilter, ScreenerResult } from "@/types";

function resultsToCsv(results: ScreenerResult[]): string {
  const headers = [
    "Symbol",
    "Name",
    "Sector",
    "Price",
    "Change %",
    "Volume",
    "Market Cap",
    "P/E Ratio",
    "P/B Ratio",
    "PEG Ratio",
    "Dividend Yield",
    "Revenue Growth",
    "Earnings Growth",
    "Valuation",
    "Match Score",
  ];

  const rows = results.map((r) =>
    [
      r.symbol,
      `"${r.name.replace(/"/g, '""')}"`,
      r.sector,
      r.price,
      r.changePercent,
      r.volume,
      r.marketCap,
      r.peRatio ?? "",
      r.pbRatio ?? "",
      r.pegRatio ?? "",
      r.dividendYield ?? "",
      r.revenueGrowth ?? "",
      r.earningsGrowth ?? "",
      r.valuationContext,
      r.matchScore,
    ].join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filtersParam = searchParams.get("filters");

    let filters: ScreenerFilter[] = [];
    if (filtersParam) {
      try {
        filters = JSON.parse(filtersParam);
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid filters parameter",
            timestamp: new Date(),
          },
          { status: 400 }
        );
      }
    }

    const results = await screenerService.fetchScreenerData(filters);
    const csv = resultsToCsv(results);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="screener-results.csv"',
      },
    });
  } catch (error) {
    logger.error("Screener export failed", error as Error);

    return NextResponse.json(
      {
        success: false,
        error: userFacingApiError(error, MARKET_UI_COPY.load.screenerExport),
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
