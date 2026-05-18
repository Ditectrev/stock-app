export type Tier = "FREE" | "ADS_FREE" | "LOCAL" | "BYOK" | "HOSTED_AI";

export type ExplanationProvider =
  | "OLLAMA"
  | "OPENAI"
  | "GEMINI"
  | "MISTRAL"
  | "DEEPSEEK"
  | "HOSTED";

export const EXPLANATIONS_PROVIDER_STORAGE_KEY = "explanations_provider";

export const EXPLANATIONS_PROVIDER_CHANGED_EVENT =
  "explanations-provider-changed";

export const PROVIDER_OPTIONS: Array<{
  id: ExplanationProvider;
  name: string;
  subtitle: string;
  allowedTiers: Tier[];
}> = [
  {
    id: "OLLAMA",
    name: "Ollama (Local)",
    subtitle: "Run on your machine (no provider API key)",
    allowedTiers: ["LOCAL", "BYOK"],
  },
  {
    id: "OPENAI",
    name: "OpenAI GPT",
    subtitle: "Requires your API key",
    allowedTiers: ["BYOK"],
  },
  {
    id: "GEMINI",
    name: "Google Gemini",
    subtitle: "Requires your API key",
    allowedTiers: ["BYOK"],
  },
  {
    id: "MISTRAL",
    name: "Mistral AI",
    subtitle: "Requires your API key",
    allowedTiers: ["BYOK"],
  },
  {
    id: "DEEPSEEK",
    name: "DeepSeek",
    subtitle: "Requires your API key",
    allowedTiers: ["BYOK"],
  },
  {
    id: "HOSTED",
    name: "Ditectrev AI",
    subtitle: "Premium managed service",
    allowedTiers: ["HOSTED_AI"],
  },
];

export function isExplanationProvider(
  value: string | null
): value is ExplanationProvider {
  return PROVIDER_OPTIONS.some((p) => p.id === value);
}

export function isProviderAllowedForTier(
  provider: ExplanationProvider,
  tier: Tier
): boolean {
  return (
    PROVIDER_OPTIONS.find((p) => p.id === provider)?.allowedTiers.includes(
      tier
    ) ?? false
  );
}

export function getDefaultProviderForTier(tier: Tier): ExplanationProvider | null {
  const allowed = PROVIDER_OPTIONS.filter((p) => p.allowedTiers.includes(tier));
  return allowed[0]?.id ?? null;
}

export function readStoredExplanationProvider(): ExplanationProvider | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(EXPLANATIONS_PROVIDER_STORAGE_KEY);
  return isExplanationProvider(stored) ? stored : null;
}

export function saveExplanationProvider(provider: ExplanationProvider): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EXPLANATIONS_PROVIDER_STORAGE_KEY, provider);
  window.dispatchEvent(new Event(EXPLANATIONS_PROVIDER_CHANGED_EVENT));
}

export function getAIProviderHeaders(): HeadersInit {
  const provider = readStoredExplanationProvider();
  if (!provider) return {};
  return { "x-ai-provider": provider };
}
