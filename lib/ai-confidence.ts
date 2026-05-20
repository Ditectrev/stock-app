/**
 * Maps an internal recommendation score to a 0–1 display value (shown as 0–100%).
 * Uses signal strength (|score|), not direction. Not a probability of profit.
 */
export function scoreToConfidence(
  score: number,
  maxStrength: number = 1
): number {
  if (maxStrength <= 0) return 0;
  const strength = Math.min(maxStrength, Math.max(0, Math.abs(score)));
  const normalized = strength / maxStrength;
  return Number(Math.min(1, Math.max(0, normalized)).toFixed(2));
}
