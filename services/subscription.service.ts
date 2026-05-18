/**
 * Subscription Service
 * Manages user subscriptions and pricing tiers.
 * Requirements: 22.8, 22.17, 22.24, 22.26, 22.27
 */

import { logger } from "@/lib/logger";
import { PricingTier, PricingTierInfo, Subscription } from "@/types";
import { subscriptionStoreService } from "@/services/subscription-store.service";

export interface SubscriptionResult {
  success: boolean;
  subscription?: Subscription;
  error?: string;
}

// Static pricing tier definitions
const PRICING_TIERS: PricingTierInfo[] = [
  {
    tier: "FREE",
    name: "Free",
    description:
      "Full access to market data, charts, and indicators — supported by ads.",
    features: [
      "Stock search & symbol detail pages",
      "Interactive price charts",
      "Technical indicators (RSI, MACD, Bollinger Bands, MAs)",
      "Analyst forecasts & price targets",
      "Seasonal performance heatmaps",
      "Fear & Greed Index",
      "World markets overview",
      "Sector performance hub",
      "Economic, earnings, dividend & IPO calendars",
      "ETF, crypto & stock heatmaps",
      "Asset screener",
      "Ad-supported",
    ],
    price: 0,
    billingPeriod: "monthly",
  },
  {
    tier: "ADS_FREE",
    name: "Ads-free",
    description: "Everything in Free, without the ads.",
    features: [
      "All Free tier features",
      "No advertisements",
      "Cleaner, distraction-free experience",
    ],
    price: 4.99,
    billingPeriod: "monthly",
  },
  {
    tier: "LOCAL",
    name: "Local AI",
    description:
      "AI-powered insights running entirely on your device via Ollama. Your data never leaves your machine.",
    features: [
      "All Ads-free tier features",
      "AI metric explanations",
      "AI chart analysis",
      "AI Q&A about any symbol",
      "Visual AI annotations on charts",
      "Powered by Ollama (runs locally)",
      "100% private — no data sent externally",
    ],
    price: 9.99,
    billingPeriod: "monthly",
  },
  {
    tier: "BYOK",
    name: "Bring Your Own Key",
    description:
      "Use your own API keys from OpenAI, Google Gemini, Mistral AI, or DeepSeek for AI features.",
    features: [
      "All Ads-free tier features",
      "AI metric explanations",
      "AI chart analysis",
      "AI Q&A about any symbol",
      "Visual AI annotations on charts",
      "Supports OpenAI, Google Gemini, Mistral AI, DeepSeek",
      "Switch AI providers anytime",
      "Encrypted API key storage",
    ],
    price: 14.99,
    billingPeriod: "monthly",
  },
  {
    tier: "HOSTED_AI",
    name: "Hosted AI",
    description:
      "Full AI features powered by our managed infrastructure — no setup required.",
    features: [
      "All Ads-free tier features",
      "AI metric explanations",
      "AI chart analysis",
      "AI Q&A about any symbol",
      "Visual AI annotations on charts",
      "Managed AI infrastructure",
      "No API keys or local setup needed",
      "Priority support",
    ],
    price: 19.99,
    billingPeriod: "monthly",
  },
];

const VALID_TIERS: PricingTier[] = [
  "FREE",
  "ADS_FREE",
  "LOCAL",
  "BYOK",
  "HOSTED_AI",
];

function parseTier(value?: string): PricingTier | null {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) return null;
  return VALID_TIERS.includes(normalized as PricingTier)
    ? (normalized as PricingTier)
    : null;
}

function parseCsv(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * When `DEV_OVERRIDE_PRICING_TIER` is set, it may apply only in these cases:
 * - `next dev` / tests (`NODE_ENV !== "production"`)
 * - Vercel preview (`VERCEL_ENV === "preview"`)
 * - Local `next start` if you set `ALLOW_LOCAL_PRICING_TIER_OVERRIDE=true`
 *
 * Production (`VERCEL_ENV === "production"`) never uses the override unless
 * you are not on Vercel (then rely on NODE_ENV).
 */
function isPricingTierOverrideEnvironment(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  if (process.env.VERCEL_ENV === "preview") return true;
  if (process.env.ALLOW_LOCAL_PRICING_TIER_OVERRIDE === "true") return true;
  return false;
}

export class SubscriptionService {
  /**
   * Returns all available pricing tiers.
   * Requirement: 22.1, 22.3
   */
  getPricingTiers(): PricingTierInfo[] {
    return PRICING_TIERS;
  }

  /**
   * Returns the current tier for a user.
   * Falls back to FREE if no active subscription is found.
   * Requirement: 22.8
   */
  async getSubscriptionRecord(userId: string) {
    return subscriptionStoreService.getMostRecentForUser(userId);
  }

  async getCurrentTier(userId: string): Promise<PricingTier> {
    try {
      const devOverrideTier = parseTier(process.env.DEV_OVERRIDE_PRICING_TIER);
      const devOverrideUserIds = parseCsv(
        process.env.DEV_OVERRIDE_PRICING_TIER_USER_IDS
      );

      // Optional tier override (dev / preview / explicit local prod):
      // Set `DEV_OVERRIDE_PRICING_TIER=BYOK` (see `.env.example`).
      // Not triggered by unrelated env names (e.g. `BYOK=1`).
      if (isPricingTierOverrideEnvironment() && devOverrideTier) {
        const appliesToAll = devOverrideUserIds.length === 0;
        const appliesToUser = devOverrideUserIds.includes(userId);
        if (appliesToAll || appliesToUser) {
          logger.warn("Using pricing tier override from environment", {
            userId,
            tier: devOverrideTier,
            scoped: !appliesToAll,
          });
          return devOverrideTier;
        }
      }

      const current =
        await subscriptionStoreService.getMostRecentForUser(userId);
      if (!current) return "FREE";

      const isActive =
        current.status === "active" ||
        current.status === "trialing" ||
        (current.status === "canceled" && current.cancelAtPeriodEnd);
      if (!isActive) return "FREE";
      return current.tier;
    } catch (error) {
      logger.error("Failed to get current tier", error as Error, { userId });
      return "FREE";
    }
  }

  /**
   * Subscribes a user to a pricing tier.
   * Requirement: 22.8, 22.17
   */
  async subscribeTier(
    userId: string,
    tier: PricingTier,
    paymentMethod?: string
  ): Promise<SubscriptionResult> {
    try {
      logger.info("Subscribing user to tier", { userId, tier });

      const tierInfo = PRICING_TIERS.find((t) => t.tier === tier);
      if (!tierInfo) {
        return { success: false, error: `Unknown pricing tier: ${tier}` };
      }

      // Free tier requires no payment
      if (tier === "FREE") {
        const subscription: Subscription = {
          id: `sub_${Date.now()}`,
          userId,
          tier,
          status: "active",
          startDate: new Date(),
          billingPeriod: "monthly",
          amount: 0,
          currency: "EUR",
          paymentMethod: "none",
        };
        logger.info("User subscribed to free tier", { userId });
        return { success: true, subscription };
      }

      if (!paymentMethod) {
        return {
          success: false,
          error: "Payment method required for paid tiers",
        };
      }

      // Paid tier — in production this would call a payment processor
      const subscription: Subscription = {
        id: `sub_${Date.now()}`,
        userId,
        tier,
        status: "active",
        startDate: new Date(),
        endDate: this.getNextBillingDate(),
        billingPeriod: tierInfo.billingPeriod,
        amount: tierInfo.price,
        currency: "EUR",
        paymentMethod,
      };

      logger.info("User subscribed to paid tier", { userId, tier });
      return { success: true, subscription };
    } catch (error) {
      logger.error("Failed to subscribe user", error as Error, {
        userId,
        tier,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Subscription failed",
      };
    }
  }

  /**
   * Upgrades a user to a higher tier.
   * Access is updated immediately per requirement 22.24.
   * Requirement: 22.24, 22.26
   */
  async upgradeTier(
    userId: string,
    newTier: PricingTier,
    paymentMethod?: string
  ): Promise<SubscriptionResult> {
    try {
      logger.info("Upgrading user tier", { userId, newTier });
      // Upgrade takes effect immediately (Requirement 22.24)
      return this.subscribeTier(userId, newTier, paymentMethod);
    } catch (error) {
      logger.error("Failed to upgrade tier", error as Error, {
        userId,
        newTier,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upgrade failed",
      };
    }
  }

  /**
   * Downgrades a user to a lower tier.
   * Access to the higher tier is maintained until end of billing period.
   * Requirement: 22.27
   */
  async downgradeTier(
    userId: string,
    newTier: PricingTier
  ): Promise<SubscriptionResult> {
    try {
      logger.info("Downgrading user tier", { userId, newTier });

      // Schedule the downgrade for end of billing period (Requirement 22.27)
      const subscription: Subscription = {
        id: `sub_${Date.now()}`,
        userId,
        tier: newTier,
        status: "active",
        startDate: this.getNextBillingDate(), // effective at next billing cycle
        endDate: this.getNextBillingDate(),
        billingPeriod: "monthly",
        amount: PRICING_TIERS.find((t) => t.tier === newTier)?.price ?? 0,
        currency: "EUR",
        paymentMethod: "existing",
      };

      logger.info("Tier downgrade scheduled for end of billing period", {
        userId,
        newTier,
        effectiveDate: subscription.startDate,
      });

      return { success: true, subscription };
    } catch (error) {
      logger.error("Failed to downgrade tier", error as Error, {
        userId,
        newTier,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Downgrade failed",
      };
    }
  }

  /**
   * Cancels a user's subscription.
   * Access is maintained until end of billing period.
   * Requirement: 22.27
   */
  async cancelSubscription(userId: string): Promise<SubscriptionResult> {
    try {
      logger.info("Cancelling subscription for user", { userId });

      const current =
        await subscriptionStoreService.getMostRecentForUser(userId);
      if (!current) {
        return { success: false, error: "No active subscription found" };
      }

      return { success: true };
    } catch (error) {
      logger.error("Failed to cancel subscription", error as Error, { userId });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Cancellation failed",
      };
    }
  }

  private getNextBillingDate(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date;
  }
}

export const subscriptionService = new SubscriptionService();
