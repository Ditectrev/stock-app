import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/retry", () => ({
  retryWithBackoff: async (fn: () => Promise<unknown>) => fn(),
}));

vi.mock("@/lib/env", () => ({
  env: {
    apis: {
      cnnDatavizUrl: "https://production.dataviz.cnn.io",
    },
  },
}));

import { CNNApiService } from "@/services/cnn-api.service";

describe("CNNApiService.getFearGreedIndex", () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchSpy);
  });

  it("fetches CNN stock-market Fear & Greed, not the crypto Alternative.me index", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        fear_and_greed: {
          score: 41.857,
          rating: "fear",
          timestamp: "2026-09-04T23:59:43+00:00",
        },
        fear_and_greed_historical: {
          data: [
            { x: 1_757_030_400_000, y: 58.68, rating: "greed" },
            { x: 1_757_116_800_000, y: 41.85, rating: "fear" },
            { x: 1_757_203_200_000, y: 39.2, rating: "fear" },
          ],
        },
      }),
    });

    const data = await new CNNApiService().getFearGreedIndex(2);

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://production.dataviz.cnn.io/index/fearandgreed/graphdata",
      expect.objectContaining({
        headers: expect.objectContaining({
          Referer: "https://www.cnn.com/markets/fear-and-greed",
        }),
      })
    );
    expect(String(fetchSpy.mock.calls[0][0])).not.toContain("alternative.me");
    expect(data.value).toBe(42);
    expect(data.label).toBe("Fear");
    expect(data.history).toHaveLength(2);
    expect(data.history[0].value).toBe(42);
    expect(data.history[1].value).toBe(39);
  });

  it("requests the full CNN history window for Max / multi-year ranges", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        fear_and_greed: {
          score: 20,
          rating: "extreme fear",
          timestamp: "2026-09-04T23:59:43+00:00",
        },
        fear_and_greed_historical: { data: [] },
      }),
    });

    const data = await new CNNApiService().getFearGreedIndex(0);

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://production.dataviz.cnn.io/index/fearandgreed/graphdata/2021-02-01",
      expect.any(Object)
    );
    expect(data.label).toBe("Extreme Fear");
  });
});
