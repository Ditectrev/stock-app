"use client";

/**
 * TabNavigation Component
 * Navigation tabs for symbol detail page sections
 *
 * Requirements: 2.4, 18.2
 */

import { useRef, useCallback } from "react";
import { useTheme } from "@/lib/theme-context";
import { HOME_SEGMENTED_NAV, homeSegmentedTabClasses } from "@/lib/home-ui";

type TabType =
  | "overview"
  | "financials"
  | "technicals"
  | "forecasts"
  | "seasonals";

export interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TABS: { id: TabType; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "financials", label: "Financials" },
  { id: "technicals", label: "Technicals" },
  { id: "forecasts", label: "Forecasts" },
  { id: "seasonals", label: "Seasonals" },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      let nextIndex: number | null = null;

      switch (e.key) {
        case "ArrowRight":
          nextIndex = (index + 1) % TABS.length;
          break;
        case "ArrowLeft":
          nextIndex = (index - 1 + TABS.length) % TABS.length;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = TABS.length - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      onTabChange(TABS[nextIndex].id);
      tabRefs.current[nextIndex]?.focus();
    },
    [onTabChange]
  );

  return (
    <div className="mt-6">
      <nav
        className={HOME_SEGMENTED_NAV}
        role="tablist"
        aria-label="Symbol detail tabs"
      >
        {TABS.map((tab, index) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              className={homeSegmentedTabClasses(isActive, isDark)}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
