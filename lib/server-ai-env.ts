/**
 * Server-side AI env for Hosted AI tier (Vercel / Node).
 * Uses AI_API_KEY for Hosted AI server routes.
 */

export function getServerAIProvider(): string | undefined {
  const raw = process.env.AI_PROVIDER?.trim().toUpperCase();
  return raw || undefined;
}

export function getServerAIApiKey(): string | undefined {
  const key = process.env.AI_API_KEY?.trim() || "";
  return key || undefined;
}

export function getServerAIModel(): string | undefined {
  const model = process.env.AI_MODEL?.trim();
  return model || undefined;
}
