"use client";

/**
 * CalendarHub Component
 * Wraps CalendarNavigation with the active calendar panel.
 *
 * Requirements: 24.2
 */

import { DNA_EYEBROW, DNA_SUBHEADING } from "@/lib/design-dna";
import { useState } from "react";
import {
  CalendarNavigation,
  CalendarType,
} from "@/components/CalendarNavigation";
import { EconomicCalendar } from "@/components/EconomicCalendar";
import { EarningsCalendar } from "@/components/EarningsCalendar";
import { DividendCalendar } from "@/components/DividendCalendar";
import { IPOCalendar } from "@/components/IPOCalendar";
import { HOME_INSTRUMENT_PANEL } from "@/lib/home-ui";

export interface CalendarHubProps {
  defaultCalendar?: CalendarType;
  onSymbolClick?: (symbol: string) => void;
}

export function CalendarHub({
  defaultCalendar = "economic",
  onSymbolClick,
}: CalendarHubProps) {
  const [activeCalendar, setActiveCalendar] =
    useState<CalendarType>(defaultCalendar);

  return (
    <div className={HOME_INSTRUMENT_PANEL} data-testid="calendar-hub">
      <header className="mb-4 sm:mb-6" data-testid="calendar-hub-header">
        <p className={DNA_EYEBROW}>Events</p>
        <h2 className={`mt-1 ${DNA_SUBHEADING}`}>Calendars</h2>
      </header>
      <CalendarNavigation
        activeCalendar={activeCalendar}
        onCalendarChange={setActiveCalendar}
      />
      <div className="mt-4" id={`calendar-panel-${activeCalendar}`}>
        {activeCalendar === "economic" && <EconomicCalendar />}
        {activeCalendar === "earnings" && (
          <EarningsCalendar onSymbolClick={onSymbolClick} />
        )}
        {activeCalendar === "dividends" && (
          <DividendCalendar onSymbolClick={onSymbolClick} />
        )}
        {activeCalendar === "ipos" && (
          <IPOCalendar onSymbolClick={onSymbolClick} />
        )}
      </div>
    </div>
  );
}
