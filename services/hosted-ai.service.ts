/**
 * Hosted AI Service
 * Provides AI features via the platform's managed infrastructure.
 * No API keys or local setup required — subscription-based access.
 * Requirements: 22.16, 22.17
 */

import { AUTH_UI_COPY } from "@/lib/auth-ui-copy";
import { logger } from "@/lib/logger";
import type { PriceData, SymbolData, TechnicalIndicators } from "@/types";

export interface HostedAIRequest {
  type: "explain_metric" | "analyze_chart" | "answer_question";
  payload: Record<string, unknown>;
  userId: string;
  subscriptionToken: string;
}

export interface HostedAIResponse {
  success: boolean;
  text?: string;
  error?: string;
  rateLimitRemaining?: number;
}

// In production this would point to the actual hosted AI endpoint
const HOSTED_AI_ENDPOINT =
  process.env.NEXT_PUBLIC_HOSTED_AI_URL ?? "/api/ai/hosted";

export class HostedAIService {
  /**
   * Sends a request to the hosted AI endpoint.
   * Validates subscription access before forwarding.
   * Requirement: 22.16, 22.17
   */
  async query(request: HostedAIRequest): Promise<HostedAIResponse> {
    try {
      logger.info("Sending request to hosted AI", { type: request.type });

      const response = await fetch(HOSTED_AI_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${request.subscriptionToken}`,
        },
        body: JSON.stringify({
          type: request.type,
          payload: request.payload,
          userId: request.userId,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: AUTH_UI_COPY.hostedTierRequired,
        };
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        return {
          success: false,
          error: `${AUTH_UI_COPY.hostedRateLimitPrefix}${retryAfter ? ` in ${retryAfter}s` : " shortly"}.`,
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: `${AUTH_UI_COPY.hostedReachPrefix} (HTTP ${response.status}).`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        text: data.text,
        rateLimitRemaining: data.rateLimitRemaining,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Hosted AI request failed", error as Error);
      return {
        success: false,
        error: `${AUTH_UI_COPY.hostedReachPrefix}: ${message}`,
      };
    }
  }

  /**
   * Explains a financial metric using hosted AI.
   */
  async explainMetric(
    metric: string,
    value: number,
    symbol: string,
    userId: string,
    subscriptionToken: string
  ): Promise<HostedAIResponse> {
    return this.query({
      type: "explain_metric",
      payload: { metric, value, symbol },
      userId,
      subscriptionToken,
    });
  }

  /**
   * Analyzes chart data using hosted AI.
   */
  async analyzeChart(
    chartData: PriceData[],
    indicators: TechnicalIndicators,
    symbol: string,
    userId: string,
    subscriptionToken: string
  ): Promise<HostedAIResponse> {
    // Send a summary rather than full data to reduce payload size
    const summary = {
      symbol,
      dataPoints: chartData.length,
      latestClose: chartData.at(-1)?.close,
      overallSentiment: indicators.overallSentiment,
      rsi: indicators.rsi.value,
    };

    return this.query({
      type: "analyze_chart",
      payload: summary,
      userId,
      subscriptionToken,
    });
  }

  /**
   * Answers a user question about a symbol using hosted AI.
   */
  async answerQuestion(
    question: string,
    context: SymbolData,
    userId: string,
    subscriptionToken: string
  ): Promise<HostedAIResponse> {
    return this.query({
      type: "answer_question",
      payload: { question, symbol: context.symbol, price: context.price },
      userId,
      subscriptionToken,
    });
  }
}

export const hostedAIService = new HostedAIService();
