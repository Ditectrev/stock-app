"use client";

/**
 * TabNavigation Component
 * Navigation tabs for symbol detail page sections
 * Supports keyboard navigation per WAI-ARIA tab pattern:
 * Arrow Left/Right to move between tabs, Home/End for first/last tab.
 *
 * Requirements: 2.4, 18.2
 */

import { useRef, useCallback } from "react";
import { useTheme } from "@/lib/theme-context";

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
      <div>
        <nav
          className={`flex overflow-x-auto rounded-xl border p-1 scrollbar-hide ${
            isDark
              ? "border-stone-700 bg-stone-800/60"
              : "border-stone-200/90 bg-white/90"
          }`}
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
                className={`
                  min-h-[44px] whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-1
                  ${
                    isActive
                      ? `${
                          isDark
                            ? "bg-stone-100 text-stone-900"
                            : "bg-stone-900 text-stone-100"
                        }`
                      : `${
                          isDark
                            ? "text-stone-300 hover:bg-stone-700 hover:text-stone-100"
                            : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                        }`
                  }
                `}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
