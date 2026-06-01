/**
 * SearchBar Component Tests
 * Tests for symbol search functionality, autocomplete, and keyboard navigation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SearchBar } from "../SearchBar";

// Mock fetch
global.fetch = vi.fn();

describe("SearchBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render search input with placeholder", () => {
    render(<SearchBar placeholder="Search stocks..." />);

    const input = screen.getByPlaceholderText("Search stocks...");
    expect(input).toBeDefined();
  });

  it("should display loading spinner while searching", async () => {
    vi.mocked(global.fetch).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ success: true, data: [] }),
              }),
            100
          )
        )
    );

    render(<SearchBar />);
    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "AAPL" } });

    // Wait for debounce
    await waitFor(
      () => {
        const spinner = document.querySelector(".animate-spin");
        expect(spinner).toBeDefined();
      },
      { timeout: 400 }
    );
  });

  it("should debounce search requests", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    render(<SearchBar />);
    const input = screen.getByRole("combobox");

    // Type multiple characters quickly
    fireEvent.change(input, { target: { value: "A" } });
    fireEvent.change(input, { target: { value: "AA" } });
    fireEvent.change(input, { target: { value: "AAP" } });
    fireEvent.change(input, { target: { value: "AAPL" } });

    // Wait for debounce period
    await waitFor(
      () => {
        // Should only call fetch once after debounce
        expect(global.fetch).toHaveBeenCalledTimes(1);
      },
      { timeout: 500 }
    );
  });

  it("should display autocomplete results", async () => {
    const mockResults = [
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        type: "EQUITY",
        exchange: "NASDAQ",
      },
      {
        symbol: "AAPLW",
        name: "Apple Inc. Warrants",
        type: "EQUITY",
        exchange: "NASDAQ",
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockResults }),
    });

    render(<SearchBar />);
    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "AAPL" } });

    await waitFor(
      () => {
        expect(screen.getByText("Apple Inc.")).toBeDefined();
        expect(screen.getByText("AAPL")).toBeDefined();
      },
      { timeout: 500 }
    );
  });

  it("should navigate to symbol page on selection", async () => {
    const mockOnSelect = vi.fn();
    const mockResults = [
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        type: "EQUITY",
        exchange: "NASDAQ",
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockResults }),
    });

    render(<SearchBar onSelect={mockOnSelect} />);
    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "AAPL" } });

    await waitFor(
      () => {
        expect(screen.getByText("Apple Inc.")).toBeDefined();
      },
      { timeout: 500 }
    );

    const resultItem = screen.getByText("Apple Inc.").closest("li");
    if (resultItem) {
      fireEvent.click(resultItem);
    }

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith("AAPL");
    });
  });

  it("should call onSelect callback when provided", async () => {
    const mockOnSelect = vi.fn();
    const mockResults = [
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        type: "EQUITY",
        exchange: "NASDAQ",
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockResults }),
    });

    render(<SearchBar onSelect={mockOnSelect} />);
    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "AAPL" } });

    await waitFor(
      () => {
        expect(screen.getByText("Apple Inc.")).toBeDefined();
      },
      { timeout: 500 }
    );

    const resultItem = screen.getByText("Apple Inc.").closest("li");
    if (resultItem) {
      fireEvent.click(resultItem);
    }

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith("AAPL");
    });
  });

  it("should support keyboard navigation with arrow keys", async () => {
    const mockResults = [
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        type: "EQUITY",
        exchange: "NASDAQ",
      },
      {
        symbol: "AAPLW",
        name: "Apple Inc. Warrants",
        type: "EQUITY",
        exchange: "NASDAQ",
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockResults }),
    });

    render(<SearchBar />);
    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "AAPL" } });

    await waitFor(
      () => {
        expect(screen.getByText("Apple Inc.")).toBeDefined();
      },
      { timeout: 500 }
    );

    // Press arrow down
    fireEvent.keyDown(input, { key: "ArrowDown" });

    await waitFor(() => {
      const firstItem = screen.getByText("Apple Inc.").closest("li");
      expect(firstItem?.getAttribute("aria-selected")).toBe("true");
    });

    // Press arrow down again
    fireEvent.keyDown(input, { key: "ArrowDown" });

    await waitFor(() => {
      const secondItem = screen.getByText("Apple Inc. Warrants").closest("li");
      expect(secondItem?.getAttribute("aria-selected")).toBe("true");
    });

    // Press arrow up
    fireEvent.keyDown(input, { key: "ArrowUp" });

    await waitFor(() => {
      const firstItem = screen.getByText("Apple Inc.").closest("li");
      expect(firstItem?.getAttribute("aria-selected")).toBe("true");
    });
  });

  it("should select item on Enter key", async () => {
    const mockOnSelect = vi.fn();
    const mockResults = [
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        type: "EQUITY",
        exchange: "NASDAQ",
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockResults }),
    });

    render(<SearchBar onSelect={mockOnSelect} />);
    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "AAPL" } });

    await waitFor(
      () => {
        expect(screen.getByText("Apple Inc.")).toBeDefined();
      },
      { timeout: 500 }
    );

    // Press arrow down to select first item
    fireEvent.keyDown(input, { key: "ArrowDown" });

    // Press Enter
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith("AAPL");
    });
  });

  it("should close dropdown on Escape key", async () => {
    const mockResults = [
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        type: "EQUITY",
        exchange: "NASDAQ",
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockResults }),
    });

    render(<SearchBar />);
    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "AAPL" } });

    await waitFor(
      () => {
        expect(screen.getByText("Apple Inc.")).toBeDefined();
      },
      { timeout: 500 }
    );

    // Press Escape
    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => {
      const dropdown = screen.queryByRole("listbox");
      expect(dropdown).toBeNull();
    });
  });

  it("should display error message on API failure", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: "API error" }),
    });

    render(<SearchBar />);
    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "AAPL" } });

    await waitFor(
      () => {
        expect(screen.getByText("Failed to search symbols")).toBeDefined();
      },
      { timeout: 500 }
    );
  });

  it("should display 'No results found' when search returns empty", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    render(<SearchBar />);
    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "INVALIDXYZ" } });

    await waitFor(
      () => {
        expect(screen.getByText("No results found")).toBeDefined();
      },
      { timeout: 500 }
    );
  });

  it("should close dropdown when clicking outside", async () => {
    const mockResults = [
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        type: "EQUITY",
        exchange: "NASDAQ",
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockResults }),
    });

    render(
      <div>
        <SearchBar />
        <div data-testid="outside">Outside element</div>
      </div>
    );

    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "AAPL" } });

    await waitFor(
      () => {
        expect(screen.getByText("Apple Inc.")).toBeDefined();
      },
      { timeout: 500 }
    );

    // Click outside
    const outsideElement = screen.getByTestId("outside");
    fireEvent.mouseDown(outsideElement);

    await waitFor(() => {
      const dropdown = screen.queryByRole("listbox");
      expect(dropdown).toBeNull();
    });
  });

  // Edge case tests for keyboard navigation
  it("should not navigate beyond last item with ArrowDown", async () => {
    const mockResults = [
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        type: "EQUITY",
        exchange: "NASDAQ",
      },
      {
        symbol: "AAPLW",
        name: "Apple Inc. Warrants",
        type: "EQUITY",
        exchange: "NASDAQ",
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockResults }),
    });

    render(<SearchBar />);
    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "AAPL" } });

    await waitFor(
      () => {
        expect(screen.getByText("Apple Inc.")).toBeDefined();
      },
      { timeout: 500 }
    );

    // Navigate to first item
    fireEvent.keyDown(input, { key: "ArrowDown" });
    // Navigate to second item
    fireEvent.keyDown(input, { key: "ArrowDown" });
    // Try to navigate beyond last item
    fireEvent.keyDown(input, { key: "ArrowDown" });

    await waitFor(() => {
      const secondItem = screen.getByText("Apple Inc. Warrants").closest("li");
      // Should still be on the last item
      expect(secondItem?.getAttribute("aria-selected")).toBe("true");
    });
  });

  it("should reset selection to -1 when pressing ArrowUp from first item", async () => {
    const mockResults = [
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        type: "EQUITY",
        exchange: "NASDAQ",
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockResults }),
    });

    render(<SearchBar />);
    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "AAPL" } });

    await waitFor(
      () => {
        expect(screen.getByText("Apple Inc.")).toBeDefined();
      },
      { timeout: 500 }
    );

    // Navigate to first item
    fireEvent.keyDown(input, { key: "ArrowDown" });

    await waitFor(() => {
      const firstItem = screen.getByText("Apple Inc.").closest("li");
      expect(firstItem?.getAttribute("aria-selected")).toBe("true");
    });

    // Press ArrowUp to deselect
    fireEvent.keyDown(input, { key: "ArrowUp" });

    await waitFor(() => {
      const firstItem = screen.getByText("Apple Inc.").closest("li");
      // Should be deselected
      expect(firstItem?.getAttribute("aria-selected")).toBe("false");
    });
  });

  it("should navigate directly when pressing Enter without dropdown", async () => {
    const mockOnSelect = vi.fn();
    render(<SearchBar onSelect={mockOnSelect} />);
    const input = screen.getByRole("combobox");

    // Type a symbol without triggering autocomplete
    fireEvent.change(input, { target: { value: "TSLA" } });

    // Press Enter immediately (before debounce completes)
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith("TSLA");
    });
  });

  it("should update selection on mouse hover", async () => {
    const mockResults = [
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        type: "EQUITY",
        exchange: "NASDAQ",
      },
      {
        symbol: "AAPLW",
        name: "Apple Inc. Warrants",
        type: "EQUITY",
        exchange: "NASDAQ",
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockResults }),
    });

    render(<SearchBar />);
    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "AAPL" } });

    await waitFor(
      () => {
        expect(screen.getByText("Apple Inc.")).toBeDefined();
      },
      { timeout: 500 }
    );

    // Hover over second item
    const secondItem = screen.getByText("Apple Inc. Warrants").closest("li");
    if (secondItem) {
      fireEvent.mouseEnter(secondItem);
    }

    await waitFor(() => {
      expect(secondItem?.getAttribute("aria-selected")).toBe("true");
    });
  });

  it("should reopen dropdown when focusing input with existing results", async () => {
    const mockResults = [
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        type: "EQUITY",
        exchange: "NASDAQ",
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockResults }),
    });

    render(<SearchBar />);
    const input = screen.getByRole("combobox");

    // Trigger search
    fireEvent.change(input, { target: { value: "AAPL" } });

    await waitFor(
      () => {
        expect(screen.getByText("Apple Inc.")).toBeDefined();
      },
      { timeout: 500 }
    );

    // Close dropdown with Escape
    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => {
      const dropdown = screen.queryByRole("listbox");
      expect(dropdown).toBeNull();
    });

    // Focus input again
    fireEvent.focus(input);

    await waitFor(() => {
      const dropdown = screen.queryByRole("listbox");
      expect(dropdown).toBeDefined();
    });
  });

  it("should not trigger search for empty or whitespace-only query", async () => {
    render(<SearchBar />);
    const input = screen.getByRole("combobox");

    // Type whitespace
    fireEvent.change(input, { target: { value: "   " } });

    // Wait for debounce period
    await waitFor(
      () => {
        // Should not call fetch for empty query
        expect(global.fetch).not.toHaveBeenCalled();
      },
      { timeout: 500 }
    );

    // Clear and try empty string
    fireEvent.change(input, { target: { value: "" } });

    await waitFor(
      () => {
        expect(global.fetch).not.toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });

  it("should clear results when query becomes empty", async () => {
    const mockResults = [
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        type: "EQUITY",
        exchange: "NASDAQ",
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockResults }),
    });

    render(<SearchBar />);
    const input = screen.getByRole("combobox");

    // Trigger search
    fireEvent.change(input, { target: { value: "AAPL" } });

    await waitFor(
      () => {
        expect(screen.getByText("Apple Inc.")).toBeDefined();
      },
      { timeout: 500 }
    );

    // Clear the input
    fireEvent.change(input, { target: { value: "" } });

    await waitFor(() => {
      const dropdown = screen.queryByRole("listbox");
      expect(dropdown).toBeNull();
    });
  });
});
