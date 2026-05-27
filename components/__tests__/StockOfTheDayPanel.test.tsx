import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StockOfTheDayPanel } from "../StockOfTheDayPanel";

describe("StockOfTheDayPanel locked state", () => {
  it("renders a readable gate when locked without data (home free tier)", () => {
    render(
      <StockOfTheDayPanel
        item={null}
        loading={false}
        locked
        embedded
        showTitle={false}
        pricingTier="FREE"
      />
    );

    expect(
      screen.getByText(/Your current plan does not include AI/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /View AI plans/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Daily AI stock ideas")).toBeInTheDocument();
  });
});
