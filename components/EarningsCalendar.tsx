"use client";

/**
 * EarningsCalendar Component
 * Displays upcoming earnings announcements grouped by day with EPS estimates and surprises.
 *
 * Requirements: 24.8, 24.9, 24.10, 24.11, 24.12, 24.13
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/lib/theme-context";
import { EarningsEvent } from "@/types";
import { CalendarDateRangePicker } from "@/components/CalendarDateRangePicker";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";

export interface EarningsCalendarProps {
  data?: EarningsEvent[];
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

function formatEps(value: number | undefined): string {
  if (value === undefined || value === null) return "—";
  return `$${value.toFixed(2)}`;
}

function formatSurprisePercent(value: number | undefined): string {
  if (value === undefined || value === null) return "";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

const today = new Date();
const todayStr = toDateString(today);
const defaultStart = todayStr;
const defaultEnd = "";

export function EarningsCalendar({
  data: externalData,
  onSymbolClick,
}: EarningsCalendarProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [data, setData] = useState<EarningsEvent[] | null>(
    externalData ?? null
  );
  const [loading, setLoading] = useState(!externalData);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/calendar/earnings");
      if (!res.ok) throw new Error("Failed to fetch earnings events");
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
              typeof event.date === "string"
                ? new Date(event.date)
                : event.date;
            const eventDateStr = toDateString(eventDate);
            if (startDate && eventDateStr < startDate) return false;
            if (endDate && eventDateStr > endDate) return false;
            return true;
          })
        : [],
    [data, startDate, endDate]
  );

  const groupedEvents = useMemo(() => {
    const groups: Record<string, EarningsEvent[]> = {};
    for (const event of filteredEvents) {
      const eventDate =
        typeof event.date === "string" ? new Date(event.date) : event.date;
      const key = toDateString(eventDate);
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredEvents]);

  // --- Loading ---
  if (loading) {
    return (
      <div
        className="border-t border-stone-200 pt-4 dark:border-stone-700"
        data-testid="earnings-calendar-loading"
      >
        <LoadingSpinner className="py-8" />
      </div>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <div
        className="border-t border-stone-200 pt-4 dark:border-stone-700"
        data-testid="earnings-calendar-error"
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
      data-testid="earnings-calendar"
      role="region"
      aria-label="Earnings Calendar"
    >
      <h3
        className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
      >
        Earnings Calendar
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
          idPrefix="earnings"
        />
      </div>

      {/* Events grouped by day */}
      {filteredEvents.length === 0 ? (
        <p
          className={`text-center py-4 text-sm ${isDark ? "text-gray-300" : "text-gray-500"}`}
          data-testid="no-events"
        >
          No earnings events match the selected filters.
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
                  className={`sticky top-0 z-10 px-3 py-2 rounded-t-lg text-sm font-semibold ${
                    isToday
                      ? isDark
                        ? "bg-blue-900/40 text-blue-300 border-b border-blue-500/30"
                        : "bg-blue-50 text-blue-800 border-b border-blue-200"
                      : isDark
                        ? "bg-gray-700 text-gray-200 border-b border-gray-600"
                        : "bg-gray-100 text-gray-800 border-b border-gray-200"
                  }`}
                  data-testid={`day-header-${dateKey}`}
                >
                  {formatDayHeader(dateKey)}
                  {isToday && (
                    <span
                      className={`ml-2 text-xs font-normal px-1.5 py-0.5 rounded ${
                        isDark
                          ? "bg-blue-800 text-blue-200"
                          : "bg-blue-200 text-blue-700"
                      }`}
                    >
                      Today
                    </span>
                  )}
                  <span
                    className={`ml-2 text-xs font-normal ${isDark ? "text-gray-300" : "text-gray-500"}`}
                  >
                    ({events.length} event{events.length !== 1 ? "s" : ""})
                  </span>
                </div>

                {/* Events for this day */}
                <div
                  className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-100"}`}
                >
                  {events.map((event) => {
                    const hasSurprise =
                      event.epsSurprise !== undefined &&
                      event.epsSurprise !== null;
                    const isBeat = hasSurprise && event.epsSurprise! > 0;
                    const isMiss = hasSurprise && event.epsSurprise! < 0;

                    const surpriseColorClass = isBeat
                      ? "text-green-600 dark:text-green-400"
                      : isMiss
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-500 dark:text-gray-300";

                    return (
                      <div
                        key={event.id}
                        className={`flex items-start gap-3 px-3 py-2 ${
                          isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                        }`}
                        data-testid={`event-${event.id}`}
                      >
                        {/* Symbol badge */}
                        <button
                          onClick={() => onSymbolClick?.(event.symbol)}
                          className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 w-16 text-center inline-block cursor-pointer transition-colors ${
                            isDark
                              ? "bg-blue-900/40 text-blue-300 hover:bg-blue-800/60"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          }`}
                          data-testid={`symbol-${event.id}`}
                          aria-label={`View details for ${event.symbol}`}
                        >
                          {event.symbol}
                        </button>

                        {/* Company details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium truncate ${isDark ? "text-gray-200" : "text-gray-900"}`}
                            >
                              {event.companyName}
                            </span>
                            {event.time && (
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded ${
                                  isDark
                                    ? "bg-gray-700 text-gray-400"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                                data-testid={`time-${event.id}`}
                              >
                                {event.time}
                              </span>
                            )}
                          </div>

                          {/* EPS row */}
                          <div
                            className={`flex flex-wrap gap-3 mt-1 text-xs ${isDark ? "text-gray-300" : "text-gray-500"}`}
                          >
                            <span data-testid={`eps-estimate-${event.id}`}>
                              Est: {formatEps(event.epsEstimate)}
                            </span>
                            {event.epsActual !== undefined &&
                              event.epsActual !== null && (
                                <span data-testid={`eps-actual-${event.id}`}>
                                  Act: {formatEps(event.epsActual)}
                                </span>
                              )}
                            {hasSurprise && (
                              <span
                                className={surpriseColorClass}
                                data-testid={`eps-surprise-${event.id}`}
                              >
                                Surprise: {formatEps(event.epsSurprise)} (
                                {formatSurprisePercent(
                                  event.epsSurprisePercent
                                )}
                                )
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
