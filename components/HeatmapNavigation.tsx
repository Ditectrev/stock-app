"use client";

/**
 * HeatmapNavigation Component
 * Segmented navigation for heatmap types.
 *
 * Requirements: 25.2, 18.2
 */

import { useRef, useCallback } from "react";
import { useTheme } from "@/lib/theme-context";
import { HOME_SEGMENTED_NAV, homeSegmentedTabClasses } from "@/lib/home-ui";

export type HeatmapType = "etf" | "crypto" | "stock";

export interface HeatmapNavigationProps {
  activeHeatmap: HeatmapType;
  onHeatmapChange: (heatmap: HeatmapType) => void;
}

const HEATMAP_TABS: { key: HeatmapType; label: string; icon: string }[] = [
  { key: "etf", label: "ETFs", icon: "📈" },
  { key: "crypto", label: "Crypto", icon: "🪙" },
  { key: "stock", label: "Stocks", icon: "🏢" },
];

export function HeatmapNavigation({
  activeHeatmap,
  onHeatmapChange,
}: HeatmapNavigationProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      let nextIndex: number | null = null;

      switch (e.key) {
        case "ArrowRight":
          nextIndex = (index + 1) % HEATMAP_TABS.length;
          break;
        case "ArrowLeft":
          nextIndex = (index - 1 + HEATMAP_TABS.length) % HEATMAP_TABS.length;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = HEATMAP_TABS.length - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      onHeatmapChange(HEATMAP_TABS[nextIndex].key);
      tabRefs.current[nextIndex]?.focus();
    },
    [onHeatmapChange]
  );

  return (
    <nav
      className={HOME_SEGMENTED_NAV}
      role="tablist"
      aria-label="Heatmap type navigation"
      data-testid="heatmap-navigation"
    >
      {HEATMAP_TABS.map(({ key, label, icon }, index) => {
        const isActive = activeHeatmap === key;
        return (
          <button
            key={key}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onHeatmapChange(key)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`flex items-center gap-1.5 ${homeSegmentedTabClasses(isActive, isDark)}`}
            data-testid={`heatmap-tab-${key}`}
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </button>
        );
      })}
    </nav>
  );
}
