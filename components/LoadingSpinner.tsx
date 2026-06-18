"use client";

import { DNA_BODY } from "@/lib/design-dna";

/**
 * LoadingSpinner Component
 * 3D arc spinner with theme-aware accent color via `--spinner-accent`.
 *
 * Requirements: 14.1
 */

export interface LoadingSpinnerProps {
  /** Spinner size: "sm" (32px), "md" (48px), or "lg" (64px). Defaults to "md". */
  size?: "sm" | "md" | "lg";
  /** Accessible label (screen readers only unless `showMessage` is true). */
  message?: string;
  /** Show the message visibly below the spinner. Defaults to false. */
  showMessage?: boolean;
  /** Additional CSS class names */
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<LoadingSpinnerProps["size"]>, string> = {
  sm: "loading-spinner--sm",
  md: "loading-spinner--md",
  lg: "loading-spinner--lg",
};

export function LoadingSpinner({
  size = "md",
  message,
  showMessage = false,
  className = "",
}: LoadingSpinnerProps) {
  const label = message ?? "Loading";

  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
      data-testid="loading-spinner"
    >
      <div className={`loading-spinner ${SIZE_CLASSES[size]}`} aria-hidden>
        <div className="loading-spinner__arc" />
        <div className="loading-spinner__arc" />
        <div className="loading-spinner__arc" />
      </div>
      {showMessage && message && (
        <p className={`mt-3 ${DNA_BODY}`}>{message}</p>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
}
