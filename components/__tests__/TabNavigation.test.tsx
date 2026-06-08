/**
 * Unit tests for TabNavigation component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TabNavigation } from "../TabNavigation";

// Mock theme context
vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

describe("TabNavigation", () => {
  it("should render all tabs", () => {
    const onTabChange = vi.fn();
    render(<TabNavigation activeTab="overview" onTabChange={onTabChange} />);

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Financials")).toBeInTheDocument();
    expect(screen.getByText("Technicals")).toBeInTheDocument();
    expect(screen.getByText("Forecasts")).toBeInTheDocument();
    expect(screen.getByText("Seasonals")).toBeInTheDocument();
  });

  it("should highlight active tab", () => {
    const onTabChange = vi.fn();
    render(<TabNavigation activeTab="overview" onTabChange={onTabChange} />);

    const overviewTab = screen.getByText("Overview");
    expect(overviewTab).toHaveClass("bg-stone-900");
    expect(overviewTab).toHaveClass("text-stone-50");
  });

  it("should call onTabChange when tab is clicked", () => {
    const onTabChange = vi.fn();
    render(<TabNavigation activeTab="overview" onTabChange={onTabChange} />);

    const financialsTab = screen.getByText("Financials");
    fireEvent.click(financialsTab);

    expect(onTabChange).toHaveBeenCalledWith("financials");
  });

  it("should change active tab styling when different tab is active", () => {
    const onTabChange = vi.fn();
    render(<TabNavigation activeTab="technicals" onTabChange={onTabChange} />);

    const technicalsTab = screen.getByText("Technicals");
    expect(technicalsTab).toHaveClass("bg-stone-900");
    expect(technicalsTab).toHaveClass("text-stone-50");

    const overviewTab = screen.getByText("Overview");
    expect(overviewTab).toHaveClass("text-stone-700");
    expect(overviewTab).not.toHaveClass("bg-stone-900");
  });

  it("should set aria-selected on active tab", () => {
    const onTabChange = vi.fn();
    render(<TabNavigation activeTab="forecasts" onTabChange={onTabChange} />);

    const forecastsTab = screen.getByText("Forecasts");
    expect(forecastsTab).toHaveAttribute("aria-selected", "true");
    expect(forecastsTab).toHaveAttribute("role", "tab");
  });

  it("should not set aria-selected=true on inactive tabs", () => {
    const onTabChange = vi.fn();
    render(<TabNavigation activeTab="overview" onTabChange={onTabChange} />);

    const financialsTab = screen.getByText("Financials");
    expect(financialsTab).toHaveAttribute("aria-selected", "false");
  });
});
