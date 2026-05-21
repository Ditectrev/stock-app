/**
 * Property-Based Tests for Tier Change Immediate Effect
 * Feature: the-open-stock, Property 14: Tier Change Immediate Effect
 *
 * Validates: Requirements 22.24, 22.26
 * "For any pricing tier change (upgrade or downgrade), the user's feature
 * access should immediately reflect the new tier's capabilities."
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { SubscriptionService } from "@/services/subscription.service";
import type { PricingTier } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TIER_ORDER: PricingTier[] = [
  "FREE",
  "ADS_FREE",
  "LOCAL",
  "BYOK",
  "HOSTED_AI",
];

/** Returns true if tierA is considered a higher or equal tier than tierB */
function isHigherOrEqual(a: PricingTier, b: PricingTier): boolean {
  return TIER_ORDER.indexOf(a) >= TIER_ORDER.indexOf(b);
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const tierArb = fc.constantFrom<PricingTier>(
  "FREE",
  "ADS_FREE",
  "LOCAL",
  "BYOK",
  "HOSTED_AI"
);

const userIdArb = fc.string({ minLength: 1, maxLength: 32 });

const paidTierArb = fc.constantFrom<PricingTier>(
  "ADS_FREE",
  "LOCAL",
  "BYOK",
  "HOSTED_AI"
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 14: Tier Change Immediate Effect", () => {
  let service: SubscriptionService;

  beforeEach(() => {
    service = new SubscriptionService();
  });

  it("upgrade result always reflects the requested new tier immediately", async () => {
    // Feature: the-open-stock, Property 14: Tier Change Immediate Effect
    // **Validates: Requirements 22.24, 22.26**
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        tierArb,
        paidTierArb,
        async (userId, fromTier, toTier) => {
          // Only test upgrades (toTier must be higher than fromTier)
          fc.pre(isHigherOrEqual(toTier, fromTier) && toTier !== fromTier);

          const result = await service.upgradeTier(
            userId,
            toTier,
            "pm_test_card"
          );

          // Upgrade must succeed
          expect(result.success).toBe(true);

          // The returned subscription must immediately reflect the new tier
          expect(result.subscription).toBeDefined();
          expect(result.subscription!.tier).toBe(toTier);

          // Subscription must be active right away (not pending)
          expect(result.subscription!.status).toBe("active");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("upgrade subscription startDate is never in the future (takes effect now)", async () => {
    // Feature: the-open-stock, Property 14: Tier Change Immediate Effect
    // **Validates: Requirements 22.24**
    await fc.assert(
      fc.asyncProperty(userIdArb, paidTierArb, async (userId, toTier) => {
        const before = Date.now();
        const result = await service.upgradeTier(
          userId,
          toTier,
          "pm_test_card"
        );
        const after = Date.now();

        expect(result.success).toBe(true);
        expect(result.subscription).toBeDefined();

        const startMs = result.subscription!.startDate.getTime();

        // startDate must be within the window of this call — not deferred
        expect(startMs).toBeGreaterThanOrEqual(before);
        expect(startMs).toBeLessThanOrEqual(after);
      }),
      { numRuns: 100 }
    );
  });

  it("subscribing to any tier always returns that exact tier in the result", async () => {
    // Feature: the-open-stock, Property 14: Tier Change Immediate Effect
    // **Validates: Requirements 22.24, 22.26**
    await fc.assert(
      fc.asyncProperty(userIdArb, tierArb, async (userId, tier) => {
        const paymentMethod = tier === "FREE" ? undefined : "pm_test_card";
        const result = await service.subscribeTier(userId, tier, paymentMethod);

        expect(result.success).toBe(true);
        expect(result.subscription).toBeDefined();
        expect(result.subscription!.tier).toBe(tier);
        expect(result.subscription!.userId).toBe(userId);
        expect(result.subscription!.status).toBe("active");
      }),
      { numRuns: 100 }
    );
  });

  it("tier change result never contains a different tier than requested", async () => {
    // Feature: the-open-stock, Property 14: Tier Change Immediate Effect
    // **Validates: Requirements 22.24, 22.26**
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        tierArb,
        tierArb,
        async (userId, currentTier, requestedTier) => {
          fc.pre(currentTier !== requestedTier);

          const paymentMethod =
            requestedTier === "FREE" ? undefined : "pm_test_card";
          const result = await service.subscribeTier(
            userId,
            requestedTier,
            paymentMethod
          );

          if (result.success) {
            // If the operation succeeded, the tier must match exactly what was requested
            expect(result.subscription!.tier).toBe(requestedTier);
            // Must never silently return a different tier
            expect(result.subscription!.tier).not.toBe(currentTier);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("paid tier upgrade always requires a payment method", async () => {
    // Feature: the-open-stock, Property 14: Tier Change Immediate Effect
    // **Validates: Requirements 22.26**
    await fc.assert(
      fc.asyncProperty(userIdArb, paidTierArb, async (userId, paidTier) => {
        // Attempt upgrade without a payment method
        const result = await service.upgradeTier(userId, paidTier, undefined);

        // Must fail — cannot silently activate a paid tier without payment
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.subscription).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it("free tier subscription always succeeds without a payment method", async () => {
    // Feature: the-open-stock, Property 14: Tier Change Immediate Effect
    // **Validates: Requirements 22.24**
    await fc.assert(
      fc.asyncProperty(userIdArb, async (userId) => {
        const result = await service.subscribeTier(userId, "FREE");

        expect(result.success).toBe(true);
        expect(result.subscription).toBeDefined();
        expect(result.subscription!.tier).toBe("FREE");
        expect(result.subscription!.amount).toBe(0);
        expect(result.subscription!.status).toBe("active");
      }),
      { numRuns: 100 }
    );
  });
});
