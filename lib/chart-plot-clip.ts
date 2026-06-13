/** Hides the entire plot (Revolut void on the right at t=0). */
export const HIDDEN_PLOT_CLIP = "inset(0 100% 0 0)";

export function clearPlotClip(element: HTMLElement | null): void {
  if (!element) return;
  element.style.clipPath = "";
}

export function applyPlotClip(
  element: HTMLElement | null,
  clipPath: string
): void {
  if (!element) return;
  element.style.clipPath = clipPath;
}

/** Reveal ratio 0–1 across the plot width (never use timeToCoordinate during load). */
export function revealRatio(
  revealedCount: number,
  totalPoints: number
): number {
  if (totalPoints <= 0) return 0;
  return Math.max(0, Math.min(1, revealedCount / totalPoints));
}

/**
 * Clip the plot from the left edge through the reveal frontier.
 * Uses ONLY linear ratio so the frontier never tracks LWC's right-anchored fit.
 */
export function computePlotClipPath(
  revealedCount: number,
  totalPoints: number,
  plotEl: HTMLElement | null
): string {
  if (totalPoints <= 0 || revealedCount <= 0) return HIDDEN_PLOT_CLIP;

  const ratio = revealRatio(revealedCount, totalPoints);
  const plotWidth = plotEl?.clientWidth ?? 0;

  if (plotWidth > 0) {
    const x = Math.max(1, Math.ceil(plotWidth * ratio));
    return `polygon(0 0, ${x}px 0, ${x}px 100%, 0 100%)`;
  }

  return `inset(0 calc(100% - ${Math.max(1, ratio * 100)}%) 0 0)`;
}
