import type {
  IChartApi,
  ISeriesApi,
  LineData,
  Time,
  WhitespaceData,
} from "lightweight-charts";

const DEFAULT_DURATION_MS = 1200;
const PRICE_PAD_RATIO = 0.06;

export type ChartTrailOptions = {
  durationMs?: number;
  chart?: IChartApi;
  onComplete?: () => void;
  /** Called each animation frame with eased progress (0–1) and tip index. */
  onStep?: (progress: number, tipIndex: number) => void;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Drop invalid points and enforce ascending time order for Lightweight Charts. */
export function sanitizeLineData(data: LineData[]): LineData[] {
  return data
    .filter(
      (point) =>
        point.time != null &&
        point.value != null &&
        Number.isFinite(point.value) &&
        !Number.isNaN(Number(point.time))
    )
    .sort((a, b) => Number(a.time) - Number(b.time));
}

/** Full timeline with unrevealed slots as whitespace (tests / legacy). */
export function buildTrailRevealData(
  clean: LineData[],
  revealedCount: number
): Array<LineData | WhitespaceData> {
  return clean.map((point, index) =>
    index < revealedCount ? point : { time: point.time as Time }
  );
}

export function computeLineValueRange(data: LineData[]): {
  minValue: number;
  maxValue: number;
} {
  let min = Infinity;
  let max = -Infinity;

  for (const point of data) {
    if (!Number.isFinite(point.value)) continue;
    min = Math.min(min, point.value);
    max = Math.max(max, point.value);
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { minValue: 0, maxValue: 1 };
  }

  const span = max - min;
  const pad =
    span > 0
      ? span * PRICE_PAD_RATIO
      : Math.max(Math.abs(max) * PRICE_PAD_RATIO, 1);

  return { minValue: min - pad, maxValue: max + pad };
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function revealCountForProgress(
  progress: number,
  totalPoints: number
): number {
  if (progress >= 1) return totalPoints;
  const eased = easeOutCubic(Math.max(0, Math.min(1, progress)));
  const count = Math.round(eased * totalPoints);
  return Math.max(2, Math.min(totalPoints, count));
}

function setSeriesDataSafely(
  series: ISeriesApi<"Line"> | ISeriesApi<"Area">,
  data: LineData[]
): boolean {
  if (data.length === 0) return true;
  try {
    series.setData(data);
    return true;
  } catch {
    return false;
  }
}

function lockSeriesPriceRange(
  series: ISeriesApi<"Line"> | ISeriesApi<"Area">,
  range: { minValue: number; maxValue: number }
): void {
  try {
    series.applyOptions({
      autoscaleInfoProvider: () => ({
        priceRange: range,
      }),
    });
  } catch {
    // Series may already be removed.
  }
}

function unlockSeriesPriceRange(
  series: ISeriesApi<"Line"> | ISeriesApi<"Area">
): void {
  try {
    series.applyOptions({ autoscaleInfoProvider: undefined });
  } catch {
    // Series may already be removed.
  }
}

function fitChart(chart: IChartApi | undefined): void {
  if (!chart) return;
  try {
    chart.timeScale().fitContent();
  } catch {
    // Chart may already be removed.
  }
}

function setVisibleWindow(chart: IChartApi, from: Time, to: Time): void {
  try {
    chart.timeScale().setVisibleRange({ from, to });
  } catch {
    // Range may not be mappable yet.
  }
}

function pinLogicalWindow(chart: IChartApi, totalBars: number): void {
  if (totalBars < 2) return;
  try {
    chart.timeScale().setVisibleLogicalRange({
      from: 0,
      to: totalBars - 1,
    });
  } catch {
    // Logical range may not be ready yet.
  }
}

function lockTimeScale(chart: IChartApi): void {
  try {
    chart.timeScale().applyOptions({
      fixLeftEdge: true,
      fixRightEdge: true,
      shiftVisibleRangeOnNewBar: false,
      rightOffset: 0,
    });
  } catch {
    // Chart may already be removed.
  }
}

function unlockTimeScale(chart: IChartApi): void {
  try {
    chart.timeScale().applyOptions({
      fixLeftEdge: false,
      fixRightEdge: false,
      shiftVisibleRangeOnNewBar: true,
    });
  } catch {
    // Chart may already be removed.
  }
}

function lockChartInteraction(chart: IChartApi): void {
  try {
    chart.applyOptions({
      handleScroll: false,
      handleScale: false,
    });
  } catch {
    // Chart may already be removed.
  }
}

function unlockChartInteraction(chart: IChartApi): void {
  try {
    chart.applyOptions({
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });
  } catch {
    // Chart may already be removed.
  }
}

/** Load full series once and pin the full timeline — never mutate data during reveal. */
function establishTimeWindow(
  chart: IChartApi,
  series: ISeriesApi<"Line"> | ISeriesApi<"Area">,
  clean: LineData[]
): boolean {
  if (clean.length < 2) return false;
  if (!setSeriesDataSafely(series, clean)) {
    return false;
  }
  pinLogicalWindow(chart, clean.length);
  setVisibleWindow(
    chart,
    clean[0]!.time as Time,
    clean[clean.length - 1]!.time as Time
  );
  return true;
}

export type ChartTrailCancel = (snapToFull?: boolean) => void;

/**
 * Revolut-style reveal: full series + pinned x-axis from frame one, then ONLY
 * move the visual frontier left → right (clip/void). No setData during animation.
 */
export function animateChartTrail(
  series: ISeriesApi<"Line"> | ISeriesApi<"Area">,
  data: LineData[],
  options: ChartTrailOptions = {}
): ChartTrailCancel {
  const {
    durationMs = DEFAULT_DURATION_MS,
    chart,
    onComplete,
    onStep,
  } = options;
  const clean = sanitizeLineData(data);
  const priceRange = computeLineValueRange(clean);
  const fromTime = clean[0]?.time as Time | undefined;
  const toTime = clean[clean.length - 1]?.time as Time | undefined;
  let finished = false;
  let cancelled = false;
  let raf = 0;
  let startAt = 0;
  let timeWindowReady = false;
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  let rangeGuard: (() => void) | null = null;

  const clearWatchdog = () => {
    if (watchdog !== undefined) {
      clearTimeout(watchdog);
      watchdog = undefined;
    }
  };

  const markFinished = () => {
    finished = true;
    clearWatchdog();
  };

  const pinChartWindow = () => {
    if (
      !chart ||
      !timeWindowReady ||
      fromTime === undefined ||
      toTime === undefined
    ) {
      return;
    }
    pinLogicalWindow(chart, clean.length);
    setVisibleWindow(chart, fromTime, toTime);
  };

  const detachRangeGuard = () => {
    if (chart && rangeGuard) {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(rangeGuard);
    }
    rangeGuard = null;
    if (chart) {
      unlockTimeScale(chart);
      unlockChartInteraction(chart);
    }
  };

  const finalize = () => {
    if (finished) return;
    try {
      detachRangeGuard();
      pinChartWindow();
      unlockSeriesPriceRange(series);
      onStep?.(1, clean.length - 1);
      onComplete?.();
      markFinished();
    } catch {
      markFinished();
    }
  };

  const stop = (snapToFull = true) => {
    if (finished) return;
    cancelled = true;
    cancelAnimationFrame(raf);
    clearWatchdog();
    detachRangeGuard();
    if (snapToFull) {
      finalize();
    } else {
      markFinished();
    }
  };

  if (clean.length <= 2 || prefersReducedMotion()) {
    setSeriesDataSafely(series, clean);
    fitChart(chart);
    onStep?.(1, clean.length - 1);
    onComplete?.();
    markFinished();
    return stop;
  }

  if (!chart || fromTime === undefined || toTime === undefined) {
    setSeriesDataSafely(series, clean);
    onStep?.(1, clean.length - 1);
    onComplete?.();
    markFinished();
    return stop;
  }

  lockSeriesPriceRange(series, priceRange);
  lockTimeScale(chart);
  lockChartInteraction(chart);
  timeWindowReady = establishTimeWindow(chart, series, clean);

  if (!timeWindowReady) {
    markFinished();
    return stop;
  }

  pinChartWindow();
  onStep?.(0, 0);

  rangeGuard = () => {
    if (!finished && !cancelled) pinChartWindow();
  };
  chart.timeScale().subscribeVisibleLogicalRangeChange(rangeGuard);

  const revealTo = (progress: number) => {
    if (finished || cancelled) return false;
    const eased = easeOutCubic(progress);
    const tipIndex = Math.max(
      0,
      Math.min(clean.length - 1, Math.round(eased * clean.length) - 1)
    );
    onStep?.(eased, tipIndex);
    return true;
  };

  const tick = (now: number) => {
    if (cancelled || finished) return;

    if (!startAt) startAt = now;
    const progress = Math.min(1, (now - startAt) / durationMs);

    if (!revealTo(progress)) {
      stop(false);
      return;
    }

    if (progress < 1) {
      raf = requestAnimationFrame(tick);
    } else {
      finalize();
    }
  };

  watchdog = setTimeout(() => {
    if (!finished && !cancelled) finalize();
  }, durationMs + 300);

  raf = requestAnimationFrame(() => {
    pinChartWindow();
    raf = requestAnimationFrame(tick);
  });

  return stop;
}
