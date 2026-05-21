"use client";

export type ConfidenceTooltipVariant = "prediction" | "stockOfTheDay";

const TOOLTIP_TEXT: Record<ConfidenceTooltipVariant, string> = {
  prediction:
    "Signal strength from 0% to 100% based on how strongly live data supports this buy, sell, or hold call (analyst targets, technical sentiment, and macro bias). Not a probability of profit or a guarantee.",
  stockOfTheDay:
    "Signal strength from 0% to 100% based on how strongly live price, technicals, and analyst data supported this pick versus other AI candidates today. Not a probability of profit or a guarantee.",
};

export function ConfidenceInfoTooltip({
  variant,
  className = "h-3.5 w-3.5",
  placement = "below",
}: {
  variant: ConfidenceTooltipVariant;
  className?: string;
  /** Below avoids clipping when the trigger sits near the top of an overflow-hidden card. */
  placement?: "above" | "below";
}) {
  const tooltipPosition =
    placement === "above"
      ? "bottom-full left-1/2 mb-2 -translate-x-1/2"
      : "top-full right-0 mt-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2";

  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <button
        type="button"
        className="cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full"
        aria-label="What does confidence mean?"
      >
        <svg
          className={`${className} text-gray-400 dark:text-gray-500`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
          />
        </svg>
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-50 w-64 max-w-[min(16rem,calc(100vw-2rem))] rounded bg-gray-900 px-3 py-2 text-left text-xs font-normal normal-case leading-snug text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-gray-700 ${tooltipPosition}`}
      >
        {TOOLTIP_TEXT[variant]}
      </span>
    </span>
  );
}
