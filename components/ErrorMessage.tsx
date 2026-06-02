"use client";

/**
 * ErrorMessage Component
 * Product gate archetype for api, not-found, network, and generic errors.
 *
 * Requirements: 14.2, 14.3, 14.4
 */

import { ProductGate } from "@/components/ProductShell";

export type ErrorType = "api" | "not-found" | "network" | "generic";

export interface ErrorMessageProps {
  type?: ErrorType;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

interface ErrorConfig {
  eyebrow: string;
  title: string;
  description: string;
}

const ERROR_CONFIGS: Record<ErrorType, ErrorConfig> = {
  api: {
    eyebrow: "Request",
    title: "Something went wrong",
    description: "We couldn't complete your request. Try again in a moment.",
  },
  "not-found": {
    eyebrow: "Symbol",
    title: "Symbol not found",
    description:
      "The symbol you searched for could not be found. Check the ticker and try again.",
  },
  network: {
    eyebrow: "Connection",
    title: "Connection error",
    description:
      "Unable to reach the server. Check your connection and try again.",
  },
  generic: {
    eyebrow: "Error",
    title: "An error occurred",
    description: "Something unexpected happened. Try again.",
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
    <ProductGate
      eyebrow={config.eyebrow}
      title={config.title}
      message={message ?? config.description}
      onRetry={onRetry}
      testId="error-message"
      className={className}
    />
  );
}
