import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  animateChartTrail,
  buildTrailRevealData,
  computeLineValueRange,
  revealCountForProgress,
  sanitizeLineData,
} from "@/lib/chart-trail";

describe("sanitizeLineData", () => {
  it("removes invalid points and sorts by time", () => {
    const clean = sanitizeLineData([
      { time: 3, value: 30 },
      { time: 1, value: null as unknown as number },
      { time: 2, value: 20 },
    ]);

    expect(clean).toEqual([
      { time: 2, value: 20 },
      { time: 3, value: 30 },
    ]);
  });
});

describe("buildTrailRevealData", () => {
  it("keeps the full timeline with whitespace slots on the right", () => {
    const clean = [
      { time: 1, value: 10 },
      { time: 2, value: 20 },
      { time: 3, value: 30 },
    ];

    const partial = buildTrailRevealData(clean, 2);

    expect(partial).toHaveLength(3);
    expect(partial[0]).toEqual({ time: 1, value: 10 });
    expect(partial[1]).toEqual({ time: 2, value: 20 });
    expect(partial[2]).toEqual({ time: 3 });
  });
});

describe("revealCountForProgress", () => {
  it("maps animation progress to an increasing point count", () => {
    expect(revealCountForProgress(0, 120)).toBeGreaterThanOrEqual(2);
    expect(revealCountForProgress(0.5, 120)).toBeGreaterThan(2);
    expect(revealCountForProgress(1, 120)).toBe(120);
  });
});

describe("computeLineValueRange", () => {
  it("pads the min and max values for a stable y-axis", () => {
    const range = computeLineValueRange([
      { time: 1, value: 100 },
      { time: 2, value: 110 },
    ]);

    expect(range.minValue).toBeLessThan(100);
    expect(range.maxValue).toBeGreaterThan(110);
  });
});

describe("animateChartTrail", () => {
  beforeEach(() => {
    vi.stubGlobal("performance", { now: vi.fn(() => 0) });
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      })
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function createSeriesMock() {
    return {
      setData: vi.fn(),
      applyOptions: vi.fn(),
    };
  }

  function countValuedPoints(data: Array<{ value?: number }>) {
    return data.filter(
      (point) => point.value != null && Number.isFinite(point.value)
    ).length;
  }

  function createChartMock() {
    const fitContent = vi.fn();
    const setVisibleRange = vi.fn();
    const setVisibleLogicalRange = vi.fn();
    const applyOptions = vi.fn();
    const subscribeVisibleLogicalRangeChange = vi.fn();
    const unsubscribeVisibleLogicalRangeChange = vi.fn();

    return {
      chart: {
        applyOptions,
        timeScale: () => ({
          fitContent,
          setVisibleRange,
          setVisibleLogicalRange,
          applyOptions,
          subscribeVisibleLogicalRangeChange,
          unsubscribeVisibleLogicalRangeChange,
        }),
      } as never,
      fitContent,
      setVisibleRange,
      setVisibleLogicalRange,
      applyOptions,
      subscribeVisibleLogicalRangeChange,
    };
  }

  it("loads full data once, pins the window, and reveals via onStep only", () => {
    const series = createSeriesMock();
    const onComplete = vi.fn();
    const onStep = vi.fn();
    const {
      chart,
      setVisibleRange,
      setVisibleLogicalRange,
      subscribeVisibleLogicalRangeChange,
    } = createChartMock();
    const data = Array.from({ length: 120 }, (_, i) => ({
      time: i + 1,
      value: i,
    }));

    let now = 0;
    vi.mocked(performance.now).mockImplementation(() => now);
    vi.mocked(requestAnimationFrame).mockImplementation((cb) => {
      now += 200;
      cb(now);
      return now;
    });

    animateChartTrail(series as never, data, {
      chart,
      durationMs: 1000,
      onComplete,
      onStep,
    });

    expect(series.setData).toHaveBeenCalledTimes(1);
    expect(setVisibleRange).toHaveBeenCalledWith({ from: 1, to: 120 });
    expect(setVisibleLogicalRange).toHaveBeenCalledWith({ from: 0, to: 119 });
    expect(subscribeVisibleLogicalRangeChange).toHaveBeenCalled();

    const loaded = series.setData.mock.calls[0]?.[0] ?? [];
    expect(loaded).toHaveLength(120);
    expect(countValuedPoints(loaded)).toBe(120);
    expect(onStep.mock.calls[0]?.[0]).toBe(2);
    expect(onStep.mock.calls.length).toBeGreaterThan(1);
    expect(onComplete).toHaveBeenCalled();
  });

  it("dispose stops animation without snapping to the full series", () => {
    const series = createSeriesMock();
    const { chart } = createChartMock();
    const data = Array.from({ length: 40 }, (_, i) => ({
      time: i + 1,
      value: i,
    }));

    vi.mocked(requestAnimationFrame).mockReturnValue(42);

    const cancel = animateChartTrail(series as never, data, {
      chart,
      durationMs: 1000,
    });
    cancel(false);

    expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
    expect(series.setData).toHaveBeenCalledTimes(1);
  });

  it("cancel snaps via onComplete without extra setData", () => {
    const series = createSeriesMock();
    const onComplete = vi.fn();
    const { chart, fitContent } = createChartMock();
    const data = Array.from({ length: 40 }, (_, i) => ({
      time: i + 1,
      value: i,
    }));

    vi.mocked(requestAnimationFrame).mockReturnValue(42);

    const cancel = animateChartTrail(series as never, data, {
      chart,
      durationMs: 1000,
      onComplete,
    });
    cancel(true);

    expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
    expect(series.setData).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalled();
    expect(fitContent).not.toHaveBeenCalled();
  });
});
