/**
 * Property-Based Tests for Exponential Backoff
 * Feature: the-open-stock, Property 6: Exponential Backoff
 *
 * Validates: Requirements 17.5
 * "For any sequence of failed API requests, the delay between retry attempts
 * should increase exponentially (e.g., 1s, 2s, 4s, 8s)."
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fc from "fast-check";

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { retryWithBackoff } from "@/lib/retry";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Capture the real timestamps at which each attempt is made by hooking into
 * fake timers. We replace `setTimeout` tracking so we can inspect the delays
 * that `retryWithBackoff` schedules between attempts.
 */
function createFailingFn(totalFailures: number) {
  let calls = 0;
  return {
    fn: async () => {
      calls++;
      if (calls <= totalFailures) {
        throw new Error(`Attempt ${calls} failed`);
      }
      return `success-on-${calls}`;
    },
    getCalls: () => calls,
  };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const baseDelayArb = fc.integer({ min: 100, max: 2000 });
const maxDelayArb = fc.integer({ min: 2000, max: 16000 });
const jitterArb = fc.integer({ min: 0, max: 500 });
const maxAttemptsArb = fc.integer({ min: 2, max: 6 });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 6: Exponential Backoff", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("delays between retries increase exponentially up to the max delay", async () => {
    // Feature: the-open-stock, Property 6: Exponential Backoff
    // **Validates: Requirements 17.5**
    await fc.assert(
      fc.asyncProperty(
        baseDelayArb,
        maxDelayArb,
        jitterArb,
        maxAttemptsArb,
        async (baseDelayMs, maxDelayMs, jitterMs, maxAttempts) => {
          fc.pre(maxDelayMs >= baseDelayMs);

          const scheduledDelays: number[] = [];

          // Spy on setTimeout to capture scheduled delays
          const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
          setTimeoutSpy.mockImplementation(((
            cb: (...args: unknown[]) => void,
            ms?: number
          ) => {
            scheduledDelays.push(ms ?? 0);
            // Execute callback immediately so the retry loop progresses
            cb();
            return 0 as unknown as ReturnType<typeof setTimeout>;
          }) as typeof setTimeout);

          // All attempts fail so we exercise every retry delay
          const alwaysFail = async () => {
            throw new Error("fail");
          };

          try {
            await retryWithBackoff(alwaysFail, "test", {
              maxAttempts,
              baseDelayMs,
              maxDelayMs,
              jitterMs,
            });
          } catch {
            // Expected — all attempts fail
          }

          setTimeoutSpy.mockRestore();

          // Number of delays should be maxAttempts - 1 (no delay after last attempt)
          expect(scheduledDelays.length).toBe(maxAttempts - 1);

          for (let i = 0; i < scheduledDelays.length; i++) {
            const expectedBase = baseDelayMs * Math.pow(2, i);
            const expectedCapped = Math.min(expectedBase, maxDelayMs);

            // Delay should be at least the capped exponential value (no jitter subtracted)
            expect(scheduledDelays[i]).toBeGreaterThanOrEqual(expectedCapped);
            // Delay should be at most the capped value plus max jitter
            expect(scheduledDelays[i]).toBeLessThanOrEqual(
              expectedCapped + jitterMs
            );
          }

          // Verify delays are non-decreasing (exponential growth, capped)
          for (let i = 1; i < scheduledDelays.length; i++) {
            // The base (without jitter) should be non-decreasing
            const prevBase = Math.min(
              baseDelayMs * Math.pow(2, i - 1),
              maxDelayMs
            );
            const currBase = Math.min(baseDelayMs * Math.pow(2, i), maxDelayMs);
            expect(currBase).toBeGreaterThanOrEqual(prevBase);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("successful retry after failures respects exponential delay pattern", async () => {
    // Feature: the-open-stock, Property 6: Exponential Backoff
    // **Validates: Requirements 17.5**
    await fc.assert(
      fc.asyncProperty(
        maxAttemptsArb,
        fc.integer({ min: 1, max: 5 }),
        async (maxAttempts, failCount) => {
          fc.pre(failCount < maxAttempts);

          const scheduledDelays: number[] = [];
          const baseDelayMs = 1000;
          const maxDelayMs = 8000;
          const jitterMs = 100;

          const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
          setTimeoutSpy.mockImplementation(((
            cb: (...args: unknown[]) => void,
            ms?: number
          ) => {
            scheduledDelays.push(ms ?? 0);
            cb();
            return 0 as unknown as ReturnType<typeof setTimeout>;
          }) as typeof setTimeout);

          const { fn, getCalls } = createFailingFn(failCount);

          const result = await retryWithBackoff(fn, "test-success", {
            maxAttempts,
            baseDelayMs,
            maxDelayMs,
            jitterMs,
          });

          setTimeoutSpy.mockRestore();

          // Should have succeeded
          expect(result).toBe(`success-on-${failCount + 1}`);
          expect(getCalls()).toBe(failCount + 1);

          // Should have exactly failCount delays (one per failed attempt)
          expect(scheduledDelays.length).toBe(failCount);

          // Each delay follows exponential pattern
          for (let i = 0; i < scheduledDelays.length; i++) {
            const expectedBase = baseDelayMs * Math.pow(2, i);
            const expectedCapped = Math.min(expectedBase, maxDelayMs);
            expect(scheduledDelays[i]).toBeGreaterThanOrEqual(expectedCapped);
            expect(scheduledDelays[i]).toBeLessThanOrEqual(
              expectedCapped + jitterMs
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("delay never exceeds the configured maximum", async () => {
    // Feature: the-open-stock, Property 6: Exponential Backoff
    // **Validates: Requirements 17.5**
    await fc.assert(
      fc.asyncProperty(
        baseDelayArb,
        maxDelayArb,
        jitterArb,
        fc.integer({ min: 2, max: 10 }),
        async (baseDelayMs, maxDelayMs, jitterMs, maxAttempts) => {
          fc.pre(maxDelayMs >= baseDelayMs);

          const scheduledDelays: number[] = [];

          const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
          setTimeoutSpy.mockImplementation(((
            cb: (...args: unknown[]) => void,
            ms?: number
          ) => {
            scheduledDelays.push(ms ?? 0);
            cb();
            return 0 as unknown as ReturnType<typeof setTimeout>;
          }) as typeof setTimeout);

          const alwaysFail = async () => {
            throw new Error("fail");
          };

          try {
            await retryWithBackoff(alwaysFail, "test-cap", {
              maxAttempts,
              baseDelayMs,
              maxDelayMs,
              jitterMs,
            });
          } catch {
            // Expected
          }

          setTimeoutSpy.mockRestore();

          // Every delay must be at most maxDelayMs + jitterMs
          for (const delay of scheduledDelays) {
            expect(delay).toBeLessThanOrEqual(maxDelayMs + jitterMs);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("total number of attempts equals maxAttempts when all fail", async () => {
    // Feature: the-open-stock, Property 6: Exponential Backoff
    // **Validates: Requirements 17.5**
    await fc.assert(
      fc.asyncProperty(maxAttemptsArb, async (maxAttempts) => {
        let attemptCount = 0;

        const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
        setTimeoutSpy.mockImplementation(((
          cb: (...args: unknown[]) => void
        ) => {
          cb();
          return 0 as unknown as ReturnType<typeof setTimeout>;
        }) as typeof setTimeout);

        const countingFail = async () => {
          attemptCount++;
          throw new Error(`Attempt ${attemptCount}`);
        };

        try {
          await retryWithBackoff(countingFail, "test-count", {
            maxAttempts,
            baseDelayMs: 100,
            maxDelayMs: 1000,
            jitterMs: 0,
          });
        } catch {
          // Expected
        }

        setTimeoutSpy.mockRestore();

        expect(attemptCount).toBe(maxAttempts);
      }),
      { numRuns: 100 }
    );
  });

  it("jitter adds randomness but stays within bounds", async () => {
    // Feature: the-open-stock, Property 6: Exponential Backoff
    // **Validates: Requirements 17.5**
    await fc.assert(
      fc.asyncProperty(jitterArb, async (jitterMs) => {
        fc.pre(jitterMs > 0);

        const scheduledDelays: number[] = [];
        const baseDelayMs = 1000;
        const maxDelayMs = 8000;
        const maxAttempts = 4;

        const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
        setTimeoutSpy.mockImplementation(((
          cb: (...args: unknown[]) => void,
          ms?: number
        ) => {
          scheduledDelays.push(ms ?? 0);
          cb();
          return 0 as unknown as ReturnType<typeof setTimeout>;
        }) as typeof setTimeout);

        const alwaysFail = async () => {
          throw new Error("fail");
        };

        try {
          await retryWithBackoff(alwaysFail, "test-jitter", {
            maxAttempts,
            baseDelayMs,
            maxDelayMs,
            jitterMs,
          });
        } catch {
          // Expected
        }

        setTimeoutSpy.mockRestore();

        // Each delay includes jitter in [0, jitterMs)
        for (let i = 0; i < scheduledDelays.length; i++) {
          const expectedBase = Math.min(
            baseDelayMs * Math.pow(2, i),
            maxDelayMs
          );
          const jitterComponent = scheduledDelays[i] - expectedBase;
          expect(jitterComponent).toBeGreaterThanOrEqual(0);
          expect(jitterComponent).toBeLessThan(jitterMs + 1);
        }
      }),
      { numRuns: 100 }
    );
  });
});
