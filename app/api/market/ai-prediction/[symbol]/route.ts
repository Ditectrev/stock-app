import { NextRequest, NextResponse } from "next/server";
import { aiMarketInsightsService } from "@/services/ai-market-insights.service";
import { logger } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/server-auth";
import { subscriptionService } from "@/services/subscription.service";
import { resolveMarketRouteLLMConfig } from "@/lib/resolve-market-ai-llm-config";

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

    const requestedProviderRaw =
      request.headers.get("x-ai-provider")?.trim().toUpperCase() ?? "";

    const resolved = await resolveMarketRouteLLMConfig({
      tier,
      userId: auth.id,
      requestedProviderRaw,
    });
    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: 503 }
      );
    }

    if (!resolved.llmConfig) {
      return NextResponse.json(
        {
          success: false,
          error: "Configure an AI provider to generate predictions.",
        },
        { status: 503 }
      );
    }

    const data = await aiMarketInsightsService.generatePrediction(
      symbol,
      resolved.llmConfig
    );

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date(),
    });
  } catch (error) {
    const { symbol } = await params;
    logger.error("Failed to generate AI prediction", error as Error, {
      symbol,
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate AI prediction",
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
