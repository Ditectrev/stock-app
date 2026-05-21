/**
 * Property-Based Tests for Technical Indicator Color Coding
 * Feature: the-open-stock, Property 16: Technical Indicator Color Coding
 *
 * Validates: Requirements 5.4
 * "For any technical indicator value, the color should be red when indicating
 * overpriced, green when indicating underpriced, and gray when indicating
 * fairly priced, based on the indicator's threshold values."
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  getRSISignal,
  getMACDSignal,
  getMASignal,
  getBollingerSignal,
  getOverallSentiment,
  type Signal,
} from "@/lib/technical-indicators";

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const finiteDouble = (min: number, max: number) =>
  fc.double({ min, max, noNaN: true, noDefaultInfinity: true });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 16: Technical Indicator Color Coding", () => {
  // ---- RSI Signal ----

  it("RSI above 70 is always 'overpriced' (red)", () => {
    // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
    fc.assert(
      fc.property(finiteDouble(70.01, 100), (rsi) => {
        expect(getRSISignal(rsi)).toBe("overpriced");
      }),
      { numRuns: 100 }
    );
  });

  it("RSI below 30 is always 'underpriced' (green)", () => {
    // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
    fc.assert(
      fc.property(finiteDouble(0, 29.99), (rsi) => {
        expect(getRSISignal(rsi)).toBe("underpriced");
      }),
      { numRuns: 100 }
    );
  });

  it("RSI between 30 and 70 is always 'fair' (gray)", () => {
    // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
    fc.assert(
      fc.property(finiteDouble(30, 70), (rsi) => {
        expect(getRSISignal(rsi)).toBe("fair");
      }),
      { numRuns: 100 }
    );
  });

  it("RSI signal is always one of the three valid signals", () => {
    // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
    fc.assert(
      fc.property(finiteDouble(0, 100), (rsi) => {
        const signal = getRSISignal(rsi);
        expect(["overpriced", "underpriced", "fair"]).toContain(signal);
      }),
      { numRuns: 100 }
    );
  });

  // ---- MACD Signal ----

  it("positive MACD histogram (above threshold) is always 'underpriced' (green)", () => {
    // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
    fc.assert(
      fc.property(finiteDouble(0.02, 1000), (histogram) => {
        expect(getMACDSignal(histogram, 0.01)).toBe("underpriced");
      }),
      { numRuns: 100 }
    );
  });

  it("negative MACD histogram (below -threshold) is always 'overpriced' (red)", () => {
    // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
    fc.assert(
      fc.property(finiteDouble(-1000, -0.02), (histogram) => {
        expect(getMACDSignal(histogram, 0.01)).toBe("overpriced");
      }),
      { numRuns: 100 }
    );
  });

  it("MACD histogram near zero (within threshold) is always 'fair' (gray)", () => {
    // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
    fc.assert(
      fc.property(finiteDouble(-0.01, 0.01), (histogram) => {
        expect(getMACDSignal(histogram, 0.01)).toBe("fair");
      }),
      { numRuns: 100 }
    );
  });

  // ---- Moving Average Signal ----

  it("price above MA is always 'underpriced' (green)", () => {
    // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
    fc.assert(
      fc.property(
        finiteDouble(1, 10000),
        finiteDouble(0.01, 0.99),
        (price, ratio) => {
          const ma = price * ratio; // ma < price
          expect(getMASignal(price, ma)).toBe("underpriced");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("price below MA is always 'overpriced' (red)", () => {
    // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
    fc.assert(
      fc.property(
        finiteDouble(1, 10000),
        finiteDouble(1.01, 2),
        (price, ratio) => {
          const ma = price * ratio; // ma > price
          expect(getMASignal(price, ma)).toBe("overpriced");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("price equal to MA is always 'fair' (gray)", () => {
    // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
    fc.assert(
      fc.property(finiteDouble(0.01, 10000), (price) => {
        expect(getMASignal(price, price)).toBe("fair");
      }),
      { numRuns: 100 }
    );
  });

  it("MA of zero always returns 'fair' (gray)", () => {
    // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
    fc.assert(
      fc.property(finiteDouble(0, 10000), (price) => {
        expect(getMASignal(price, 0)).toBe("fair");
      }),
      { numRuns: 100 }
    );
  });

  // ---- Bollinger Bands Signal ----

  it("price near upper band is always 'overpriced' (red)", () => {
    // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
    fc.assert(
      fc.property(
        finiteDouble(50, 500),
        finiteDouble(10, 100),
        (middle, halfWidth) => {
          const upper = middle + halfWidth;
          const lower = middle - halfWidth;
          const bandWidth = upper - lower;
          // Place price at or above the near-upper threshold
          const price = upper - bandWidth * 0.05;
          expect(getBollingerSignal(price, upper, lower)).toBe("overpriced");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("price near lower band is always 'underpriced' (green)", () => {
    // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
    fc.assert(
      fc.property(
        finiteDouble(50, 500),
        finiteDouble(10, 100),
        (middle, halfWidth) => {
          const upper = middle + halfWidth;
          const lower = middle - halfWidth;
          const bandWidth = upper - lower;
          // Place price at or below the near-lower threshold
          const price = lower + bandWidth * 0.05;
          expect(getBollingerSignal(price, upper, lower)).toBe("underpriced");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("price in the middle of bands is always 'fair' (gray)", () => {
    // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
    fc.assert(
      fc.property(
        finiteDouble(50, 500),
        finiteDouble(10, 100),
        (middle, halfWidth) => {
          const upper = middle + halfWidth;
          const lower = middle - halfWidth;
          // Price exactly at the middle
          expect(getBollingerSignal(middle, upper, lower)).toBe("fair");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("equal upper and lower bands always returns 'fair' (gray)", () => {
    // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
    fc.assert(
      fc.property(finiteDouble(1, 10000), (band) => {
        expect(getBollingerSignal(band, band, band)).toBe("fair");
      }),
      { numRuns: 100 }
    );
  });

  // ---- Overall Sentiment ----

  it("overall sentiment follows majority vote of individual signals", () => {
    // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
    const signalArb = fc.constantFrom<Signal>(
      "overpriced",
      "underpriced",
      "fair"
    );

    fc.assert(
      fc.property(
        fc.array(signalArb, { minLength: 1, maxLength: 10 }),
        (signals) => {
          const result = getOverallSentiment(signals);
          expect(["overpriced", "underpriced", "fair"]).toContain(result);

          const counts = { overpriced: 0, underpriced: 0, fair: 0 };
          for (const s of signals) counts[s]++;

          // If one signal has a strict majority, it must win
          if (
            counts.overpriced > counts.underpriced &&
            counts.overpriced > counts.fair
          ) {
            expect(result).toBe("overpriced");
          } else if (
            counts.underpriced > counts.overpriced &&
            counts.underpriced > counts.fair
          ) {
            expect(result).toBe("underpriced");
          } else {
            // Ties default to "fair"
            expect(result).toBe("fair");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---- Cross-cutting: every signal function returns a valid Signal ----

  it("all signal functions always return a valid Signal value", () => {
    // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
    const validSignals: Signal[] = ["overpriced", "underpriced", "fair"];

    fc.assert(
      fc.property(
        finiteDouble(0, 100),
        finiteDouble(-1000, 1000),
        finiteDouble(0.01, 10000),
        finiteDouble(0.01, 10000),
        finiteDouble(0.01, 10000),
        finiteDouble(0.01, 10000),
        (rsi, histogram, price, ma, upper, lower) => {
          expect(validSignals).toContain(getRSISignal(rsi));
          expect(validSignals).toContain(getMACDSignal(histogram));
          expect(validSignals).toContain(getMASignal(price, ma));
          expect(validSignals).toContain(
            getBollingerSignal(price, upper, lower)
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
