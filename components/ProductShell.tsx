"use client";

import {
  DNA_ACCENT_BAR,
  DNA_BODY,
  DNA_EYEBROW,
  DNA_GATE_INLINE,
  DNA_GATE_OVERLAY,
  DNA_GATE_SHELL,
  DNA_HEADING,
  DNA_OVERLAY_PANEL,
  DNA_OVERLAY_SCRIM,
  DNA_PANEL_STACK,
} from "@/lib/design-dna";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { HOME_PRIMARY_BUTTON } from "@/lib/home-ui";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scroll-lock";

function ProductShellHeader({
  eyebrow,
  title,
}: {
  eyebrow?: string;
  title: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className={DNA_ACCENT_BAR} aria-hidden />
      <div className="min-w-0 flex-1">
        {eyebrow ? <p className={DNA_EYEBROW}>{eyebrow}</p> : null}
        <h2 className={eyebrow ? `mt-1 ${DNA_HEADING}` : DNA_HEADING}>
          {title}
        </h2>
      </div>
    </div>
  );
}

export interface ProductOverlayProps {
  open: boolean;
  onClose?: () => void;
  dismissible?: boolean;
  eyebrow?: string;
  title: ReactNode;
  children: ReactNode;
  testId?: string;
  ariaLabel: string;
  closeTestId?: string;
}

/** Centered modal overlay (auth, account flows). */
export function ProductOverlay({
  open,
  onClose,
  dismissible = true,
  eyebrow,
  title,
  children,
  testId = "product-overlay",
  ariaLabel,
  closeTestId = "product-overlay-close",
}: ProductOverlayProps) {
  // Ensure lock/unlock pairing even if open toggles rapidly.
  const didLockRef = useRef(false);

  useEffect(() => {
    if (open) {
      if (!didLockRef.current) {
        lockBodyScroll();
        didLockRef.current = true;
      }
      return;
    }

    // open === false
    if (didLockRef.current) {
      unlockBodyScroll();
      didLockRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    // Unmount safety.
    return () => {
      if (didLockRef.current) {
        unlockBodyScroll();
        didLockRef.current = false;
      }
    };
  }, []);

  if (!open) return null;

  const panel = (
    <div
      className={DNA_OVERLAY_SCRIM}
      data-testid={testId}
      onClick={
        dismissible && onClose
          ? (e) => {
              if (e.target === e.currentTarget) onClose();
            }
          : undefined
      }
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={DNA_OVERLAY_PANEL}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex flex-1 flex-col overflow-y-auto p-5 sm:p-6 ${DNA_PANEL_STACK}`}
        >
          <div className="flex items-start justify-between gap-3">
            <ProductShellHeader eyebrow={eyebrow} title={title} />
            {dismissible && onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-md p-1 text-stone-500 hover:text-stone-900 dark:hover:text-stone-50"
                aria-label="Close"
                data-testid={closeTestId}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            ) : null}
          </div>
          {children}
        </div>
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(panel, document.body);
  }
  return panel;
}

export interface ProductGateProps {
  eyebrow?: string;
  title: ReactNode;
  message: ReactNode;
  ctaHref?: string;
  ctaLabel?: string;
  onRetry?: () => void;
  retryLabel?: string;
  overlay?: boolean;
  align?: "start" | "center";
  buttonClassName?: string;
  className?: string;
  testId?: string;
  children?: ReactNode;
}

/** Inline or overlay gate (AI lock, errors, upgrade prompts). */
const SUBSCRIPTION_GATE_INLINE_CLASS = "min-h-[11rem] py-2 sm:min-h-[12rem]";
const SUBSCRIPTION_GATE_OVERLAY_CLASS =
  "absolute inset-0 z-10 min-h-[11rem] justify-center sm:min-h-[12rem]";

export type SubscriptionGateProps = {
  message: ReactNode;
  ctaHref: string;
  ctaLabel: string;
  title?: ReactNode;
  overlay?: boolean;
  align?: "start" | "center";
  buttonClassName?: string;
};

/** AI subscription paywall (inline or blurred overlay). */
export function SubscriptionGate({
  message,
  ctaHref,
  ctaLabel,
  title,
  overlay = false,
  align = "start",
  buttonClassName = HOME_PRIMARY_BUTTON,
}: SubscriptionGateProps) {
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
          ? SUBSCRIPTION_GATE_OVERLAY_CLASS
          : SUBSCRIPTION_GATE_INLINE_CLASS
      }
    />
  );
}

export function ProductGate({
  eyebrow,
  title,
  message,
  ctaHref,
  ctaLabel,
  onRetry,
  retryLabel = "Try again",
  overlay = false,
  align = "start",
  buttonClassName = HOME_PRIMARY_BUTTON,
  className = "",
  testId = "product-gate",
  children,
}: ProductGateProps) {
  const alignmentClass =
    align === "center" ? "items-center text-center" : "items-start text-left";
  const shellClass = overlay ? DNA_GATE_OVERLAY : DNA_GATE_INLINE;

  return (
    <div
      className={`${DNA_GATE_SHELL} ${shellClass} ${alignmentClass} ${className}`}
      role="alert"
      aria-live="assertive"
      data-testid={testId}
    >
      <ProductShellHeader eyebrow={eyebrow} title={title} />
      <p className={`max-w-xl ${DNA_BODY}`}>{message}</p>
      {children}
      {(ctaHref && ctaLabel) || onRetry ? (
        <div className={align === "center" ? "flex justify-center" : ""}>
          {ctaHref && ctaLabel ? (
            <Link href={ctaHref} className={buttonClassName}>
              {ctaLabel}
            </Link>
          ) : null}
          {onRetry ? (
            <button type="button" onClick={onRetry} className={buttonClassName}>
              {retryLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
