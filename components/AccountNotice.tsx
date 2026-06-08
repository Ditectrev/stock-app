"use client";

import { DNA_BODY } from "@/lib/design-dna";
import type { ReactNode } from "react";
import { HOME_CALLOUT } from "@/lib/home-ui";

export type AccountNoticeTone = "error" | "info" | "success" | "warning";

const TONE_STYLES: Record<AccountNoticeTone, string> = {
  error:
    "border-stone-300 bg-stone-100 text-stone-900 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100",
  info: HOME_CALLOUT,
  success:
    "border-emerald-200/90 bg-emerald-50/80 text-emerald-950 dark:border-emerald-800/70 dark:bg-emerald-950/35 dark:text-emerald-100",
  warning:
    "border-amber-200/90 bg-amber-50/80 text-amber-950 dark:border-amber-800/70 dark:bg-amber-950/35 dark:text-amber-100",
};

export interface AccountNoticeProps {
  tone?: AccountNoticeTone;
  title?: string;
  children: ReactNode;
  className?: string;
  testId?: string;
}

export function AccountNotice({
  tone = "error",
  title,
  children,
  className = "",
  testId,
}: AccountNoticeProps) {
  const role = tone === "error" || tone === "warning" ? "alert" : "status";
  const live = tone === "error" ? "assertive" : "polite";

  return (
    <div
      className={`mb-4 rounded-lg border px-3 py-3 text-sm ${TONE_STYLES[tone]} ${className}`}
      role={role}
      aria-live={live}
      data-testid={testId}
    >
      {title ? (
        <p className="font-medium text-stone-900 dark:text-stone-50">{title}</p>
      ) : null}
      <div className={title ? `mt-1 ${DNA_BODY}` : `${DNA_BODY}`}>
        {children}
      </div>
    </div>
  );
}
