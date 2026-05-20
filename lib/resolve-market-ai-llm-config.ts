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

  if (opts.tier === "HOSTED_AI") {
    const hostedModel =
      process.env.AI_MODEL?.trim() ||
      process.env.OLLAMA_MODEL?.trim() ||
      undefined;
    const providerRaw = process.env.AI_PROVIDER?.trim().toUpperCase();

    if (!providerRaw) {
      return {
        ok: false,
        error:
          "Hosted AI is not configured on this deployment. Set AI_PROVIDER and AI_API_KEY for server-side inference.",
      };
    }

    if (providerRaw === "HOSTED") {
      return {
        ok: false,
        error:
          "AI_PROVIDER=HOSTED is not supported for server routes until /api/ai/hosted is deployed. Use OPENAI, GEMINI, MISTRAL, DEEPSEEK, or OLLAMA.",
      };
    }

    if (providerRaw === "OLLAMA") {
      return {
        ok: true,
        llmConfig: {
          provider: "OLLAMA",
          model: hostedModel ?? ollamaModel,
        },
      };
    }

    if (isBYOKCloudProvider(providerRaw)) {
      const apiKey = process.env.AI_API_KEY?.trim() || "";
      if (!apiKey) {
        return {
          ok: false,
          error: `Hosted AI is set to ${providerRaw} but AI_API_KEY is not set on the deployment.`,
        };
      }
      return {
        ok: true,
        llmConfig: {
          provider: providerRaw,
          apiKey,
          model: hostedModel ?? model,
        },
      };
    }

    return {
      ok: false,
      error: `Unsupported AI_PROVIDER for hosted tier: ${providerRaw}. Use OPENAI, GEMINI, MISTRAL, DEEPSEEK, or OLLAMA.`,
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
