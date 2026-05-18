"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserProfileMenu } from "@/components/UserProfileMenu";
import { MAIN_NAV, pathnameToNavId } from "@/lib/nav-routes";

export interface NavigationProps {
  /** Override active section (e.g. tests); default: derived from URL */
  activeSection?: string;
}

export function Navigation({
  activeSection: activeSectionProp,
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const activeSection = activeSectionProp ?? pathnameToNavId(pathname ?? "/");

  const handleSymbolSelect = (symbol: string) => {
    router.push(`/?symbol=${encodeURIComponent(symbol)}`);
    setMobileMenuOpen(false);
  };

  return (
    <nav
      className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 overflow-visible"
      aria-label="Main navigation"
      data-testid="navigation"
      data-active-section={activeSection}
    >
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4 overflow-visible">
          <Link
            href="/"
            className="flex-shrink-0 text-lg font-bold text-gray-900 dark:text-gray-100"
            aria-label="Stock Exchange Application home"
          >
            <span className="hidden sm:inline">Stock Exchange</span>
            <span className="sm:hidden">SE</span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {MAIN_NAV.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${
                    activeSection === link.id
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800"
                  }`}
                aria-current={activeSection === link.id ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:block flex-1 max-w-sm">
            <SearchBar
              placeholder="Search symbols..."
              onSelect={handleSymbolSelect}
              className="w-full"
            />
          </div>

          <div className="relative z-[10060] flex items-center gap-2 flex-shrink-0">
            <UserProfileMenu />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="md:hidden border-t border-gray-200 dark:border-gray-700"
        >
          <div className="px-4 py-3">
            <SearchBar
              placeholder="Search symbols..."
              onSelect={handleSymbolSelect}
            />
          </div>
          <div className="px-2 pb-3 space-y-1">
            {MAIN_NAV.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors
                  ${
                    activeSection === link.id
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800"
                  }`}
                aria-current={activeSection === link.id ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
