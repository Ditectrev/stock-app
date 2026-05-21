/**
 * Property-Based Tests for Technical Indicator Color Coding
 * Feature: the-open-stock, Property 16: Technical Indicator Color Coding
 *
 * Validates: Requirements 5.4
 * "For any technical indicator value, the color should be red when indicating overpriced,
 * green when indicating underpriced, and gray when indicating fairly priced,
 * based on the indicator's threshold values."
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  getRSISignal,
  getMACDSignal,
  getMASignal,
  getBollingerSignal,
  type Signal,
} from "../technical-indicators";

const VALID_SIGNALS: Signal[] = ["overpriced", "underpriced", "fair"];

describe("Property 16: Technical Indicator Color Coding", () => {
  /**
   * **Validates: Requirements 5.4**
   * RSI signal: >70 = overpriced, <30 = underpriced, 30-70 = fair
   */
  describe("RSI Signal", () => {
    it("should always return a valid signal for any RSI value in [0, 100]", () => {
      // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
      fc.assert(
        fc.property(fc.double({ min: 0, max: 100, noNaN: true }), (rsi) => {
          const signal = getRSISignal(rsi);
          expect(VALID_SIGNALS).toContain(signal);
        }),
        { numRuns: 100 }
      );
    });

    it("should return 'overpriced' for any RSI > 70", () => {
      // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
      fc.assert(
        fc.property(
          fc.double({ min: 70.0001, max: 100, noNaN: true }),
          (rsi) => {
            expect(getRSISignal(rsi)).toBe("overpriced");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return 'underpriced' for any RSI < 30", () => {
      // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
      fc.assert(
        fc.property(fc.double({ min: 0, max: 29.9999, noNaN: true }), (rsi) => {
          expect(getRSISignal(rsi)).toBe("underpriced");
        }),
        { numRuns: 100 }
      );
    });

    it("should return 'fair' for any RSI between 30 and 70 inclusive", () => {
      // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
      fc.assert(
        fc.property(fc.double({ min: 30, max: 70, noNaN: true }), (rsi) => {
          expect(getRSISignal(rsi)).toBe("fair");
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 5.4**
   * MACD signal: histogram > threshold = underpriced, < -threshold = overpriced, else fair
   */
  describe("MACD Signal", () => {
    it("should always return a valid signal for any histogram value", () => {
      // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
      fc.assert(
        fc.property(
          fc.double({ min: -1000, max: 1000, noNaN: true }),
          (histogram) => {
            const signal = getMACDSignal(histogram);
            expect(VALID_SIGNALS).toContain(signal);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should map histogram values consistently with threshold", () => {
      // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
      fc.assert(
        fc.property(
          fc.double({ min: -1000, max: 1000, noNaN: true }),
          fc.double({ min: 0.001, max: 10, noNaN: true }),
          (histogram, threshold) => {
            const signal = getMACDSignal(histogram, threshold);
            if (histogram > threshold) {
              expect(signal).toBe("underpriced");
            } else if (histogram < -threshold) {
              expect(signal).toBe("overpriced");
            } else {
              expect(signal).toBe("fair");
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 5.4**
   * MA signal: price > MA = underpriced, price < MA = overpriced, price == MA or MA == 0 = fair
   */
  describe("Moving Average Signal", () => {
    it("should always return a valid signal for any price/MA combination", () => {
      // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          fc.double({ min: 0, max: 10000, noNaN: true }),
          (price, ma50) => {
            const signal = getMASignal(price, ma50);
            expect(VALID_SIGNALS).toContain(signal);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should map price/MA relationship consistently", () => {
      // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          (price, ma50) => {
            const signal = getMASignal(price, ma50);
            if (price > ma50) {
              expect(signal).toBe("underpriced");
            } else if (price < ma50) {
              expect(signal).toBe("overpriced");
            } else {
              expect(signal).toBe("fair");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return 'fair' when MA is zero", () => {
      // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          (price) => {
            expect(getMASignal(price, 0)).toBe("fair");
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 5.4**
   * Bollinger signal: price >= upper - 10%bandwidth = overpriced,
   * price <= lower + 10%bandwidth = underpriced, else fair
   */
  describe("Bollinger Bands Signal", () => {
    it("should always return a valid signal for any price/band combination", () => {
      // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          fc.double({ min: 0.01, max: 5000, noNaN: true }),
          fc.double({ min: 0.01, max: 5000, noNaN: true }),
          (price, a, b) => {
            const upper = Math.max(a, b);
            const lower = Math.min(a, b);
            const signal = getBollingerSignal(price, upper, lower);
            expect(VALID_SIGNALS).toContain(signal);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should map price/band relationship consistently with 10% threshold", () => {
      // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
      fc.assert(
        fc.property(
          fc.double({ min: 1, max: 10000, noNaN: true }),
          fc.double({ min: 1, max: 100, noNaN: true }),
          (midpoint, halfSpread) => {
            const upper = midpoint + halfSpread;
            const lower = midpoint - halfSpread;

            // Test overpriced: price at upper band
            const overpricedPrice = upper;
            expect(getBollingerSignal(overpricedPrice, upper, lower)).toBe(
              "overpriced"
            );

            // Test underpriced: price at lower band
            const underpricedPrice = lower;
            expect(getBollingerSignal(underpricedPrice, upper, lower)).toBe(
              "underpriced"
            );

            // Test fair: price at midpoint
            expect(getBollingerSignal(midpoint, upper, lower)).toBe("fair");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return 'fair' when upper equals lower", () => {
      // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          (price, band) => {
            expect(getBollingerSignal(price, band, band)).toBe("fair");
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 5.4**
   * Exhaustiveness: all signal functions always return one of the three valid signals
   */
  describe("Signal Exhaustiveness", () => {
    it("all indicator functions should only produce valid Signal values", () => {
      // Feature: the-open-stock, Property 16: Technical Indicator Color Coding
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: -1000, max: 1000, noNaN: true }),
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          fc.double({ min: 0.01, max: 5000, noNaN: true }),
          (rsi, histogram, price, ma, bandOffset) => {
            const upper = price + bandOffset;
            const lower = price - bandOffset;

            const signals: Signal[] = [
              getRSISignal(rsi),
              getMACDSignal(histogram),
              getMASignal(price, ma),
              getBollingerSignal(price, upper, lower),
            ];

            for (const signal of signals) {
              expect(VALID_SIGNALS).toContain(signal);
              expect(typeof signal).toBe("string");
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
