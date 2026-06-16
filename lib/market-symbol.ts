/** US-style tickers: 1–12 chars, letters/digits, optional dots or hyphens. */
const MARKET_SYMBOL_PATTERN = /^[A-Z0-9][A-Z0-9.-]{0,11}$/;

export function isValidMarketSymbol(symbol: string): boolean {
  return MARKET_SYMBOL_PATTERN.test(symbol);
}

/** Trim, uppercase, and reject empty or invalid symbols. */
export function normalizeMarketSymbol(
  input: string | null | undefined
): string | null {
  if (input == null) return null;
  const normalized = input.trim().toUpperCase();
  if (!normalized || !isValidMarketSymbol(normalized)) return null;
  return normalized;
}
