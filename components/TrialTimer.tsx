"use client";

/**
 * TrialTimer Component
 * Displays a countdown timer for the trial session.
 * Updates at least once per second. Shows auth prompt when expired.
 * Requirements: 21.9, 21.10, 21.12
 */

import { useState, useEffect, useCallback, useRef } from "react";

export interface TrialTimerProps {
  /** Remaining seconds when the component mounts */
  remainingSeconds: number;
  /** Called when the timer reaches zero */
  onExpired: () => void;
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function TrialTimer({ remainingSeconds, onExpired }: TrialTimerProps) {
  const [seconds, setSeconds] = useState(Math.max(0, remainingSeconds));
  const expiredRef = useRef(false);

  const handleExpiry = useCallback(() => {
    if (expiredRef.current) return;
    expiredRef.current = true;
    onExpired();
  }, [onExpired]);

  useEffect(() => {
    const initial = Math.max(0, remainingSeconds);
    setSeconds(initial);
    if (initial > 0) {
      expiredRef.current = false;
    }
  }, [remainingSeconds]);

  useEffect(() => {
    if (seconds <= 0) return;

    const interval = setInterval(() => {
      setSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds, seconds > 0]);

  useEffect(() => {
    if (seconds <= 0) {
      handleExpiry();
    }
  }, [seconds, handleExpiry]);

  const isLow = seconds <= 60;

  return (
    <div
      className="flex items-center gap-1.5 text-sm"
      role="timer"
      aria-live="polite"
      aria-label={`Trial time remaining: ${formatTime(seconds)}`}
      data-testid="trial-timer"
    >
      <ClockIcon
        className={isLow ? "text-red-500" : "text-gray-500 dark:text-gray-400"}
      />
      <span
        className={
          isLow
            ? "font-mono font-semibold text-red-500"
            : "font-mono text-gray-700 dark:text-gray-300"
        }
        data-testid="trial-timer-display"
      >
        {formatTime(seconds)}
      </span>
    </div>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
