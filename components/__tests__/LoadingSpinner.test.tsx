/**
 * LoadingSpinner Component Tests
 * Tests for rendering, size variants, message display, and accessibility.
 *
 * Requirements: 14.1
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "../LoadingSpinner";

describe("LoadingSpinner", () => {
  it("should render with default props", () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toBeDefined();
    expect(spinner.getAttribute("role")).toBe("status");
  });

  it("should have accessible label defaulting to 'Loading'", () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner.getAttribute("aria-label")).toBe("Loading");
    expect(screen.getByText("Loading")).toBeDefined(); // sr-only text
  });

  it("should display a custom message for screen readers only by default", () => {
    render(<LoadingSpinner message="Fetching data..." />);
    expect(screen.getAllByText("Fetching data...")).toHaveLength(1);
    expect(screen.queryByRole("paragraph")).toBeNull();
    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner.getAttribute("aria-label")).toBe("Fetching data...");
  });

  it("should show visible message when showMessage is true", () => {
    render(<LoadingSpinner message="Fetching data..." showMessage />);
    expect(screen.getAllByText("Fetching data...")).toHaveLength(2);
  });

  it("should render small size variant", () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    const arcSpinner = container.querySelector(".loading-spinner");
    expect(arcSpinner?.classList.contains("loading-spinner--sm")).toBe(true);
    expect(container.querySelectorAll(".loading-spinner__arc")).toHaveLength(3);
  });

  it("should render medium size variant (default)", () => {
    const { container } = render(<LoadingSpinner />);
    const arcSpinner = container.querySelector(".loading-spinner");
    expect(arcSpinner?.classList.contains("loading-spinner--md")).toBe(true);
  });

  it("should render large size variant", () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const arcSpinner = container.querySelector(".loading-spinner");
    expect(arcSpinner?.classList.contains("loading-spinner--lg")).toBe(true);
  });

  it("should apply additional className", () => {
    render(<LoadingSpinner className="py-8" />);
    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner.classList.contains("py-8")).toBe(true);
  });

  it("should include sr-only text for screen readers", () => {
    render(<LoadingSpinner message="Loading chart" showMessage />);
    const srOnly = screen.getByText("Loading chart", {
      selector: ".sr-only",
    });
    expect(srOnly).toBeDefined();
  });

  it("should not render message paragraph when no message provided", () => {
    const { container } = render(<LoadingSpinner />);
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs.length).toBe(0);
  });
});
