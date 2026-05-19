import { appwriteAIKeyStoreService } from "@/services/appwrite-ai-key-store.service";
import type { BYOKProvider } from "@/services/api-key-manager.service";
import type { AIProvider } from "@/types";

export type MarketRouteLLMConfig = {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
};

function isBYOKCloudProvider(value: string): value is BYOKProvider {
  return ["OPENAI", "GEMINI", "MISTRAL", "DEEPSEEK"].includes(value);
}

/**
 * Resolves LLM config for market AI routes (BYOK can use Ollama without a stored API key).
 */
export async function resolveMarketRouteLLMConfig(opts: {
  tier: string;
  userId: string;
  requestedProviderRaw: string;
}): Promise<
  | { ok: true; llmConfig: MarketRouteLLMConfig | undefined }
  | { ok: false; error: string }
> {
  const model = process.env.AI_MODEL;
  const ollamaModel = process.env.OLLAMA_MODEL ?? model;

  if (opts.tier === "LOCAL") {
    return {
      ok: true,
      llmConfig: { provider: "OLLAMA", model: ollamaModel },
    };
  }

  if (opts.tier === "BYOK") {
    const header = opts.requestedProviderRaw.trim().toUpperCase();
    if (header === "OLLAMA") {
      return {
        ok: true,
        llmConfig: { provider: "OLLAMA", model: ollamaModel },
      };
    }

    const requested = isBYOKCloudProvider(header) ? header : null;
    const provider =
      requested ??
      (await appwriteAIKeyStoreService.getPreferredProvider(opts.userId));
    if (!provider) {
      return {
        ok: true,
        llmConfig: { provider: "OLLAMA", model: ollamaModel },
      };
    }

    const apiKey = await appwriteAIKeyStoreService.getDecryptedKey(
      opts.userId,
      provider
    );
    if (!apiKey) {
      return {
        ok: false,
        error: `No API key stored for provider ${provider}. Change provider in profile or save a key for ${provider}.`,
      };
    }

    return { ok: true, llmConfig: { provider, apiKey, model } };
  }

  return { ok: true, llmConfig: undefined };
}
