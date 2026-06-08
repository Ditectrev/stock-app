/**
 * ErrorMessage Component Tests
 * Tests for rendering, error types, custom messages, retry, and accessibility.
 *
 * Requirements: 14.2, 14.3, 14.4
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorMessage } from "../ErrorMessage";

describe("ErrorMessage", () => {
  it("should render with default generic error type", () => {
    render(<ErrorMessage />);
    const el = screen.getByTestId("error-message");
    expect(el).toBeDefined();
    expect(el.getAttribute("role")).toBe("alert");
    expect(el.getAttribute("aria-live")).toBe("assertive");
    expect(screen.getByText("An error occurred")).toBeDefined();
  });

  it("should display API error content for type='api'", () => {
    render(<ErrorMessage type="api" />);
    expect(screen.getByText("Something went wrong")).toBeDefined();
    expect(
      screen.getByText(
        "We couldn't complete your request. Try again in a moment."
      )
    ).toBeDefined();
  });

  it("should display 'Symbol not found' for type='not-found'", () => {
    render(<ErrorMessage type="not-found" />);
    expect(screen.getByText("Symbol not found")).toBeDefined();
    expect(
      screen.getByText(
        "The symbol you searched for could not be found. Check the ticker and try again."
      )
    ).toBeDefined();
  });

  it("should display connectivity error for type='network'", () => {
    render(<ErrorMessage type="network" />);
    expect(screen.getByText("Connection error")).toBeDefined();
    expect(
      screen.getByText(
        "Unable to reach the server. Check your connection and try again."
      )
    ).toBeDefined();
  });

  it("should override default description with custom message", () => {
    render(<ErrorMessage type="api" message="Custom error detail" />);
    expect(screen.getByText("Something went wrong")).toBeDefined();
    expect(screen.getByText("Custom error detail")).toBeDefined();
    expect(
      screen.queryByText(
        "We couldn't complete your request. Try again in a moment."
      )
    ).toBeNull();
  });

  it("should render retry button when onRetry is provided", () => {
    const onRetry = vi.fn();
    render(<ErrorMessage onRetry={onRetry} />);
    const button = screen.getByRole("button", { name: "Try again" });
    expect(button).toBeDefined();
  });

  it("should call onRetry when retry button is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorMessage onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("should not render retry button when onRetry is not provided", () => {
    render(<ErrorMessage />);
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("should apply additional className", () => {
    render(<ErrorMessage className="mt-8" />);
    const el = screen.getByTestId("error-message");
    expect(el.classList.contains("mt-8")).toBe(true);
  });

  it("should display eyebrow labels for each error type", () => {
    const { rerender } = render(<ErrorMessage type="api" />);
    expect(screen.getByText("Request")).toBeDefined();

    rerender(<ErrorMessage type="not-found" />);
    expect(screen.getByText("Symbol")).toBeDefined();

    rerender(<ErrorMessage type="network" />);
    expect(screen.getByText("Connection")).toBeDefined();

    rerender(<ErrorMessage type="generic" />);
    expect(screen.getByText("Error")).toBeDefined();
  });
});
