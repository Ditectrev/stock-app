# Product Overview

The Open Stock — a free, open-source stock market platform for individual long-term investors.

## Core Functionality

- Stock search and symbol detail view with tabbed UI (Overview, Financials, Technicals, Forecasts, Seasonals)
- Interactive price charts with technical indicator overlays (SMA, EMA, RSI, MACD, Bollinger Bands)
- Financial statements, analyst forecasts, and seasonal performance heatmaps
- Market dashboard: Fear & Greed index, world market indices, sector performance, economic calendar, earnings calendar
- Dark/light theme support

## Data Sources

- Yahoo Finance API (quotes, historical data, financials, forecasts, earnings calendar)
- CNN Dataviz API (Fear & Greed index, world markets, economic events)
- Trading Economics (economic events fallback)
- FairEconomy / ForexFactory (economic calendar feed)

## Architecture Notes

- All market data flows through a service layer with in-memory caching (TTL-based) and rate limiting
- API routes return `{ success, data, timestamp }` shaped responses
- Services fall back to alternative data sources when primary APIs fail (e.g., CNN → Yahoo for world markets)
- Mock data fallbacks exist in some API routes for development/testing resilience
- Auth via Appwrite (planned/partial — env vars present but not fully wired)
