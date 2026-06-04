/**
 * Shared fill + text colors for performance heatmaps (tiles and matrix cells).
 * Uses emerald/rose hues aligned with lib/market-semantics.ts.
 * Light mode uses a higher opacity floor and dark text on pale tiles for WCAG contrast.
 */

function fillRgba(r: number, g: number, b: number, intensity: number): string {
  return `rgba(${r},${g},${b},${intensity})`;
}

/** Tailwind emerald-600 / rose-600 approximations for heatmap fills. */
const EMERALD_LIGHT = { r: 5, g: 150, b: 105 };
const ROSE_LIGHT = { r: 225, g: 29, b: 72 };
const EMERALD_DARK = { r: 16, g: 185, b: 129 };
const ROSE_DARK = { r: 244, g: 63, b: 94 };

/** Background for a signed performance value (e.g. % change). */
export function getHeatmapFillColor(value: number, isDark: boolean): string {
  const magnitude = Math.min(Math.abs(value), 10);

  if (value === 0) {
    return isDark ? fillRgba(120, 113, 108, 0.45) : "rgb(231, 229, 228)";
  }

  if (isDark) {
    const intensity = 0.2 + (magnitude / 10) * 0.75;
    if (value > 0) {
      return fillRgba(
        EMERALD_DARK.r,
        EMERALD_DARK.g,
        EMERALD_DARK.b,
        intensity
      );
    }
    return fillRgba(ROSE_DARK.r, ROSE_DARK.g, ROSE_DARK.b, intensity);
  }

  const intensity = 0.42 + (magnitude / 10) * 0.52;
  if (value > 0) {
    return fillRgba(
      EMERALD_LIGHT.r,
      EMERALD_LIGHT.g,
      EMERALD_LIGHT.b,
      intensity
    );
  }
  return fillRgba(ROSE_LIGHT.r, ROSE_LIGHT.g, ROSE_LIGHT.b, intensity);
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
