"use client";

import { DNA_BODY, DNA_HEADING } from "@/lib/design-dna";
import type { ReactNode } from "react";

export function InsightPanel({
  children,
  embedded = false,
  className = "",
}: {
  children: ReactNode;
  embedded?: boolean;
  className?: string;
}) {
  const shell = <div className={className}>{children}</div>;
  if (embedded) return shell;
  return <section className="mt-6 sm:mt-8 lg:mt-10">{shell}</section>;
}

export function InsightPanelHeader({
  title,
  subtitle,
  right,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <div>
        {title ? <h2 className={DNA_HEADING}>{title}</h2> : null}
        {subtitle ? <p className={`mt-1 ${DNA_BODY}`}>{subtitle}</p> : null}
      </div>
      {right ? <div className="sm:text-right">{right}</div> : null}
    </div>
  );
}
