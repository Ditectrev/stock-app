"use client";

import type { ReactNode } from "react";
import { ProductGate } from "@/components/ProductShell";
import { DNA_BODY, DNA_HEADING } from "@/lib/design-dna";
import { HOME_PRIMARY_BUTTON } from "@/lib/home-ui";

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

/** @deprecated Prefer ProductGate directly; kept for existing call sites. */
export function InsightPanelGate({
  message,
  ctaHref,
  ctaLabel,
  title,
  overlay = false,
  align = "start",
  buttonClassName = HOME_PRIMARY_BUTTON,
}: {
  message: ReactNode;
  ctaHref: string;
  ctaLabel: string;
  title?: ReactNode;
  overlay?: boolean;
  align?: "start" | "center";
  buttonClassName?: string;
}) {
  return (
    <ProductGate
      eyebrow="Subscription"
      title={title ?? "Upgrade to continue"}
      message={message}
      ctaHref={ctaHref}
      ctaLabel={ctaLabel}
      overlay={overlay}
      align={align}
      buttonClassName={buttonClassName}
      className={
        overlay
          ? "absolute inset-0 z-10 min-h-[11rem] justify-center sm:min-h-[12rem]"
          : "min-h-[11rem] py-2 sm:min-h-[12rem]"
      }
    />
  );
}
