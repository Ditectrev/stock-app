"use client";

/**
 * ErrorMessage Component
 * Reusable error display with support for different error types:
 * api, not-found, network, and generic.
 * Each type has a default icon, title, and description.
 * Supports an optional retry callback and custom message override.
 *
 * Requirements: 14.2, 14.3, 14.4
 */

export type ErrorType = "api" | "not-found" | "network" | "generic";

export interface ErrorMessageProps {
  /** The category of error to display */
  type?: ErrorType;
  /** Optional custom message that overrides the default description */
  message?: string;
  /** Optional callback invoked when the user clicks the retry button */
  onRetry?: () => void;
  /** Additional CSS class names */
  className?: string;
}

interface ErrorConfig {
  icon: string;
  title: string;
  description: string;
}

const ERROR_CONFIGS: Record<ErrorType, ErrorConfig> = {
  api: {
    icon: "⚠️",
    title: "Something went wrong",
    description: "We couldn't complete your request. Please try again later.",
  },
  "not-found": {
    icon: "🔍",
    title: "Symbol not found",
    description:
      "The symbol you searched for could not be found. Please check the ticker and try again.",
  },
  network: {
    icon: "🌐",
    title: "Connection error",
    description:
      "Unable to connect to the server. Please check your internet connection and try again.",
  },
  generic: {
    icon: "❗",
    title: "An error occurred",
    description: "Something unexpected happened. Please try again.",
  },
};

export function ErrorMessage({
  type = "generic",
  message,
  onRetry,
  className = "",
}: ErrorMessageProps) {
  const config = ERROR_CONFIGS[type];

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950 ${className}`}
      role="alert"
      aria-live="assertive"
      data-testid="error-message"
    >
      <span className="text-3xl" aria-hidden="true">
        {config.icon}
      </span>
      <h3 className="mt-3 text-lg font-semibold text-stone-900 dark:text-stone-50">
        {config.title}
      </h3>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
        {message ?? config.description}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-600"
        >
          Try again
        </button>
      )}
    </div>
  );
}
