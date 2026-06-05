let lockCount = 0;
let previousBodyOverflow = "";
let previousHtmlOverflow = "";

/** Reference-counted scroll lock for modal overlays. */
export function lockBodyScroll(): void {
  if (typeof document === "undefined") return;
  if (lockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  }
  lockCount += 1;
}

export function unlockBodyScroll(): void {
  if (typeof document === "undefined") return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    // Restore deterministically. Setting to "" removes the inline override.
    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overflow = previousHtmlOverflow;
  }
}

/** Safety reset — e.g. route change or provider unmount. */
export function resetBodyScrollLock(): void {
  if (typeof document === "undefined") return;
  lockCount = 0;
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
  previousBodyOverflow = "";
  previousHtmlOverflow = "";
}
