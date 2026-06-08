/**
 * Application configuration
 * Appwrite credentials will use env vars once auth is implemented.
 * Everything else is hardcoded.
 */

interface EnvConfig {
  apis: {
    cnnDatavizUrl: string;
    yahooFinanceUrl: string;
  };
  cache: {
    ttlSeconds: number;
    rateLimitMaxRequests: number;
    rateLimitWindowSeconds: number;
  };
  trial: {
    durationMinutes: number;
  };
  ipServices: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  logging: {
    level: string;
    vercelEnv: string;
  };
}

const defaultYahooFinanceUrl = "https://query2.finance.yahoo.com";

export const env: EnvConfig = {
  apis: {
    cnnDatavizUrl: "https://production.dataviz.cnn.io",
    yahooFinanceUrl:
      process.env.YAHOO_FINANCE_API_URL?.trim() || defaultYahooFinanceUrl,
  },
  cache: {
    ttlSeconds: 300,
    rateLimitMaxRequests: 100,
    rateLimitWindowSeconds: 60,
  },
  trial: {
    durationMinutes: 60,
  },
  ipServices: {
    primary: "https://api.ipify.org?format=json",
    secondary: "https://api.my-ip.io/ip.json",
    tertiary: "https://ipapi.co/json",
  },
  logging: {
    level: "info",
    vercelEnv: "development",
  },
};
