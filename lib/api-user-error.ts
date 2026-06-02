import { MARKET_UI_COPY } from "@/lib/market-ui-copy";

const TECHNICAL_PREFIX = /^Failed to /i;
const TECHNICAL_HINT =
  /Yahoo|crumb|ECONNREFUSED|fetch failed|ENOTFOUND|ETIMEDOUT|status code \d{3}/i;

/**
 * Returns a safe user-facing API error. Passes through intentional app messages
 * (validation, hosted-AI setup) and maps internal/technical errors to fallback.
 */
export function userFacingApiError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }
  const message = error.message.trim();
  if (!message) {
    return fallback;
  }
  if (!isUserFacingMessage(message)) {
    return fallback;
  }
  return message;
}

function isUserFacingMessage(message: string): boolean {
  if (message.length > 240 || message.includes("\n    at ")) {
    return false;
  }
  if (TECHNICAL_PREFIX.test(message) || TECHNICAL_HINT.test(message)) {
    return false;
  }
  if (
    message.startsWith("We couldn't") ||
    message.startsWith("We could not") ||
    message.startsWith("Ditectrev AI") ||
    message.startsWith("No API key stored")
  ) {
    return true;
  }
  if (
    /^(Authentication|Invalid|Missing|Symbol not|Paid AI|Local or BYOK|BYOK tier|Query parameter|sessionId|Valid paid)/i.test(
      message
    )
  ) {
    return true;
  }
  if (
    /\b(unavailable|not found|required)\b/i.test(message) &&
    message.length <= 120
  ) {
    return true;
  }
  if (
    message.length <= 80 &&
    !TECHNICAL_PREFIX.test(message) &&
    !TECHNICAL_HINT.test(message)
  ) {
    return true;
  }
  return false;
}

/** Re-export for routes that only need the constant map. */
export { MARKET_UI_COPY };
