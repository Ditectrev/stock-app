"use client";

/**
 * IPOCalendar Component
 * Displays upcoming IPOs grouped by day with price range and exchange info.
 *
 * Requirements: 24.19, 24.20, 24.21
 */

import {
  DNA_BODY_SECONDARY,
  DNA_CAPTION,
  DNA_SUBHEADING,
} from "@/lib/design-dna";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/lib/theme-context";
import { IPOEvent } from "@/types";
import { CalendarDateRangePicker } from "@/components/CalendarDateRangePicker";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { MARKET_UI_COPY } from "@/lib/market-ui-copy";
import {
  CALENDAR_DAY_HEADER,
  CALENDAR_EMPTY_TEXT,
  CALENDAR_EVENT_LIST,
  CALENDAR_EVENT_META,
  CALENDAR_EVENT_ROW,
  CALENDAR_EVENT_TITLE,
  CALENDAR_SYMBOL_CHIP,
  CALENDAR_PAGE_TITLE,
  CALENDAR_TODAY_BADGE,
  CALENDAR_TODAY_HEADER,
} from "@/lib/home-ui";

export interface IPOCalendarProps {
  data?: IPOEvent[];
  onSymbolClick?: (symbol: string) => void;
}

function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPrice(value: number | undefined): string {
  if (value === undefined || value === null) return "—";
  return `$${value.toFixed(2)}`;
}

function formatShares(value: number | undefined): string {
  if (value === undefined || value === null) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString();
}

const todayStr = toDateString(new Date());
const defaultStart = todayStr;

export function IPOCalendar({
  data: externalData,
  onSymbolClick,
}: IPOCalendarProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [data, setData] = useState<IPOEvent[] | null>(externalData ?? null);
  const [loading, setLoading] = useState(!externalData);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>("");

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/calendar/ipos");
      if (!res.ok) throw new Error(MARKET_UI_COPY.load.ipoCalendar);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Unknown error");
      setData(json.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : MARKET_UI_COPY.load.ipoCalendar
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (externalData) {
      setData(externalData);
      setLoading(false);
      return;
    }
    fetchData();
  }, [externalData, fetchData]);

  const filteredEvents = useMemo(
    () =>
      data
        ? data.filter((event) => {
            const eventDate =
              typeof event.expectedDate === "string"
                ? new Date(event.expectedDate)
                : event.expectedDate;
            const eventDateStr = toDateString(eventDate);
            if (startDate && eventDateStr < startDate) return false;
            if (endDate && eventDateStr > endDate) return false;
            return true;
          })
        : [],
    [data, startDate, endDate]
  );

  const groupedEvents = useMemo(() => {
    const groups: Record<string, IPOEvent[]> = {};
    for (const event of filteredEvents) {
      const eventDate =
        typeof event.expectedDate === "string"
          ? new Date(event.expectedDate)
          : event.expectedDate;
      const key = toDateString(eventDate);
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredEvents]);

  if (loading) {
    return (
      <div
        className="border-t border-stone-200 pt-4 dark:border-stone-700"
        data-testid="ipo-calendar-loading"
      >
        <LoadingSpinner className="py-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="border-t border-stone-200 pt-4 dark:border-stone-700"
        data-testid="ipo-calendar-error"
      >
        <ErrorMessage
          type="api"
          message={error}
          onRetry={() => {
            setLoading(true);
            fetchData();
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="border-t border-stone-200 pt-4 sm:pt-6 dark:border-stone-700"
      data-testid="ipo-calendar"
      role="region"
      aria-label="IPO Calendar"
    >
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className={CALENDAR_PAGE_TITLE}>IPO Calendar</h3>
          <p className={`mt-1 ${DNA_BODY_SECONDARY}`}>
            New listings by date with exchange, range, and offer context.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full border border-stone-300 bg-stone-100 px-2.5 py-1 text-stone-700 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200">
            {filteredEvents.length} upcoming
          </span>
        </div>
      </div>

      {/* Filters */}
      <div
        className="mb-4 flex flex-col gap-3 rounded-lg border border-stone-200 bg-stone-100 p-3 sm:flex-row sm:items-center dark:border-stone-700 dark:bg-stone-800"
        data-testid="filters"
      >
        <CalendarDateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          idPrefix="ipo"
        />
      </div>

      {/* Events grouped by day */}
      {filteredEvents.length === 0 ? (
        <p className={CALENDAR_EMPTY_TEXT} data-testid="no-events">
          No upcoming IPOs match the selected filters.
          {!externalData && (
            <span className="block mt-1 text-xs">
              {MARKET_UI_COPY.calendar.emptyHint}
            </span>
          )}
        </p>
      ) : (
        <div className="space-y-4" data-testid="events-list">
          {groupedEvents.map(([dateKey, events]) => {
            const isToday = dateKey === todayStr;
            return (
              <div key={dateKey} data-testid={`day-group-${dateKey}`}>
                {/* Day header */}
                <div
                  className={`sticky top-0 z-10 rounded-t-lg px-3 py-2 ${DNA_SUBHEADING} ${
                    isToday ? CALENDAR_TODAY_HEADER : CALENDAR_DAY_HEADER
                  }`}
                  data-testid={`day-header-${dateKey}`}
                >
                  {formatDayHeader(dateKey)}
                  {isToday && (
                    <span
                      className={`ml-2 rounded px-1.5 py-0.5 text-xs font-normal ${CALENDAR_TODAY_BADGE}`}
                    >
                      Today
                    </span>
                  )}
                  <span className={`ml-2 text-xs font-normal ${DNA_CAPTION}`}>
                    ({events.length} IPO{events.length !== 1 ? "s" : ""})
                  </span>
                </div>

                {/* Events for this day */}
                <div className={CALENDAR_EVENT_LIST}>
                  {events.map((event) => {
                    const hasPriceRange =
                      event.priceRangeLow != null ||
                      event.priceRangeHigh != null;

                    return (
                      <div
                        key={event.id}
                        className={CALENDAR_EVENT_ROW}
                        data-testid={`event-${event.id}`}
                      >
                        {/* Exchange badge */}
                        <span
                          className={`${CALENDAR_SYMBOL_CHIP} w-16 shrink-0`}
                          data-testid={`exchange-${event.id}`}
                        >
                          {event.exchange}
                        </span>

                        {/* Company details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={CALENDAR_EVENT_TITLE}>
                              {event.companyName}
                            </span>
                            {event.symbol && (
                              <button
                                onClick={() => onSymbolClick?.(event.symbol!)}
                                className={`text-xs px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                                  isDark
                                    ? "bg-stone-700 text-stone-300 hover:bg-stone-600"
                                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                                }`}
                                data-testid={`symbol-${event.id}`}
                                aria-label={`View details for ${event.symbol}`}
                              >
                                {event.symbol}
                              </button>
                            )}
                          </div>

                          {/* Details row */}
                          <div className={CALENDAR_EVENT_META}>
                            {hasPriceRange && (
                              <span data-testid={`price-range-${event.id}`}>
                                Price: {formatPrice(event.priceRangeLow)} –{" "}
                                {formatPrice(event.priceRangeHigh)}
                              </span>
                            )}
                            {event.sharesOffered != null && (
                              <span data-testid={`shares-${event.id}`}>
                                Shares: {formatShares(event.sharesOffered)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
