"use client";

/**
 * IPOCalendar Component
 * Displays upcoming IPOs grouped by day with price range and exchange info.
 *
 * Requirements: 24.19, 24.20, 24.21
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/lib/theme-context";
import { IPOEvent } from "@/types";
import { CalendarDateRangePicker } from "@/components/CalendarDateRangePicker";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import {
  CALENDAR_DAY_HEADER,
  CALENDAR_TODAY_BADGE,
  CALENDAR_TODAY_HEADER,
  HOME_SUBTLE_TEXT,
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
      if (!res.ok) throw new Error("Failed to fetch IPO events");
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Unknown error");
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
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
      <h3
        className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
      >
        IPO Calendar
      </h3>

      {/* Filters */}
      <div
        className="flex flex-col sm:flex-row gap-3 mb-4"
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
        <p
          className={`text-center py-4 text-sm ${isDark ? "text-gray-300" : "text-gray-500"}`}
          data-testid="no-events"
        >
          No upcoming IPOs match the selected filters.
          {!externalData && (
            <span className="block mt-1 text-xs">
              The data source may be temporarily unavailable. Try again in a few
              minutes.
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
                  className={`sticky top-0 z-10 rounded-t-lg px-3 py-2 text-sm font-semibold ${
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
                  <span
                    className={`ml-2 text-xs font-normal ${HOME_SUBTLE_TEXT}`}
                  >
                    ({events.length} IPO{events.length !== 1 ? "s" : ""})
                  </span>
                </div>

                {/* Events for this day */}
                <div
                  className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-100"}`}
                >
                  {events.map((event) => {
                    const hasPriceRange =
                      event.priceRangeLow != null ||
                      event.priceRangeHigh != null;

                    return (
                      <div
                        key={event.id}
                        className={`flex items-start gap-3 px-3 py-2 ${
                          isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                        }`}
                        data-testid={`event-${event.id}`}
                      >
                        {/* Exchange badge */}
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 w-16 text-center inline-block ${
                            isDark
                              ? "bg-purple-900/40 text-purple-300"
                              : "bg-purple-100 text-purple-700"
                          }`}
                          data-testid={`exchange-${event.id}`}
                        >
                          {event.exchange}
                        </span>

                        {/* Company details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium truncate ${isDark ? "text-gray-200" : "text-gray-900"}`}
                            >
                              {event.companyName}
                            </span>
                            {event.symbol && (
                              <button
                                onClick={() => onSymbolClick?.(event.symbol!)}
                                className={`text-xs px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                                  isDark
                                    ? "bg-gray-700 text-gray-400 hover:bg-gray-600"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                }`}
                                data-testid={`symbol-${event.id}`}
                                aria-label={`View details for ${event.symbol}`}
                              >
                                {event.symbol}
                              </button>
                            )}
                          </div>

                          {/* Details row */}
                          <div
                            className={`flex flex-wrap gap-3 mt-1 text-xs ${isDark ? "text-gray-300" : "text-gray-500"}`}
                          >
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
