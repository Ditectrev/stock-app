import { NextRequest, NextResponse } from "next/server";
import { aiMarketInsightsService } from "@/services/ai-market-insights.service";
import { logger } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/server-auth";
import { subscriptionService } from "@/services/subscription.service";
import { resolveMarketRouteLLMConfig } from "@/lib/resolve-market-ai-llm-config";

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
            "Configure an AI explanations provider to generate dynamic stock-of-the-day picks.",
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
        error:
          error instanceof Error
            ? error.message
            : "Failed to load stock of the day",
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
