"use client";

/**
 * DividendCalendar Component
 * Displays upcoming dividend payments grouped by day with filtering and sorting.
 *
 * Requirements: 24.14, 24.15, 24.16, 24.17, 24.18
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/lib/theme-context";
import { DividendEvent } from "@/types";
import { CalendarDateRangePicker } from "@/components/CalendarDateRangePicker";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import {
  CALENDAR_DAY_HEADER,
  CALENDAR_EMPTY_TEXT,
  CALENDAR_EVENT_LIST,
  CALENDAR_EVENT_META,
  CALENDAR_EVENT_ROW,
  CALENDAR_EVENT_TITLE,
  CALENDAR_FILTER_LABEL,
  CALENDAR_PAGE_TITLE,
  CALENDAR_SELECT,
  CALENDAR_TODAY_BADGE,
  CALENDAR_TODAY_HEADER,
  HOME_SUBTLE_TEXT,
} from "@/lib/home-ui";

export interface DividendCalendarProps {
  data?: DividendEvent[];
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

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatYield(value: number): string {
  return `${value.toFixed(2)}%`;
}

const todayStr = toDateString(new Date());
const defaultStart = todayStr;

export function DividendCalendar({
  data: externalData,
  onSymbolClick,
}: DividendCalendarProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [data, setData] = useState<DividendEvent[] | null>(
    externalData ?? null
  );
  const [loading, setLoading] = useState(!externalData);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [timezoneFilter, setTimezoneFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/calendar/dividends");
      if (!res.ok) throw new Error("Failed to fetch dividend events");
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

  const filteredEvents = useMemo(() => {
    if (!data) return [];

    return data.filter((event) => {
      const exDate =
        typeof event.exDividendDate === "string"
          ? new Date(event.exDividendDate)
          : event.exDividendDate;
      const exDateStr = toDateString(exDate);

      if (startDate && exDateStr < startDate) return false;
      if (endDate && exDateStr > endDate) return false;

      if (countryFilter !== "all" && event.country !== countryFilter)
        return false;
      if (timezoneFilter !== "all" && event.timezone !== timezoneFilter)
        return false;

      return true;
    });
  }, [data, startDate, endDate, countryFilter, timezoneFilter]);

  const availableCountries = useMemo(() => {
    if (!data) return [];
    const set = new Set(data.map((e) => e.country).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  const availableTimezones = useMemo(() => {
    if (!data) return [];
    const set = new Set(data.map((e) => e.timezone).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  const groupedEvents = useMemo(() => {
    const groups: Record<string, DividendEvent[]> = {};
    for (const event of filteredEvents) {
      const exDate =
        typeof event.exDividendDate === "string"
          ? new Date(event.exDividendDate)
          : event.exDividendDate;
      const key = toDateString(exDate);
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredEvents]);

  if (loading) {
    return (
      <div
        className="border-t border-stone-200 pt-4 dark:border-stone-700"
        data-testid="dividend-calendar-loading"
      >
        <LoadingSpinner className="py-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="border-t border-stone-200 pt-4 dark:border-stone-700"
        data-testid="dividend-calendar-error"
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
      data-testid="dividend-calendar"
      role="region"
      aria-label="Dividend Calendar"
    >
      <h3 className={CALENDAR_PAGE_TITLE}>Dividend Calendar</h3>

      {/* Filters */}
      <div
        className="flex flex-col sm:flex-row gap-3 mb-4"
        data-testid="filters"
      >
        <CalendarDateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(d) => {
            setStartDate(d);
          }}
          onEndDateChange={(d) => {
            setEndDate(d);
          }}
          idPrefix="dividend"
        />

        {/* Country filter (Req 24.17) */}
        {availableCountries.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="dividend-country" className={CALENDAR_FILTER_LABEL}>
              Country:
            </label>
            <select
              id="dividend-country"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className={`${CALENDAR_SELECT} px-2 py-1`}
              data-testid="country-filter"
            >
              <option value="all">All Countries</option>
              {availableCountries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Timezone filter (Req 24.18) */}
        {availableTimezones.length > 0 && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="dividend-timezone"
              className={CALENDAR_FILTER_LABEL}
            >
              Timezone:
            </label>
            <select
              id="dividend-timezone"
              value={timezoneFilter}
              onChange={(e) => setTimezoneFilter(e.target.value)}
              className={`${CALENDAR_SELECT} px-2 py-1`}
              data-testid="timezone-filter"
            >
              <option value="all">All Timezones</option>
              {availableTimezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Events grouped by day */}
      {filteredEvents.length === 0 ? (
        <p className={CALENDAR_EMPTY_TEXT} data-testid="no-events">
          No dividend events match the selected filters.
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
                    ({events.length} event
                    {events.length !== 1 ? "s" : ""})
                  </span>
                </div>

                <div className={CALENDAR_EVENT_LIST}>
                  {events.map((event) => {
                    const payDate =
                      typeof event.paymentDate === "string"
                        ? new Date(event.paymentDate)
                        : event.paymentDate;

                    return (
                      <div
                        key={event.id}
                        className={CALENDAR_EVENT_ROW}
                        data-testid={`event-${event.id}`}
                      >
                        {/* Symbol badge */}
                        <button
                          onClick={() => onSymbolClick?.(event.symbol)}
                          className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 w-16 text-center inline-block cursor-pointer transition-colors ${
                            isDark
                              ? "bg-green-900/40 text-green-300 hover:bg-green-800/60"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                          data-testid={`symbol-${event.id}`}
                          aria-label={`View details for ${event.symbol}`}
                        >
                          {event.symbol}
                        </button>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <span
                            className={`block truncate ${CALENDAR_EVENT_TITLE}`}
                          >
                            {event.companyName}
                          </span>
                          <div className={CALENDAR_EVENT_META}>
                            <span data-testid={`amount-${event.id}`}>
                              Div: {formatCurrency(event.amount)}
                            </span>
                            <span data-testid={`yield-${event.id}`}>
                              Yield: {formatYield(event.yield)}
                            </span>
                            <span data-testid={`payment-date-${event.id}`}>
                              Pay: {toDateString(payDate)}
                            </span>
                            <span
                              className={`capitalize ${HOME_SUBTLE_TEXT}`}
                              data-testid={`frequency-${event.id}`}
                            >
                              {event.frequency}
                            </span>
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
