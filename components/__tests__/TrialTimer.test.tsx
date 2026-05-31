/**
 * TrialTimer Component Tests
 * Tests for countdown display, expiration callback, and formatting.
 * Requirements: 21.9, 21.12
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { TrialTimer, TrialTimerProps } from "../TrialTimer";

function renderTimer(overrides: Partial<TrialTimerProps> = {}) {
  const props: TrialTimerProps = {
    remainingSeconds: 900,
    onExpired: vi.fn(),
    ...overrides,
  };
  return { ...render(<TrialTimer {...props} />), props };
}

describe("TrialTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- Display formatting ---

  it("should display time in mm:ss format", () => {
    renderTimer({ remainingSeconds: 900 });
    expect(screen.getByTestId("trial-timer-display").textContent).toBe("15:00");
  });

  it("should pad seconds with leading zero", () => {
    renderTimer({ remainingSeconds: 65 });
    expect(screen.getByTestId("trial-timer-display").textContent).toBe("1:05");
  });

  it("should display 0:00 when remaining is zero", () => {
    renderTimer({ remainingSeconds: 0 });
    expect(screen.getByTestId("trial-timer-display").textContent).toBe("0:00");
  });

  it("should clamp negative values to 0:00", () => {
    renderTimer({ remainingSeconds: -10 });
    expect(screen.getByTestId("trial-timer-display").textContent).toBe("0:00");
  });

  // --- Countdown ---

  it("should decrement every second (Req 21.9)", () => {
    renderTimer({ remainingSeconds: 5 });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("trial-timer-display").textContent).toBe("0:04");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("trial-timer-display").textContent).toBe("0:03");
  });

  it("should count down from a larger value correctly", () => {
    renderTimer({ remainingSeconds: 120 });

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByTestId("trial-timer-display").textContent).toBe("1:57");
  });

  // --- Expiration callback (Req 21.12) ---

  it("should call onExpired when timer reaches zero", () => {
    const onExpired = vi.fn();
    renderTimer({ remainingSeconds: 2, onExpired });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onExpired).toHaveBeenCalled();
    expect(screen.getByTestId("trial-timer-display").textContent).toBe("0:00");
  });

  it("should call onExpired immediately when initialized with 0", () => {
    const onExpired = vi.fn();
    renderTimer({ remainingSeconds: 0, onExpired });

    expect(onExpired).toHaveBeenCalled();
  });

  it("should not call onExpired while time remains", () => {
    const onExpired = vi.fn();
    renderTimer({ remainingSeconds: 10, onExpired });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onExpired).not.toHaveBeenCalled();
  });

  it("should stop counting after reaching zero", () => {
    const onExpired = vi.fn();
    renderTimer({ remainingSeconds: 1, onExpired });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId("trial-timer-display").textContent).toBe("0:00");
    // onExpired called once when countdown reaches 0
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  // --- Low time styling ---

  it("should apply low-time styling when <= 60 seconds", () => {
    renderTimer({ remainingSeconds: 60 });
    const display = screen.getByTestId("trial-timer-display");
    expect(display.className).toContain("text-red-500");
  });

  it("should not apply low-time styling when > 60 seconds", () => {
    renderTimer({ remainingSeconds: 61 });
    const display = screen.getByTestId("trial-timer-display");
    expect(display.className).not.toContain("text-red-500");
  });

  it("should transition to low-time styling as countdown progresses", () => {
    renderTimer({ remainingSeconds: 62 });

    const display = screen.getByTestId("trial-timer-display");
    expect(display.className).not.toContain("text-red-500");

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(display.className).toContain("text-red-500");
  });

  // --- Accessibility ---

  it("should have role=timer for assistive technologies", () => {
    renderTimer();
    const timer = screen.getByTestId("trial-timer");
    expect(timer.getAttribute("role")).toBe("timer");
  });

  it("should have aria-live=polite for screen reader announcements", () => {
    renderTimer();
    const timer = screen.getByTestId("trial-timer");
    expect(timer.getAttribute("aria-live")).toBe("polite");
  });

  it("should include remaining time in aria-label", () => {
    renderTimer({ remainingSeconds: 300 });
    const timer = screen.getByTestId("trial-timer");
    expect(timer.getAttribute("aria-label")).toContain("5:00");
  });

  // --- Prop updates ---

  it("should reset when remainingSeconds prop changes", () => {
    const { rerender } = render(
      <TrialTimer remainingSeconds={100} onExpired={vi.fn()} />
    );
    expect(screen.getByTestId("trial-timer-display").textContent).toBe("1:40");

    rerender(<TrialTimer remainingSeconds={200} onExpired={vi.fn()} />);
    expect(screen.getByTestId("trial-timer-display").textContent).toBe("3:20");
  });
});
