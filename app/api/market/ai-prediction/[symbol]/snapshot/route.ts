import { NextRequest, NextResponse } from "next/server";
import { MARKET_UI_COPY, userFacingApiError } from "@/lib/api-user-error";
import { aiMarketInsightsService } from "@/services/ai-market-insights.service";
import { logger } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/server-auth";
import { subscriptionService } from "@/services/subscription.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const tier = await subscriptionService.getCurrentTier(auth.id);
    if (!["LOCAL", "BYOK", "HOSTED_AI"].includes(tier)) {
      return NextResponse.json(
        { success: false, error: "Paid AI tier required" },
        { status: 403 }
      );
    }

    const { symbol } = await params;
    if (!symbol) {
      return NextResponse.json(
        { success: false, error: "Symbol parameter is required" },
        { status: 400 }
      );
    }

    const data = await aiMarketInsightsService.gatherPredictionSnapshot(symbol);

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date(),
    });
  } catch (error) {
    const { symbol } = await params;
    logger.error("Failed to load AI prediction snapshot", error as Error, {
      symbol,
    });

    return NextResponse.json(
      {
        success: false,
        error: userFacingApiError(
          error,
          MARKET_UI_COPY.load.aiPredictionSnapshot
        ),
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
