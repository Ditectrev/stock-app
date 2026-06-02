# The Open Stock — Free Stock Market Analysis Platform

**Live app:** [https://theopenstock.com](https://theopenstock.com)

The Open Stock is a free, open source stock market application for individual long-term investors. Search any ticker, study interactive charts and technical indicators, review financials and analyst forecasts, scan sectors and heatmaps, follow economic and earnings calendars, and optionally use AI (local Ollama, your own API keys, or hosted plans) for predictions and daily stock ideas.

Built with **Next.js**, **TypeScript**, and **Tailwind CSS**. Self-hostable on **Vercel**.

## What you get

| Area                   | Features                                                                      |
| ---------------------- | ----------------------------------------------------------------------------- |
| **Charts & quotes**    | Live prices, historical charts, key metrics, 52-week range                    |
| **Technical analysis** | RSI, MACD, SMA/EMA, Bollinger Bands, sentiment labels                         |
| **Fundamentals**       | Income statement, balance sheet, cash flow, valuation metrics                 |
| **Forecasts**          | Analyst price targets and rating breakdowns                                   |
| **Market tools**       | Sector hub, stock/ETF/crypto heatmaps, asset screener with presets            |
| **Calendars**          | Economic events, earnings, dividends, IPOs                                    |
| **Sentiment**          | CNN Fear & Greed Index, world markets overview                                |
| **AI (optional)**      | Per-symbol AI prediction, daily stock-of-the-day buy/sell ideas, local Ollama |

## Why this stock app?

Most stock tools are expensive, ad-heavy, or locked behind paywalls. The Open Stock keeps core market data and charts free, with optional paid tiers for ads-free use and AI:

- Real-time stock quotes and market data
- Interactive charts with technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands)
- Financial statements: income, balance sheet, cash flow
- Analyst forecasts and price targets
- Seasonal performance heatmaps
- Economic calendar with country flags and day-grouped events
- Sector performance overview
- World markets at a glance
- Fear & Greed Index
- Stock screener with built-in and custom presets
- AI stock-of-the-day (buy + sell) and symbol-level AI predictions
- Dark mode and mobile-friendly layout

No paywall for core features. No forced tracking. Run it yourself or use [theopenstock.com](https://theopenstock.com).

## Screenshots

<!-- Add screenshots here -->

## Tech stack

| Layer       | Technology                          |
| ----------- | ----------------------------------- |
| Framework   | Next.js 15 (App Router)             |
| Language    | TypeScript                          |
| Runtime     | Bun (or Node.js 18+)                |
| Styling     | Tailwind CSS                        |
| Auth        | Appwrite                            |
| Database    | Appwrite                            |
| Market Data | Yahoo Finance, Finnhub, FairEconomy |
| Deployment  | Vercel                              |
| Testing     | Vitest, Playwright                  |

## Getting started

### Prerequisites

- Bun 1.0+ (or Node.js 18+)
- Appwrite account and project (for auth)

### Installation

```bash
git clone https://github.com/Ditectrev/Open-Source-Stock-Application.git
cd Open-Source-Stock-Application

bun install

cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_SITE_URL for correct SEO canonical URLs

bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### Local Ollama from a deployed site

The Local AI tier uses Ollama at `http://localhost:11434`. When you run this app locally, the Next.js server can call Ollama directly. When you open a deployed URL, the browser must call Ollama on the user's machine, so Ollama must allow that site origin.

Install Ollama from [webinstall.dev/ollama](https://webinstall.dev/ollama/). Set `OLLAMA_ORIGINS` to your site origin (for production, `https://theopenstock.com`), then start Ollama with `ollama serve`:

```bash
OLLAMA_ORIGINS="https://theopenstock.com" ollama serve
```

```bash
# macOS Ollama desktop app
launchctl setenv OLLAMA_ORIGINS "https://theopenstock.com"
# Fully quit and restart Ollama after setting this.
```

```bash
# Linux systemd service
sudo systemctl edit ollama
# Add:
# [Service]
# Environment="OLLAMA_ORIGINS=https://theopenstock.com"
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

```powershell
# Windows PowerShell
setx OLLAMA_ORIGINS "https://theopenstock.com"
# Restart Ollama after setting this.
```

```bash
# Docker
docker run -e OLLAMA_ORIGINS="https://theopenstock.com" -p 11434:11434 ollama/ollama
```

Use the exact origin from your browser address bar (scheme + host, no trailing slash).

The app asks Ollama for the locally installed model list and uses the most recently modified model. If no models are installed, run e.g. `ollama pull llama3.2`.

If `ollama serve` shows `127.0.0.1:11434: bind: address already in use`, Ollama is already running. Quit the existing process or see [ollama/ollama#707](https://github.com/ollama/ollama/issues/707).

## Environment variables

### Required

| Variable                               | Description                           |
| -------------------------------------- | ------------------------------------- |
| `NEXT_PUBLIC_APPWRITE_ENDPOINT`        | Appwrite API endpoint                 |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID`      | Appwrite project ID                   |
| `APPWRITE_API_KEY`                     | Appwrite server-side API key          |
| `APPWRITE_DATABASE_ID`                 | Appwrite DB for app data              |
| `APPWRITE_COLLECTION_ID_AI_KEYS`       | Appwrite collection for keys          |
| `APPWRITE_COLLECTION_ID_SUBSCRIPTIONS` | Appwrite collection for subscriptions |

Also required for trial features: `APPWRITE_COLLECTION_ID_TRIAL_SESSIONS`.

### Hosted AI (Ditectrev AI tier on production)

Required on Vercel when subscribers use the **Hosted AI** plan. Synced from GitHub Actions on deploy (see `.github/workflows/deploy.yml`).

| Variable      | Description                                                                           | Example    |
| ------------- | ------------------------------------------------------------------------------------- | ---------- |
| `AI_PROVIDER` | Server LLM vendor for Hosted AI (`MISTRAL`, `OPENAI`, `GEMINI`, `DEEPSEEK`, `OLLAMA`) | `MISTRAL`  |
| `AI_API_KEY`  | API key for that provider                                                             | _(secret)_ |
| `AI_MODEL`    | Optional model override; defaults are used per provider if unset                      | unset      |

### SEO & analytics (recommended for production)

| Variable               | Description                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for sitemap, Open Graph, and JSON-LD (e.g. `https://theopenstock.com`) |
| `NEXT_PUBLIC_GTM_ID`   | Google Tag Manager container ID (optional)                                                |

### Optional

| Variable                             | Description                                                                     | Default                            |
| ------------------------------------ | ------------------------------------------------------------------------------- | ---------------------------------- |
| `FINNHUB_API_KEY`                    | Finnhub API key for higher-quality live quotes/search/candles                   | unset                              |
| `FINNHUB_BASE_URL`                   | Finnhub API base URL                                                            | `https://finnhub.io/api/v1`        |
| `YAHOO_FINANCE_API_URL`              | Yahoo Finance API base URL                                                      | `https://query1.finance.yahoo.com` |
| `CACHE_TTL_SECONDS`                  | Cache TTL in seconds                                                            | `300`                              |
| `RATE_LIMIT_MAX_REQUESTS`            | Max API requests per window                                                     | `100`                              |
| `RATE_LIMIT_WINDOW_SECONDS`          | Rate limit window in seconds                                                    | `60`                               |
| `LOG_LEVEL`                          | Logging level                                                                   | `info`                             |
| `DEV_OVERRIDE_PRICING_TIER`          | Temporary non-prod tier override (`FREE`,`ADS_FREE`,`LOCAL`,`BYOK`,`HOSTED_AI`) | unset                              |
| `DEV_OVERRIDE_PRICING_TIER_USER_IDS` | Optional comma-separated user IDs for scoped override                           | unset                              |
| `STRIPE_SECRET_KEY`                  | Stripe secret API key (`sk_*`)                                                  | unset                              |
| `STRIPE_WEBHOOK_SECRET`              | Stripe webhook signing secret (`whsec_*`)                                       | unset                              |
| `STRIPE_PRICE_ADS_FREE`              | Stripe recurring price id for Ads-free tier                                     | unset                              |
| `STRIPE_PRICE_LOCAL`                 | Stripe recurring price id for Local tier                                        | unset                              |
| `STRIPE_PRICE_BYOK`                  | Stripe recurring price id for BYOK tier                                         | unset                              |
| `STRIPE_PRICE_HOSTED_AI`             | Stripe recurring price id for Hosted AI tier                                    | unset                              |

See `.env.example` for the full list.

### Appwrite AI keys database setup

```bash
bun run setup:appwrite:ai-keys
bun run setup:appwrite:subscriptions
```

## Project structure

```text
├── app/            # Next.js App Router pages, metadata, sitemap, robots
├── components/     # React components
├── lib/            # Utilities, SEO helpers, caching
├── services/       # API service layer
├── types/          # TypeScript types
├── e2e/            # Playwright end-to-end tests
└── public/         # Static assets
```

## Features in detail

### Stock analysis

Search any symbol (e.g. `AAPL`, `MSFT`) for overview, financials, technicals, forecasts, and seasonals. URL format: `/?symbol=TICKER`.

### Economic calendar

Live economic events grouped by day with country flags and importance filters (FairEconomy / ForexFactory feed).

### Technical indicators

SMA, EMA, RSI, MACD, and Bollinger Bands on interactive price charts.

### Sector performance & heatmaps

Sector returns and visual heatmaps for stocks, ETFs, and crypto.

### Stock screener

Preset screens (growth, value, momentum, dividends) plus custom filters.

### AI features

- **AI prediction** on symbol pages (buy / sell / hold stance with context bullets)
- **Stock of the day** — daily AI buy and sell ideas validated against market data
- **Local AI** via [Ollama](https://ollama.com) on your machine

## Scripts

```bash
bun dev              # Development server
bun run build        # Production build
bun start            # Production server
bun run lint         # ESLint
bun run format       # Prettier
bun run test         # Unit tests (Vitest)
bun run test:e2e     # E2E tests (Playwright)
```

## SEO

Production builds expose:

- Page titles and meta descriptions (per route and per `/?symbol=` ticker)
- Open Graph and Twitter Card tags
- `robots.txt` and `sitemap.xml`
- JSON-LD (`WebSite`, `Organization`, `WebApplication`)

Set `NEXT_PUBLIC_SITE_URL=https://theopenstock.com` on Vercel so canonical URLs and the sitemap match your live domain.

For **GitHub Actions → Vercel** (`.github/workflows/deploy.yml`), add the same value as a **repository variable** `NEXT_PUBLIC_SITE_URL` so the deploy job can sync it to Vercel (optional for Preview if you prefer `VERCEL_URL` at build time—leave the variable empty for that environment).

**Naming:** This product is **The Open Stock** at **theopenstock.com**. It is not affiliated with other projects named `OpenStock.` Meta keywords and the default description include phrases such as `OpenStock alternative` so people comparing open-source stock tools can find this repo—always use honest wording on landing pages and docs.

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

## Keywords

The Open Stock, free stock app, stock market dashboard, stock charts, stock screener, technical analysis, RSI MACD Bollinger Bands, economic calendar, earnings calendar, sector heatmap, Fear and Greed Index, analyst forecasts, open source stock platform, AI stock prediction, Ollama investing, long term investing, self-hosted stock app, Next.js finance app, OpenStock alternative, OpenStock alternative free, openstock, free open source stock tracker, open source stock market app like OpenStock

## License

Private - All rights reserved
