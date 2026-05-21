/**
 * Property-Based Tests for Downgrade Grace Period
 * Feature: the-open-stock, Property 15: Downgrade Grace Period
 *
 * Validates: Requirements 22.27
 * "For any downgrade from a paid tier, the user should retain access to the
 * higher tier's features until the end of the current billing period."
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

function isLowerTier(a: PricingTier, b: PricingTier): boolean {
  return TIER_ORDER.indexOf(a) < TIER_ORDER.indexOf(b);
}

/** Returns true if the date is approximately one billing month in the future (within 5s tolerance). */
function isApproximatelyOneMonthAhead(date: Date): boolean {
  const now = new Date();
  const oneMonthAhead = new Date(now);
  oneMonthAhead.setMonth(oneMonthAhead.getMonth() + 1);
  const diffMs = Math.abs(date.getTime() - oneMonthAhead.getTime());
  return diffMs < 5_000; // 5 second tolerance
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const userIdArb = fc.string({ minLength: 1, maxLength: 32 });

const paidTierArb = fc.constantFrom<PricingTier>(
  "ADS_FREE",
  "LOCAL",
  "BYOK",
  "HOSTED_AI"
);

// Pairs where fromTier is strictly higher than toTier (a real downgrade)
const downgradePairArb = fc
  .tuple(
    fc.constantFrom<PricingTier>("ADS_FREE", "LOCAL", "BYOK", "HOSTED_AI"),
    fc.constantFrom<PricingTier>("FREE", "ADS_FREE", "LOCAL", "BYOK")
  )
  .filter(([from, to]) => isLowerTier(to, from));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 15: Downgrade Grace Period", () => {
  let service: SubscriptionService;

  beforeEach(() => {
    service = new SubscriptionService();
  });

  it("downgrade always succeeds and returns the requested lower tier", async () => {
    // Feature: the-open-stock, Property 15: Downgrade Grace Period
    // **Validates: Requirements 22.27**
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        downgradePairArb,
        async (userId, [_fromTier, toTier]) => {
          const result = await service.downgradeTier(userId, toTier);

          expect(result.success).toBe(true);
          expect(result.subscription).toBeDefined();
          expect(result.subscription!.tier).toBe(toTier);
          expect(result.subscription!.userId).toBe(userId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("downgrade effective date is always deferred to the next billing cycle", async () => {
    // Feature: the-open-stock, Property 15: Downgrade Grace Period
    // **Validates: Requirements 22.27**
    // The startDate of the returned subscription must be ~1 month in the future,
    // proving the lower tier does not take effect immediately.
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        downgradePairArb,
        async (userId, [_fromTier, toTier]) => {
          const result = await service.downgradeTier(userId, toTier);

          expect(result.success).toBe(true);
          expect(result.subscription).toBeDefined();

          const effectiveDate = result.subscription!.startDate;

          // The new (lower) tier must not start immediately — it must be deferred
          expect(effectiveDate.getTime()).toBeGreaterThan(Date.now());

          // It should be approximately one billing month away
          expect(isApproximatelyOneMonthAhead(effectiveDate)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("downgrade startDate is always strictly in the future (not now)", async () => {
    // Feature: the-open-stock, Property 15: Downgrade Grace Period
    // **Validates: Requirements 22.27**
    // Contrast with upgrades: a downgrade must never take effect at the current moment.
    await fc.assert(
      fc.asyncProperty(userIdArb, paidTierArb, async (userId, fromTier) => {
        // Downgrade to FREE (always a valid downgrade from any paid tier)
        const result = await service.downgradeTier(userId, "FREE");

        expect(result.success).toBe(true);
        expect(result.subscription).toBeDefined();

        const now = Date.now();
        const effectiveMs = result.subscription!.startDate.getTime();

        // Must be in the future — grace period is being honoured
        expect(effectiveMs).toBeGreaterThan(now);
      }),
      { numRuns: 100 }
    );
  });

  it("downgrade subscription status is always active (not pending or cancelled)", async () => {
    // Feature: the-open-stock, Property 15: Downgrade Grace Period
    // **Validates: Requirements 22.27**
    // The subscription record should be active — the user still has access
    // to the current (higher) tier during the grace period.
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        downgradePairArb,
        async (userId, [_fromTier, toTier]) => {
          const result = await service.downgradeTier(userId, toTier);

          expect(result.success).toBe(true);
          expect(result.subscription).toBeDefined();
          expect(result.subscription!.status).toBe("active");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("downgrade to any lower tier always defers by the same billing period length", async () => {
    // Feature: the-open-stock, Property 15: Downgrade Grace Period
    // **Validates: Requirements 22.27**
    // Regardless of which tier is being downgraded to, the grace period length
    // should be consistent (one billing month).
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        downgradePairArb,
        async (userId, [_fromTier, toTier]) => {
          const before = Date.now();
          const result = await service.downgradeTier(userId, toTier);
          const after = Date.now();

          expect(result.success).toBe(true);
          expect(result.subscription).toBeDefined();

          const effectiveMs = result.subscription!.startDate.getTime();

          // Effective date must be at least 28 days away (shortest month)
          const minGracePeriodMs = 28 * 24 * 60 * 60 * 1000;
          expect(effectiveMs - before).toBeGreaterThanOrEqual(minGracePeriodMs);

          // And no more than 32 days away (longest month + small buffer)
          const maxGracePeriodMs = 32 * 24 * 60 * 60 * 1000;
          expect(effectiveMs - after).toBeLessThanOrEqual(maxGracePeriodMs);
        }
      ),
      { numRuns: 100 }
    );
  });
});
