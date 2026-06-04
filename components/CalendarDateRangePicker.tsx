"use client";

/**
 * CalendarDateRangePicker Component
 * Shared date range selection for all calendar types.
 *
 * Requirements: 24.22, 24.23
 */

import { DNA_BODY } from "@/lib/design-dna";
import { HOME_CHIP_SM, HOME_INPUT_SM, homeChipClasses } from "@/lib/home-ui";

export interface CalendarDateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  /** Optional id prefix to avoid duplicate ids when multiple pickers exist */
  idPrefix?: string;
}

function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const todayStr = toDateString(new Date());

export function CalendarDateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  idPrefix = "cal",
}: CalendarDateRangePickerProps) {
  const isToday = startDate === todayStr && endDate === "";

  const handleTodayClick = () => {
    onStartDateChange(todayStr);
    onEndDateChange("");
  };

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="calendar-date-range-picker"
    >
      <button
        onClick={handleTodayClick}
        className={`${HOME_CHIP_SM} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 ${homeChipClasses(isToday)}`}
        data-testid="today-button"
        aria-label="Jump to today"
      >
        Today
      </button>

      <label htmlFor={`${idPrefix}-start-date`} className={`${DNA_BODY}`}>
        From:
      </label>
      <input
        id={`${idPrefix}-start-date`}
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className={HOME_INPUT_SM}
        data-testid="start-date"
      />

      <label htmlFor={`${idPrefix}-end-date`} className={`${DNA_BODY}`}>
        To:
      </label>
      <input
        id={`${idPrefix}-end-date`}
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className={HOME_INPUT_SM}
        data-testid="end-date"
      />
    </div>
  );
}
