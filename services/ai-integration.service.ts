/**
 * AI Integration Service
 * Orchestrates AI features across all three AI tiers:
 * - LOCAL: Ollama running on the user's device
 * - BYOK: User-provided API keys for external providers
 * - HOSTED_AI: Platform-managed AI infrastructure
 *
 * Provides visual annotations connecting AI explanations to chart elements.
 * Requirements: 22.18, 22.19, 22.20, 22.21, 22.22, 22.23
 */

import { logger } from "@/lib/logger";
import { ollamaService } from "@/services/ollama.service";
import {
  apiKeyManagerService,
  type BYOKProvider,
} from "@/services/api-key-manager.service";
import { hostedAIService } from "@/services/hosted-ai.service";
import type {
  AIProvider,
  AIConfig,
  PriceData,
  SymbolData,
  TechnicalIndicators,
  VisualAnnotation,
} from "@/types";

export interface AIExplanation {
  text: string;
  visualAnnotations: VisualAnnotation[];
  relatedMetrics: string[];
}

export interface AIAnalysis {
  summary: string;
  keyPoints: string[];
  visualAnnotations: VisualAnnotation[];
  confidence: number;
}

export interface AIResponse {
  text: string;
  visualAnnotations: VisualAnnotation[];
}

// ---------------------------------------------------------------------------
// BYOK provider → fetch helper
// ---------------------------------------------------------------------------

const BYOK_ENDPOINTS: Record<BYOKProvider, string> = {
  OPENAI: "https://api.openai.com/v1/chat/completions",
  GEMINI:
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
  MISTRAL: "https://api.mistral.ai/v1/chat/completions",
  DEEPSEEK: "https://api.deepseek.com/v1/chat/completions",
};

async function queryBYOK(
  provider: BYOKProvider,
  apiKey: string,
  prompt: string,
  maxTokens = 512
): Promise<string> {
  const endpoint = BYOK_ENDPOINTS[provider];

  if (provider === "GEMINI") {
    const url = `${endpoint}?key=${apiKey}`;
    const geminiBody: {
      contents: Array<{ parts: Array<{ text: string }> }>;
      generationConfig?: { maxOutputTokens: number };
    } = {
      contents: [{ parts: [{ text: prompt }] }],
    };
    if (maxTokens > 512) {
      geminiBody.generationConfig = { maxOutputTokens: maxTokens };
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`Gemini error: HTTP ${res.status}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  // OpenAI-compatible format (OpenAI, Mistral, DeepSeek)
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:
        provider === "OPENAI"
          ? "gpt-4o-mini"
          : provider === "MISTRAL"
            ? "mistral-small-latest"
            : "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`${provider} error: HTTP ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ---------------------------------------------------------------------------
// Annotation helpers
// ---------------------------------------------------------------------------

function buildMetricAnnotation(metric: string): VisualAnnotation {
  return {
    type: "highlight",
    target: `[data-metric="${metric}"]`,
    position: { x: 0, y: 0 },
    label: metric,
  };
}

function buildChartAnnotations(keyPoints: string[]): VisualAnnotation[] {
  return keyPoints.slice(0, 3).map((point, i) => ({
    type: "label" as const,
    target: `chart-annotation-${i}`,
    position: { x: 0, y: i * 20 },
    label: point.slice(0, 60),
  }));
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class AIIntegrationService {
  private config: AIConfig | null = null;

  /**
   * Sets the active AI provider and configuration.
   * Requirement: 22.23
   */
  async setAIProvider(provider: AIProvider, config: AIConfig): Promise<void> {
    this.config = { ...config, provider };
    logger.info("AI provider set", { provider });
  }

  /**
   * Returns the current AI configuration.
   */
  getConfig(): AIConfig | null {
    return this.config;
  }

  /**
   * Validates an API key for a BYOK provider.
   * Requirement: 22.14
   */
  async validateAPIKey(
    provider: BYOKProvider,
    apiKey: string
  ): Promise<boolean> {
    const result = await apiKeyManagerService.validateKey(provider, apiKey);
    return result.valid;
  }

  /**
   * Explains a financial metric with visual annotations pointing to the
   * relevant chart or metric element.
   * Requirement: 22.18, 22.19, 22.21
   */
  async explainMetric(
    metric: string,
    value: number,
    context: Partial<SymbolData>
  ): Promise<AIExplanation> {
    const prompt = `You are a financial analyst assistant. Explain the metric "${metric}" with value ${value} for ${context.symbol ?? "this asset"} in 2-3 plain sentences. Do not use "buy" or "sell" language. Focus on what the value means and whether it appears high, low, or typical.`;

    const text = await this.runPrompt(prompt);

    return {
      text,
      visualAnnotations: [buildMetricAnnotation(metric)],
      relatedMetrics: this.getRelatedMetrics(metric),
    };
  }

  /**
   * Analyzes chart data and returns key observations with visual annotations.
   * Requirement: 22.19, 22.21
   */
  async analyzeChart(
    chartData: PriceData[],
    indicators: TechnicalIndicators
  ): Promise<AIAnalysis> {
    const latest = chartData.at(-1);
    const oldest = chartData.at(0);
    const priceChange =
      latest && oldest
        ? (((latest.close - oldest.close) / oldest.close) * 100).toFixed(2)
        : "N/A";

    const prompt = `You are a financial analyst. Analyze this price chart data:
- Data points: ${chartData.length}
- Latest close: ${latest?.close ?? "N/A"}
- Price change over period: ${priceChange}%
- RSI: ${indicators.rsi.value.toFixed(1)} (${indicators.rsi.signal})
- Overall sentiment: ${indicators.overallSentiment}

Provide a brief summary and 3 key observations. Do not use "buy" or "sell" language.
Format: Summary on first line, then 3 bullet points starting with "•".`;

    const raw = await this.runPrompt(prompt);
    const lines = raw.split("\n").filter((l) => l.trim());
    const summary = lines[0] ?? raw;
    const keyPoints = lines
      .slice(1)
      .filter((l) => l.startsWith("•"))
      .map((l) => l.replace(/^•\s*/, ""));

    return {
      summary,
      keyPoints,
      visualAnnotations: buildChartAnnotations(keyPoints),
      confidence: 0.8,
    };
  }

  /**
   * Answers a user question about a symbol with context-aware response.
   * Requirement: 22.20, 22.22
   */
  async answerQuestion(
    question: string,
    context: SymbolData
  ): Promise<AIResponse> {
    const prompt = `You are a financial analyst assistant. Answer this question about ${context.symbol} (${context.name}):

Question: ${question}

Context:
- Current price: $${context.price}
- Change: ${context.changePercent.toFixed(2)}%
- Market cap: $${(context.marketCap / 1e9).toFixed(2)}B

Answer in 2-4 sentences. Do not use "buy" or "sell" language.`;

    const text = await this.runPrompt(prompt);

    // Annotate any metrics mentioned in the question
    const annotations: VisualAnnotation[] = [];
    const metricKeywords = [
      "rsi",
      "macd",
      "pe",
      "revenue",
      "earnings",
      "price",
    ];
    metricKeywords.forEach((kw) => {
      if (question.toLowerCase().includes(kw)) {
        annotations.push(buildMetricAnnotation(kw));
      }
    });

    return { text, visualAnnotations: annotations };
  }

  // ---------------------------------------------------------------------------
  // Internal routing
  // ---------------------------------------------------------------------------

  private async runPrompt(
    prompt: string,
    options?: { maxOutputTokens?: number }
  ): Promise<string> {
    if (!this.config) {
      throw new Error(
        "No AI provider configured. Please set up an AI provider first."
      );
    }

    const { provider } = this.config;
    const maxTokens = options?.maxOutputTokens ?? 512;

    try {
      if (provider === "OLLAMA") {
        return await ollamaService.generate({
          model: this.config.model ?? ollamaService.getDefaultModel(),
          prompt,
          ...(maxTokens > 512 ? { format: "json" as const } : {}),
          options: { num_predict: maxTokens },
        });
      }

      if (provider === "HOSTED") {
        const userId = (this.config.settings?.userId as string) ?? "";
        const token = (this.config.settings?.subscriptionToken as string) ?? "";
        const res = await hostedAIService.query({
          type: "answer_question",
          payload: { prompt },
          userId,
          subscriptionToken: token,
        });
        if (!res.success) throw new Error(res.error);
        return res.text ?? "";
      }

      // BYOK providers
      const byokProvider = provider as BYOKProvider;
      const apiKey =
        this.config.apiKey ?? (await apiKeyManagerService.getKey(byokProvider));

      if (!apiKey) {
        throw new Error(
          `No API key found for ${provider}. Please add your key in Settings.`
        );
      }

      return await queryBYOK(byokProvider, apiKey, prompt, maxTokens);
    } catch (error) {
      logger.error("AI prompt failed", error as Error, {
        provider: this.config.provider,
      });
      throw error;
    }
  }

  /**
   * Runs an arbitrary prompt and returns the raw model output text.
   * This is intended for backend features that need to parse structured output.
   */
  async runRawPrompt(
    prompt: string,
    options?: { maxOutputTokens?: number }
  ): Promise<string> {
    return await this.runPrompt(prompt, options);
  }

  private getRelatedMetrics(metric: string): string[] {
    const relations: Record<string, string[]> = {
      rsi: ["macd", "bollingerBands", "overallSentiment"],
      macd: ["rsi", "movingAverages"],
      peRatio: ["pbRatio", "pegRatio", "earningsGrowth"],
      revenue: ["netIncome", "profitMargin", "revenueGrowth"],
      movingAverages: ["macd", "bollingerBands"],
    };
    return relations[metric] ?? [];
  }
}

export const aiIntegrationService = new AIIntegrationService();
