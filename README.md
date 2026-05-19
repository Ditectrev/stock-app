# Open Source Stock Application

A free, open source stock market application for individual long-term investors. Track stocks, analyze technical indicators, view financial statements, forecasts, seasonal patterns, and economic calendars — all in one place.

Built with Next.js, TypeScript, and Tailwind CSS. Self-hostable on Vercel.

## Why This Stock App?

Most stock market tools are either expensive, cluttered with ads, or locked behind paywalls. This open source stock application gives you:

- Real-time stock quotes and market data
- Interactive charts with technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands)
- Financial statements: income, balance sheet, cash flow
- Analyst forecasts and price targets
- Seasonal performance heatmaps
- Economic calendar with country flags and day-grouped events
- Sector performance overview
- World markets at a glance
- Fear & Greed index
- Dark mode support
- Mobile-friendly responsive design

No paywall for core features. No forced tracking. Just a clean stock analysis tool you can run yourself.

## Screenshots

<!-- Add screenshots here -->

## Tech Stack

| Layer       | Technology                 |
| ----------- | -------------------------- |
| Framework   | Next.js 14+ (App Router)   |
| Language    | TypeScript                 |
| Runtime     | Bun (or Node.js 18+)       |
| Styling     | Tailwind CSS               |
| Auth        | Appwrite                   |
| Database    | Appwrite                   |
| Market Data | Yahoo Finance, FairEconomy |
| Deployment  | Vercel                     |
| Testing     | Vitest, Playwright         |

## Getting Started

### Prerequisites

- Bun 1.0+ (or Node.js 18+)
- Appwrite account and project (for auth)

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/stock-exchange-app.git
cd stock-exchange-app

# Install dependencies
bun install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Local Ollama From A Deployed Preview

The Local AI tier uses Ollama at `http://localhost:11434`. When you run this app locally, the Next.js server can call Ollama directly. When you open a deployed preview URL, such as Vercel, the browser must call the Ollama server running on the user's machine, so Ollama must allow that site origin.

Install Ollama from [webinstall.dev/ollama](https://webinstall.dev/ollama/). Set `OLLAMA_ORIGINS` to your deployed app origin, then restart Ollama:

```bash
# macOS/Linux shell when starting Ollama manually
OLLAMA_ORIGINS=https://theopenstock.com ollama serve
```

```bash
# macOS Ollama desktop app
launchctl setenv OLLAMA_ORIGINS https://theopenstock.com
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
docker run -e OLLAMA_ORIGINS=https://theopenstock.com -p 11434:11434 ollama/ollama
```

Use the exact origin shown in the browser address bar: scheme + host, without a trailing slash. For multiple previews, use a comma-separated list if your Ollama version supports it, or update the value before testing that preview.

If `ollama serve` shows `127.0.0.1:11434: bind: address already in use`, Ollama is already running. Quit the existing Ollama process/app before starting it with `OLLAMA_ORIGINS`, or follow the workaround in [ollama/ollama#707](https://github.com/ollama/ollama/issues/707).

## Environment Variables

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

### Optional

| Variable                             | Description                                                                     | Default                            |
| ------------------------------------ | ------------------------------------------------------------------------------- | ---------------------------------- |
| `FINNHUB_API_KEY`                    | Finnhub API key used for higher-quality live quotes/search/candles              | unset                              |
| `FINNHUB_BASE_URL`                   | Finnhub API base URL                                                            | `https://finnhub.io/api/v1`        |
| `YAHOO_FINANCE_API_URL`              | Yahoo Finance API base URL                                                      | `https://query1.finance.yahoo.com` |
| `CACHE_TTL_SECONDS`                  | Cache TTL in seconds                                                            | `300`                              |
| `RATE_LIMIT_MAX_REQUESTS`            | Max API requests per window                                                     | `100`                              |
| `RATE_LIMIT_WINDOW_SECONDS`          | Rate limit window in seconds                                                    | `60`                               |
| `LOG_LEVEL`                          | Logging level                                                                   | `info`                             |
| `NEXT_PUBLIC_GTM_ID`                 | Google Tag Manager container ID (enables GTM when set, e.g. `GTM-XXXXXXX`)      | unset                              |
| `DEV_OVERRIDE_PRICING_TIER`          | Temporary non-prod tier override (`FREE`,`ADS_FREE`,`LOCAL`,`BYOK`,`HOSTED_AI`) | unset                              |
| `DEV_OVERRIDE_PRICING_TIER_USER_IDS` | Optional comma-separated user IDs for scoped override                           | unset                              |
| `STRIPE_SECRET_KEY`                  | Stripe secret API key (`sk_*`)                                                  | unset                              |
| `STRIPE_WEBHOOK_SECRET`              | Stripe webhook signing secret (`whsec_*`)                                       | unset                              |
| `STRIPE_PRICE_ADS_FREE`              | Stripe recurring price id for Ads-free tier                                     | unset                              |
| `STRIPE_PRICE_LOCAL`                 | Stripe recurring price id for Local tier                                        | unset                              |
| `STRIPE_PRICE_BYOK`                  | Stripe recurring price id for BYOK tier                                         | unset                              |
| `STRIPE_PRICE_HOSTED_AI`             | Stripe recurring price id for Hosted AI tier                                    | unset                              |

See `.env.example` for the full list.

### Appwrite AI Keys Database Setup

After setting the required environment variables, run:

```bash
bun run setup:appwrite:ai-keys
```

This uses your existing `APPWRITE_DATABASE_ID` and creates (or reuses) the BYOK keys collection in that database.

For subscriptions collection setup, run:

```bash
bun run setup:appwrite:subscriptions
```

## Project Structure

```text
├── app/            # Next.js App Router pages and API routes
├── components/     # React components
├── lib/            # Utilities, caching, rate limiting
├── services/       # API service layer
├── types/          # TypeScript types
├── e2e/            # Playwright end-to-end tests
└── public/         # Static assets
```

## Features in Detail

### Stock Analysis

Search any stock symbol and get a multi-tab view: Overview, Financials, Technical Indicators, Forecasts, and Seasonal patterns.

### Economic Calendar

Live economic events grouped by day with country flags, importance filters, and date range selection. Data sourced from FairEconomy (ForexFactory feed).

### Technical Indicators

SMA, EMA, RSI, MACD, and Bollinger Bands overlaid on interactive price charts.

### Sector Performance

Track all major market sectors with performance metrics and visual indicators.

### World Markets

Global market indices overview showing real-time performance across regions.

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

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

## Keywords

open source stock app, free stock market application, stock analysis tool, stock portfolio tracker, technical indicators, economic calendar, Next.js stock app, self-hosted stock platform, stock market dashboard, financial analysis tool

## License

Private - All rights reserved
