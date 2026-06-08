/** User-facing copy for market data surfaces (calendars, heatmaps, search, screener). */

export const MARKET_UI_COPY = {
  load: {
    economicCalendar: "We couldn't load economic calendar events. Try again.",
    earningsCalendar: "We couldn't load earnings events. Try again.",
    dividendCalendar: "We couldn't load dividend events. Try again.",
    ipoCalendar: "We couldn't load IPO events. Try again.",
    fearGreed: "We couldn't load the Fear & Greed index. Try again.",
    worldMarkets: "We couldn't load world markets. Try again.",
    sectorHub: "We couldn't load sector performance. Try again.",
    screenerResults:
      "We couldn't run the screener. Check your filters and try again.",
    screenerPresetsLoad: "We couldn't load your saved presets. Try again.",
    screenerPresetsSave: "We couldn't save this preset. Try again.",
    stockHeatmap: "We couldn't load the stock heatmap. Try again.",
    etfHeatmap: "We couldn't load the ETF heatmap. Try again.",
    cryptoHeatmap: "We couldn't load the crypto heatmap. Try again.",
    symbolData: "We couldn't load this symbol. Try again.",
    historicalData: "We couldn't load price history. Try another range.",
    pricingDetails: "We couldn't load pricing details. Refresh the page.",
    stockOfTheDay: "We couldn't load today's stock pick. Try again.",
    aiPrediction: "We couldn't load the AI prediction. Try again.",
    aiPredictionMarketData:
      "We couldn't load market data for the AI prediction. Try again.",
    aiPredictionValidate: "We couldn't validate the AI prediction. Try again.",
    stockOfTheDayValidate:
      "We couldn't validate today's stock pick. Try again.",
    checkout: "We couldn't start checkout. Try again.",
    checkoutUrl: "We couldn't open checkout. Try again.",
    confirmCheckout: "We couldn't confirm checkout. Try again.",
    financials: "We couldn't load financials. Try again.",
    indicators: "We couldn't load technical indicators. Try again.",
    indicatorsCalc: "We couldn't calculate technical indicators. Try again.",
    forecast: "We couldn't load forecast data. Try again.",
    seasonal: "We couldn't load seasonal patterns. Try again.",
    stockPerformance: "We couldn't load stock performance. Try again.",
    etfPerformance: "We couldn't load ETF performance. Try again.",
    cryptoPerformance: "We couldn't load crypto performance. Try again.",
    liveSymbol: "We couldn't load live quote data. Try again.",
    liveHistorical: "We couldn't load live price history. Try again.",
    aiPredictionGenerate: "We couldn't generate the AI prediction. Try again.",
    aiPredictionSnapshot:
      "We couldn't load data for the AI prediction. Try again.",
    screenerExport: "We couldn't export screener results. Try again.",
  },
  account: {
    subscription: "We couldn't load your subscription. Try again.",
    upgrade:
      "We couldn't upgrade your subscription. Try again or contact support.",
    downgrade:
      "We couldn't change your subscription plan. Try again or contact support.",
    subscribe:
      "We couldn't update your subscription. Try again or contact support.",
    trialStatus: "We couldn't load trial status. Try again.",
    trialEligibility: "We couldn't check trial eligibility. Try again.",
    trialStart: "We couldn't start your trial. Try again.",
    trialEnd: "We couldn't end your trial. Try again.",
    stripeWebhook: "We couldn't process the payment update. Try again later.",
  },
  auth: {
    verificationEmail: "We couldn't send the verification email. Try again.",
  },
  search: {
    failed: "We couldn't search symbols right now. Try again.",
    noResults: "No symbols match that search.",
    genericFailed: "Search didn't complete. Try again.",
  },
  chart: {
    noData: "No price data for this range.",
    initFailed: "We couldn't draw this chart. Try another range or refresh.",
  },
  calendar: {
    emptyHint:
      "If you expected events here, the feed may still be updating—check back shortly.",
  },
  billing: {
    cancelFailed:
      "We couldn't cancel your subscription. Try again or contact support.",
    portalFailed:
      "We couldn't open the billing portal. Try again or contact support.",
  },
} as const;
