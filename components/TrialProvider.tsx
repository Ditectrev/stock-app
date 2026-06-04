"use client";

/**
 * TrialProvider
 * Renders the TrialBanner at the top of every page.
 * Trial startup logic lives in TrialBanner itself to avoid race conditions.
 * Requirements: 21.12, 21.13
 */

import { TrialBanner } from "@/components/TrialBanner";

export function TrialProvider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TrialBanner />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
