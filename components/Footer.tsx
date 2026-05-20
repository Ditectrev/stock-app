"use client";

import React from "react";
import GitHubButton from "react-github-btn";
import packageJson from "../package.json";
import { useTheme } from "@/lib/theme-context";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <footer
      className={`py-4 sm:py-6 mt-8 sm:mt-12 border-t ${
        isDark
          ? "border-gray-700 bg-gray-900 text-gray-300"
          : "border-gray-200 bg-gray-50 text-gray-500"
      }`}
      aria-label="Site footer"
    >
      {/* GitHub Star */}
      <div className="flex items-center justify-center mb-3">
        <GitHubButton
          href="https://github.com/Ditectrev/Open-Source-Stock-Application"
          data-color-scheme="no-preference: dark; light: light; dark: dark;"
          data-icon="octicon-star"
          data-size="large"
          data-show-count="true"
          aria-label="Star Open Source Stock Application on GitHub"
        >
          Star
        </GitHubButton>
      </div>

      {/* Version */}
      <p className="text-xs text-center mb-2">v{packageJson.version}</p>

      {/* Copyright */}
      <p className="text-sm text-center">
        &copy; {currentYear} Ditectrev and our contributors
      </p>
    </footer>
  );
}
