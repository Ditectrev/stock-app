/**
 * Shared fill + text colors for performance heatmaps (tiles and matrix cells).
 * Light mode uses a higher opacity floor and dark text on pale tiles for WCAG contrast.
 */

function fillRgba(r: number, g: number, b: number, intensity: number): string {
  return `rgba(${r},${g},${b},${intensity})`;
}

/** Background for a signed performance value (e.g. % change). */
export function getHeatmapFillColor(value: number, isDark: boolean): string {
  const magnitude = Math.min(Math.abs(value), 10);

  if (value === 0) {
    return isDark ? fillRgba(120, 113, 108, 0.45) : "rgb(231, 229, 228)";
  }

  if (isDark) {
    const intensity = 0.2 + (magnitude / 10) * 0.75;
    if (value > 0) return fillRgba(34, 197, 94, intensity);
    return fillRgba(239, 68, 68, intensity);
  }

  // Light mode: deeper base hues + higher minimum alpha (pale tiles stay readable)
  const intensity = 0.42 + (magnitude / 10) * 0.52;
  if (value > 0) return fillRgba(22, 163, 74, intensity);
  return fillRgba(220, 38, 38, intensity);
}

/** Tailwind text classes for labels on heatmap fills. */
export function getHeatmapTextClass(value: number, isDark: boolean): string {
  if (value === 0) {
    return isDark ? "text-stone-200" : "text-stone-800";
  }

  const magnitude = Math.abs(value);
  if (isDark) return "text-white";

  return magnitude >= 2 ? "text-white" : "text-stone-900";
}

/** Neutral swatch for legend gradients. */
export function getHeatmapNeutralLegendColor(isDark: boolean): string {
  return isDark ? "rgba(120,113,108,0.45)" : "rgb(231, 229, 228)";
}
