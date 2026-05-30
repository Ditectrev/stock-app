"use client";

import React from "react";
import GitHubButton from "react-github-btn";
import packageJson from "../package.json";
import { HOME_MUTED_TEXT, HOME_SUBTLE_TEXT } from "@/lib/home-ui";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`mt-8 border-t border-stone-200 bg-stone-100 py-4 sm:mt-12 sm:py-6 dark:border-stone-800 dark:bg-stone-950 ${HOME_MUTED_TEXT}`}
      aria-label="Site footer"
    >
      <div className="mb-3 flex items-center justify-center">
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

      <p className={`mb-2 text-center text-xs ${HOME_SUBTLE_TEXT}`}>
        v{packageJson.version}
      </p>

      <p className="text-center text-sm">
        © {currentYear} Ditectrev and our contributors
      </p>
    </footer>
  );
}
