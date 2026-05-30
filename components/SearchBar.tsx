"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { HOME_INPUT, HOME_MUTED_TEXT, HOME_SUBTLE_TEXT } from "@/lib/home-ui";

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onSelect?: (symbol: string) => void;
}

export function SearchBar({
  placeholder = "Search stocks by symbol...",
  className = "",
  onSelect,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/market/search?q=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      if (data.success) {
        setResults(data.data || []);
        setIsOpen(true);
      } else {
        setError(data.error || "Search failed");
        setResults([]);
        setIsOpen(true); // Open dropdown to show error
      }
    } catch (err) {
      setError("Failed to search symbols");
      setResults([]);
      setIsOpen(true); // Open dropdown to show error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced search
    debounceTimerRef.current = setTimeout(() => {
      performSearch(value);
    }, 300); // 300ms debounce
  };

  // Handle symbol selection
  const handleSelect = (symbol: string) => {
    setQuery(symbol);
    setIsOpen(false);
    setResults([]);
    setSelectedIndex(-1);

    if (onSelect) {
      onSelect(symbol);
    }
    // Note: Navigation removed - symbol details now shown inline on home page
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        // Direct navigation if user presses Enter with a query
        handleSelect(query.trim().toUpperCase());
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex].symbol);
        } else if (query.trim()) {
          handleSelect(query.trim().toUpperCase());
        }
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className={`${HOME_INPUT} py-3 pr-10 text-base sm:text-sm`}
          role="combobox"
          aria-label="Search stocks"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={isOpen}
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-600 border-t-transparent dark:border-stone-300" />
          </div>
        )}

        {/* Search Icon */}
        {!isLoading && (
          <div
            className={`absolute right-3 top-1/2 -translate-y-1/2 ${HOME_SUBTLE_TEXT}`}
            aria-hidden="true"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div
          id="search-results"
          role="listbox"
          className="absolute z-50 mt-2 max-h-96 w-full overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900"
        >
          {error && (
            <div className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {!error && results.length === 0 && !isLoading && (
            <div className={`px-4 py-3 text-sm ${HOME_MUTED_TEXT}`}>
              No results found
            </div>
          )}

          {!error && results.length > 0 && (
            <ul className="py-1">
              {results.map((result, index) => (
                <li
                  key={`${result.symbol}-${result.exchange}`}
                  role="option"
                  aria-selected={index === selectedIndex}
                  className={`min-h-[44px] cursor-pointer px-4 py-3 transition-colors ${
                    index === selectedIndex
                      ? "bg-stone-100 dark:bg-stone-800"
                      : "hover:bg-stone-50 dark:hover:bg-stone-800"
                  }`}
                  onClick={() => handleSelect(result.symbol)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-stone-900 dark:text-stone-50">
                        {result.symbol}
                      </div>
                      <div className={`truncate text-sm ${HOME_MUTED_TEXT}`}>
                        {result.name}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span
                        className={`rounded px-2 py-1 text-xs ${HOME_SUBTLE_TEXT} bg-stone-100 dark:bg-stone-800`}
                      >
                        {result.exchange}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
