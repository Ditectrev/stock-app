import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeHub } from "../HomeHub";

vi.mock("@/components/SearchBar", () => ({
  SearchBar: ({
    placeholder,
    onSelect,
  }: {
    placeholder?: string;
    onSelect?: (symbol: string) => void;
  }) => (
    <input
      data-testid="home-search"
      placeholder={placeholder}
      onChange={() => onSelect?.("AAPL")}
    />
  ),
}));

describe("HomeHub", () => {
  it("renders hero, explore links, and section labels", () => {
    render(
      <HomeHub
        onSymbolSelect={vi.fn()}
        fearGreed={<div data-testid="fear-greed" />}
        worldMarkets={<div data-testid="world-markets-slot" />}
        stockOfTheDay={<div data-testid="stock-of-day-slot" />}
      />
    );

    expect(document.getElementById("section-home")).toBeInTheDocument();
    expect(screen.getByText(/Market dashboard/i)).toBeInTheDocument();
    expect(screen.getByText("Explore")).toBeInTheDocument();
    expect(screen.getByText("Market pulse")).toBeInTheDocument();
    expect(screen.getByText("AI outlook")).toBeInTheDocument();
    expect(screen.getByText("Compare sector performance")).toBeInTheDocument();
    expect(screen.getByText("Visual market overview")).toBeInTheDocument();
    expect(screen.getByTestId("fear-greed")).toBeInTheDocument();
    expect(screen.getByTestId("world-markets-slot")).toBeInTheDocument();
    expect(screen.getByTestId("stock-of-day-slot")).toBeInTheDocument();
  });
});
