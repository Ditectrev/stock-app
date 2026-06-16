import type { ChartType } from "@/types";

export type ChartEffectTone = "up" | "down";

export type ChartGlowPoint = {
  x: number;
  y: number;
};

export function chartEffectTone(isPositive: boolean): ChartEffectTone {
  return isPositive ? "up" : "down";
}

export function chartSparkleEnabled(chartType: ChartType): boolean {
  return chartType === "area";
}

export function chartAtmosphereEnabled(chartType: ChartType): boolean {
  return chartType === "area";
}

/** Chart line reveal duration (ms). */
export const CHART_REVEAL_DURATION_MS = 1200;

/** Full-chart splash loops during load (independent of reveal frontier). */
export const CHART_LOAD_SPLASH_LOOPS = 1;

/** One splash sweep across the full chart width (ms). */
export const CHART_LOAD_SPLASH_LOOP_MS = Math.round(
  CHART_REVEAL_DURATION_MS / CHART_LOAD_SPLASH_LOOPS
);

export function chartSparkleSweepClass(tone: ChartEffectTone): string {
  return `chart-sparkle-sweep chart-sparkle-sweep--${tone}`;
}

export function chartSparkleFlashClass(tone: ChartEffectTone): string {
  return `chart-sparkle-flash chart-sparkle-flash--${tone}`;
}

export function chartScrubBeamClass(
  tone: ChartEffectTone,
  active: boolean
): string {
  return [
    "chart-scrub-beam",
    `chart-scrub-beam--${tone}`,
    active ? "chart-scrub-beam--active" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function chartScrubPointClass(
  tone: ChartEffectTone,
  active: boolean
): string {
  return [
    "chart-scrub-point",
    `chart-scrub-point--${tone}`,
    active ? "chart-scrub-point--active" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function chartLiveFlashClass(tone: ChartEffectTone): string {
  return `chart-live-flash chart-live-flash--${tone}`;
}

export function chartLiveFlashRingClass(tone: ChartEffectTone): string {
  return `chart-live-flash-ring chart-live-flash-ring--${tone}`;
}

export function chartLiveFlashCoreClass(tone: ChartEffectTone): string {
  return `chart-live-flash-core chart-live-flash-core--${tone}`;
}
