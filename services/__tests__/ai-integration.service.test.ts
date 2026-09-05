/**
 * Unit Tests for AI Integration Service
 * Tests Ollama connection, API key validation, provider switching,
 * and visual annotations.
 * Requirements: 22.10, 22.14, 22.18, 22.19
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PriceData, SymbolData, TechnicalIndicators } from "@/types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockOllamaGenerate = vi.fn();
const mockOllamaVerify = vi.fn();
const mockOllamaGetDefaultModel = vi.fn().mockReturnValue("llama3.2");

vi.mock("@/services/ollama.service", () => ({
  ollamaService: {
    generate: mockOllamaGenerate,
    verify: mockOllamaVerify,
    getDefaultModel: mockOllamaGetDefaultModel,
  },
}));

const mockValidateKey = vi.fn();
const mockGetKey = vi.fn();

vi.mock("@/services/api-key-manager.service", () => ({
  apiKeyManagerService: {
    validateKey: mockValidateKey,
    getKey: mockGetKey,
  },
}));

const mockHostedQuery = vi.fn();

vi.mock("@/services/hosted-ai.service", () => ({
  hostedAIService: {
    query: mockHostedQuery,
  },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockSymbolData: SymbolData = {
  symbol: "AAPL",
  name: "Apple Inc.",
  price: 185.5,
  change: 2.3,
  changePercent: 1.25,
  marketCap: 2_900_000_000_000,
  volume: 55_000_000,
  fiftyTwoWeekHigh: 199.62,
  fiftyTwoWeekLow: 164.08,
  lastUpdated: new Date("2025-01-01"),
};

const mockPriceData: PriceData[] = [
  {
    timestamp: new Date("2025-01-01"),
    open: 180,
    high: 185,
    low: 179,
    close: 183,
    volume: 50_000_000,
  },
  {
    timestamp: new Date("2025-01-02"),
    open: 183,
    high: 188,
    low: 182,
    close: 185.5,
    volume: 55_000_000,
  },
];

const mockIndicators: TechnicalIndicators = {
  rsi: { value: 62, signal: "overpriced" },
  macd: { value: 1.2, signal: 0.8, histogram: 0.4, trend: "underpriced" },
  movingAverages: { ma50: 178, ma200: 165, signal: "underpriced" },
  bollingerBands: { upper: 192, middle: 180, lower: 168, signal: "fair" },
  overallSentiment: "fair",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function makeService() {
  const { AIIntegrationService } =
    await import("@/services/ai-integration.service");
  return new AIIntegrationService();
}

// ---------------------------------------------------------------------------
// Ollama connection tests (Requirement 22.10)
// ---------------------------------------------------------------------------

describe("Ollama connection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes prompts to ollamaService.generate when provider is OLLAMA", async () => {
    mockOllamaGenerate.mockResolvedValue(
      "RSI above 60 suggests the asset may be relatively expensive."
    );

    const service = await makeService();
    await service.setAIProvider("OLLAMA", { provider: "OLLAMA", settings: {} });

    const result = await service.explainMetric("rsi", 62, { symbol: "AAPL" });

    expect(mockOllamaGenerate).toHaveBeenCalledOnce();
    expect(result.text).toContain("RSI");
  });

  it("passes the configured model to ollamaService.generate", async () => {
    mockOllamaGenerate.mockResolvedValue("Analysis complete.");

    const service = await makeService();
    await service.setAIProvider("OLLAMA", {
      provider: "OLLAMA",
      model: "mistral:7b",
      settings: {},
    });

    await service.explainMetric("rsi", 55, { symbol: "TSLA" });

    const call = mockOllamaGenerate.mock.calls[0][0];
    expect(call.model).toBe("mistral:7b");
  });

  it("falls back to ollamaService.getDefaultModel when no model is configured", async () => {
    mockOllamaGenerate.mockResolvedValue("Analysis complete.");

    const service = await makeService();
    await service.setAIProvider("OLLAMA", { provider: "OLLAMA", settings: {} });

    await service.explainMetric("macd", 1.2, { symbol: "NVDA" });

    const call = mockOllamaGenerate.mock.calls[0][0];
    expect(call.model).toBe("llama3.2");
  });

  it("propagates errors from ollamaService.generate", async () => {
    mockOllamaGenerate.mockRejectedValue(new Error("Ollama not running"));

    const service = await makeService();
    await service.setAIProvider("OLLAMA", { provider: "OLLAMA", settings: {} });

    await expect(
      service.explainMetric("rsi", 70, { symbol: "AAPL" })
    ).rejects.toThrow("Ollama not running");
  });

  it("throws when no provider is configured", async () => {
    const service = await makeService();

    await expect(
      service.explainMetric("rsi", 70, { symbol: "AAPL" })
    ).rejects.toThrow("No AI provider configured");
  });
});

// ---------------------------------------------------------------------------
// API key validation tests (Requirement 22.14)
// ---------------------------------------------------------------------------

describe("API key validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when apiKeyManagerService.validateKey returns valid=true", async () => {
    mockValidateKey.mockResolvedValue({ valid: true });

    const service = await makeService();
    const result = await service.validateAPIKey("OPENAI", "sk-valid-key");

    expect(result).toBe(true);
    expect(mockValidateKey).toHaveBeenCalledWith("OPENAI", "sk-valid-key");
  });

  it("returns false when apiKeyManagerService.validateKey returns valid=false", async () => {
    mockValidateKey.mockResolvedValue({
      valid: false,
      error: "Invalid API key — authentication failed",
    });

    const service = await makeService();
    const result = await service.validateAPIKey("GEMINI", "AIza-bad-key");

    expect(result).toBe(false);
  });

  it("validates each BYOK provider independently", async () => {
    const providers = ["OPENAI", "GEMINI", "MISTRAL", "DEEPSEEK"] as const;

    for (const provider of providers) {
      vi.clearAllMocks();
      mockValidateKey.mockResolvedValue({ valid: true });

      const service = await makeService();
      await service.validateAPIKey(provider, "test-key");

      expect(mockValidateKey).toHaveBeenCalledWith(provider, "test-key");
    }
  });

  it("uses stored key from apiKeyManagerService when config has no apiKey", async () => {
    mockGetKey.mockResolvedValue("stored-openai-key");
    mockValidateKey.mockResolvedValue({ valid: true });

    const service = await makeService();
    await service.setAIProvider("OPENAI", { provider: "OPENAI", settings: {} });

    // Trigger a prompt to exercise the getKey path
    vi.mocked(
      (await import("@/services/ollama.service")).ollamaService.generate
    );
    // Patch global fetch to simulate BYOK call
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: "Answer." } }],
        }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    await service.explainMetric("rsi", 55, { symbol: "AAPL" });

    expect(mockGetKey).toHaveBeenCalledWith("OPENAI");
  });

  it("throws when BYOK provider has no key stored and none in config", async () => {
    mockGetKey.mockResolvedValue(null);

    const service = await makeService();
    await service.setAIProvider("OPENAI", { provider: "OPENAI", settings: {} });

    await expect(
      service.explainMetric("rsi", 55, { symbol: "AAPL" })
    ).rejects.toThrow("No API key found for OPENAI");
  });
});

// ---------------------------------------------------------------------------
// Provider switching tests (Requirement 22.23)
// ---------------------------------------------------------------------------

describe("Provider switching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("setAIProvider updates the active config", async () => {
    const service = await makeService();

    expect(service.getConfig()).toBeNull();

    await service.setAIProvider("OLLAMA", { provider: "OLLAMA", settings: {} });
    expect(service.getConfig()?.provider).toBe("OLLAMA");

    await service.setAIProvider("OPENAI", {
      provider: "OPENAI",
      apiKey: "sk-abc",
      settings: {},
    });
    expect(service.getConfig()?.provider).toBe("OPENAI");
  });

  it("routes to ollamaService when provider is OLLAMA", async () => {
    mockOllamaGenerate.mockResolvedValue("Ollama response.");

    const service = await makeService();
    await service.setAIProvider("OLLAMA", { provider: "OLLAMA", settings: {} });

    await service.explainMetric("rsi", 55, { symbol: "AAPL" });

    expect(mockOllamaGenerate).toHaveBeenCalledOnce();
    expect(mockHostedQuery).not.toHaveBeenCalled();
  });

  it("routes to hostedAIService when provider is HOSTED", async () => {
    mockHostedQuery.mockResolvedValue({
      success: true,
      text: "Hosted response.",
    });

    const service = await makeService();
    await service.setAIProvider("HOSTED", {
      provider: "HOSTED",
      settings: { userId: "user-1", subscriptionToken: "tok-abc" },
    });

    await service.explainMetric("rsi", 55, { symbol: "AAPL" });

    expect(mockHostedQuery).toHaveBeenCalledOnce();
    expect(mockOllamaGenerate).not.toHaveBeenCalled();
  });

  it("routes to BYOK fetch when provider is OPENAI with apiKey in config", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: "OpenAI response." } }],
        }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const service = await makeService();
    await service.setAIProvider("OPENAI", {
      provider: "OPENAI",
      apiKey: "sk-test-key",
      settings: {},
    });

    const result = await service.explainMetric("rsi", 55, { symbol: "AAPL" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-test-key",
        }),
      })
    );
    expect(result.text).toBe("OpenAI response.");
  });

  it("routes Gemini BYOK to a current generateContent model, not gemini-pro", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          candidates: [{ content: { parts: [{ text: "Gemini response." }] } }],
        }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const service = await makeService();
    await service.setAIProvider("GEMINI", {
      provider: "GEMINI",
      apiKey: "AIza-test-key",
      settings: {},
    });

    const result = await service.explainMetric("rsi", 55, { symbol: "AAPL" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIza-test-key",
      expect.objectContaining({ method: "POST" })
    );
    expect(result.text).toBe("Gemini response.");
  });

  it("uses AI_MODEL override for Gemini generateContent", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          candidates: [{ content: { parts: [{ text: "Flash response." }] } }],
        }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const service = await makeService();
    await service.setAIProvider("GEMINI", {
      provider: "GEMINI",
      apiKey: "AIza-test-key",
      model: "gemini-3.5-flash",
      settings: {},
    });

    await service.explainMetric("rsi", 55, { symbol: "AAPL" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=AIza-test-key",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("falls back to another Gemini model when the first returns HTTP 404", async () => {
    const fetchSpy = vi.fn().mockImplementation(async (url: string) => {
      if (String(url).includes("gemini-2.5-flash:generateContent")) {
        return { ok: false, status: 404, json: async () => ({}) };
      }
      return {
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: "Fallback model." }] } }],
        }),
      };
    });
    vi.stubGlobal("fetch", fetchSpy);

    const service = await makeService();
    await service.setAIProvider("GEMINI", {
      provider: "GEMINI",
      apiKey: "AIza-test-key",
      settings: {},
    });

    const result = await service.explainMetric("rsi", 55, { symbol: "AAPL" });

    expect(result.text).toBe("Fallback model.");
    expect(String(fetchSpy.mock.calls[0][0])).toContain("gemini-2.5-flash");
    expect(String(fetchSpy.mock.calls[1][0])).toContain("gemini-3.5-flash");
  });

  it("switching from OLLAMA to HOSTED uses the new provider on next call", async () => {
    mockOllamaGenerate.mockResolvedValue("Ollama response.");
    mockHostedQuery.mockResolvedValue({
      success: true,
      text: "Hosted response.",
    });

    const service = await makeService();

    await service.setAIProvider("OLLAMA", { provider: "OLLAMA", settings: {} });
    await service.explainMetric("rsi", 55, { symbol: "AAPL" });
    expect(mockOllamaGenerate).toHaveBeenCalledOnce();

    vi.clearAllMocks();
    mockHostedQuery.mockResolvedValue({
      success: true,
      text: "Hosted response.",
    });

    await service.setAIProvider("HOSTED", {
      provider: "HOSTED",
      settings: { userId: "u1", subscriptionToken: "t1" },
    });
    await service.explainMetric("rsi", 55, { symbol: "AAPL" });
    expect(mockHostedQuery).toHaveBeenCalledOnce();
    expect(mockOllamaGenerate).not.toHaveBeenCalled();
  });

  it("throws when hosted AI returns an error response", async () => {
    mockHostedQuery.mockResolvedValue({
      success: false,
      error: "Subscription required.",
    });

    const service = await makeService();
    await service.setAIProvider("HOSTED", {
      provider: "HOSTED",
      settings: { userId: "u1", subscriptionToken: "bad-token" },
    });

    await expect(
      service.explainMetric("rsi", 55, { symbol: "AAPL" })
    ).rejects.toThrow("Subscription required.");
  });
});

// ---------------------------------------------------------------------------
// Visual annotation tests (Requirements 22.18, 22.19)
// ---------------------------------------------------------------------------

describe("Visual annotations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOllamaGenerate.mockResolvedValue("Explanation text.");
  });

  it("explainMetric returns a visual annotation targeting the metric element", async () => {
    const service = await makeService();
    await service.setAIProvider("OLLAMA", { provider: "OLLAMA", settings: {} });

    const result = await service.explainMetric("rsi", 62, mockSymbolData);

    expect(result.visualAnnotations).toHaveLength(1);
    expect(result.visualAnnotations[0].type).toBe("highlight");
    expect(result.visualAnnotations[0].target).toBe('[data-metric="rsi"]');
    expect(result.visualAnnotations[0].label).toBe("rsi");
  });

  it("explainMetric returns relatedMetrics for known metrics", async () => {
    const service = await makeService();
    await service.setAIProvider("OLLAMA", { provider: "OLLAMA", settings: {} });

    const result = await service.explainMetric("rsi", 62, mockSymbolData);

    expect(result.relatedMetrics).toContain("macd");
    expect(result.relatedMetrics).toContain("bollingerBands");
  });

  it("explainMetric returns empty relatedMetrics for unknown metrics", async () => {
    const service = await makeService();
    await service.setAIProvider("OLLAMA", { provider: "OLLAMA", settings: {} });

    const result = await service.explainMetric(
      "unknownMetric",
      42,
      mockSymbolData
    );

    expect(result.relatedMetrics).toEqual([]);
  });

  it("analyzeChart returns visual annotations for key points", async () => {
    mockOllamaGenerate.mockResolvedValue(
      "Price has risen steadily.\n• RSI is elevated at 62\n• MACD shows bullish crossover\n• Price above 200-day MA"
    );

    const service = await makeService();
    await service.setAIProvider("OLLAMA", { provider: "OLLAMA", settings: {} });

    const result = await service.analyzeChart(mockPriceData, mockIndicators);

    expect(result.visualAnnotations.length).toBeGreaterThan(0);
    result.visualAnnotations.forEach((ann) => {
      expect(ann.type).toBe("label");
      expect(ann.target).toMatch(/^chart-annotation-\d+$/);
      expect(typeof ann.label).toBe("string");
    });
  });

  it("analyzeChart caps visual annotations at 3", async () => {
    mockOllamaGenerate.mockResolvedValue(
      "Summary.\n• Point 1\n• Point 2\n• Point 3\n• Point 4\n• Point 5"
    );

    const service = await makeService();
    await service.setAIProvider("OLLAMA", { provider: "OLLAMA", settings: {} });

    const result = await service.analyzeChart(mockPriceData, mockIndicators);

    expect(result.visualAnnotations.length).toBeLessThanOrEqual(3);
  });

  it("analyzeChart returns a confidence value between 0 and 1", async () => {
    mockOllamaGenerate.mockResolvedValue("Summary.\n• Point 1");

    const service = await makeService();
    await service.setAIProvider("OLLAMA", { provider: "OLLAMA", settings: {} });

    const result = await service.analyzeChart(mockPriceData, mockIndicators);

    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("answerQuestion annotates metrics mentioned in the question", async () => {
    mockOllamaGenerate.mockResolvedValue(
      "The RSI is elevated, suggesting the stock may be overbought."
    );

    const service = await makeService();
    await service.setAIProvider("OLLAMA", { provider: "OLLAMA", settings: {} });

    const result = await service.answerQuestion(
      "What does the RSI tell me about this stock?",
      mockSymbolData
    );

    const targets = result.visualAnnotations.map((a) => a.target);
    expect(targets).toContain('[data-metric="rsi"]');
  });

  it("answerQuestion returns no annotations when no known metrics are mentioned", async () => {
    mockOllamaGenerate.mockResolvedValue(
      "The company has strong fundamentals."
    );

    const service = await makeService();
    await service.setAIProvider("OLLAMA", { provider: "OLLAMA", settings: {} });

    const result = await service.answerQuestion(
      "Tell me about the company history",
      mockSymbolData
    );

    expect(result.visualAnnotations).toHaveLength(0);
  });

  it("annotation positions are numeric coordinates", async () => {
    const service = await makeService();
    await service.setAIProvider("OLLAMA", { provider: "OLLAMA", settings: {} });

    const result = await service.explainMetric("macd", 1.2, mockSymbolData);

    result.visualAnnotations.forEach((ann) => {
      expect(typeof ann.position.x).toBe("number");
      expect(typeof ann.position.y).toBe("number");
    });
  });
});
