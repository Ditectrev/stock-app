"use client";

import { DNA_BODY } from "@/lib/design-dna";

/**
 * LoadingSpinner Component
 * Reusable loading indicator with configurable size and optional message.
 * Supports dark mode via Tailwind CSS classes.
 *
 * Requirements: 14.1
 */

export interface LoadingSpinnerProps {
  /** Spinner size: "sm" (20px), "md" (32px), or "lg" (48px). Defaults to "md". */
  size?: "sm" | "md" | "lg";
  /** Optional message displayed below the spinner */
  message?: string;
  /** Additional CSS class names */
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<LoadingSpinnerProps["size"]>, string> = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-[3px]",
};

export function LoadingSpinner({
  size = "md",
  message,
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message ?? "Loading"}
      data-testid="loading-spinner"
    >
      <div
        className={`animate-spin rounded-full border-stone-700 border-b-transparent dark:border-stone-300 ${SIZE_CLASSES[size]}`}
      />
      {message && (
        <p className={`mt-3 ${DNA_BODY}`}>
          {message}
        </p>
      )}
      <span className="sr-only">{message ?? "Loading"}</span>
    </div>
  );
}
