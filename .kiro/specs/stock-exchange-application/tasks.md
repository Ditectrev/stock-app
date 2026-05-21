# Implementation Plan: The Open Stock

## Overview

This implementation plan breaks down The Open Stock into discrete, actionable coding tasks. The application is a comprehensive web platform built with Next.js 14+, deployed on Vercel, integrating with Appwrite for authentication and database, and connecting to CNN dataviz and Yahoo Finance APIs for market data.

The implementation follows an incremental approach, building core infrastructure first, then adding features progressively, with property-based tests integrated throughout to validate correctness properties.

## Tasks

- [x] 1. Project setup and core infrastructure
  - [x] 1.1 Initialize Next.js 14+ project with TypeScript and App Router
    - Create Next.js project with TypeScript configuration
    - Configure Tailwind CSS for styling
    - Set up project directory structure: app/, components/, lib/, types/, services/
    - Configure ESLint and Prettier
    - _Requirements: 16.1_

  - [x] 1.2 Configure environment variables and validation
    - Create .env.example with all required variables
    - Implement environment variable validation on startup
    - Document all configuration options in README
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

  - [x] 1.3 Set up Appwrite SDK integration
    - Install and configure Appwrite SDK
    - Create Appwrite client configuration
    - Implement connection to existing Appwrite instance
    - _Requirements: 1.1, 12.1_

  - [x] 1.4 Implement logging infrastructure
    - Create structured logging utility with log levels (debug, info, warn, error)
    - Integrate with Vercel's logging infrastructure
    - Add request/response logging middleware
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

  - [x] 1.5 Create shared TypeScript types and interfaces
    - Define core types: User, SymbolData, PriceData, TimeRange
    - Define authentication types: AuthResult, AuthProvider
    - Define trial types: TrialSession, TrialStatus
    - Define subscription types: PricingTier, Subscription, AIConfig
    - _Requirements: All requirements (foundational)_

- [-] 2. Authentication system
  - [x] 2.1 Implement AuthenticationService with Appwrite integration
    - Create AuthenticationService class with all authentication methods
    - Implement signInWithApple() using Appwrite OAuth
    - Implement signInWithGoogle() using Appwrite OAuth
    - Implement signInWithEmail() for email OTP
    - Implement verifyEmailOTP() for magic link verification
    - Implement signOut() and getCurrentUser()
    - Implement onAuthStateChange() for session monitoring
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.2 Write property test for authentication round trip
    - **Property 1: Authentication Round Trip**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5**

  - [x] 2.3 Write property test for authentication error handling
    - **Property 2: Authentication Error Handling**
    - **Validates: Requirements 1.6**

  - [x] 2.4 Create OAuth callback handlers
    - Implement /api/auth/callback/apple route
    - Implement /api/auth/callback/google route
    - Handle OAuth errors and edge cases
    - _Requirements: 21.14, 21.15_

  - [x] 2.5 Implement authentication UI components
    - Create AuthPrompt component with provider selection
    - Create email input form for OTP
    - Add error message display
    - Style authentication modal
    - _Requirements: 1.6, 21.13_

  - [x] 2.6 Write unit tests for authentication UI
    - Test provider button clicks
    - Test email form validation
    - Test error message display
    - _Requirements: 1.6_

- [-] 3. Trial session management
  - [x] 3.1 Implement device fingerprinting
    - Create DeviceFingerprint utility
    - Collect browser characteristics: user agent, screen resolution, timezone, plugins
    - Generate unique fingerprint hash
    - _Requirements: 21.3, 21.4_

  - [x] 3.2 Implement IP tracking with fallback mechanisms
    - Create IPTracking service with multiple provider support
    - Implement fallback to localStorage when IP services unavailable
    - Implement fallback to device fingerprint + timestamp
    - _Requirements: 21.6, 21.7, 21.8_

  - [x] 3.3 Implement TrialManagementService
    - Create TrialManagementService class
    - Implement startTrial() with 15-minute duration
    - Implement getTrialStatus() with remaining time calculation
    - Implement endTrial() to deactivate session
    - Implement checkTrialEligibility() with fingerprint checking
    - Store trial state in browser storage for persistence
    - _Requirements: 21.1, 21.2, 21.4, 21.5, 21.18, 21.19, 21.20_

  - [x] 3.4 Write property test for trial session creation
    - **Property 7: Trial Session Creation**
    - **Validates: Requirements 21.1, 21.2, 21.3**

  - [x] 3.5 Write property test for trial enforcement
    - **Property 8: Trial Enforcement**
    - **Validates: Requirements 21.4, 21.5, 21.19**

  - [x] 3.6 Write property test for trial state persistence
    - **Property 11: Trial State Persistence**
    - **Validates: Requirements 21.18**

  - [x] 3.7 Create trial API routes
    - Implement POST /api/trial/start
    - Implement GET /api/trial/status
    - Implement POST /api/trial/end
    - Implement GET /api/trial/eligibility
    - _Requirements: 21.1, 21.12_

  - [x] 3.8 Implement TrialTimer component
    - Create countdown timer with minute:second display
    - Update display at least once per second
    - Show authentication prompt when expired
    - _Requirements: 21.9, 21.10, 21.12_

  - [x] 3.9 Write property test for trial timer accuracy
    - **Property 9: Trial Timer Accuracy**
    - **Validates: Requirements 21.9**

  - [x] 3.10 Write property test for trial access control
    - **Property 10: Trial Access Control**
    - **Validates: Requirements 21.11, 21.12**

  - [x] 3.11 Create TrialBanner component
    - Display trial status and remaining time
    - Show authentication options when trial expires
    - Integrate with TrialTimer
    - _Requirements: 21.12, 21.13_

  - [x] 3.12 Write unit tests for trial components
    - Test timer countdown display
    - Test expiration prompt
    - Test authentication flow trigger
    - _Requirements: 21.9, 21.12_

- [x] 4. Checkpoint - Core authentication and trial system
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Market data infrastructure
  - [x] 5.1 Implement caching layer
    - Create cache service using Vercel KV or Redis
    - Implement cache key generation (symbol + data type)
    - Implement TTL-based expiration
    - Implement cache invalidation methods
    - _Requirements: 3.4, 17.2_

  - [x] 5.2 Write property test for market data caching
    - **Property 3: Market Data Caching**
    - **Validates: Requirements 3.4, 17.2**

  - [x] 5.3 Implement rate limiting
    - Create rate limiter for external API calls
    - Track API usage per endpoint
    - Log warnings when approaching limits
    - Serve cached data when rate limited
    - _Requirements: 17.1, 17.3, 17.4_

  - [x] 5.4 Write property test for rate limit enforcement
    - **Property 5: Rate Limit Enforcement**
    - **Validates: Requirements 17.1, 17.4**

  - [x] 5.5 Implement exponential backoff for retries
    - Create retry utility with exponential backoff (1s, 2s, 4s, 8s)
    - Implement max retry limit (3 attempts)
    - Add jitter to prevent thundering herd
    - _Requirements: 17.5_

  - [x] 5.6 Write property test for exponential backoff
    - **Property 6: Exponential Backoff**
    - **Validates: Requirements 17.5**

  - [x] 5.7 Create MarketDataService
    - Implement getSymbolData() with caching and rate limiting
    - Implement getHistoricalPrices() with time range support
    - Implement getTechnicalIndicators()
    - Implement getForecastData()
    - Implement getSeasonalPatterns()
    - Implement getFinancials()
    - Implement getFearGreedIndex()
    - Implement getWorldMarkets()
    - Implement getSectorPerformance()
    - Implement invalidateCache()
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

  - [x] 5.8 Write property test for symbol data fetching
    - **Property 22: Symbol Data Fetching**
    - **Validates: Requirements 3.1**

  - [x] 5.9 Write property test for API error handling
    - **Property 4: API Error Handling**
    - **Validates: Requirements 3.5, 14.2, 14.5**

  - [x] 5.10 Implement CNN dataviz API integration
    - Create CNN API client
    - Implement endpoints for Fear & Greed Index
    - Implement endpoints for world markets
    - Implement endpoints for economic calendar
    - Handle API response parsing and error cases
    - _Requirements: 3.2, 9.1, 10.4, 24.3_

  - [x] 5.11 Implement Yahoo Finance API integration
    - Create Yahoo Finance API client
    - Implement endpoints for symbol quotes
    - Implement endpoints for historical data
    - Implement endpoints for financial statements
    - Handle API response parsing and error cases
    - _Requirements: 3.3_

  - [x] 5.12 Create market data API routes
    - Implement GET /api/market/symbol/[symbol]
    - Implement GET /api/market/historical/[symbol]
    - Implement GET /api/market/indicators/[symbol]
    - Implement GET /api/market/forecast/[symbol]
    - Implement GET /api/market/seasonal/[symbol]
    - Implement GET /api/market/financials/[symbol]
    - Implement GET /api/market/fear-greed
    - Implement GET /api/market/world-markets
    - Implement GET /api/market/sectors
    - _Requirements: 3.1, 3.6_

  - [x] 5.13 Write unit tests for API routes
    - Test successful data retrieval
    - Test caching behavior
    - Test rate limiting
    - Test error responses
    - _Requirements: 3.5, 14.2_

- [x] 6. Chart and visualization components
  - [x] 6.1 Integrate charting library
    - Install Lightweight Charts or Recharts
    - Create wrapper component for consistent styling
    - Configure chart defaults and theme
    - _Requirements: 11.1_

  - [x] 6.2 Implement ChartComponent
    - Support line, area, and candlestick chart types
    - Implement time range selection (1D, 1W, 1M, 3M, 1Y, 5Y, Max)
    - Add interactive features: zoom, pan, crosshair
    - Implement responsive sizing for mobile and desktop
    - Add loading and error states
    - _Requirements: 4.2, 11.2, 11.3, 11.4, 11.5_

  - [x] 6.3 Add technical indicator overlays to charts
    - Implement moving average overlays
    - Implement RSI indicator display
    - Implement MACD indicator display
    - Implement Bollinger Bands overlay
    - Make indicators toggleable
    - _Requirements: 5.1, 5.2_

  - [x] 6.4 Write unit tests for ChartComponent
    - Test chart type switching
    - Test time range changes
    - Test responsive behavior
    - Test indicator toggles
    - _Requirements: 4.2, 11.2, 11.4_

- [x] 7. Symbol search and navigation
  - [x] 7.1 Implement symbol search functionality
    - Create search API endpoint with symbol lookup
    - Implement autocomplete suggestions
    - Add debouncing to reduce API calls
    - _Requirements: 2.1, 2.2_

  - [x] 7.2 Create SearchBar component
    - Implement search input with autocomplete dropdown
    - Handle symbol selection and navigation
    - Add keyboard navigation support
    - Style for mobile and desktop
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 7.3 Write unit tests for SearchBar
    - Test autocomplete behavior
    - Test symbol selection
    - Test keyboard navigation
    - _Requirements: 2.2, 2.3_

- [x] 8. Symbol detail page - Overview tab
  - [x] 8.1 Create symbol detail page layout
    - Implement /symbol/[symbol] route
    - Create tab navigation: Overview, Financials, Technicals, Forecasts, Seasonals
    - Add symbol header with name and current price
    - _Requirements: 2.4, 4.3_

  - [x] 8.2 Implement Overview tab content
    - Display price chart with ChartComponent
    - Show current price, change amount, and change percentage
    - Display key metrics: market cap, volume, 52-week range
    - Add tooltips for metric explanations
    - Color-code positive/negative changes
    - _Requirements: 4.1, 4.3, 4.4, 4.5_

  - [x] 8.3 Write unit tests for Overview tab
    - Test metric display
    - Test tooltip functionality
    - Test color coding
    - _Requirements: 4.3, 4.4, 4.5_

- [x] 9. Technical indicators display
  - [x] 9.1 Implement technical indicator calculations
    - Calculate RSI from price data
    - Calculate MACD from price data
    - Calculate Moving Averages (SMA, EMA)
    - Calculate Bollinger Bands
    - _Requirements: 5.2_

  - [x] 9.2 Create TechnicalIndicators component
    - Display all calculated indicators with values
    - Add tooltips explaining each indicator
    - Implement color coding: red (overpriced), green (underpriced), gray (fair)
    - Display overall technical sentiment gauge
    - Avoid "Buy" or "Sell" language
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.6_

  - [x] 9.3 Write property test for technical indicator color coding
    - **Property 16: Technical Indicator Color Coding**
    - **Validates: Requirements 5.4**

  - [x] 9.4 Write unit tests for TechnicalIndicators component
    - Test indicator calculations
    - Test tooltip display
    - Test color coding logic
    - Test sentiment gauge
    - _Requirements: 5.1, 5.3, 5.4, 5.5_

- [x] 10. Checkpoint - Core market data and visualization
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Forecast data display
  - [x] 11.1 Create ForecastDisplay component
    - Display analyst price targets (low, average, high)
    - Display analyst rating distribution (Strong Buy, Buy, Hold, Sell, Strong Sell)
    - Display EPS and revenue forecasts
    - Show actual vs estimate comparisons
    - Indicate earnings beats/misses
    - Add tooltips for forecast metrics
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 11.2 Write unit tests for ForecastDisplay
    - Test price target display
    - Test rating distribution
    - Test earnings surprise indicators
    - Test tooltip functionality
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 12. Seasonal patterns display
  - [x] 12.1 Calculate seasonal patterns from historical data
    - Aggregate returns by month across multiple years
    - Calculate cumulative returns for each month
    - Handle missing data gracefully
    - _Requirements: 7.2_

  - [x] 12.2 Create SeasonalHeatmap component
    - Render heatmap with months as columns and years as rows
    - Color-code cells based on return percentage
    - Display return percentage on hover
    - Add disclaimer about past performance
    - _Requirements: 7.1, 7.3, 7.4_

  - [x] 12.3 Write unit tests for SeasonalHeatmap
    - Test heatmap rendering
    - Test color coding
    - Test hover tooltips
    - Test disclaimer display
    - _Requirements: 7.1, 7.3, 7.4_

- [x] 13. Financials tab display
  - [x] 13.1 Create FinancialsTable component
    - Display key financial facts: revenue, net income, profit margins
    - Display valuation metrics: P/E, P/B, PEG ratios
    - Display growth metrics: revenue growth, earnings growth
    - Display profitability metrics: ROE, ROA, operating margin
    - Add tooltips for all metrics
    - Color-code favorable vs unfavorable values
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 13.2 Write unit tests for FinancialsTable
    - Test metric display
    - Test tooltip functionality
    - Test color coding
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 14. Fear and Greed Index
  - [x] 14.1 Create FearGreedGauge component
    - Display current index value from CNN
    - Render gauge visualization (0-100 scale)
    - Display historical timeline
    - Label ranges: Extreme Fear, Fear, Neutral, Greed, Extreme Greed
    - Add tooltip explaining the index
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 14.2 Write unit tests for FearGreedGauge
    - Test gauge rendering
    - Test range labels
    - Test timeline display
    - Test tooltip
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 15. World markets overview
  - [x] 15.1 Create WorldMarkets component
    - Display major indices by region (Americas, Asia-Pacific, Europe)
    - Show current values and percentage changes
    - Color-code based on positive/negative performance
    - Implement auto-refresh at configurable intervals
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

  - [x] 15.2 Write unit tests for WorldMarkets
    - Test index display
    - Test color coding
    - Test regional grouping
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 16. Subscription and pricing system
  - [x] 16.1 Implement SubscriptionService
    - Create SubscriptionService class
    - Implement getPricingTiers()
    - Implement getCurrentTier()
    - Implement subscribeTier() with payment processing
    - Implement upgradeTier() and downgradeTier()
    - Implement cancelSubscription()
    - _Requirements: 22.8, 22.17, 22.24, 22.26, 22.27_

  - [x] 16.2 Write property test for tier change immediate effect
    - **Property 14: Tier Change Immediate Effect**
    - **Validates: Requirements 22.24, 22.26**

  - [x] 16.3 Write property test for downgrade grace period
    - **Property 15: Downgrade Grace Period**
    - **Validates: Requirements 22.27**

  - [x] 16.4 Create PricingPage component
    - Display all five pricing tiers in comparison format
    - Show tier name, description, features, and pricing
    - Style similar to education.ditectrev.com/pricing
    - Add tier selection and subscription buttons
    - _Requirements: 22.1, 22.2, 22.3, 22.4_

  - [x] 16.5 Implement subscription API routes
    - Implement GET /api/subscription/tiers
    - Implement GET /api/subscription/current
    - Implement POST /api/subscription/subscribe
    - Implement PUT /api/subscription/upgrade
    - Implement PUT /api/subscription/downgrade
    - Implement DELETE /api/subscription/cancel
    - _Requirements: 22.8, 22.17, 22.26_

  - [x] 16.6 Write unit tests for PricingPage
    - Test tier display
    - Test comparison layout
    - Test subscription flow
    - _Requirements: 22.1, 22.2, 22.3, 22.4_

- [x] 17. Ads integration for Free tier
  - [x] 17.1 Implement AdsService
    - Create ads display logic for Free tier
    - Integrate with ad provider
    - Ensure ads only show for Free tier users
    - _Requirements: 22.5, 22.6_

  - [x] 17.2 Add ad placements in UI
    - Place ads in appropriate locations
    - Ensure ads don't interfere with core functionality
    - Hide ads for paid tiers
    - _Requirements: 22.5, 22.7_

  - [x] 17.3 Write unit tests for ads display
    - Test ads show for Free tier
    - Test ads hidden for paid tiers
    - _Requirements: 22.5, 22.7_

- [x] 18. AI integration infrastructure
  - [x] 18.1 Implement Ollama integration for Local tier
    - Create OllamaIntegration service
    - Verify Ollama installation and accessibility
    - Implement local AI query methods
    - Ensure no data sent to external services
    - _Requirements: 22.9, 22.10, 22.11_

  - [x] 18.2 Write property test for Ollama verification
    - **Property 21: Ollama Verification**
    - **Validates: Requirements 22.10**

  - [x] 18.3 Implement API key management for BYOK tier
    - Create APIKeyManager component
    - Implement secure encrypted storage
    - Support multiple AI providers: OpenAI, Google Gemini, Mistral AI, DeepSeek
    - Implement API key validation
    - Allow provider selection
    - _Requirements: 22.12, 22.13, 22.14, 22.15_

  - [x] 18.4 Write property test for API key encryption
    - **Property 12: API Key Encryption**
    - **Validates: Requirements 22.13**

  - [x] 18.5 Write property test for API key validation
    - **Property 13: API Key Validation**
    - **Validates: Requirements 22.14**

  - [x] 18.6 Implement Hosted AI service integration
    - Create HostedAIService
    - Implement AI query endpoints
    - Handle subscription-based access
    - _Requirements: 22.16, 22.17_

  - [x] 18.7 Create AIIntegrationService
    - Implement explainMetric() with visual annotations
    - Implement analyzeChart() with key points
    - Implement answerQuestion() with context
    - Implement validateAPIKey()
    - Implement setAIProvider()
    - _Requirements: 22.18, 22.19, 22.20, 22.21, 22.22, 22.23_

  - [x] 18.8 Write unit tests for AI integration
    - Test Ollama connection
    - Test API key validation
    - Test provider switching
    - Test visual annotations
    - _Requirements: 22.10, 22.14, 22.18, 22.19_

- [x] 19. Checkpoint - Subscription and AI features
  - Ensure all tests pass, ask the user if questions arise.

- [x] 20. Sectors Hub
  - [x] 20.1 Create SectorHub component
    - Display all 11 sectors: Technology, Financial, Consumer Discretionary, Communication, Healthcare, Industrials, Consumer Staples, Energy, Materials, Real Estate, Utilities
    - Fetch sector performance data
    - Display performance metrics with percentage change
    - Color-code sectors: green for positive, red for negative
    - _Requirements: 23.1, 23.2, 23.3, 23.4_

  - [x] 20.2 Implement sector comparison functionality
    - Add side-by-side comparison view
    - Display relative performance metrics
    - Support configurable time periods (1D, 1W, 1M, 3M, 1Y, YTD)
    - _Requirements: 23.5, 23.6, 23.7_

  - [x] 20.3 Add sector interaction features
    - Implement hover tooltips with detailed info
    - Navigate to detailed sector view on click
    - Display constituent stocks in sector view
    - Add visual representation of relative strength
    - Implement sorting by performance
    - _Requirements: 23.8, 23.9, 23.11, 23.12_

  - [x] 20.4 Implement sector data refresh
    - Auto-update sector data at configurable intervals
    - _Requirements: 23.10_

  - [x] 20.5 Write unit tests for SectorHub
    - Test sector display
    - Test comparison view
    - Test time period selection
    - Test sorting
    - _Requirements: 23.1, 23.5, 23.7, 23.12_

- [x] 21. Economic Calendar
  - [x] 21.1 Implement economic calendar API integration
    - Fetch economic events from CNN's economic-events endpoint
    - Parse event data: name, date, time, country, importance, description
    - _Requirements: 24.3, 24.4_

  - [x] 21.2 Create EconomicCalendar component
    - Display upcoming economic events
    - Show event name, date, time, and description
    - Implement country filter
    - Implement importance level filter (High, Medium, Low)
    - Apply filters to display matching events only
    - _Requirements: 24.4, 24.5, 24.6, 24.7_

  - [x] 21.3 Create calendar API route
    - Implement GET /api/calendar/economic with query params
    - Support country and importance filters
    - _Requirements: 24.3, 24.5, 24.6_

  - [x] 21.4 Write unit tests for EconomicCalendar
    - Test event display
    - Test country filter
    - Test importance filter
    - _Requirements: 24.4, 24.5, 24.6, 24.7_

- [x] 22. Earnings Calendar
  - [x] 22.1 Implement earnings calendar data fetching
    - Fetch earnings announcements
    - Parse company name, symbol, date, EPS estimates
    - _Requirements: 24.8_

  - [x] 22.2 Create EarningsCalendar component
    - Display upcoming earnings announcements
    - Show company name, symbol, announcement date
    - Display EPS estimates
    - Show actual vs estimated EPS when available
    - Display surprise amount and percentage
    - Show earnings call time when available
    - Color-code surprises: green for beats, red for misses
    - _Requirements: 24.8, 24.9, 24.10, 24.11, 24.12, 24.13_

  - [x] 22.3 Create earnings calendar API route
    - Implement GET /api/calendar/earnings with date range
    - _Requirements: 24.8_

  - [x] 22.4 Write unit tests for EarningsCalendar
    - Test earnings display
    - Test EPS comparison
    - Test surprise color coding
    - _Requirements: 24.8, 24.10, 24.13_

- [x] 23. Dividend Calendar
  - [x] 23.1 Implement dividend calendar data fetching
    - Fetch dividend payment information
    - Parse company name, symbol, amount, dates, yield
    - _Requirements: 24.14, 24.15_

  - [x] 23.2 Create DividendCalendar component
    - Display upcoming dividend payments
    - Show company name, symbol, dividend amount
    - Display ex-dividend date, payment date, yield
    - Implement time period sorting (week, month, quarter)
    - Implement country filter
    - Implement timezone filter
    - _Requirements: 24.14, 24.15, 24.16, 24.17, 24.18_

  - [x] 23.3 Create dividend calendar API route
    - Implement GET /api/calendar/dividends with filters
    - _Requirements: 24.14_

  - [x] 23.4 Write unit tests for DividendCalendar
    - Test dividend display
    - Test time period sorting
    - Test country filter
    - Test timezone filter
    - _Requirements: 24.14, 24.15, 24.16, 24.17, 24.18_

- [x] 24. IPO Calendar
  - [x] 24.1 Implement IPO calendar data fetching
    - Fetch upcoming IPO information
    - Parse company name, expected date, price range, shares, exchange
    - _Requirements: 24.19, 24.20, 24.21_

  - [x] 24.2 Create IPOCalendar component
    - Display upcoming IPOs
    - Show company name, expected listing date
    - Display price range and number of shares when available
    - Display exchange information
    - _Requirements: 24.19, 24.20, 24.21_

  - [x] 24.3 Create IPO calendar API route
    - Implement GET /api/calendar/ipos with date range
    - _Requirements: 24.19_

  - [x] 24.4 Write unit tests for IPOCalendar
    - Test IPO display
    - Test price range display
    - Test exchange display
    - _Requirements: 24.19, 24.20, 24.21_

- [x] 25. Calendar shared features
  - [x] 25.1 Implement calendar navigation component
    - Create navigation to switch between calendar types
    - _Requirements: 24.2_

  - [x] 25.2 Add date range selection to all calendars
    - Implement date range picker
    - Highlight today's date
    - _Requirements: 24.22, 24.23_

  - [x] 25.3 Add symbol navigation from calendar entries
    - Navigate to symbol detail page on click
    - _Requirements: 24.24_

  - [x] 25.4 Write unit tests for calendar navigation
    - Test calendar type switching
    - Test date range selection
    - Test symbol navigation
    - _Requirements: 24.2, 24.22, 24.24_

- [x] 26. Checkpoint - Calendars complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 27. Heatmap infrastructure
  - [x] 27.1 Create base HeatmapComponent
    - Render data in grid of tiles
    - Color-code tiles based on performance (green positive, red negative)
    - Vary color intensity based on magnitude
    - Display symbol and percentage change on each tile
    - Implement responsive tile sizing
    - Display legend explaining color coding
    - _Requirements: 25.3, 25.4, 25.5, 25.6, 25.16, 25.19_

  - [x] 27.2 Add heatmap interactivity
    - Display tooltip with detailed info on hover
    - Navigate to asset detail page on click
    - _Requirements: 25.14, 25.15_

  - [x] 27.3 Add heatmap time period selection
    - Support time periods: 1D, 1W, 1M, 3M, 1Y
    - Update colors and values when period changes
    - _Requirements: 25.12, 25.13_

  - [x] 27.4 Add heatmap filtering and sorting
    - Implement filtering options
    - Implement sorting: by performance, market cap, volume
    - _Requirements: 25.17, 25.18_

  - [x] 27.5 Implement heatmap auto-refresh
    - Update data at configurable intervals
    - _Requirements: 25.20_

  - [x] 27.6 Write unit tests for HeatmapComponent
    - Test tile rendering
    - Test color coding
    - Test time period changes
    - Test filtering and sorting
    - _Requirements: 25.3, 25.4, 25.5, 25.12, 25.17, 25.18_

- [x] 28. ETF Heatmap
  - [x] 28.1 Implement ETF data fetching
    - Fetch ETF performance data
    - Group by category or sector
    - _Requirements: 25.7_

  - [x] 28.2 Create ETFHeatmap component
    - Extend HeatmapComponent for ETFs
    - Display ETFs grouped by category/sector
    - _Requirements: 25.1, 25.7_

  - [x] 28.3 Write unit tests for ETFHeatmap
    - Test ETF display
    - Test category grouping
    - _Requirements: 25.7_

- [x] 29. Crypto Heatmap
  - [x] 29.1 Implement crypto data fetching
    - Fetch cryptocurrency performance data
    - _Requirements: 25.8_

  - [x] 29.2 Create CryptoHeatmap component
    - Extend HeatmapComponent for crypto
    - Display cryptocurrency assets with current performance
    - _Requirements: 25.1, 25.8_

  - [x] 29.3 Write unit tests for CryptoHeatmap
    - Test crypto display
    - Test performance display
    - _Requirements: 25.8_

- [x] 30. Stock Heatmap
  - [x] 30.1 Implement stock heatmap data fetching
    - Fetch stock performance data
    - Group by sector
    - _Requirements: 25.9_

  - [x] 30.2 Create StockHeatmap component
    - Extend HeatmapComponent for stocks
    - Display in TradingView style
    - Group by sector
    - _Requirements: 25.1, 25.9_

  - [x] 30.3 Write unit tests for StockHeatmap
    - Test stock display
    - Test sector grouping
    - Test TradingView style
    - _Requirements: 25.9_

- [x] 31. Matrix Heatmap
  - [x] 31.1 Implement matrix heatmap layout
    - Create matrix format: rows = symbols/sectors, columns = time periods/metrics
    - Color-code cells based on return values or metric values
    - _Requirements: 25.10, 25.11_

  - [x] 31.2 Create MatrixHeatmap component
    - Extend HeatmapComponent for matrix format
    - Support configurable row and column definitions
    - _Requirements: 25.1, 25.10, 25.11_

  - [x] 31.3 Write unit tests for MatrixHeatmap
    - Test matrix layout
    - Test cell color coding
    - _Requirements: 25.10, 25.11_

- [x] 32. Heatmap navigation
  - [x] 32.1 Create heatmap navigation component
    - Allow switching between ETF, Crypto, and Stock heatmaps
    - _Requirements: 25.2_

  - [x] 32.2 Write unit tests for heatmap navigation
    - Test heatmap type switching
    - _Requirements: 25.2_

- [x] 33. Asset Screener infrastructure
  - [x] 33.1 Implement screener filter logic
    - Create ScreenerFilter interface implementation
    - Support operators: gt, lt, eq, gte, lte, between, in
    - Implement filter matching logic
    - _Requirements: 26.1, 26.8_

  - [x] 33.2 Write property test for screener filter conjunction
    - **Property 17: Screener Filter Conjunction**
    - **Validates: Requirements 26.8**

  - [x] 33.3 Implement screener data fetching
    - Fetch asset data with all relevant metrics
    - Apply filters to results
    - Calculate valuation context (overpriced/underpriced/fair)
    - _Requirements: 26.8, 26.18_

  - [x] 33.4 Create screener API routes
    - Implement POST /api/screener/search
    - Implement GET /api/screener/presets
    - Implement POST /api/screener/presets
    - Implement GET /api/screener/export
    - _Requirements: 26.1, 26.12, 26.15, 26.20_

  - [x] 33.5 Write unit tests for screener API
    - Test filter application
    - Test preset loading
    - Test preset saving
    - Test export functionality
    - _Requirements: 26.8, 26.12, 26.15, 26.20_

- [x] 34. Asset Screener UI
  - [x] 34.1 Create AssetScreener component
    - Implement filter selection interface
    - Support filtering by valuation metrics (P/E, P/B, PEG)
    - Support filtering by growth metrics (revenue growth, earnings growth)
    - Support filtering by dividend metrics (yield, payout ratio)
    - Support filtering by sector
    - Support filtering by market cap ranges
    - Support filtering by volume and liquidity
    - Display number of matching assets
    - Add tooltips explaining each filter
    - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.7, 26.14, 26.24_

  - [x] 34.2 Implement screener table view
    - Display results in sortable table
    - Show key metrics: price, change %, volume, market cap
    - Allow sorting by any column
    - Color-code based on valuation context
    - Implement pagination for >50 results
    - Navigate to asset detail on click
    - _Requirements: 26.9, 26.16, 26.18, 26.19, 26.21, 26.22_

  - [x] 34.3 Implement screener heatmap view
    - Integrate HeatmapComponent for results
    - Add mini charts for each asset
    - Allow toggle between table and heatmap view
    - _Requirements: 26.10, 26.11, 26.17_

  - [x] 34.4 Implement screener presets
    - Create 7 default presets: Most Active Penny Stocks, Undervalued Growth Stocks, Day Gainers, Most Shorted Stocks, Undervalued Large Caps, Aggressive Small Caps
    - Allow preset selection
    - Apply preset filter combinations
    - Allow saving custom presets
    - _Requirements: 26.12, 26.13, 26.15_

  - [x] 34.5 Write property test for screener preset application
    - **Property 18: Screener Preset Application**
    - **Validates: Requirements 26.13**

  - [x] 34.6 Write property test for custom preset round trip
    - **Property 20: Custom Preset Round Trip**
    - **Validates: Requirements 26.15**

  - [x] 34.7 Implement screener state persistence
    - Persist filter selections in browser storage
    - Restore filters on page refresh
    - _Requirements: 26.23_

  - [x] 34.8 Write property test for screener state persistence
    - **Property 19: Screener State Persistence**
    - **Validates: Requirements 26.23**

  - [x] 34.9 Implement screener auto-refresh
    - Update results when market data refreshes
    - _Requirements: 26.25_

  - [x] 34.10 Write unit tests for AssetScreener
    - Test filter selection
    - Test table view
    - Test heatmap view
    - Test preset selection
    - Test custom preset saving
    - Test state persistence
    - _Requirements: 26.1, 26.9, 26.10, 26.12, 26.15, 26.23_

- [x] 35. Checkpoint - Heatmaps and Screener complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 36. Database integration
  - [ ] 36.1 Implement DatabaseService
    - Connect to existing Appwrite database
    - Implement user preferences storage and retrieval
    - Implement watchlist storage and retrieval
    - Implement market data caching in database
    - Handle connection errors gracefully
    - Log errors and return appropriate responses
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]\* 36.2 Write unit tests for DatabaseService
    - Test connection handling
    - Test preferences CRUD operations
    - Test watchlist operations
    - Test error handling
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 37. Responsive design implementation
  - [x] 37.1 Implement mobile layouts (320px-768px)
    - Adapt all components for mobile screens
    - Ensure touch-friendly controls
    - Test on various mobile devices
    - _Requirements: 13.1, 13.5_

  - [x] 37.2 Implement tablet layouts (768px-1024px)
    - Adapt all components for tablet screens
    - Optimize chart sizes for tablets
    - _Requirements: 13.2, 13.4_

  - [x] 37.3 Implement desktop layouts (>1024px)
    - Ensure optimal layout for large screens
    - Maximize chart visibility
    - _Requirements: 13.3, 13.4_

  - [x] 37.4 Write unit tests for responsive design
    - Test mobile breakpoints
    - Test tablet breakpoints
    - Test desktop breakpoints
    - Test touch controls
    - _Requirements: 13.1, 13.2, 13.3, 13.5_

- [x] 38. Error handling and loading states
  - [x] 38.1 Implement loading indicators
    - Create loading spinner component
    - Add loading states to all data-fetching components
    - _Requirements: 14.1_

  - [x] 38.2 Implement error messages
    - Create error message component
    - Display user-friendly messages for API failures
    - Display "Symbol not found" for invalid symbols
    - Display connectivity error for network issues
    - _Requirements: 14.2, 14.3, 14.4_

  - [x] 38.3 Add retry functionality
    - Add retry buttons to all error states
    - Preserve user context during retry
    - _Requirements: 14.5_

  - [x] 38.4 Write unit tests for error handling
    - Test loading indicators
    - Test error message display
    - Test retry functionality
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 39. Performance optimization
  - [x] 39.1 Implement code splitting
    - Configure route-based lazy loading
    - Split large components into chunks
    - _Requirements: 15.2_

  - [x] 39.2 Optimize static assets
    - Configure cache headers for static assets
    - Optimize images for web delivery
    - Compress images and use modern formats (WebP, AVIF)
    - _Requirements: 15.3, 15.4_

  - [x] 39.3 Minimize bundle size
    - Remove unused dependencies
    - Analyze bundle with webpack-bundle-analyzer
    - Tree-shake unused code
    - _Requirements: 15.5_

  - [x] 39.4 Run Lighthouse performance audit
    - Achieve performance score >80
    - Optimize based on Lighthouse recommendations
    - _Requirements: 15.1_

  - [x] 39.5 Write performance tests
    - Test bundle size limits
    - Test lazy loading behavior
    - _Requirements: 15.2, 15.5_

- [x] 40. Accessibility implementation
  - [x] 40.1 Add alt text and ARIA labels
    - Add alt text for all images and icons
    - Add ARIA labels for dynamic content and charts
    - Ensure screen readers can announce loading states and errors
    - _Requirements: 18.1, 18.4, 18.5_

  - [x] 40.2 Implement keyboard navigation
    - Support keyboard navigation for all interactive elements
    - Add focus indicators
    - Test tab order
    - _Requirements: 18.2_

  - [x] 40.3 Ensure color contrast compliance
    - Maintain contrast ratios ≥4.5:1 for text
    - Test with color contrast analyzer
    - _Requirements: 18.3_

  - [x] 40.4 Run accessibility audit
    - Use axe-core to test WCAG 2.1 Level AA compliance
    - Fix all critical accessibility issues
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [x] 41. Deployment configuration
  - [x] 41.1 Configure Vercel deployment
    - Set up Vercel project
    - Configure environment variables for production
    - Configure custom domain if provided
    - Enable automatic deployments from main branch
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

  - [x] 41.2 Configure Vercel edge network
    - Optimize for edge network performance
    - Configure edge functions if needed
    - _Requirements: 16.3_

  - [x]\* 41.3 Test deployment
    - Deploy to staging environment
    - Verify all features work in production
    - Test environment variable configuration
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 42. Shared UI components and layout
  - [x] 42.1 Create Layout component
    - Implement main layout with header, navigation, and content area
    - Add trial banner integration
    - Add navigation menu
    - _Requirements: 13.1, 13.2, 13.3_

  - [x] 42.2 Create Navigation component
    - Implement main navigation menu
    - Add links to all major sections: Home, Sectors, Calendars, Heatmaps, Screener, Pricing
    - Add symbol search in navigation
    - Make responsive for mobile
    - _Requirements: 2.1, 13.1_

  - [x] 42.3 Create Tooltip component
    - Implement reusable tooltip for metric explanations
    - Support hover and focus triggers
    - Make accessible with ARIA
    - _Requirements: 4.5, 5.3, 6.5, 8.5_

  - [x] 42.4 Create ErrorBoundary component
    - Catch React errors
    - Display fallback UI
    - Log errors
    - _Requirements: 14.2_

  - [x] 42.5 Write unit tests for shared components
    - Test Layout rendering
    - Test Navigation links
    - Test Tooltip display
    - Test ErrorBoundary
    - _Requirements: 13.1, 14.2_

- [x] 43. Home page
  - [x] 43.1 Create home page layout
    - Implement / route
    - Display Fear & Greed Index
    - Display World Markets overview
    - Add symbol search
    - Add quick links to major sections
    - _Requirements: 9.1, 10.1_

  - [x]\* 43.2 Write unit tests for home page
    - Test component rendering
    - Test navigation links
    - _Requirements: 9.1, 10.1_

- [ ] 44. Final integration and testing
  - [ ] 44.1 Integration testing with Playwright
    - Test end-to-end authentication flows
    - Test trial session lifecycle
    - Test subscription purchase flows
    - Test multi-page navigation
    - _Requirements: 1.1, 21.1, 22.8_

  - [ ] 44.2 Cross-browser testing
    - Test on Chrome, Firefox, Safari, Edge
    - Fix browser-specific issues
    - _Requirements: 13.1, 13.2, 13.3_

  - [ ] 44.3 Performance testing
    - Run Lighthouse CI
    - Run WebPageTest
    - Verify performance targets met
    - _Requirements: 15.1_

  - [ ] 44.4 Security review
    - Review API key storage security
    - Review authentication implementation
    - Test for common vulnerabilities
    - _Requirements: 22.13_

  - [ ] 44.5 Documentation
    - Complete README with setup instructions
    - Document API endpoints
    - Document environment variables
    - Document deployment process
    - _Requirements: 19.5_

- [ ] 45. Final checkpoint - Production ready
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- The implementation uses TypeScript throughout as specified in the design document
- All 22 correctness properties from the design are included as property-based test tasks
- Checkpoints are placed at logical breaks to validate incremental progress
- Property tests use fast-check library with minimum 100 iterations
- The application integrates with existing Appwrite infrastructure for auth and database
- External API integrations include CNN dataviz and Yahoo Finance
- Five pricing tiers are supported: Free (with ads), Ads-free, Local (Ollama), BYOK, Hosted AI
- The screener includes 7 preset configurations for common screening scenarios
- All calendar types (Economic, Earnings, Dividend, IPO) are implemented with appropriate filters
- Three heatmap types (ETF, Crypto, Stock) plus Matrix format are supported
- Responsive design covers mobile (320px-768px), tablet (768px-1024px), and desktop (>1024px)
- Accessibility compliance targets WCAG 2.1 Level AA
- Performance target is Lighthouse score >80
- Deployment is configured for Vercel with automatic deployments from main branch

## Version Management

⚠️ **CRITICAL - MUST BE DONE AFTER EVERY TASK** ⚠️

After completing each task, you MUST:

1. **Write unit tests** (Vitest) for all components - REQUIRED, not optional
2. **Write e2e tests** (Playwright) for all user-facing components - REQUIRED, not optional
3. **Bump the version** in `package.json`:
   - Patch version (0.0.x) for bug fixes and minor updates
   - Minor version (0.x.0) for new features and task completions
   - Major version (x.0.0) for breaking changes or major milestones

Example: After completing task 6, bump from 0.2.0 → 0.3.0

**Note**: Tasks marked with `*` (e.g., `[ ]*`) are optional property-based tests. All other tests are REQUIRED.
