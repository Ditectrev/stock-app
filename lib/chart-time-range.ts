import type { PriceData, TimeRange } from "@/types";

/** Start of the window for a chart time range (local time). */
export function getTimeRangeStart(
  range: TimeRange,
  now = new Date()
): Date | null {
  if (range === "Max") return null;

  const startDate = new Date(now);

  switch (range) {
    case "1D":
      startDate.setHours(now.getHours() - 24);
      break;
    case "1W":
      startDate.setDate(now.getDate() - 7);
      break;
    case "1M":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "3M":
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "1Y":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case "5Y":
      startDate.setFullYear(now.getFullYear() - 5);
      break;
    case "YTD":
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  return startDate;
}

/** Slice history for local-only charts (parent does not refetch per range). */
export function filterPriceDataByTimeRange(
  allData: PriceData[],
  range: TimeRange,
  now = new Date()
): PriceData[] {
  if (!allData.length) return [];
  if (range === "Max") return allData;

  const startDate = getTimeRangeStart(range, now);
  if (!startDate) return allData;

  return allData.filter((d) => new Date(d.timestamp) >= startDate);
}
