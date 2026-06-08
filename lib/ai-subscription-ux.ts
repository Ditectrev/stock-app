import type { PricingTier } from "@/types";

/**
 * Copy for AI-gated panels when the user has no AI-enabled subscription.
 */
export function getAiSubscriptionGateMessage(
  tier: PricingTier | null | undefined
): string {
  if (tier === "FREE" || tier === "ADS_FREE") {
    return "AI is available on Local AI, BYOK, and Ditectrev AI plans. Upgrade to unlock predictions, chart analysis, and daily ideas.";
  }
  return "Enable Local AI, BYOK, or Ditectrev AI to unlock this section.";
}
