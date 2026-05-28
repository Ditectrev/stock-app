"use client";

import Link from "next/link";
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
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <div>
        <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm opacity-80">{subtitle}</p>
        ) : null}
      </div>
      {right ? <div className="sm:text-right">{right}</div> : null}
    </div>
  );
}

export function InsightPanelGate({
  message,
  ctaHref,
  ctaLabel,
  title,
  overlay = false,
  align = "start",
  buttonClassName,
}: {
  message: ReactNode;
  ctaHref: string;
  ctaLabel: string;
  title?: ReactNode;
  overlay?: boolean;
  align?: "start" | "center";
  buttonClassName: string;
}) {
  const alignmentClass =
    align === "center" ? "items-center text-center" : "items-start";
  const shellClass = overlay
    ? "absolute inset-0 rounded-xl px-6 py-8"
    : "min-h-[11rem] py-2 sm:min-h-[12rem]";

  return (
    <div
      className={`flex flex-col justify-center gap-4 ${alignmentClass} ${shellClass}`}
    >
      {title ? <p className="text-lg font-semibold">{title}</p> : null}
      <p className="max-w-xl text-sm leading-relaxed sm:text-base">{message}</p>
      <div>
        <Link href={ctaHref} className={buttonClassName}>
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
