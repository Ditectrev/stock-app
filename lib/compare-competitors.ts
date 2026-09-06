/**
 * Comparison catalog for /compare and /compare/[slug].
 * Copy is written as a direct answer so search engines and AI agents can cite it.
 */

export const COMPARE_UPDATED = "2026-09-07";
export const COMPARE_UPDATED_LABEL = "September 2026";

export const OUR_PRODUCT = {
  name: "The Open Stock",
  url: "https://theopenstock.com",
  short:
    "Free stock charts, screener, heatmaps, calendars, Fear & Greed, and optional private AI.",
  paidFrom: "$4.99/mo ads-free; AI from $9.99/mo",
  freeTier:
    "Charts, screener, heatmaps, calendars, financials, Fear & Greed — ads-supported",
} as const;

export type CompareCategory =
  | "screener"
  | "charts"
  | "quotes"
  | "fundamentals"
  | "self-host";

export const COMPARE_CATEGORY_LABEL: Record<CompareCategory, string> = {
  screener: "Screeners and heatmaps",
  charts: "Charting platforms",
  quotes: "Quotes, news, and calendars",
  fundamentals: "Fundamentals and research",
  "self-host": "Open-source and self-hosted",
};

export type FeatureRow = {
  label: string;
  us: string;
  them: string;
};

export type CompareFaq = {
  question: string;
  answer: string;
};

export type CompetitorComparison = {
  slug: string;
  name: string;
  website: string;
  category: CompareCategory;
  alsoKnownAs: string[];
  freeTier: string;
  paidFrom: string;
  /** Direct 40–70 word answer for featured snippets and AI overviews. */
  verdict: string;
  theyWin: string[];
  weWin: string[];
  chooseThemIf: string;
  chooseUsIf: string;
  features: FeatureRow[];
  faqs: CompareFaq[];
  relatedSlugs: string[];
};

export function comparisonPath(slug: string): string {
  return `/compare/${slug}`;
}

export function vsPath(slug: string): string {
  return `/vs/${slug}`;
}

export function getCompetitor(slug: string): CompetitorComparison | undefined {
  return COMPARISONS.find((item) => item.slug === slug);
}

export function listComparisons(): CompetitorComparison[] {
  return COMPARISONS;
}

export function comparisonsByCategory(): Array<{
  category: CompareCategory;
  label: string;
  items: CompetitorComparison[];
}> {
  const order: CompareCategory[] = [
    "screener",
    "charts",
    "quotes",
    "fundamentals",
    "self-host",
  ];
  return order.map((category) => ({
    category,
    label: COMPARE_CATEGORY_LABEL[category],
    items: COMPARISONS.filter((item) => item.category === category),
  }));
}

export function comparisonSitemapPaths(): string[] {
  return ["/compare", ...COMPARISONS.map((item) => comparisonPath(item.slug))];
}

const CORE_FEATURES = {
  charts: "Interactive charts + RSI, MACD, MAs, Bollinger",
  screener: "Presets (value, growth, momentum, dividends) + custom filters",
  heatmap: "Stock, ETF, and crypto heatmaps",
  calendars: "Economic, earnings, dividend, and IPO calendars",
  fearGreed: "CNN Fear & Greed on the home dashboard",
  financials: "Income, balance sheet, cash flow, valuation metrics",
  ai: "Optional Ollama (local), BYOK, or hosted AI",
  adsFree: "$4.99/mo",
} as const;

export const COMPARISONS: CompetitorComparison[] = [
  {
    slug: "finviz",
    name: "Finviz",
    website: "https://finviz.com",
    category: "screener",
    alsoKnownAs: ["FINVIZ", "Finviz Elite", "Finviz Elite alternative"],
    freeTier: "US screener + heatmap, delayed quotes, ads",
    paidFrom: "Elite about $39.50/mo or ~$300/yr",
    verdict:
      "Finviz is the faster US stock screener and heatmap. The Open Stock is the better all-in-one if you also want interactive charts, calendars, Fear & Greed, and optional private AI without paying Elite prices. Free Finviz stays delayed and ad-heavy; The Open Stock keeps core research free and ads-free at $4.99/mo.",
    theyWin: [
      "Fastest no-login US screener with 60+ filters",
      "Best-known free market heatmap",
      "Hover charts and dense table workflow traders already know",
    ],
    weWin: [
      "Interactive charts with technicals on the same site",
      "Economic, earnings, dividend, and IPO calendars",
      "Ads-free from $4.99/mo vs Elite near $40/mo",
      "Optional local Ollama AI that does not leave your machine",
    ],
    chooseThemIf:
      "You only need a lightning-fast US scan or heatmap and already chart elsewhere.",
    chooseUsIf:
      "You want screener + charts + calendars in one tab, and Elite feels like overkill.",
    features: [
      { label: "Free screener", us: "Yes", them: "Yes (US, delayed)" },
      {
        label: "Heatmap",
        us: "Stocks, ETFs, crypto",
        them: "Excellent US map",
      },
      {
        label: "Interactive charts",
        us: CORE_FEATURES.charts,
        them: "Mostly static on free",
      },
      { label: "Calendars", us: CORE_FEATURES.calendars, them: "Limited" },
      { label: "Fear & Greed", us: "Yes", them: "No" },
      { label: "Local / private AI", us: CORE_FEATURES.ai, them: "No" },
      {
        label: "Ads-free price",
        us: CORE_FEATURES.adsFree,
        them: "Elite ~$39.50/mo",
      },
    ],
    faqs: [
      {
        question: "Is The Open Stock a free Finviz alternative?",
        answer:
          "Yes for DIY investors who want a free screener plus charts and calendars. It is not a 1:1 Elite clone — Finviz still wins raw US filter speed and the classic heatmap.",
      },
      {
        question: "Does The Open Stock have real-time data like Finviz Elite?",
        answer:
          "The Open Stock uses Yahoo Finance and optional Finnhub quotes. Finviz Elite is still the specialist for real-time US scans and exports.",
      },
    ],
    relatedSlugs: ["tradingview", "chartinglens", "stock-analysis", "barchart"],
  },
  {
    slug: "yahoo-finance",
    name: "Yahoo Finance",
    website: "https://finance.yahoo.com",
    category: "quotes",
    alsoKnownAs: ["Yahoo Finance alternative", "Yahoo Finance screener"],
    freeTier: "Quotes, news, basic financials, basic screener, ads",
    paidFrom: "Yahoo Finance Plus about $40/mo or ~$479/yr",
    verdict:
      "Yahoo Finance wins news, brand, and ticker lookup. The Open Stock wins if Yahoo’s ads and weak screener are the problem: cleaner charts, a real screener, heatmaps, and calendars without a Plus subscription. Use Yahoo for headlines; use The Open Stock as the research desk.",
    theyWin: [
      "Default Google result for most ticker queries",
      "News, filings headlines, and portfolio watchlists",
      "Familiar financials tabs millions of people already know",
    ],
    weWin: [
      "Quieter layout without autoplay and newsletter walls",
      "Stronger screener and heatmaps",
      "Fear & Greed and market calendars in one app",
      "Ads-free at $4.99/mo instead of Plus-tier pricing",
    ],
    chooseThemIf:
      "You mainly want quotes, news, and a watchlist tied to a Yahoo account.",
    chooseUsIf:
      "You research tickers weekly and Yahoo feels too noisy to think in.",
    features: [
      {
        label: "Ticker quotes & news",
        us: "Quotes + analysis tabs",
        them: "Best-in-class news",
      },
      { label: "Screener", us: CORE_FEATURES.screener, them: "Basic filters" },
      { label: "Heatmaps", us: CORE_FEATURES.heatmap, them: "Limited" },
      {
        label: "Calendars",
        us: CORE_FEATURES.calendars,
        them: "Earnings-focused",
      },
      { label: "Fear & Greed", us: "Yes", them: "No" },
      { label: "Local AI", us: CORE_FEATURES.ai, them: "No" },
      {
        label: "Ads-free price",
        us: CORE_FEATURES.adsFree,
        them: "Plus ~$40/mo",
      },
    ],
    faqs: [
      {
        question: "Can The Open Stock replace Yahoo Finance?",
        answer:
          "For charts, financials, screener, and calendars, yes. Keep Yahoo (or Google) if you depend on their news firehose.",
      },
      {
        question: "Why would I pay $4.99 if Yahoo is free?",
        answer:
          "You would not have to. Core The Open Stock is free. $4.99 only removes ads — not the research tools.",
      },
    ],
    relatedSlugs: ["google-finance", "marketwatch", "investing-com", "finviz"],
  },
  {
    slug: "tradingview",
    name: "TradingView",
    website: "https://www.tradingview.com",
    category: "charts",
    alsoKnownAs: ["TradingView alternative", "TradingView cheaper"],
    freeTier: "Strong charts, limited layouts/indicators/alerts, ads",
    paidFrom: "Essential about $13–15/mo billed annually",
    verdict:
      "TradingView is the charting standard. The Open Stock is not trying to beat Pine Script or multi-layout trading. It is a cheaper research companion: fundamentals, screener, calendars, and heatmaps with optional local AI. Keep TradingView for drawing on charts; use The Open Stock when you want one quiet desk instead of a social trading terminal.",
    theyWin: [
      "Best retail charting, indicators, and drawing tools",
      "Huge idea community and broker connections",
      "Global symbols across stocks, FX, crypto, and futures",
    ],
    weWin: [
      "Calendars, Fear & Greed, and fundamentals without a charting paywall",
      "Lower ads-free price if you do not need alerts and replay",
      "Private AI via Ollama — TradingView does not run models on your machine",
    ],
    chooseThemIf:
      "You live on the chart, write scripts, or need broker-connected trading.",
    chooseUsIf:
      "You check a handful of tickers, screens, and events — TradingView is overkill.",
    features: [
      {
        label: "Charting depth",
        us: "Solid interactive charts",
        them: "Class-leading",
      },
      {
        label: "Screener",
        us: CORE_FEATURES.screener,
        them: "Strong technical screener",
      },
      {
        label: "Fundamentals",
        us: CORE_FEATURES.financials,
        them: "Shallower than specialists",
      },
      {
        label: "Calendars",
        us: CORE_FEATURES.calendars,
        them: "Available, chart-first",
      },
      { label: "Community", us: "No social feed", them: "100M+ users" },
      { label: "Local AI", us: CORE_FEATURES.ai, them: "No on-device LLM" },
      {
        label: "Entry paid plan",
        us: CORE_FEATURES.adsFree,
        them: "~$13–15/mo Essential",
      },
    ],
    faqs: [
      {
        question: "Is The Open Stock a TradingView alternative?",
        answer:
          "It is an alternative for research, not for professional charting. If Pine Script, bar replay, or broker tickets matter, stay on TradingView.",
      },
      {
        question: "Can I use both?",
        answer:
          "Yes. A common setup is TradingView for entries and The Open Stock for screens, calendars, and a quieter fundamental snapshot.",
      },
    ],
    relatedSlugs: ["finviz", "stockcharts", "koyfin", "yahoo-finance"],
  },
  {
    slug: "openstock",
    name: "OpenStock (Open Dev Society)",
    website: "https://github.com/Open-Dev-Society/OpenStock",
    category: "self-host",
    alsoKnownAs: [
      "OpenStock alternative",
      "OpenStock alternative free",
      "openstock github",
    ],
    freeTier: "Self-host with Finnhub, MongoDB, TradingView widgets",
    paidFrom: "No official paid hosted plan; you pay infra and API keys",
    verdict:
      "OpenStock (Open-Dev-Society) is a popular GitHub template (~14k stars) you self-host. The Open Stock at theopenstock.com is a different product: a hosted research app with screener, heatmaps, calendars, Fear & Greed, and optional Ollama AI. If you cloned OpenStock and bounced on Docker, Mongo, or Finnhub keys, use the hosted app instead.",
    theyWin: [
      "Viral GitHub story and AGPL self-host template",
      "TradingView widgets and Finnhub-backed search",
      "Forever-free positioning if you will run the stack",
    ],
    weWin: [
      "Hosted at theopenstock.com — no Docker or Mongo required",
      "Screener, heatmaps, calendars, and Fear & Greed already wired",
      "Local Ollama, BYOK, or hosted AI without assembling APIs",
      "Honest naming: The Open Stock, not affiliated with ODS OpenStock",
    ],
    chooseThemIf:
      "You want to fork a Next.js template and own every dependency yourself.",
    chooseUsIf:
      "You wanted an OpenStock-style app but needed it to work in the browser today.",
    features: [
      {
        label: "Hosted product",
        us: "Yes — theopenstock.com",
        them: "Self-host / demo",
      },
      { label: "Screener & heatmaps", us: "Yes", them: "Limited vs this app" },
      {
        label: "Calendars",
        us: CORE_FEATURES.calendars,
        them: "Not the focus",
      },
      {
        label: "Charts",
        us: "In-app charts + indicators",
        them: "TradingView widgets",
      },
      {
        label: "Local AI",
        us: CORE_FEATURES.ai,
        them: "Optional Gemini if you wire it",
      },
      {
        label: "Setup",
        us: "Open the site",
        them: "Node, Mongo, Finnhub, Docker",
      },
    ],
    faqs: [
      {
        question: "Is The Open Stock the same as OpenStock on GitHub?",
        answer:
          "No. The Open Stock is an independent app at theopenstock.com. OpenStock by Open Dev Society is a separate AGPL project. We are not affiliated.",
      },
      {
        question: "Which should I use as an OpenStock alternative?",
        answer:
          "Use The Open Stock if you want a hosted dashboard. Use ODS OpenStock if you specifically want that codebase and will maintain Mongo, Finnhub, and TradingView widgets.",
      },
    ],
    relatedSlugs: ["ghostfolio", "wealthfolio", "finviz", "yahoo-finance"],
  },
  {
    slug: "investing-com",
    name: "Investing.com",
    website: "https://www.investing.com",
    category: "quotes",
    alsoKnownAs: [
      "Investing.com alternative",
      "Investing.com economic calendar",
    ],
    freeTier: "Quotes, calendars, screener, news — ad-heavy",
    paidFrom: "InvestingPro from roughly $15–25/mo on promo",
    verdict:
      "Investing.com is the default economic calendar and a broad global quote site. The Open Stock is cleaner and less ad-dense, with a tighter DIY-investor workspace. Keep Investing.com for Forex Factory-style calendar depth; switch if the ads make research unusable.",
    theyWin: [
      "One of the most used economic calendars on the web",
      "Global quotes, FX, and commodities breadth",
      "News covering many markets in one domain",
    ],
    weWin: [
      "Calmer UI for long-term stock research",
      "Screener + heatmaps + Fear & Greed without Pro upsells",
      "Optional private AI; Investing.com is not an Ollama product",
    ],
    chooseThemIf:
      "You trade FX/macro and live inside a multi-country economic calendar.",
    chooseUsIf:
      "You are a stock/ETF DIY investor who wants less chrome and fewer ads.",
    features: [
      {
        label: "Economic calendar",
        us: "Yes, with importance filters",
        them: "Industry default",
      },
      {
        label: "Stock screener",
        us: CORE_FEATURES.screener,
        them: "Yes, ad-supported",
      },
      { label: "Heatmaps", us: CORE_FEATURES.heatmap, them: "Available" },
      { label: "Fear & Greed", us: "Yes", them: "No native CNN gauge" },
      { label: "Local AI", us: CORE_FEATURES.ai, them: "No" },
      {
        label: "Ads-free entry",
        us: CORE_FEATURES.adsFree,
        them: "Pro subscription",
      },
    ],
    faqs: [
      {
        question: "Does The Open Stock replace Investing.com’s calendar?",
        answer:
          "It covers economic, earnings, dividend, and IPO events for DIY stock research. Power users who filter dozens of countries and currencies may still prefer Investing.com.",
      },
    ],
    relatedSlugs: ["yahoo-finance", "marketwatch", "google-finance", "finviz"],
  },
  {
    slug: "google-finance",
    name: "Google Finance",
    website: "https://www.google.com/finance",
    category: "quotes",
    alsoKnownAs: ["Google Finance alternative"],
    freeTier: "Quotes, basic charts, news, simple portfolios — free",
    paidFrom: "None (Google product)",
    verdict:
      "Google Finance is the fastest quote check after a Google search. The Open Stock is what you open when you want to screen, read financials, and scan calendars without leaving for Finviz or Yahoo. Google wins distribution; The Open Stock wins the research workflow.",
    theyWin: [
      "Zero learning curve from Google Search",
      "Clean, fast quote pages",
      "Simple portfolio tracking in a Google account",
    ],
    weWin: [
      "Real screener, heatmaps, and technicals",
      "Dedicated calendars and Fear & Greed",
      "Optional AI explanations without sending Google more finance data",
    ],
    chooseThemIf: "You only need a price, a sparkline, and a headline.",
    chooseUsIf: "You actually research before you buy.",
    features: [
      {
        label: "Quote lookup",
        us: "Search any symbol",
        them: "Fastest from Google",
      },
      {
        label: "Screener",
        us: CORE_FEATURES.screener,
        them: "No serious screener",
      },
      { label: "Technicals", us: CORE_FEATURES.charts, them: "Basic chart" },
      { label: "Calendars", us: CORE_FEATURES.calendars, them: "Limited" },
      { label: "Local AI", us: CORE_FEATURES.ai, them: "No" },
      { label: "Price", us: "Free core; $4.99 ads-free", them: "Free" },
    ],
    faqs: [
      {
        question: "Why use The Open Stock instead of Google Finance?",
        answer:
          "Google Finance is a quote card. The Open Stock is a research app: screener, heatmaps, calendars, financials, and optional private AI.",
      },
    ],
    relatedSlugs: ["yahoo-finance", "finviz", "tradingview", "marketwatch"],
  },
  {
    slug: "koyfin",
    name: "Koyfin",
    website: "https://www.koyfin.com",
    category: "fundamentals",
    alsoKnownAs: ["Koyfin alternative", "Koyfin vs TradingView"],
    freeTier: "Limited history and dashboards, generally ad-free",
    paidFrom: "Plus about $39/mo billed annually",
    verdict:
      "Koyfin is closer to a retail Bloomberg for fundamentals, dashboards, and transcripts. The Open Stock is for people who will never pay $39/mo: free charts, screener, calendars, and optional local AI. If you need 10-year models and custom dashboards, Koyfin wins. If you need a quiet free desk, we do.",
    theyWin: [
      "Institutional-style fundamentals and graphing",
      "Dashboards, earnings transcripts, macro overlays",
      "Ad-free even on a limited free tier",
    ],
    weWin: [
      "Free core that includes screener, heatmaps, and calendars",
      "Ads-free at $4.99 vs Plus near $39",
      "On-device AI via Ollama",
    ],
    chooseThemIf:
      "You build serious fundamental dashboards and will pay for data depth.",
    chooseUsIf:
      "You want 80% of daily research without a terminal subscription.",
    features: [
      {
        label: "Fundamental depth",
        us: "Statements + valuation metrics",
        them: "Terminal-grade",
      },
      {
        label: "Charting",
        us: CORE_FEATURES.charts,
        them: "Fundamental overlays",
      },
      {
        label: "Screener",
        us: CORE_FEATURES.screener,
        them: "Deep, paid unlocks more",
      },
      {
        label: "Calendars / sentiment",
        us: `${CORE_FEATURES.calendars}; Fear & Greed`,
        them: "Macro-focused",
      },
      { label: "Local AI", us: CORE_FEATURES.ai, them: "No Ollama workflow" },
      { label: "Paid from", us: CORE_FEATURES.adsFree, them: "~$39/mo Plus" },
    ],
    faqs: [
      {
        question: "Is The Open Stock cheaper than Koyfin?",
        answer:
          "Yes. Core is free and ads-free is $4.99/mo. Koyfin’s useful paid tier typically starts around $39/mo.",
      },
    ],
    relatedSlugs: ["simply-wall-st", "tikr", "gurufocus", "stock-rover"],
  },
  {
    slug: "simply-wall-st",
    name: "Simply Wall St",
    website: "https://simplywall.st",
    category: "fundamentals",
    alsoKnownAs: ["Simply Wall Street", "Simply Wall St alternative"],
    freeTier: "A few visual reports per month",
    paidFrom: "About $10–14/mo or ~$120/yr",
    verdict:
      "Simply Wall St is the prettiest visual fundamental report (snowflake, valuation, health). The Open Stock is a daily workspace — charts, screener, calendars — not a narrative report generator. Use Simply Wall St for a company story; use The Open Stock to scan and monitor the market.",
    theyWin: [
      "Visual snowflake reports and fair-value snapshots",
      "Beginner-friendly company narratives",
      "Polished shareable report pages",
    ],
    weWin: [
      "Unlimited free daily charts, screener, and calendars",
      "Heatmaps and Fear & Greed for market context",
      "Optional private AI instead of a report paywall",
    ],
    chooseThemIf: "You want a visual ‘is this company healthy?’ one-pager.",
    chooseUsIf: "You already know how to read a chart and a screener.",
    features: [
      {
        label: "Visual reports",
        us: "Standard financial tables",
        them: "Snowflake / infographics",
      },
      {
        label: "Daily workspace",
        us: "Charts, screener, calendars",
        them: "Report-centric",
      },
      { label: "Heatmaps", us: CORE_FEATURES.heatmap, them: "Not the product" },
      { label: "Local AI", us: CORE_FEATURES.ai, them: "No" },
      { label: "Free access", us: "Full core, ads", them: "Metered reports" },
      { label: "Paid from", us: CORE_FEATURES.adsFree, them: "~$120/yr" },
    ],
    faqs: [
      {
        question:
          "Does The Open Stock calculate intrinsic value like Simply Wall St?",
        answer:
          "It shows financials, valuation metrics, and analyst targets. It does not sell a proprietary snowflake or DCF report.",
      },
    ],
    relatedSlugs: ["koyfin", "seeking-alpha", "gurufocus", "yahoo-finance"],
  },
  {
    slug: "seeking-alpha",
    name: "Seeking Alpha",
    website: "https://seekingalpha.com",
    category: "fundamentals",
    alsoKnownAs: ["Seeking Alpha alternative"],
    freeTier: "Headlines and limited articles; heavy paywall",
    paidFrom: "Premium about $299/yr; higher for Pro / Alpha Picks",
    verdict:
      "Seeking Alpha is an opinion and quant-research publisher. The Open Stock is a data workspace. If you want contributor articles and Quant ratings, stay on Seeking Alpha. If you want to look at the numbers yourself without a $299/yr wall, use The Open Stock.",
    theyWin: [
      "Contributor analysis and Quant ratings",
      "Earnings call coverage and idea feed",
      "Portfolio tools tied to that research",
    ],
    weWin: [
      "No article paywall on charts, screener, or calendars",
      "Your own analysis instead of a subscribed narrative",
      "Local AI that is not a Seeking Alpha substitute for due diligence",
    ],
    chooseThemIf: "You pay for other people’s write-ups and ratings.",
    chooseUsIf: "You would rather screen and read financials yourself.",
    features: [
      {
        label: "Editorial / ratings",
        us: "Optional AI notes",
        them: "Core product",
      },
      {
        label: "Charts & financials",
        us: "Yes",
        them: "Yes, with paywall depth",
      },
      { label: "Screener", us: CORE_FEATURES.screener, them: "Quant-oriented" },
      {
        label: "Calendars",
        us: CORE_FEATURES.calendars,
        them: "Earnings-heavy",
      },
      {
        label: "Price",
        us: "Free core; $4.99 ads-free",
        them: "~$299/yr Premium",
      },
    ],
    faqs: [
      {
        question: "Is The Open Stock like Seeking Alpha without the paywall?",
        answer:
          "No. Seeking Alpha sells analysis. The Open Stock sells (optionally) a quieter data UI and private AI. Different job.",
      },
    ],
    relatedSlugs: ["tipranks", "zacks", "yahoo-finance", "koyfin"],
  },
  {
    slug: "stock-analysis",
    name: "StockAnalysis",
    website: "https://stockanalysis.com",
    category: "screener",
    alsoKnownAs: ["Stock Analysis", "stockanalysis.com"],
    freeTier: "Deep free financials and a capable screener, no account",
    paidFrom: "Mostly free; some extras gated",
    verdict:
      "StockAnalysis is one of the best free fundamental sites on the web. The Open Stock overlaps on financials and screening, then adds heatmaps, calendars, Fear & Greed, and optional local AI in one product UI. Use StockAnalysis for statement history; use The Open Stock as the daily terminal.",
    theyWin: [
      "Excellent free financial statement history",
      "No-account fundamental screener",
      "Clean ticker pages many listicles already recommend",
    ],
    weWin: [
      "Heatmaps, Fear & Greed, and multi-calendar hub",
      "Interactive technicals and optional Ollama",
      "A single hosted app rather than a documentation-style data site",
    ],
    chooseThemIf: "You live in 10-K style statements and want them free.",
    chooseUsIf: "You want statements plus market maps and calendars together.",
    features: [
      { label: "Financial statements", us: "Yes", them: "Among the best free" },
      {
        label: "Screener",
        us: CORE_FEATURES.screener,
        them: "Strong free screener",
      },
      { label: "Heatmaps", us: CORE_FEATURES.heatmap, them: "Not the focus" },
      {
        label: "Calendars",
        us: CORE_FEATURES.calendars,
        them: "Limited vs this app",
      },
      { label: "Local AI", us: CORE_FEATURES.ai, them: "No" },
      { label: "Price", us: "Free core; $4.99 ads-free", them: "Mostly free" },
    ],
    faqs: [
      {
        question: "Is The Open Stock better than StockAnalysis?",
        answer:
          "Not at raw free statement depth. It is better as a combined workspace if you also need heatmaps, calendars, and optional private AI.",
      },
    ],
    relatedSlugs: ["finviz", "gurufocus", "yahoo-finance", "tikr"],
  },
  {
    slug: "barchart",
    name: "Barchart",
    website: "https://www.barchart.com",
    category: "screener",
    alsoKnownAs: ["BarChart", "Barchart Premier"],
    freeTier: "Broad screeners including futures and FX, delayed-ish data",
    paidFrom: "Premier about $20/mo",
    verdict:
      "Barchart wins if you screen futures, FX, and commodities alongside stocks. The Open Stock is equities-first: stocks, ETFs, crypto heatmaps, calendars, and DIY investor tools. Do not pick us to replace a commodities terminal.",
    theyWin: [
      "Futures, FX, and commodities screening heritage",
      "Huge filter list across asset classes",
      "Options-oriented data many stock apps skip",
    ],
    weWin: [
      "Cleaner long-term investor UX",
      "Fear & Greed, seasonal views, and private AI",
      "Lower ads-free price for people who only need stocks",
    ],
    chooseThemIf: "Your screener includes crude, corn, or currency crosses.",
    chooseUsIf: "You screen US stocks and ETFs and want a quieter app.",
    features: [
      { label: "Stock screener", us: "Yes", them: "Yes" },
      { label: "Futures / FX", us: "Not the focus", them: "Core strength" },
      { label: "Heatmaps", us: CORE_FEATURES.heatmap, them: "Available" },
      {
        label: "Calendars",
        us: CORE_FEATURES.calendars,
        them: "Economic + earnings",
      },
      { label: "Local AI", us: CORE_FEATURES.ai, them: "No" },
      {
        label: "Paid from",
        us: CORE_FEATURES.adsFree,
        them: "~$20/mo Premier",
      },
    ],
    faqs: [
      {
        question: "Can The Open Stock replace Barchart?",
        answer:
          "Only if you do not need futures and FX screening. Barchart remains the broader market-data site.",
      },
    ],
    relatedSlugs: ["finviz", "tradingview", "investing-com", "chartinglens"],
  },
  {
    slug: "stock-rover",
    name: "Stock Rover",
    website: "https://www.stockrover.com",
    category: "fundamentals",
    alsoKnownAs: ["StockRover"],
    freeTier: "Limited; trial of the full product",
    paidFrom: "Essentials about $8/mo; higher tiers for real-time",
    verdict:
      "Stock Rover is a fundamentals workbench: hundreds of metrics, equation screening, watchlist comparison. The Open Stock is lighter and free at the core. Choose Rover if you build factor screens; choose us if you want a simple daily market desk.",
    theyWin: [
      "650+ metrics and equation-style screening",
      "Watchlist comparison and portfolio analytics",
      "Cheaper than Finviz Elite for fundamental investors",
    ],
    weWin: [
      "No trial-gated core charts and calendars",
      "Heatmaps and Fear & Greed out of the box",
      "Optional local AI without a research-terminal UI",
    ],
    chooseThemIf:
      "You think in percentiles, formulas, and 20-column watchlists.",
    chooseUsIf: "You want presets and a readable ticker page.",
    features: [
      {
        label: "Metric depth",
        us: "Key financials + technicals",
        them: "Institutional-style",
      },
      {
        label: "Screener logic",
        us: "Filters + presets",
        them: "AND/OR equations",
      },
      { label: "Heatmaps / calendars", us: "Yes", them: "Secondary" },
      { label: "Local AI", us: CORE_FEATURES.ai, them: "No" },
      {
        label: "Paid from",
        us: CORE_FEATURES.adsFree,
        them: "~$8/mo Essentials",
      },
    ],
    faqs: [
      {
        question: "Is The Open Stock like Stock Rover?",
        answer:
          "Only at a high level (screen + research). Stock Rover is deeper on factors. The Open Stock is broader on market context tools.",
      },
    ],
    relatedSlugs: ["koyfin", "gurufocus", "finviz", "tikr"],
  },
  {
    slug: "tikr",
    name: "TIKR",
    website: "https://www.tikr.com",
    category: "fundamentals",
    alsoKnownAs: ["TIKR Terminal"],
    freeTier: "Deliberately limited; friction to upgrade",
    paidFrom: "Plus/Pro from roughly $30–50/mo equivalent",
    verdict:
      "TIKR markets itself as Excel-for-fundamentals in the browser. The Open Stock does not try to be a 20-year financial database. It is the free daily layer: chart, screen, calendar. Serious modelers still need TIKR, Koyfin, or filings.",
    theyWin: [
      "Long financial history and Excel-like tables",
      "Global coverage aimed at fundamental analysts",
      "Terminal feel without Bloomberg pricing",
    ],
    weWin: [
      "Actually usable free tier for daily work",
      "Heatmaps, calendars, Fear & Greed",
      "Private AI option",
    ],
    chooseThemIf: "You rebuild three-statement models in the browser.",
    chooseUsIf: "You are not building a model; you are staying informed.",
    features: [
      {
        label: "History depth",
        us: "Standard statements",
        them: "Long-run financials",
      },
      { label: "Free usefulness", us: "High", them: "Intentionally gated" },
      { label: "Market maps / calendars", us: "Yes", them: "Not the pitch" },
      { label: "Local AI", us: CORE_FEATURES.ai, them: "No" },
      { label: "Paid from", us: CORE_FEATURES.adsFree, them: "Tens of $/mo" },
    ],
    faqs: [
      {
        question: "Is The Open Stock a free TIKR alternative?",
        answer:
          "No for historical modeling. Yes as a free daily research surface if TIKR’s free tier felt like a demo.",
      },
    ],
    relatedSlugs: ["koyfin", "gurufocus", "stock-analysis", "stock-rover"],
  },
  {
    slug: "gurufocus",
    name: "GuruFocus",
    website: "https://www.gurufocus.com",
    category: "fundamentals",
    alsoKnownAs: ["Guru Focus"],
    freeTier: "Limited guru pages and some data; paywall for depth",
    paidFrom: "Premium often $299+/yr",
    verdict:
      "GuruFocus is 13F / superinvestor tracking plus deep value metrics. The Open Stock does not track Buffett’s filings. It is a personal research desk. Overlap is financials and screening, not guru portfolios.",
    theyWin: [
      "Superinvestor 13F tracking",
      "Value metrics (GF score, DCF-style tools)",
      "Screener aimed at value investors",
    ],
    weWin: [
      "Free daily charts, calendars, heatmaps",
      "Much lower paid entry",
      "Local AI instead of a guru-data paywall",
    ],
    chooseThemIf: "You clone 13F holdings and want value scores.",
    chooseUsIf: "You do not need guru tracking to research a ticker.",
    features: [
      { label: "13F / gurus", us: "No", them: "Core" },
      {
        label: "Value screener",
        us: "Presets including value/dividends",
        them: "Deep value toolkit",
      },
      { label: "Charts & calendars", us: "Yes", them: "Secondary" },
      { label: "Local AI", us: CORE_FEATURES.ai, them: "No" },
      { label: "Paid from", us: CORE_FEATURES.adsFree, them: "Hundreds $/yr" },
    ],
    faqs: [
      {
        question: "Does The Open Stock show what famous investors hold?",
        answer:
          "No. Use GuruFocus, Dataraoma, or 13F tools for that. The Open Stock is your own screening and charting.",
      },
    ],
    relatedSlugs: [
      "stock-analysis",
      "simply-wall-st",
      "koyfin",
      "seeking-alpha",
    ],
  },
  {
    slug: "marketwatch",
    name: "MarketWatch",
    website: "https://www.marketwatch.com",
    category: "quotes",
    alsoKnownAs: ["Market Watch"],
    freeTier: "News, quotes, some tools, ads",
    paidFrom: "WSJ/Dow Jones bundle rather than a research SaaS",
    verdict:
      "MarketWatch is a newsroom with quote pages. The Open Stock is a research app with almost no editorial. If you want journalists, stay. If you want screener, heatmap, and calendars without a media homepage, switch.",
    theyWin: [
      "Financial journalism and breaking headlines",
      "Brand trust for news",
      "Quote pages people already bookmark",
    ],
    weWin: [
      "Tools-first layout",
      "Screener, heatmaps, Fear & Greed",
      "No news homepage fighting for attention",
    ],
    chooseThemIf: "You read market news more than you screen.",
    chooseUsIf: "You already get news elsewhere and need a desk.",
    features: [
      { label: "News", us: "Not a publisher", them: "Core" },
      {
        label: "Research tools",
        us: "Charts, screener, calendars",
        them: "Secondary",
      },
      { label: "Fear & Greed", us: "Yes", them: "No CNN gauge" },
      { label: "Local AI", us: CORE_FEATURES.ai, them: "No" },
      {
        label: "Ads",
        us: "Free has ads; $4.99 removes them",
        them: "Ad-supported news",
      },
    ],
    faqs: [
      {
        question: "Is The Open Stock a MarketWatch alternative?",
        answer:
          "Only for quotes and basic research. It does not replace MarketWatch as a news site.",
      },
    ],
    relatedSlugs: ["yahoo-finance", "investing-com", "google-finance", "cnbc"],
  },
  {
    slug: "tipranks",
    name: "TipRanks",
    website: "https://www.tipranks.com",
    category: "fundamentals",
    alsoKnownAs: ["Tip Ranks"],
    freeTier: "Analyst ranking teasers; smart score gated",
    paidFrom: "Premium often ~$30/mo or $300/yr class",
    verdict:
      "TipRanks scores analysts, bloggers, and corporate insiders. The Open Stock shows analyst targets on a ticker but does not rank Wall Street accuracy. Different product: they sell signal reputation; we sell a workspace.",
    theyWin: [
      "Analyst performance rankings",
      "Insider and hedge-fund overlays",
      "Smart Score style composites",
    ],
    weWin: [
      "Free charts, screener, calendars without a Smart Score paywall",
      "Fear & Greed and heatmaps",
      "Your own judgment plus optional local AI",
    ],
    chooseThemIf: "You pick stocks by following top-ranked analysts.",
    chooseUsIf: "You want the underlying chart and financials, not a score.",
    features: [
      {
        label: "Analyst ranking",
        us: "Rating breakdown + targets",
        them: "Ranked analysts",
      },
      { label: "Workspace", us: "Full desk", them: "Score-centric" },
      { label: "Screener / heatmaps", us: "Yes", them: "Limited" },
      { label: "Local AI", us: CORE_FEATURES.ai, them: "No Ollama" },
      {
        label: "Paid from",
        us: CORE_FEATURES.adsFree,
        them: "Premium research pricing",
      },
    ],
    faqs: [
      {
        question: "Does The Open Stock have analyst ratings?",
        answer:
          "Yes — rating breakdowns and price targets on symbol pages. It does not rank which analyst is historically best.",
      },
    ],
    relatedSlugs: ["seeking-alpha", "zacks", "yahoo-finance", "koyfin"],
  },
  {
    slug: "zacks",
    name: "Zacks",
    website: "https://www.zacks.com",
    category: "fundamentals",
    alsoKnownAs: ["Zacks Rank", "Zacks Investment Research"],
    freeTier: "Zacks Rank visible; best screens and research paywalled",
    paidFrom: "Premier / Premium typically tens of $/mo",
    verdict:
      "Zacks is a ranking and stock-picking service (Zacks Rank #1). The Open Stock does not sell a proprietary rank. Use Zacks if you follow the rank; use The Open Stock if you want tools without a stock-tip brand.",
    theyWin: [
      "Famous Zacks Rank",
      "Style screens built around that rank",
      "Research service positioning",
    ],
    weWin: [
      "No rank subscription required to screen",
      "Heatmaps, calendars, Fear & Greed",
      "Local AI instead of a black-box rank",
    ],
    chooseThemIf: "You already buy or trust Zacks Rank.",
    chooseUsIf: "You do not want a vendor rank in the middle of research.",
    features: [
      { label: "Proprietary rank", us: "No", them: "Zacks Rank" },
      {
        label: "Screener",
        us: CORE_FEATURES.screener,
        them: "Rank-aware screens",
      },
      { label: "Charts / calendars", us: "Yes", them: "Available" },
      { label: "Local AI", us: CORE_FEATURES.ai, them: "No" },
      { label: "Price", us: "Free core", them: "Paid research tiers" },
    ],
    faqs: [
      {
        question: "Does The Open Stock have a stock rank like Zacks?",
        answer:
          "No proprietary 1–5 rank. Optional AI can offer a stance on a symbol; it is not a Zacks Rank substitute.",
      },
    ],
    relatedSlugs: ["tipranks", "seeking-alpha", "finviz", "yahoo-finance"],
  },
  {
    slug: "chartinglens",
    name: "ChartingLens",
    website: "https://chartinglens.com",
    category: "screener",
    alsoKnownAs: ["Charting Lens"],
    freeTier: "Marketed as real-time screener + AI signals",
    paidFrom: "About $10/mo premium in public comparisons",
    verdict:
      "ChartingLens shows up in ‘Finviz alternative 2026’ listicles as an AI + real-time screener. The Open Stock competes on a different promise: free core research, $5 ads-free, and AI that can run locally with Ollama. We do not claim to beat them on options flow or day-trader scanners.",
    theyWin: [
      "Listicle positioning vs Finviz (real-time + AI signals)",
      "Trader-oriented scans (gappers, RVOL)",
      "Chart-aware AI marketing",
    ],
    weWin: [
      "Calendars, Fear & Greed, ETF/crypto heatmaps as first-class tools",
      "True local AI (Ollama) rather than only hosted signals",
      "Open, GitHub-visible product at theopenstock.com",
    ],
    chooseThemIf: "You want an AI day-trading scanner as a Finviz replacement.",
    chooseUsIf:
      "You are a long-term DIY investor who wants private AI optional.",
    features: [
      { label: "Audience", us: "Long-term DIY", them: "Active traders" },
      {
        label: "Screener",
        us: CORE_FEATURES.screener,
        them: "Trader scans + AI signals",
      },
      {
        label: "Local Ollama",
        us: "Yes on Local AI plan",
        them: "Hosted AI features",
      },
      { label: "Calendars / F&G", us: "Yes", them: "Not the headline" },
      {
        label: "Paid from",
        us: CORE_FEATURES.adsFree,
        them: "~$10/mo premium",
      },
    ],
    faqs: [
      {
        question: "Is The Open Stock better than ChartingLens?",
        answer:
          "For privacy-first and all-in-one DIY research, that is the intent. For real-time momentum scanners, ChartingLens is closer to Finviz Elite’s job.",
      },
    ],
    relatedSlugs: ["finviz", "tradingview", "barchart", "openstock"],
  },
  {
    slug: "stockcharts",
    name: "StockCharts",
    website: "https://stockcharts.com",
    category: "charts",
    alsoKnownAs: ["StockCharts.com", "Stock Charts"],
    freeTier: "Limited charts; SharpCharts culture is paid",
    paidFrom: "Basic around $15–30/mo class",
    verdict:
      "StockCharts is a technical analysis school: SharpCharts, scans, ChartLists. The Open Stock is a lighter web app with enough technicals for DIY investors, not a TA platform. Do not switch if you are a StockCharts power user.",
    theyWin: [
      "SharpCharts and a huge TA education library",
      "ChartLists and member scans",
      "Decades of technician mindshare",
    ],
    weWin: [
      "Free interactive charts plus fundamentals and calendars",
      "Modern web app without a charting-site membership",
      "Optional local AI annotations",
    ],
    chooseThemIf: "You already speak StockCharts and pay for SharpCharts.",
    chooseUsIf: "You want RSI/MACD on a ticker without a TA subscription.",
    features: [
      { label: "TA depth", us: "Core indicators", them: "Specialist" },
      { label: "Fundamentals / calendars", us: "Yes", them: "Not the pitch" },
      { label: "Heatmaps / F&G", us: "Yes", them: "No" },
      { label: "Local AI", us: CORE_FEATURES.ai, them: "No" },
      { label: "Paid from", us: CORE_FEATURES.adsFree, them: "Member plans" },
    ],
    faqs: [
      {
        question: "Can The Open Stock replace StockCharts?",
        answer:
          "No for dedicated technicians. Yes if you only needed a few indicators next to financials and a screener.",
      },
    ],
    relatedSlugs: ["tradingview", "finviz", "barchart", "yahoo-finance"],
  },
  {
    slug: "morningstar",
    name: "Morningstar",
    website: "https://www.morningstar.com",
    category: "fundamentals",
    alsoKnownAs: ["Morningstar Investor"],
    freeTier: "Quotes, some articles, star ratings teasers",
    paidFrom: "Morningstar Investor often ~$25/mo or ~$249/yr",
    verdict:
      "Morningstar is independent research, star ratings, and fund/ETF data. The Open Stock does not sell ratings. It is a free toolkit. Keep Morningstar for fund research and moat ratings; use The Open Stock to look at a stock’s chart and screen.",
    theyWin: [
      "Star ratings, moat, and fund/ETF research brand",
      "Portfolio analysis for households",
      "Editorial research desk",
    ],
    weWin: [
      "Free charts, screener, heatmaps, calendars",
      "No research-membership required",
      "Local AI for people who do not want another rating vendor",
    ],
    chooseThemIf: "You pick funds/ETFs using Morningstar ratings.",
    chooseUsIf: "You pick individual stocks with your own process.",
    features: [
      { label: "Ratings / moat", us: "No proprietary stars", them: "Core" },
      {
        label: "Fund research",
        us: "ETF heatmap, not fund rater",
        them: "Strength",
      },
      {
        label: "Stock desk",
        us: "Charts, screener, calendars",
        them: "Quote + research",
      },
      { label: "Local AI", us: CORE_FEATURES.ai, them: "No Ollama" },
      {
        label: "Paid from",
        us: CORE_FEATURES.adsFree,
        them: "Investor membership",
      },
    ],
    faqs: [
      {
        question: "Does The Open Stock have Morningstar-style star ratings?",
        answer:
          "No. Analyst targets and optional AI stance are not a Morningstar star rating.",
      },
    ],
    relatedSlugs: [
      "seeking-alpha",
      "yahoo-finance",
      "koyfin",
      "simply-wall-st",
    ],
  },
  {
    slug: "ghostfolio",
    name: "Ghostfolio",
    website: "https://ghostfol.io",
    category: "self-host",
    alsoKnownAs: ["Ghostfolio alternative"],
    freeTier: "Open-source self-host; hosted Ghostfolio Premium exists",
    paidFrom: "Premium for managed hosting / extra features",
    verdict:
      "Ghostfolio tracks what you already own (portfolio, allocation, privacy). The Open Stock helps you research what to look at next. They are complements, not substitutes. Use both if you want a private portfolio plus a public research desk.",
    theyWin: [
      "Holdings, allocation, and privacy-first portfolio UX",
      "Mature AGPL self-host community",
      "Net-worth style reporting",
    ],
    weWin: [
      "Screener, heatmaps, calendars, ticker research",
      "Hosted research without importing trades",
      "Market AI on symbols, not P&L accounting",
    ],
    chooseThemIf: "Your pain is ‘where is my money allocated?’",
    chooseUsIf:
      "Your pain is ‘what is this ticker doing and what else looks similar?’",
    features: [
      { label: "Portfolio / lots", us: "No tax-lot tracker", them: "Core" },
      { label: "Ticker research", us: "Core", them: "Secondary" },
      { label: "Screener / heatmaps", us: "Yes", them: "No" },
      {
        label: "Self-host",
        us: "GitHub app; hosted site first",
        them: "Designed to self-host",
      },
      {
        label: "Local AI on symbols",
        us: CORE_FEATURES.ai,
        them: "Not the job",
      },
    ],
    faqs: [
      {
        question: "Can The Open Stock replace Ghostfolio?",
        answer:
          "No. Ghostfolio is wealth tracking. The Open Stock is market research. Many people will want both.",
      },
    ],
    relatedSlugs: ["wealthfolio", "openstock", "yahoo-finance", "koyfin"],
  },
  {
    slug: "wealthfolio",
    name: "Wealthfolio",
    website: "https://wealthfolio.app",
    category: "self-host",
    alsoKnownAs: ["Wealthfolio alternative"],
    freeTier: "Open-source desktop / self-host portfolio tracker",
    paidFrom: "Optional paid extras; core is OSS",
    verdict:
      "Wealthfolio is a local-first portfolio app (desktop, Docker, holdings). The Open Stock is a browser research site. Same split as Ghostfolio: we do not import your trades. We help you study the market.",
    theyWin: [
      "Local-first holdings and performance",
      "Desktop + Docker story HN readers already know",
      "Privacy of never putting lots on a research SaaS",
    ],
    weWin: [
      "Market-wide screener and heatmaps",
      "Calendars and Fear & Greed",
      "Symbol-level optional AI",
    ],
    chooseThemIf: "You need a private ledger of positions.",
    chooseUsIf: "You need a public-market dashboard.",
    features: [
      { label: "Holdings ledger", us: "No", them: "Yes" },
      { label: "Research workspace", us: "Yes", them: "No" },
      { label: "Heatmaps / calendars", us: "Yes", them: "No" },
      {
        label: "Local AI on tickers",
        us: CORE_FEATURES.ai,
        them: "Not the product",
      },
    ],
    faqs: [
      {
        question: "Is The Open Stock a Wealthfolio alternative?",
        answer:
          "No for portfolio tracking. Yes if you found Wealthfolio while searching for an open-source stock app and actually needed research tools.",
      },
    ],
    relatedSlugs: ["ghostfolio", "openstock", "yahoo-finance", "finviz"],
  },
  {
    slug: "cnbc",
    name: "CNBC",
    website: "https://www.cnbc.com",
    category: "quotes",
    alsoKnownAs: ["CNBC Markets"],
    freeTier: "News, quotes, some screeners, video ads",
    paidFrom: "CNBC Pro subscription",
    verdict:
      "CNBC is TV and digital news. The Open Stock is not a media company. Compare them only if you use CNBC quote pages as a research tool — in that case a dedicated desk with screener, heatmaps, and calendars is usually calmer.",
    theyWin: [
      "Breaking news and video",
      "CNBC Pro exclusives",
      "Quote pages attached to a news brand",
    ],
    weWin: [
      "No video homepage",
      "Screener, heatmaps, calendars as the product",
      "Optional private AI",
    ],
    chooseThemIf: "You watch or read CNBC as your market ritual.",
    chooseUsIf: "You want tools, not a news network.",
    features: [
      { label: "News / video", us: "None", them: "Core" },
      { label: "Research tools", us: "Full desk", them: "Secondary" },
      {
        label: "Fear & Greed",
        us: "CNN index on our home",
        them: "Different properties",
      },
      { label: "Local AI", us: CORE_FEATURES.ai, them: "No" },
    ],
    faqs: [
      {
        question: "Is The Open Stock a CNBC alternative?",
        answer:
          "Not for news. It can replace CNBC’s quote gadget if you needed charts and a screener more than TV clips.",
      },
    ],
    relatedSlugs: [
      "marketwatch",
      "yahoo-finance",
      "google-finance",
      "investing-com",
    ],
  },
];
