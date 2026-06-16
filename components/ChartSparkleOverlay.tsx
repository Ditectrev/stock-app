"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type { IChartApi, ISeriesApi, LineData } from "lightweight-charts";
import type { ChartType } from "@/types";
import {
  chartAtmosphereEnabled,
  chartEffectTone,
  CHART_LOAD_SPLASH_LOOP_MS,
  CHART_LOAD_SPLASH_LOOPS,
  chartLiveFlashClass,
  chartLiveFlashCoreClass,
  chartLiveFlashRingClass,
  chartScrubBeamClass,
  chartScrubPointClass,
  chartSparkleEnabled,
  chartSparkleFlashClass,
  chartSparkleSweepClass,
  type ChartGlowPoint,
} from "@/lib/chart-effects";

type MainSeries = ISeriesApi<"Area">;

function restartLoadSplashAnimation(
  sweep: HTMLDivElement | null,
  flash: HTMLDivElement | null
) {
  const timing = `${CHART_LOAD_SPLASH_LOOP_MS}ms ease-in-out ${CHART_LOAD_SPLASH_LOOPS}`;

  for (const el of [sweep, flash]) {
    if (!el) continue;
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
  }

  if (sweep) {
    sweep.style.animation = `chart-sparkle-sweep ${timing}`;
  }
  if (flash) {
    flash.style.animation = `chart-sparkle-flash ${timing}`;
  }
}

function stopLoadSplashAnimation(
  sweep: HTMLDivElement | null,
  flash: HTMLDivElement | null
) {
  for (const el of [sweep, flash]) {
    if (!el) continue;
    el.style.animation = "none";
  }
}

export type ChartSparkleOverlayHandle = {
  setCrosshairGlow: (glow: ChartGlowPoint | null) => void;
  syncLivePoint: () => void;
  syncLiveTip: (tipIndex: number) => void;
  setLoadingSplash: (active: boolean) => void;
  /** 0–1 reveal progress; drives the right-side void panel during load. */
  setRevealProgress: (ratio: number) => void;
};

export interface ChartSparkleOverlayProps {
  chartRef: React.RefObject<IChartApi | null>;
  seriesRef: React.RefObject<MainSeries | null>;
  chartType: ChartType;
  isPositive: boolean;
  dataRevision: string;
}

function applyVoidMask(
  voidEl: HTMLDivElement,
  ratio: number,
  frontierX: number | null
) {
  voidEl.style.left = "0";
  voidEl.style.right = "0";
  voidEl.style.width = "100%";
  voidEl.style.willChange = "clip-path";
  voidEl.style.opacity = "1";

  if (frontierX !== null) {
    voidEl.style.clipPath = `inset(0 0 0 ${frontierX}px)`;
    return;
  }

  voidEl.style.clipPath = `inset(0 0 0 ${ratio * 100}%)`;
}

export const ChartSparkleOverlay = forwardRef<
  ChartSparkleOverlayHandle,
  ChartSparkleOverlayProps
>(function ChartSparkleOverlay(
  { chartRef, seriesRef, chartType, isPositive, dataRevision },
  ref
) {
  const tone = chartEffectTone(isPositive);
  const showSparkle = chartSparkleEnabled(chartType);
  const showAmbient = chartAtmosphereEnabled(chartType);
  const sweepRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const crosshairPointRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const voidRef = useRef<HTMLDivElement>(null);
  const crosshairGlowRef = useRef(false);
  const loadingSplashRef = useRef(false);
  const revealRatioRef = useRef(0);
  const frontierXRef = useRef<number | null>(null);
  const liveTipIndexRef = useRef<number | null>(null);
  const pendingGlowRef = useRef<ChartGlowPoint | null | undefined>(undefined);
  const glowRafRef = useRef(0);

  const positionLivePoint = useCallback(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    const live = liveRef.current;
    if (!chart || !series || !live) return;

    if (crosshairGlowRef.current) {
      live.style.opacity = "0";
      return;
    }

    const data = series.data() as LineData[];
    const index = liveTipIndexRef.current ?? data.length - 1;
    const point = data[index];
    if (!point || point.value === undefined) {
      live.style.opacity = "0";
      return;
    }

    const x = chart.timeScale().timeToCoordinate(point.time);
    const y = series.priceToCoordinate(point.value);
    if (x === null || y === null) {
      live.style.opacity = "0";
      frontierXRef.current = null;
      return;
    }

    frontierXRef.current = x;
    live.style.left = `${x}px`;
    live.style.top = `${y}px`;
    live.style.opacity = loadingSplashRef.current ? "0" : "1";

    if (loadingSplashRef.current) {
      const voidEl = voidRef.current;
      if (voidEl) {
        applyVoidMask(voidEl, revealRatioRef.current, x);
      }
    }
  }, [chartRef, seriesRef]);

  const applyCrosshairGlow = (glow: ChartGlowPoint | null) => {
    const beam = beamRef.current;
    const crosshairPoint = crosshairPointRef.current;
    if (!beam || !crosshairPoint) return;

    crosshairGlowRef.current = glow !== null;
    const active = glow !== null;

    beam.classList.toggle("chart-scrub-beam--active", active);
    crosshairPoint.classList.toggle("chart-scrub-point--active", active);

    if (!glow) {
      beam.style.left = "";
      crosshairPoint.style.left = "";
      crosshairPoint.style.top = "";
      positionLivePoint();
      return;
    }

    beam.style.left = `${glow.x}px`;
    crosshairPoint.style.left = `${glow.x}px`;
    crosshairPoint.style.top = `${glow.y}px`;

    if (liveRef.current) liveRef.current.style.opacity = "0";
  };

  const scheduleCrosshairGlow = (glow: ChartGlowPoint | null) => {
    pendingGlowRef.current = glow;
    if (glowRafRef.current) {
      cancelAnimationFrame(glowRafRef.current);
    }
    glowRafRef.current = requestAnimationFrame(() => {
      glowRafRef.current = 0;
      applyCrosshairGlow(pendingGlowRef.current ?? null);
    });
  };

  const setRevealProgress = (ratio: number) => {
    revealRatioRef.current = Math.max(0, Math.min(1, ratio));
    const voidEl = voidRef.current;

    if (!loadingSplashRef.current) {
      if (voidEl) {
        voidEl.style.opacity = "0";
        voidEl.style.left = "100%";
      }
      return;
    }

    if (voidEl) {
      applyVoidMask(voidEl, revealRatioRef.current, frontierXRef.current);
    }
  };

  const setLoadingSplash = (active: boolean) => {
    loadingSplashRef.current = active;

    if (showAmbient) {
      sweepRef.current?.classList.toggle(
        "chart-sparkle-sweep--loading",
        active
      );
      flashRef.current?.classList.toggle(
        "chart-sparkle-flash--loading",
        active
      );
      if (active) {
        restartLoadSplashAnimation(sweepRef.current, flashRef.current);
      } else {
        stopLoadSplashAnimation(sweepRef.current, flashRef.current);
      }
    }

    if (active) {
      scheduleCrosshairGlow(null);
      setRevealProgress(revealRatioRef.current);
    } else {
      liveTipIndexRef.current = null;
      setRevealProgress(1);
      positionLivePoint();
    }
  };

  const syncLiveTip = (tipIndex: number) => {
    liveTipIndexRef.current = tipIndex;
    positionLivePoint();
  };

  useImperativeHandle(ref, () => ({
    setCrosshairGlow: scheduleCrosshairGlow,
    syncLivePoint: () => {
      liveTipIndexRef.current = null;
      positionLivePoint();
    },
    syncLiveTip,
    setLoadingSplash,
    setRevealProgress,
  }));

  useEffect(() => {
    if (!showSparkle) return;

    let cancelled = false;
    let frame = 0;
    let chart: IChartApi | null = null;

    const attach = () => {
      if (cancelled) return;

      chart = chartRef.current;
      if (!chart || !seriesRef.current) {
        frame = requestAnimationFrame(attach);
        return;
      }

      positionLivePoint();
      chart.timeScale().subscribeVisibleLogicalRangeChange(positionLivePoint);
      window.addEventListener("resize", positionLivePoint);
    };

    attach();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      if (glowRafRef.current) cancelAnimationFrame(glowRafRef.current);
      if (chart) {
        chart
          .timeScale()
          .unsubscribeVisibleLogicalRangeChange(positionLivePoint);
      }
      window.removeEventListener("resize", positionLivePoint);
    };
  }, [chartRef, seriesRef, showSparkle, dataRevision, positionLivePoint]);

  if (!showSparkle) return null;

  return (
    <>
      {showAmbient ? (
        <>
          <div
            ref={voidRef}
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-[1] bg-stone-50 dark:bg-stone-950"
            style={{ left: "100%", opacity: 0 }}
          />
          <div
            ref={flashRef}
            aria-hidden
            className={chartSparkleFlashClass(tone)}
          />
          <div
            ref={sweepRef}
            aria-hidden
            className={chartSparkleSweepClass(tone)}
          />
        </>
      ) : null}

      <div
        ref={beamRef}
        aria-hidden
        className={chartScrubBeamClass(tone, false)}
      />
      <div
        ref={crosshairPointRef}
        aria-hidden
        className={chartScrubPointClass(tone, false)}
      />
      <div
        ref={liveRef}
        aria-hidden
        className={`${chartLiveFlashClass(tone)} z-[8]`}
        style={{ opacity: 0 }}
      >
        <div className={chartLiveFlashRingClass(tone)} />
        <div className={chartLiveFlashCoreClass(tone)} />
      </div>
    </>
  );
});
