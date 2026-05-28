"use client";

import type { ReactNode } from "react";
import {
  SYMBOL_INSTRUMENT_PANEL,
  SYMBOL_PANEL_TITLE,
  SYMBOL_SECTION_LABEL,
  SYMBOL_SKELETON,
} from "@/lib/symbol-ui";

export interface SymbolTabShellProps {
  eyebrow: string;
  title: string;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
}

export function SymbolTabShell({
  eyebrow,
  title,
  ariaLabel,
  children,
  className = "",
}: SymbolTabShellProps) {
  return (
    <div
      className={`${SYMBOL_INSTRUMENT_PANEL} ${className}`}
      role="tabpanel"
      aria-label={ariaLabel}
    >
      <header className="mb-4 sm:mb-6">
        <p className={SYMBOL_SECTION_LABEL}>{eyebrow}</p>
        <h2 className={`mt-1 ${SYMBOL_PANEL_TITLE}`}>{title}</h2>
      </header>
      {children}
    </div>
  );
}

export function SymbolTabSkeleton({
  blocks,
  blockClassName = "h-24",
}: {
  blocks: number;
  blockClassName?: string;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: blocks }, (_, i) => (
        <div key={i} className={`${SYMBOL_SKELETON} ${blockClassName}`} />
      ))}
    </div>
  );
}
