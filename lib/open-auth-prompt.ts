/** Dispatched by nav/profile “Sign in” — handled by `TrialBanner` → `AuthPrompt`. */
export const OPEN_AUTH_PROMPT_EVENT = "open-auth-prompt";

export function openAuthPrompt(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_AUTH_PROMPT_EVENT));
}
