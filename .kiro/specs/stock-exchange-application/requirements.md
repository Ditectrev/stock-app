# Requirements Document

## Introduction

This document defines requirements for a stock exchange application designed for individual long-term investors. The application provides visualized market data, technical indicators, forecasts, and seasonal patterns with plain-language explanations to help users make informed investment decisions. The system integrates with existing Appwrite database infrastructure and authentication (Apple/Google/Email SSO), leverages Next.js for the frontend, and deploys on Vercel.

## Glossary

- **Stock_Exchange_App**: The complete web application system including frontend, backend, and integrations
- **User**: An individual investor using the application to view market data and analysis
- **Symbol**: A stock ticker identifier (e.g., TSLA, AAPL, NVDA)
- **Market_Data_Service**: Backend service responsible for fetching and caching data from external APIs
- **Chart_Component**: Frontend component that renders financial charts and visualizations
- **Authentication_Service**: Existing Appwrite-based authentication system supporting Apple SSO/Google SSO/Email OTP
- **Database_Service**: Existing Appwrite database infrastructure
- **Technical_Indicator**: A calculated metric used to analyze price movements (e.g., RSI, MACD, Moving Averages)
- **Forecast_Data**: Analyst predictions including price targets, ratings, and earnings estimates
- **Seasonal_Pattern**: Historical performance data aggregated by month across multiple years
- **Fear_Greed_Index**: CNN's market sentiment indicator ranging from 0 (Extreme Fear) to 100 (Extreme Greed)
- **Tooltip**: Contextual help text explaining what a metric means and how to interpret it
- **Valuation_Context**: Visual indication (red/green/gray) showing whether an asset appears overpriced, underpriced, or fairly priced
- **Trial_Session**: A temporary 15-minute access period allowing unauthenticated users to explore the application, tracked with start_time, end_time, is_active flag, and device_fingerprint
- **Trial_Timer**: Component tracking and displaying remaining trial time
- **Device_Fingerprint**: A unique identifier generated from browser characteristics to track devices and prevent trial abuse
- **IP_Tracking**: System for capturing user IP addresses to enforce trial limits across sessions
- **OAuth_Callback**: Handler for processing authentication responses from Apple SSO and Google SSO providers
- **Magic_URL**: Email-based authentication link containing a one-time password for passwordless login
- **Trial_Enforcement**: System combining device fingerprinting and IP tracking to prevent users from bypassing trial limits
- **Pricing_Tier**: A subscription level defining access rights and features (Free, Ads-free, Local, BYOK, Hosted AI)
- **Ads_Service**: System responsible for displaying advertisements in the Free tier
- **Subscription_Service**: System managing user subscriptions and payment processing
- **Ollama_Integration**: Local AI service running on the user's device for privacy-focused AI features
- **BYOK**: Bring Your Own Key - functionality allowing users to provide their own API keys for AI providers
- **AI_Provider**: External AI service such as OpenAI, Google Gemini, Mistral AI, or DeepSeek
- **Hosted_AI_Service**: Platform-managed AI infrastructure providing integrated AI features
- **AI_Visual_Integration**: System that connects AI explanations to visual elements like charts, graphs, and metrics
- **Pricing_Page**: Dedicated page displaying all available pricing tiers and their features
- **API_Key_Manager**: Component for securely storing and managing user-provided API keys
- **Sector_Hub**: Component displaying sector comparison and performance metrics across market sectors
- **Sector**: A market category grouping companies by industry (Technology, Financial, Consumer Discretionary, Communication, Healthcare, Industrials, Consumer Staples, Energy, Materials, Real Estate, Utilities)
- **Economic_Calendar**: Calendar displaying upcoming economic events with country and importance filters
- **Earnings_Calendar**: Calendar showing upcoming earnings announcements with EPS estimates and actual results
- **Dividend_Calendar**: Calendar displaying dividend payment information including amount, ex-dividend date, payment date, and yield
- **IPO_Calendar**: Calendar showing upcoming initial public offerings with relevant details
- **Heatmap_Component**: Visual component displaying data in a grid format with color-coded cells representing performance or values
- **ETF_Heatmap**: Heatmap visualization specifically for exchange-traded funds
- **Crypto_Heatmap**: Heatmap visualization specifically for cryptocurrency assets
- **Stock_Heatmap**: Heatmap visualization for stock performance in TradingView style
- **Matrix_Heatmap**: Heatmap format where rows represent symbols or sectors and columns represent time periods or metrics
- **Asset_Screener**: Tool for searching and filtering assets based on multiple criteria
- **Screener_Preset**: Pre-configured filter combination for common screening scenarios
- **Screener_Filter**: Individual criterion used to narrow down asset search results

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to sign in using Apple SSO, Google SSO, or Email OTP, so that I can access the application securely using my preferred method.

#### Acceptance Criteria

1. THE Authentication_Service SHALL integrate with the existing Appwrite authentication solution
2. WHEN a user selects Apple SSO, THE Authentication_Service SHALL authenticate via Apple Sign-In
3. WHEN a user selects Google SSO, THE Authentication_Service SHALL authenticate via Google Sign-In
4. WHEN a user selects Email authentication, THE Authentication_Service SHALL authenticate via email OTP
5. WHEN authentication succeeds, THE Authentication_Service SHALL create or retrieve the user session
6. WHEN authentication fails, THE Authentication_Service SHALL display a descriptive error message

### Requirement 2: Symbol Search and Navigation

**User Story:** As a user, I want to search for stocks by ticker symbol, so that I can view detailed information about specific companies.

#### Acceptance Criteria

1. THE Stock_Exchange_App SHALL provide a search input for entering ticker symbols
2. WHEN a user types in the search input, THE Stock_Exchange_App SHALL suggest matching symbols
3. WHEN a user selects a symbol, THE Stock_Exchange_App SHALL navigate to that symbol's detail page
4. THE Stock_Exchange_App SHALL display the symbol detail page with tabs for Overview, Financials, Technicals, Forecasts, and Seasonals

### Requirement 3: Market Data Retrieval

**User Story:** As a user, I want to see current market data for stocks, so that I can understand their current price and performance.

#### Acceptance Criteria

1. WHEN a symbol page loads, THE Market_Data_Service SHALL fetch current price data from external APIs
2. THE Market_Data_Service SHALL support CNN dataviz endpoints as a data source
3. THE Market_Data_Service SHALL support Yahoo Finance endpoints as a data source
4. THE Market_Data_Service SHALL cache fetched data to reduce API calls
5. WHEN API data is unavailable, THE Market_Data_Service SHALL display a user-friendly error message
6. THE Market_Data_Service SHALL refresh price data at configurable intervals

### Requirement 4: Overview Tab Display

**User Story:** As a user, I want to see an overview of a stock's performance, so that I can quickly assess its current state.

#### Acceptance Criteria

1. THE Stock_Exchange_App SHALL display a price chart showing historical performance
2. THE Chart_Component SHALL support time range selection (1D, 1W, 1M, 3M, 1Y, 5Y, Max)
3. THE Stock_Exchange_App SHALL display current price, change amount, and change percentage
4. THE Stock_Exchange_App SHALL display key metrics including market cap, volume, and 52-week range
5. WHEN a user hovers over a metric, THE Stock_Exchange_App SHALL display a tooltip explaining the metric

### Requirement 5: Technical Indicators Display

**User Story:** As a user, I want to see technical indicators with explanations, so that I can understand what they mean and whether the stock appears overpriced or underpriced.

#### Acceptance Criteria

1. THE Stock_Exchange_App SHALL display technical indicators including RSI, MACD, Moving Averages, and Bollinger Bands
2. THE Stock_Exchange_App SHALL calculate indicator values from price data
3. WHEN a user hovers over an indicator name, THE Stock_Exchange_App SHALL display a tooltip explaining what the indicator measures
4. THE Stock_Exchange_App SHALL color-code each indicator: red for overpriced, green for underpriced, gray for fairly priced
5. THE Stock_Exchange_App SHALL display a summary gauge showing overall technical sentiment
6. THE Stock_Exchange_App SHALL NOT use "Buy" or "Sell" language in indicator descriptions

### Requirement 6: Forecast Data Display

**User Story:** As a user, I want to see analyst forecasts and price targets, so that I can understand market expectations for a stock.

#### Acceptance Criteria

1. THE Stock_Exchange_App SHALL display analyst price targets including low, average, and high estimates
2. THE Stock_Exchange_App SHALL display analyst rating distribution (Strong Buy, Buy, Hold, Sell, Strong Sell)
3. THE Stock_Exchange_App SHALL display EPS and revenue forecasts with actual vs estimate comparisons
4. WHEN earnings data includes surprises, THE Stock_Exchange_App SHALL indicate whether the company beat or missed estimates
5. WHEN a user hovers over forecast metrics, THE Stock_Exchange_App SHALL display tooltips explaining the metrics

### Requirement 7: Seasonal Pattern Display

**User Story:** As a user, I want to see historical seasonal patterns, so that I can identify recurring monthly trends.

#### Acceptance Criteria

1. THE Stock_Exchange_App SHALL display a heatmap showing cumulative returns by month across multiple years
2. THE Stock_Exchange_App SHALL calculate seasonal patterns from historical price data
3. THE Stock_Exchange_App SHALL display a disclaimer that past seasonality does not guarantee future performance
4. WHEN a user hovers over a month cell, THE Stock_Exchange_App SHALL display the specific return percentage for that month and year

### Requirement 8: Financials Tab Display

**User Story:** As a user, I want to see financial statements and key metrics, so that I can evaluate a company's financial health.

#### Acceptance Criteria

1. THE Stock_Exchange_App SHALL display key financial facts including revenue, net income, and profit margins
2. THE Stock_Exchange_App SHALL display valuation metrics including P/E ratio, P/B ratio, and PEG ratio
3. THE Stock_Exchange_App SHALL display growth metrics including revenue growth and earnings growth
4. THE Stock_Exchange_App SHALL display profitability metrics including ROE, ROA, and operating margin
5. WHEN a user hovers over financial metrics, THE Stock_Exchange_App SHALL display tooltips explaining the metrics
6. THE Stock_Exchange_App SHALL color-code metrics to indicate favorable vs unfavorable values

### Requirement 9: Fear and Greed Index Display

**User Story:** As a user, I want to see the market Fear and Greed Index, so that I can gauge overall market sentiment.

#### Acceptance Criteria

1. THE Stock_Exchange_App SHALL display the current Fear and Greed Index value from CNN
2. THE Stock_Exchange_App SHALL display a gauge visualization showing the index on a 0-100 scale
3. THE Stock_Exchange_App SHALL display a timeline showing historical Fear and Greed values
4. THE Stock_Exchange_App SHALL label index ranges as Extreme Fear, Fear, Neutral, Greed, or Extreme Greed
5. WHEN a user hovers over the gauge, THE Stock_Exchange_App SHALL display a tooltip explaining what the index measures

### Requirement 10: World Markets Overview

**User Story:** As a user, I want to see global market performance, so that I can understand how different regions are performing.

#### Acceptance Criteria

1. THE Stock_Exchange_App SHALL display major market indices by region (Americas, Asia-Pacific, Europe)
2. THE Stock_Exchange_App SHALL display current values and percentage changes for each index
3. THE Stock_Exchange_App SHALL color-code indices based on positive or negative performance
4. THE Stock_Exchange_App SHALL fetch world market data from CNN dataviz endpoints
5. THE Stock_Exchange_App SHALL update world market data at configurable intervals

### Requirement 11: Chart Library Integration

**User Story:** As a developer, I want to integrate a charting library, so that I can render financial visualizations consistently.

#### Acceptance Criteria

1. THE Stock_Exchange_App SHALL integrate a charting library for rendering price charts
2. THE Chart_Component SHALL support line charts, area charts, and candlestick charts
3. THE Chart_Component SHALL support interactive features including zoom, pan, and crosshair
4. THE Chart_Component SHALL support responsive sizing for mobile and desktop displays
5. THE Chart_Component SHALL render charts with consistent styling across the application

### Requirement 12: Database Integration

**User Story:** As a developer, I want to integrate with the existing Appwrite database, so that I can store user preferences and cached data.

#### Acceptance Criteria

1. THE Database_Service SHALL connect to the existing Appwrite database instance
2. THE Database_Service SHALL store user watchlists and preferences
3. THE Database_Service SHALL cache frequently accessed market data
4. THE Database_Service SHALL handle connection errors gracefully
5. WHEN database operations fail, THE Database_Service SHALL log errors and return appropriate error responses

### Requirement 13: Responsive Design

**User Story:** As a user, I want the application to work on mobile and desktop devices, so that I can access market data from any device.

#### Acceptance Criteria

1. THE Stock_Exchange_App SHALL render correctly on mobile devices with screen widths from 320px to 768px
2. THE Stock_Exchange_App SHALL render correctly on tablet devices with screen widths from 768px to 1024px
3. THE Stock_Exchange_App SHALL render correctly on desktop devices with screen widths above 1024px
4. THE Stock_Exchange_App SHALL adapt chart sizes and layouts based on screen size
5. THE Stock_Exchange_App SHALL provide touch-friendly controls on mobile devices

### Requirement 14: Error Handling and Loading States

**User Story:** As a user, I want to see clear feedback when data is loading or when errors occur, so that I understand the application's state.

#### Acceptance Criteria

1. WHEN data is loading, THE Stock_Exchange_App SHALL display loading indicators
2. WHEN API requests fail, THE Stock_Exchange_App SHALL display user-friendly error messages
3. WHEN a symbol is not found, THE Stock_Exchange_App SHALL display a "Symbol not found" message
4. WHEN network connectivity is lost, THE Stock_Exchange_App SHALL display a connectivity error message
5. THE Stock_Exchange_App SHALL allow users to retry failed operations

### Requirement 15: Performance Optimization

**User Story:** As a user, I want the application to load quickly, so that I can access market data without delays.

#### Acceptance Criteria

1. THE Stock_Exchange_App SHALL achieve a Lighthouse performance score above 80
2. THE Stock_Exchange_App SHALL implement code splitting for route-based lazy loading
3. THE Stock_Exchange_App SHALL cache static assets with appropriate cache headers
4. THE Stock_Exchange_App SHALL optimize images for web delivery
5. THE Stock_Exchange_App SHALL minimize bundle size by removing unused dependencies

### Requirement 16: Deployment Configuration

**User Story:** As a developer, I want to deploy the application to Vercel, so that it is accessible to users with minimal infrastructure management.

#### Acceptance Criteria

1. THE Stock_Exchange_App SHALL deploy to Vercel using the Next.js framework
2. THE Stock_Exchange_App SHALL configure environment variables for API keys and database credentials
3. THE Stock_Exchange_App SHALL use Vercel's edge network for optimal performance
4. THE Stock_Exchange_App SHALL configure custom domain settings if provided
5. THE Stock_Exchange_App SHALL enable automatic deployments from the main branch

### Requirement 17: API Rate Limiting and Caching

**User Story:** As a developer, I want to implement rate limiting and caching, so that I stay within API quotas and reduce costs.

#### Acceptance Criteria

1. THE Market_Data_Service SHALL implement rate limiting for external API calls
2. THE Market_Data_Service SHALL cache API responses with appropriate TTL values
3. THE Market_Data_Service SHALL track API usage and log when approaching rate limits
4. WHEN rate limits are exceeded, THE Market_Data_Service SHALL serve cached data if available
5. THE Market_Data_Service SHALL implement exponential backoff for failed API requests

### Requirement 18: Accessibility Compliance

**User Story:** As a user with accessibility needs, I want the application to be usable with assistive technologies, so that I can access market data independently.

#### Acceptance Criteria

1. THE Stock_Exchange_App SHALL provide alt text for all images and icons
2. THE Stock_Exchange_App SHALL support keyboard navigation for all interactive elements
3. THE Stock_Exchange_App SHALL maintain color contrast ratios of at least 4.5:1 for text
4. THE Stock_Exchange_App SHALL provide ARIA labels for dynamic content and charts
5. THE Stock_Exchange_App SHALL ensure screen readers can announce loading states and errors

### Requirement 19: Configuration Management

**User Story:** As a developer, I want to manage configuration settings centrally, so that I can easily adjust API endpoints, cache durations, and feature flags.

#### Acceptance Criteria

1. THE Stock_Exchange_App SHALL store configuration in environment variables
2. THE Stock_Exchange_App SHALL support different configurations for development, staging, and production
3. THE Stock_Exchange_App SHALL validate required environment variables on startup
4. WHEN required configuration is missing, THE Stock_Exchange_App SHALL fail startup with a descriptive error
5. THE Stock_Exchange_App SHALL document all configuration options in a README or configuration guide

### Requirement 20: Logging and Monitoring

**User Story:** As a developer, I want to log application events and errors, so that I can diagnose issues and monitor application health.

#### Acceptance Criteria

1. THE Stock_Exchange_App SHALL log API requests and responses with timestamps
2. THE Stock_Exchange_App SHALL log errors with stack traces and context
3. THE Stock_Exchange_App SHALL log user authentication events
4. THE Stock_Exchange_App SHALL integrate with Vercel's logging infrastructure
5. THE Stock_Exchange_App SHALL implement structured logging with consistent log levels (debug, info, warn, error)

### Requirement 21: 15-Minute Trial Access

**User Story:** As a potential user, I want to explore the application for 15 minutes without creating an account, so that I can evaluate its value before committing to sign up.

#### Acceptance Criteria

1. WHEN an unauthenticated user accesses the application, THE Stock_Exchange_App SHALL create a Trial_Session object containing start_time, end_time, is_active flag, and device_fingerprint
2. THE Stock_Exchange_App SHALL set the Trial_Session end_time to 15 minutes after start_time
3. THE Stock_Exchange_App SHALL generate a Device_Fingerprint from browser characteristics including user agent, screen resolution, timezone, and available plugins
4. THE Stock_Exchange_App SHALL store the Device_Fingerprint to track whether a device has previously used a trial
5. WHEN a device with an existing Device_Fingerprint attempts to start a new trial, THE Stock_Exchange_App SHALL prevent trial access and prompt for authentication
6. THE IP_Tracking SHALL attempt to retrieve the user's IP address from multiple IP service providers for reliability
7. WHEN IP service providers are unavailable, THE IP_Tracking SHALL fall back to localStorage-based identification
8. WHEN localStorage is unavailable, THE IP_Tracking SHALL use Device_Fingerprint combined with timestamp as identification
9. THE Trial_Timer SHALL display remaining trial time in minutes and seconds
10. THE Trial_Timer SHALL update the countdown display at least once per second
11. WHILE the Trial_Session is_active flag is true, THE Stock_Exchange_App SHALL allow full access to all features
12. WHEN the Trial_Session expires, THE Stock_Exchange_App SHALL set is_active to false and display an authentication prompt
13. THE Stock_Exchange_App SHALL offer three authentication methods: Apple SSO, Google SSO, and Email OTP via Magic_URL
14. WHEN a user selects Apple SSO, THE OAuth_Callback SHALL process the Apple authentication response
15. WHEN a user selects Google SSO, THE OAuth_Callback SHALL process the Google authentication response
16. WHEN a user selects Email OTP, THE Authentication_Service SHALL send a Magic_URL to the provided email address
17. WHEN a user authenticates successfully during or after a Trial_Session, THE Stock_Exchange_App SHALL terminate the trial and grant full authenticated access
18. THE Stock_Exchange_App SHALL persist Trial_Session state across page refreshes using browser storage
19. WHEN a user attempts to bypass trial limits using incognito mode, THE Trial_Enforcement SHALL detect the existing Device_Fingerprint and prevent trial access
20. THE Trial_Enforcement SHALL prevent multiple trials from the same device regardless of browser mode or cleared cookies

### Requirement 22: Pricing Tiers

**User Story:** As a user, I want to choose from multiple pricing tiers based on my needs for ad-free experience, privacy, cost control, and AI features, so that I can access the application in a way that aligns with my preferences and requirements.

#### Acceptance Criteria

1. THE Pricing_Page SHALL display all five pricing tiers: Free, Ads-free, Local, BYOK, and Hosted AI
2. THE Pricing_Page SHALL be accessible at the /pricing route
3. FOR EACH Pricing_Tier, THE Pricing_Page SHALL display the tier name, description, key features, and pricing information
4. THE Pricing_Page SHALL present pricing information in a clear comparison format similar to education.ditectrev.com/pricing
5. WHILE a user is on the Free tier, THE Ads_Service SHALL display advertisements within the application interface
6. THE Free tier SHALL provide full access to visualized markets, indicators, and metrics
7. THE Ads-free tier SHALL provide the same features as the Free tier without displaying advertisements
8. WHEN a user selects the Ads-free tier, THE Subscription_Service SHALL process payment and activate the subscription
9. THE Local tier SHALL integrate with Ollama_Integration to run AI features on the user's local machine
10. WHEN a user activates the Local tier, THE Ollama_Integration SHALL verify that Ollama is installed and accessible on the user's device
11. WHILE using the Local tier, THE Stock_Exchange_App SHALL NOT send user data to external AI services
12. THE BYOK tier SHALL allow users to provide API keys for multiple AI_Provider options including OpenAI, Google Gemini, Mistral AI, and DeepSeek
13. THE API_Key_Manager SHALL securely store user-provided API keys with encryption
14. WHEN a user provides an API key, THE API_Key_Manager SHALL validate the key with the corresponding AI_Provider
15. THE BYOK tier SHALL allow users to select which AI_Provider to use for AI features
16. THE Hosted AI tier SHALL provide AI features using the Hosted_AI_Service without requiring user-managed API keys
17. WHEN a user selects the Hosted AI tier, THE Subscription_Service SHALL process payment and activate the subscription
18. FOR ALL tiers with AI features (Local, BYOK, Hosted AI), THE AI_Visual_Integration SHALL connect AI explanations to specific visual elements
19. WHEN AI provides an explanation, THE AI_Visual_Integration SHALL highlight or annotate the relevant chart, graph, or metric
20. THE AI_Visual_Integration SHALL surface the appropriate visualization when responding to user queries
21. THE AI_Visual_Integration SHALL tie explanations to specific data points on timelines and charts
22. THE Stock_Exchange_App SHALL NOT limit AI features to text-based chat interfaces
23. THE Stock_Exchange_App SHALL provide visual representations of AI insights including annotated charts and highlighted metrics
24. WHEN a user changes Pricing_Tier, THE Stock_Exchange_App SHALL update feature access immediately
25. THE Stock_Exchange_App SHALL display the user's current Pricing_Tier in account settings
26. THE Subscription_Service SHALL support tier upgrades and downgrades
27. WHEN a user downgrades from a paid tier, THE Subscription_Service SHALL maintain access until the end of the current billing period

### Requirement 23: Sectors Hub

**User Story:** As a user, I want to view and compare sector performance, so that I can understand how different market sectors are performing relative to each other and identify sector trends.

#### Acceptance Criteria

1. THE Sector_Hub SHALL display all eleven market sectors: Technology, Financial, Consumer Discretionary, Communication, Healthcare, Industrials, Consumer Staples, Energy, Materials, Real Estate, and Utilities
2. THE Sector_Hub SHALL fetch sector performance data from available market data sources
3. FOR EACH Sector, THE Sector_Hub SHALL display current performance metrics including percentage change
4. THE Sector_Hub SHALL color-code sector performance with green for positive returns and red for negative returns
5. THE Sector_Hub SHALL provide a side-by-side comparison view allowing users to compare multiple sectors simultaneously
6. WHEN a user selects sectors for comparison, THE Sector_Hub SHALL display relative performance metrics for the selected sectors
7. THE Sector_Hub SHALL display sector performance over configurable time periods (1D, 1W, 1M, 3M, 1Y, YTD)
8. WHEN a user hovers over a sector, THE Sector_Hub SHALL display a tooltip with detailed sector information
9. WHEN a user clicks on a sector, THE Stock_Exchange_App SHALL navigate to a detailed sector view showing constituent stocks
10. THE Sector_Hub SHALL update sector data at configurable intervals
11. THE Sector_Hub SHALL display a visual representation showing relative sector strength
12. THE Sector_Hub SHALL sort sectors by performance when requested by the user

### Requirement 24: Calendars

**User Story:** As a user, I want to view economic events, earnings announcements, dividend payments, and upcoming IPOs in calendar format, so that I can plan my investment decisions around important market events.

#### Acceptance Criteria

1. THE Stock_Exchange_App SHALL provide four calendar types: Economic_Calendar, Earnings_Calendar, Dividend_Calendar, and IPO_Calendar
2. THE Stock_Exchange_App SHALL display calendar navigation allowing users to switch between calendar types
3. THE Economic_Calendar SHALL fetch economic event data from CNN's economic-events endpoint
4. THE Economic_Calendar SHALL display upcoming economic events with event name, date, time, and description
5. THE Economic_Calendar SHALL provide filters for country selection
6. THE Economic_Calendar SHALL provide filters for importance level (High, Medium, Low)
7. WHEN a user applies filters to the Economic_Calendar, THE Economic_Calendar SHALL display only events matching the selected criteria
8. THE Earnings_Calendar SHALL display upcoming earnings announcements with company name, symbol, and announcement date
9. THE Earnings_Calendar SHALL display EPS estimates for upcoming earnings
10. WHEN earnings results are available, THE Earnings_Calendar SHALL display actual EPS versus estimated EPS
11. WHEN actual EPS differs from estimated EPS, THE Earnings_Calendar SHALL display the surprise amount and percentage
12. THE Earnings_Calendar SHALL display earnings call time when available
13. THE Earnings_Calendar SHALL color-code earnings surprises with green for beats and red for misses
14. THE Dividend_Calendar SHALL display upcoming dividend payments with company name and symbol
15. THE Dividend_Calendar SHALL display dividend amount, ex-dividend date, payment date, and dividend yield
16. THE Dividend_Calendar SHALL allow sorting by time period (upcoming week, month, quarter)
17. THE Dividend_Calendar SHALL allow filtering by country
18. THE Dividend_Calendar SHALL allow filtering by timezone
19. THE IPO_Calendar SHALL display upcoming initial public offerings with company name and expected listing date
20. THE IPO_Calendar SHALL display IPO details including expected price range and number of shares when available
21. THE IPO_Calendar SHALL display the exchange where the IPO will be listed
22. FOR ALL calendar types, THE Stock_Exchange_App SHALL provide date range selection
23. FOR ALL calendar types, THE Stock_Exchange_App SHALL highlight today's date
24. WHEN a user clicks on a calendar entry with an associated symbol, THE Stock_Exchange_App SHALL navigate to that symbol's detail page

### Requirement 25: Heatmaps

**User Story:** As a user, I want to view market data in heatmap format, so that I can quickly identify performance patterns and see at-a-glance what assets are up or down.

#### Acceptance Criteria

1. THE Stock_Exchange_App SHALL provide three heatmap types: ETF_Heatmap, Crypto_Heatmap, and Stock_Heatmap
2. THE Stock_Exchange_App SHALL display heatmap navigation allowing users to switch between heatmap types
3. THE Heatmap_Component SHALL render data in a grid of tiles where each tile represents one asset
4. THE Heatmap_Component SHALL color-code tiles based on performance with green for positive returns and red for negative returns
5. THE Heatmap_Component SHALL vary color intensity based on the magnitude of performance change
6. THE Heatmap_Component SHALL display the asset symbol and percentage change on each tile
7. THE ETF_Heatmap SHALL display exchange-traded funds grouped by category or sector
8. THE Crypto_Heatmap SHALL display cryptocurrency assets with current performance
9. THE Stock_Heatmap SHALL display stock performance in TradingView style with sector grouping
10. THE Heatmap_Component SHALL support Matrix_Heatmap format where rows represent symbols or sectors and columns represent time periods or metrics
11. WHEN using Matrix_Heatmap format, THE Heatmap_Component SHALL color-code cells based on return values or metric values
12. THE Heatmap_Component SHALL provide time period selection (1D, 1W, 1M, 3M, 1Y)
13. WHEN a user changes the time period, THE Heatmap_Component SHALL update colors and values to reflect the selected period
14. WHEN a user hovers over a tile, THE Heatmap_Component SHALL display a tooltip with detailed asset information
15. WHEN a user clicks on a tile, THE Stock_Exchange_App SHALL navigate to that asset's detail page
16. THE Heatmap_Component SHALL resize tiles responsively based on screen size
17. THE Heatmap_Component SHALL provide filtering options to narrow down displayed assets
18. THE Heatmap_Component SHALL provide sorting options (by performance, by market cap, by volume)
19. THE Heatmap_Component SHALL display a legend explaining the color coding scheme
20. THE Heatmap_Component SHALL update heatmap data at configurable intervals

### Requirement 26: Asset Screener

**User Story:** As a user, I want to search and filter assets by multiple criteria, so that I can discover investment opportunities that match my specific requirements and valuation preferences.

#### Acceptance Criteria

1. THE Asset_Screener SHALL provide a search interface with multiple Screener_Filter options
2. THE Asset_Screener SHALL support filtering by valuation metrics including P/E ratio, P/B ratio, and PEG ratio
3. THE Asset_Screener SHALL support filtering by growth metrics including revenue growth and earnings growth
4. THE Asset_Screener SHALL support filtering by dividend metrics including dividend yield and payout ratio
5. THE Asset_Screener SHALL support filtering by sector selection
6. THE Asset_Screener SHALL support filtering by market cap ranges (Small Cap, Mid Cap, Large Cap)
7. THE Asset_Screener SHALL support filtering by volume and liquidity metrics
8. WHEN a user applies filters, THE Asset_Screener SHALL display only assets matching all selected criteria
9. THE Asset_Screener SHALL display results in a sortable table format
10. THE Asset_Screener SHALL display results with an integrated Heatmap_Component view
11. THE Asset_Screener SHALL allow users to toggle between table view and heatmap view
12. THE Asset_Screener SHALL provide seven preset configurations: Most Active Penny Stocks, Undervalued Growth Stocks, Day Gainers, Most Shorted Stocks, Undervalued Large Caps, and Aggressive Small Caps
13. WHEN a user selects a Screener_Preset, THE Asset_Screener SHALL apply the corresponding filter combination
14. THE Asset_Screener SHALL display the number of assets matching current filter criteria
15. THE Asset_Screener SHALL allow users to save custom filter combinations as personal presets
16. WHEN displaying results in table view, THE Asset_Screener SHALL show key metrics for each asset including price, change percentage, volume, and market cap
17. WHEN displaying results in heatmap view, THE Asset_Screener SHALL integrate Chart_Component to show mini charts for each asset
18. THE Asset_Screener SHALL color-code results based on Valuation_Context (red for overpriced, green for underpriced, gray for fairly priced)
19. WHEN a user clicks on a screener result, THE Stock_Exchange_App SHALL navigate to that asset's detail page
20. THE Asset_Screener SHALL support exporting filtered results to CSV format
21. THE Asset_Screener SHALL allow sorting results by any displayed metric column
22. THE Asset_Screener SHALL provide pagination when results exceed 50 assets
23. THE Asset_Screener SHALL persist filter selections across page refreshes using browser storage
24. THE Asset_Screener SHALL display tooltips explaining each filter criterion
25. THE Asset_Screener SHALL update screener results when market data refreshes
