import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Navigation } from "@/components/Navigation";

const mockPush = vi.fn();
let mockPathname = "/";
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

// Mock child components to keep tests focused
vi.mock("@/components/SearchBar", () => ({
  SearchBar: ({
    onSelect,
    placeholder,
  }: {
    onSelect?: (s: string) => void;
    placeholder?: string;
  }) => (
    <input
      data-testid="search-bar"
      placeholder={placeholder}
      onChange={(e) => onSelect?.(e.target.value)}
    />
  ),
}));

vi.mock("@/components/ThemeToggle", () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme</button>,
}));

describe("Navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/";
    mockSearchParams = new URLSearchParams();
  });

  it("renders all nav links", () => {
    render(<Navigation />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByRole("link", { name: "Sectors" })).toHaveAttribute(
      "href",
      "/sectors"
    );
    expect(screen.getByRole("link", { name: "Calendars" })).toHaveAttribute(
      "href",
      "/calendars"
    );
    expect(screen.getByRole("link", { name: "Heatmaps" })).toHaveAttribute(
      "href",
      "/heatmaps"
    );
    expect(screen.getByRole("link", { name: "Screener" })).toHaveAttribute(
      "href",
      "/screener"
    );
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute(
      "href",
      "/pricing"
    );
  });

  it("highlights the active section from pathname", () => {
    mockPathname = "/sectors";
    render(<Navigation />);
    const sectorsLink = screen.getByRole("link", { name: "Sectors" });
    expect(sectorsLink).toHaveAttribute("aria-current", "page");
  });

  it("calls router.push when a symbol is selected from search", () => {
    mockPathname = "/sectors";
    render(<Navigation />);
    const search = screen.getAllByTestId("search-bar")[0];
    fireEvent.change(search, { target: { value: "AAPL" } });

    expect(mockPush).toHaveBeenCalledWith("/?symbol=AAPL");
  });

  it("renders desktop search bar outside home dashboard", () => {
    mockPathname = "/sectors";
    render(<Navigation />);
    expect(screen.getAllByTestId("search-bar").length).toBeGreaterThan(0);
  });

  it("renders theme toggle", () => {
    render(<Navigation />);
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
  });

  it("toggles mobile menu", async () => {
    const user = userEvent.setup();
    render(<Navigation />);

    const menuButton = screen.getByLabelText("Toggle navigation menu");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
  });

  it("has proper navigation landmark", () => {
    render(<Navigation />);
    expect(screen.getByRole("navigation")).toHaveAttribute(
      "aria-label",
      "Main navigation"
    );
  });
});
