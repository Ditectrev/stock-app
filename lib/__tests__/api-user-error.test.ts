import { describe, expect, it } from "vitest";
import { MARKET_UI_COPY, userFacingApiError } from "@/lib/api-user-error";

describe("userFacingApiError", () => {
  it("returns fallback for technical Failed to messages", () => {
    expect(
      userFacingApiError(
        new Error("Failed to fetch Fear & Greed Index"),
        MARKET_UI_COPY.load.fearGreed
      )
    ).toBe(MARKET_UI_COPY.load.fearGreed);
  });

  it("returns fallback for Yahoo-related errors", () => {
    expect(
      userFacingApiError(
        new Error("Failed to obtain Yahoo Finance crumb"),
        MARKET_UI_COPY.load.worldMarkets
      )
    ).toBe(MARKET_UI_COPY.load.worldMarkets);
  });

  it("passes through editorial and setup messages", () => {
    const hosted =
      "Ditectrev AI is set to MISTRAL, but AI_API_KEY is missing on this deployment.";
    expect(
      userFacingApiError(new Error(hosted), MARKET_UI_COPY.load.aiPrediction)
    ).toBe(hosted);
  });

  it("passes through short service messages", () => {
    expect(
      userFacingApiError(
        new Error("Forecast data unavailable"),
        MARKET_UI_COPY.load.forecast
      )
    ).toBe("Forecast data unavailable");
  });

  it("returns fallback for non-Error values", () => {
    expect(userFacingApiError(null, MARKET_UI_COPY.search.failed)).toBe(
      MARKET_UI_COPY.search.failed
    );
  });
});
