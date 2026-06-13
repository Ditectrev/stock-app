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

function restartAnimation(element: HTMLElement | null) {
  if (!element) return;
  element.style.animation = "none";
  void element.offsetWidth;
  element.style.animation = "";
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
      return;
    }

    live.style.left = `${x}px`;
    live.style.top = `${y}px`;
    live.style.opacity = "1";
  }, [chartRef, seriesRef]);

  const applyCrosshairGlow = (glow: ChartGlowPoint | null) => {
    const beam = beamRef.current;
    const crosshairPoint = crosshairPointRef.current;
    if (!beam || !crosshairPoint) return;

    crosshairGlowRef.current = glow !== null;

    if (!glow) {
      beam.style.opacity = "0";
      crosshairPoint.style.opacity = "0";
      positionLivePoint();
      return;
    }

    beam.style.left = `${glow.x}px`;
    beam.style.opacity = "1";
    crosshairPoint.style.left = `${glow.x}px`;
    crosshairPoint.style.top = `${glow.y}px`;
    crosshairPoint.style.opacity = "1";

    if (liveRef.current) liveRef.current.style.opacity = "0";
  };

  const scheduleCrosshairGlow = (glow: ChartGlowPoint | null) => {
    pendingGlowRef.current = glow;
    if (glowRafRef.current) return;
    glowRafRef.current = requestAnimationFrame(() => {
      glowRafRef.current = 0;
      applyCrosshairGlow(pendingGlowRef.current ?? null);
    });
  };

  const setRevealProgress = (ratio: number) => {
    revealRatioRef.current = Math.max(0, Math.min(1, ratio));
    const voidEl = voidRef.current;
    if (!voidEl) return;
    if (!loadingSplashRef.current) {
      voidEl.style.opacity = "0";
      voidEl.style.left = "100%";
      return;
    }
    voidEl.style.left = `${revealRatioRef.current * 100}%`;
    voidEl.style.opacity = "1";
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
        restartAnimation(sweepRef.current);
        restartAnimation(flashRef.current);
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
        className={`${chartScrubBeamClass(tone, false)} z-[2]`}
        style={{ opacity: 0 }}
      />
      <div
        ref={crosshairPointRef}
        aria-hidden
        className={`${chartScrubPointClass(tone, false)} z-[2]`}
        style={{ opacity: 0 }}
      />
      <div
        ref={liveRef}
        aria-hidden
        className={`${chartLiveFlashClass(tone)} z-[2]`}
        style={{ opacity: 0 }}
      >
        <div className={chartLiveFlashRingClass(tone)} />
        <div className={chartLiveFlashCoreClass(tone)} />
      </div>
    </>
  );
});
