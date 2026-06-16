import type { PriceData } from "@/types";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function coerceNumber(value: unknown): number | null {
  if (isFiniteNumber(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
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
    const close = coerceNumber(record.close);

    if (!timestamp || close === null) continue;

    points.push({
      timestamp,
      open: coerceNumber(record.open) ?? close,
      high: coerceNumber(record.high) ?? close,
      low: coerceNumber(record.low) ?? close,
      close,
      volume: coerceNumber(record.volume) ?? 0,
    });
  }

  return points;
}
