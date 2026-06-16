import type { PriceData } from "@/types";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseTimestamp(value: unknown): Date | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  return null;
}

/** Coerce unknown API/prop input into a safe PriceData array for charting. */
export function validatePriceDataSeries(input: unknown): PriceData[] {
  if (!Array.isArray(input)) return [];

  const points: PriceData[] = [];

  for (const row of input) {
    if (row == null || typeof row !== "object") continue;

    const record = row as Record<string, unknown>;
    const timestamp = parseTimestamp(record.timestamp);
    const close = record.close;

    if (!timestamp || !isFiniteNumber(close)) continue;

    points.push({
      timestamp,
      open: isFiniteNumber(record.open) ? record.open : close,
      high: isFiniteNumber(record.high) ? record.high : close,
      low: isFiniteNumber(record.low) ? record.low : close,
      close,
      volume: isFiniteNumber(record.volume) ? record.volume : 0,
    });
  }

  return points;
}
