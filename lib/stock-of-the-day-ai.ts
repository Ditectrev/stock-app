export type AIStockCandidate = {
  symbol: string;
  name?: string;
  thesis?: string;
};

export type StockOfTheDayCandidates = {
  buyCandidates: AIStockCandidate[];
  sellCandidates: AIStockCandidate[];
};

export const STOCK_OF_THE_DAY_CANDIDATES_PROMPT = `You are an equity research scout building a premium AI-only "stock of the day" feature.
Return ONLY valid JSON, no markdown, in this exact shape:
{
  "buyCandidates": [{"symbol": string, "name": string, "thesis": string}],
  "sellCandidates": [{"symbol": string, "name": string, "thesis": string}]
}

Task:
- Find 8 US-listed common stocks for "stock of the day to BUY": niche, non-obvious, early-stage or mid-stage companies that could become category-defining winners.
- Find 8 US-listed common stocks for "stock of the day to SELL": companies with deteriorating fundamentals, broken narratives, overextended valuations, or weak competitive position.

Rules:
- Do not include ETFs, crypto, ADRs, funds, warrants, or preferred shares.
- Avoid obvious mega-cap defaults like AAPL, MSFT, NVDA, AMZN, GOOGL, META, TSLA unless the SELL case is unusually compelling.
- Prefer liquid public companies that Yahoo Finance can quote.
- thesis must be one short sentence explaining the unique reason it belongs in that list.
- Use tickers only, no exchange suffixes.`;

export function extractFirstJsonObject(
  text: string
): Record<string, unknown> | null {
  const trimmed = text.trim();
  const codeBlock = trimmed.match(/```json\s*([\s\S]*?)```/i)?.[1];
  const fallbackCandidate =
    codeBlock ?? trimmed.match(/\{[\s\S]*\}/)?.[0] ?? null;

  if (!fallbackCandidate) return null;

  try {
    return JSON.parse(fallbackCandidate) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function parseAIStockCandidates(value: unknown): AIStockCandidate[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  return value
    .map((item): AIStockCandidate | null => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as Record<string, unknown>;
      const symbol =
        typeof candidate.symbol === "string"
          ? candidate.symbol.trim().toUpperCase()
          : "";
      if (!/^[A-Z]{1,5}$/.test(symbol) || seen.has(symbol)) return null;
      seen.add(symbol);
      return {
        symbol,
        name:
          typeof candidate.name === "string"
            ? candidate.name.trim()
            : undefined,
        thesis:
          typeof candidate.thesis === "string"
            ? candidate.thesis.trim()
            : undefined,
      };
    })
    .filter((item): item is AIStockCandidate => item !== null)
    .slice(0, 8);
}

export function parseStockOfTheDayCandidates(
  raw: string
): StockOfTheDayCandidates {
  const parsed = extractFirstJsonObject(raw);
  const buyCandidates = parseAIStockCandidates(parsed?.buyCandidates);
  const sellCandidates = parseAIStockCandidates(parsed?.sellCandidates);

  if (buyCandidates.length < 2 || sellCandidates.length < 2) {
    throw new Error(
      "AI returned an incomplete stock-of-the-day candidate set."
    );
  }

  return { buyCandidates, sellCandidates };
}
