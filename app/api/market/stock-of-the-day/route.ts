import { NextRequest, NextResponse } from "next/server";
import { MARKET_UI_COPY, userFacingApiError } from "@/lib/api-user-error";
import { aiMarketInsightsService } from "@/services/ai-market-insights.service";
import { logger } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/server-auth";
import { subscriptionService } from "@/services/subscription.service";
import { resolveMarketRouteLLMConfig } from "@/lib/resolve-market-ai-llm-config";
import { parseAIStockCandidates } from "@/lib/stock-of-the-day-ai";

export async function GET(request: NextRequest) {
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

    const requestedProviderRaw =
      request.headers.get("x-ai-provider")?.trim().toUpperCase() ?? "";

    const resolved = await resolveMarketRouteLLMConfig({
      tier,
      userId: auth.id,
      requestedProviderRaw,
    });
    if (!resolved.ok) {
      logger.warn("Stock of the day: no LLM credentials", {
        userId: auth.id,
        tier,
        detail: resolved.error,
      });
      return NextResponse.json(
        {
          success: false,
          error:
            resolved.error ??
            "AI is available on your plan, but this deployment has no active provider configuration for stock ideas.",
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    const data = await aiMarketInsightsService.getStockOfTheDay(
      resolved.llmConfig
    );

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Failed to load stock of the day", error as Error);

    return NextResponse.json(
      {
        success: false,
        error: userFacingApiError(error, MARKET_UI_COPY.load.stockOfTheDay),
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const tier = await subscriptionService.getCurrentTier(auth.id);
    if (!["LOCAL", "BYOK"].includes(tier)) {
      return NextResponse.json(
        { success: false, error: "Local or BYOK AI tier required" },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      buyCandidates?: unknown;
      sellCandidates?: unknown;
    } | null;

    const buyCandidates = parseAIStockCandidates(body?.buyCandidates);
    const sellCandidates = parseAIStockCandidates(body?.sellCandidates);

    if (buyCandidates.length < 2 || sellCandidates.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "AI returned an incomplete stock-of-the-day candidate set.",
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    const data = await aiMarketInsightsService.enrichStockOfTheDayCandidates({
      buyCandidates,
      sellCandidates,
    });

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error(
      "Failed to validate local stock-of-the-day candidates",
      error as Error
    );

    return NextResponse.json(
      {
        success: false,
        error: userFacingApiError(
          error,
          MARKET_UI_COPY.load.stockOfTheDayValidate
        ),
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
