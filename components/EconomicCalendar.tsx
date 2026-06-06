"use client";

/**
 * EconomicCalendar Component
 * Displays upcoming economic events grouped by day with country flags.
 *
 * Requirements: 24.4, 24.5, 24.6, 24.7
 */

import {
  DNA_BODY_SECONDARY,
  DNA_CAPTION,
  DNA_SUBHEADING,
} from "@/lib/design-dna";
import { useState, useEffect, useCallback, useMemo } from "react";
import { EconomicEvent } from "@/types";
import { CalendarDateRangePicker } from "@/components/CalendarDateRangePicker";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { MARKET_UI_COPY } from "@/lib/market-ui-copy";
import {
  CALENDAR_IMPORTANCE_HIGH,
  CALENDAR_IMPORTANCE_LOW,
  CALENDAR_IMPORTANCE_MEDIUM,
  MARKET_NEUTRAL_TEXT,
  marketChangeTextClass,
} from "@/lib/market-semantics";
import {
  CALENDAR_DAY_HEADER,
  CALENDAR_CHIP_IDLE,
  CALENDAR_EMPTY_TEXT,
  CALENDAR_EVENT_LIST,
  CALENDAR_EVENT_ROW,
  CALENDAR_EVENT_TITLE,
  CALENDAR_FILTER_LABEL,
  CALENDAR_SELECT,
  CALENDAR_TODAY_BADGE,
  CALENDAR_TODAY_HEADER,
  HOME_PANEL_TITLE,
} from "@/lib/home-ui";

const COUNTRIES = [
  "All",
  "United States",
  "United Kingdom",
  "European Union",
  "Japan",
  "China",
  "Canada",
  "Australia",
  "New Zealand",
  "Switzerland",
] as const;

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  "United States": "US",
  "United Kingdom": "UK",
  "European Union": "EU",
  Japan: "JP",
  China: "CN",
  Canada: "CA",
  Australia: "AU",
  "New Zealand": "NZ",
  Switzerland: "CH",
};

const COUNTRY_CODE_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_NAME_TO_CODE).map(([name, code]) => [code, name])
);

const COUNTRY_FLAG: Record<string, string> = {
  US: "🇺🇸",
  UK: "🇬🇧",
  EU: "🇪🇺",
  JP: "🇯🇵",
  CN: "🇨🇳",
  CA: "🇨🇦",
  AU: "🇦🇺",
  NZ: "🇳🇿",
  CH: "🇨🇭",
};

const IMPORTANCE_LEVELS = ["high", "medium", "low"] as const;
type ImportanceLevel = (typeof IMPORTANCE_LEVELS)[number];

const IMPORTANCE_STYLES: Record<ImportanceLevel, string> = {
  high: CALENDAR_IMPORTANCE_HIGH,
  medium: CALENDAR_IMPORTANCE_MEDIUM,
  low: CALENDAR_IMPORTANCE_LOW,
};

export interface EconomicCalendarProps {
  data?: EconomicEvent[];
}

function parseMetricValue(value: string): number | null {
  const parsed = parseFloat(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function economicActualTextClass(actual: string, forecast?: string): string {
  if (!forecast) return MARKET_NEUTRAL_TEXT;
  const actualNum = parseMetricValue(actual);
  const forecastNum = parseMetricValue(forecast);
  if (actualNum === null || forecastNum === null) return MARKET_NEUTRAL_TEXT;
  if (actualNum === forecastNum) return MARKET_NEUTRAL_TEXT;
  return marketChangeTextClass(actualNum - forecastNum);
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

const today = new Date();
const todayStr = toDateString(today);
const defaultStart = todayStr;
const defaultEnd = "";

export function EconomicCalendar({
  data: externalData,
}: EconomicCalendarProps) {
  const [data, setData] = useState<EconomicEvent[] | null>(
    externalData ?? null
  );
  const [loading, setLoading] = useState(!externalData);
  const [error, setError] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string>("All");
  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);
  const [importanceFilter, setImportanceFilter] = useState<
    Set<ImportanceLevel>
  >(new Set(IMPORTANCE_LEVELS));

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/calendar/economic");
      if (!res.ok) throw new Error(MARKET_UI_COPY.load.economicCalendar);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Unknown error");
      setData(json.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : MARKET_UI_COPY.load.economicCalendar
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

  const toggleImportance = (level: ImportanceLevel) => {
    setImportanceFilter((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        if (next.size > 1) next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const filteredEvents = useMemo(
    () =>
      data
        ? data.filter((event) => {
            if (countryFilter !== "All") {
              const code = COUNTRY_NAME_TO_CODE[countryFilter] || countryFilter;
              if (event.country !== code) return false;
            }
            if (!importanceFilter.has(event.importance)) return false;
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
    [data, countryFilter, importanceFilter, startDate, endDate]
  );

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, EconomicEvent[]> = {};
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
        data-testid="economic-calendar-loading"
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
        data-testid="economic-calendar-error"
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
      data-testid="economic-calendar"
      role="region"
      aria-label="Economic Calendar"
    >
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className={HOME_PANEL_TITLE}>Economic Calendar</h3>
          <p className={`mt-1 ${DNA_BODY_SECONDARY}`}>
            Macro events ordered by day with country, importance, and release
            values.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-stone-300 bg-stone-100 px-2.5 py-1 text-stone-700 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200">
            {filteredEvents.length} matched
          </span>
          <span className={`rounded-full px-2.5 py-1 ${CALENDAR_CHIP_IDLE}`}>
            {countryFilter === "All" ? "All countries" : countryFilter}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div
        className="mb-4 flex flex-col gap-3 rounded-lg border border-stone-200 bg-stone-100 p-3 sm:flex-row sm:items-center dark:border-stone-700 dark:bg-stone-800"
        data-testid="filters"
      >
        <div className="flex items-center gap-2">
          <label htmlFor="country-filter" className={CALENDAR_FILTER_LABEL}>
            Country:
          </label>
          <select
            id="country-filter"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className={`${CALENDAR_SELECT} px-2 py-1`}
            data-testid="country-filter"
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c === "All"
                  ? "🌍 All"
                  : `${COUNTRY_FLAG[COUNTRY_NAME_TO_CODE[c]] || ""} ${c}`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className={CALENDAR_FILTER_LABEL}>Importance:</span>
          {IMPORTANCE_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => toggleImportance(level)}
              className={`text-xs px-2 py-1 rounded capitalize ${
                importanceFilter.has(level)
                  ? IMPORTANCE_STYLES[level]
                  : CALENDAR_CHIP_IDLE
              }`}
              data-testid={`importance-${level}`}
              aria-pressed={importanceFilter.has(level)}
            >
              {level}
            </button>
          ))}
        </div>

        <CalendarDateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          idPrefix="economic"
        />
      </div>

      {/* Events grouped by day */}
      {filteredEvents.length === 0 ? (
        <p className={CALENDAR_EMPTY_TEXT} data-testid="no-events">
          No events match the selected filters.
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
                    <span className={`ml-2 ${CALENDAR_TODAY_BADGE}`}>
                      Today
                    </span>
                  )}
                  <span className={`ml-2 text-xs font-normal ${DNA_CAPTION}`}>
                    ({events.length} event{events.length !== 1 ? "s" : ""})
                  </span>
                </div>

                {/* Events table for this day */}
                <div className={CALENDAR_EVENT_LIST}>
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className={CALENDAR_EVENT_ROW}
                      data-testid={`event-${event.id}`}
                    >
                      {/* Time */}
                      <span
                        className={`text-xs w-12 shrink-0 pt-0.5 font-mono ${DNA_CAPTION}`}
                      >
                        {event.time || "—"}
                      </span>

                      {/* Flag + Country */}
                      <span
                        className="text-base w-6 shrink-0"
                        aria-hidden="true"
                        title={
                          COUNTRY_CODE_TO_NAME[event.country] || event.country
                        }
                      >
                        {COUNTRY_FLAG[event.country] || "🏳️"}
                      </span>

                      {/* Event details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize shrink-0 ${IMPORTANCE_STYLES[event.importance]}`}
                            data-testid={`badge-${event.id}`}
                          >
                            {event.importance}
                          </span>
                          <span className={CALENDAR_EVENT_TITLE}>
                            {event.name}
                          </span>
                        </div>
                        {event.description &&
                          event.description !== event.name && (
                            <p className={`text-xs mt-0.5 ${DNA_CAPTION}`}>
                              {event.description}
                            </p>
                          )}
                      </div>

                      {/* Values: Prev / Forecast / Actual */}
                      {(event.previous || event.forecast || event.actual) && (
                        <div
                          className={`flex gap-3 text-xs shrink-0 pt-0.5 ${DNA_CAPTION}`}
                        >
                          {event.previous && (
                            <span>Prev: {event.previous}</span>
                          )}
                          {event.forecast && (
                            <span>Fcst: {event.forecast}</span>
                          )}
                          {event.actual && (
                            <span
                              className={`font-medium ${economicActualTextClass(
                                event.actual,
                                event.forecast
                              )}`}
                            >
                              Act: {event.actual}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
