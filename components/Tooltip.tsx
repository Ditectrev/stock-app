"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SYMBOL_TOOLTIP_SURFACE } from "@/lib/symbol-ui";

export interface TooltipProps {
  /** The content to display inside the tooltip */
  content: React.ReactNode;
  /** The element that triggers the tooltip */
  children: React.ReactNode;
  /** Preferred position of the tooltip */
  position?: "top" | "bottom" | "left" | "right";
  /** Additional CSS class names for the tooltip container */
  className?: string;
  /** Delay in ms before showing the tooltip */
  delay?: number;
}

export function Tooltip({
  content,
  children,
  position = "top",
  className = "",
  delay = 200,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useRef(
    `tooltip-${Math.random().toString(36).slice(2, 9)}`
  ).current;

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <span
      ref={triggerRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      tabIndex={0}
      aria-describedby={visible ? tooltipId : undefined}
    >
      {children}
      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`${SYMBOL_TOOLTIP_SURFACE} max-w-xs pointer-events-none whitespace-normal ${positionClasses[position]}`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
