/**
 * Screener API Route Tests
 * Tests for search, presets, and export endpoints
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the env module
vi.mock("@/lib/env", () => ({
  env: {
    cache: { ttlSeconds: 300 },
    apis: {
      yahooFinanceUrl: "https://query1.finance.yahoo.com",
      cnnDatavizUrl: "https://production.dataviz.cnn.io",
    },
    logging: { level: "info" },
  },
}));

// Mock the logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock the screener service
vi.mock("@/services/screener.service", () => ({
  screenerService: {
    fetchScreenerData: vi.fn(),
    getDefaultPresets: vi.fn(),
  },
}));

import { screenerService } from "@/services/screener.service";

const mockResults = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    sector: "Technology",
    price: 175.5,
    changePercent: 1.2,
    volume: 50000000,
    marketCap: 2800000000000,
    peRatio: 28,
    pbRatio: 45,
    pegRatio: 2.5,
    valuationContext: "overpriced" as const,
    matchScore: 0,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp",
    sector: "Technology",
    price: 380.0,
    changePercent: -0.5,
    volume: 25000000,
    marketCap: 2900000000000,
    valuationContext: "fair" as const,
    matchScore: 0,
  },
];

const mockPresets = [
  {
    id: "day-gainers",
    name: "Day Gainers",
    description: "Stocks with the highest daily gains",
    filters: [
      {
        field: "changePercent",
        operator: "gt",
        value: 3,
        label: "Change > 3%",
      },
    ],
    isDefault: true,
    createdAt: new Date(),
  },
  {
    id: "undervalued-growth-stocks",
    name: "Undervalued Growth Stocks",
    description: "Low P/E with strong earnings growth",
    filters: [
      { field: "peRatio", operator: "lt", value: 15, label: "P/E < 15" },
    ],
    isDefault: true,
    createdAt: new Date(),
  },
];

describe("POST /api/screener/search", () => {
  let POST: typeof import("../../screener/search/route").POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("../../screener/search/route");
    POST = mod.POST;
  });

  it("should return results for valid filters", async () => {
    vi.mocked(screenerService.fetchScreenerData).mockResolvedValue(mockResults);

    const request = new NextRequest(
      "http://localhost:3000/api/screener/search",
      {
        method: "POST",
        body: JSON.stringify({
          filters: [
            {
              field: "price",
              operator: "gt",
              value: 100,
              label: "Price > $100",
            },
          ],
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockResults);
    expect(data.timestamp).toBeDefined();
  });

  it("should use preset filters when preset is specified", async () => {
    vi.mocked(screenerService.fetchScreenerData).mockResolvedValue(mockResults);
    vi.mocked(screenerService.getDefaultPresets).mockReturnValue(mockPresets);

    const request = new NextRequest(
      "http://localhost:3000/api/screener/search",
      {
        method: "POST",
        body: JSON.stringify({ filters: [], preset: "day-gainers" }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(screenerService.fetchScreenerData).toHaveBeenCalledWith(
      mockPresets[0].filters
    );
  });

  it("should use provided filters when preset is not found", async () => {
    vi.mocked(screenerService.fetchScreenerData).mockResolvedValue([]);
    vi.mocked(screenerService.getDefaultPresets).mockReturnValue(mockPresets);

    const filters = [
      { field: "price", operator: "lt", value: 5, label: "Price < $5" },
    ];
    const request = new NextRequest(
      "http://localhost:3000/api/screener/search",
      {
        method: "POST",
        body: JSON.stringify({ filters, preset: "nonexistent" }),
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(screenerService.fetchScreenerData).toHaveBeenCalledWith(filters);
  });

  it("should default to empty filters when none provided", async () => {
    vi.mocked(screenerService.fetchScreenerData).mockResolvedValue(mockResults);

    const request = new NextRequest(
      "http://localhost:3000/api/screener/search",
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(screenerService.fetchScreenerData).toHaveBeenCalledWith([]);
  });

  it("should pass multiple filters to service for AND logic (Req 26.8)", async () => {
    vi.mocked(screenerService.fetchScreenerData).mockResolvedValue([
      mockResults[0],
    ]);

    const filters = [
      {
        field: "sector",
        operator: "eq",
        value: "Technology",
        label: "Sector = Tech",
      },
      { field: "price", operator: "gt", value: 100, label: "Price > $100" },
      {
        field: "volume",
        operator: "gte",
        value: 1_000_000,
        label: "Vol >= 1M",
      },
    ];
    const request = new NextRequest(
      "http://localhost:3000/api/screener/search",
      {
        method: "POST",
        body: JSON.stringify({ filters }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(screenerService.fetchScreenerData).toHaveBeenCalledWith(filters);
  });

  it("should prefer preset filters over provided filters", async () => {
    vi.mocked(screenerService.fetchScreenerData).mockResolvedValue(mockResults);
    vi.mocked(screenerService.getDefaultPresets).mockReturnValue(mockPresets);

    const request = new NextRequest(
      "http://localhost:3000/api/screener/search",
      {
        method: "POST",
        body: JSON.stringify({
          filters: [
            { field: "price", operator: "gt", value: 999, label: "ignored" },
          ],
          preset: "day-gainers",
        }),
      }
    );

    await POST(request);

    expect(screenerService.fetchScreenerData).toHaveBeenCalledWith(
      mockPresets[0].filters
    );
  });

  it("should return 500 on service error", async () => {
    vi.mocked(screenerService.fetchScreenerData).mockRejectedValue(
      new Error("Service unavailable")
    );

    const request = new NextRequest(
      "http://localhost:3000/api/screener/search",
      {
        method: "POST",
        body: JSON.stringify({ filters: [] }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Service unavailable");
  });

  it("should return 500 with generic message for non-Error throws", async () => {
    vi.mocked(screenerService.fetchScreenerData).mockRejectedValue("unknown");

    const request = new NextRequest(
      "http://localhost:3000/api/screener/search",
      {
        method: "POST",
        body: JSON.stringify({ filters: [] }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe(
      "We couldn't run the screener. Check your filters and try again."
    );
  });
});

describe("GET /api/screener/presets", () => {
  let GET: typeof import("../../screener/presets/route").GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("../../screener/presets/route");
    GET = mod.GET;
  });

  it("should return default presets", async () => {
    vi.mocked(screenerService.getDefaultPresets).mockReturnValue(mockPresets);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(JSON.parse(JSON.stringify(mockPresets)));
    expect(data.timestamp).toBeDefined();
  });

  it("should return presets with required structure (Req 26.12)", async () => {
    vi.mocked(screenerService.getDefaultPresets).mockReturnValue(mockPresets);

    const response = await GET();
    const data = await response.json();

    for (const preset of data.data) {
      expect(preset).toHaveProperty("id");
      expect(preset).toHaveProperty("name");
      expect(preset).toHaveProperty("description");
      expect(preset).toHaveProperty("filters");
      expect(preset).toHaveProperty("isDefault");
      expect(Array.isArray(preset.filters)).toBe(true);
      expect(preset.filters.length).toBeGreaterThan(0);
    }
  });

  it("should return empty array when no presets exist", async () => {
    vi.mocked(screenerService.getDefaultPresets).mockReturnValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
  });

  it("should return 500 on service error", async () => {
    vi.mocked(screenerService.getDefaultPresets).mockImplementation(() => {
      throw new Error("Preset error");
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Preset error");
  });
});

describe("POST /api/screener/presets", () => {
  let POST: typeof import("../../screener/presets/route").POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("../../screener/presets/route");
    POST = mod.POST;
  });

  it("should create a custom preset", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/screener/presets",
      {
        method: "POST",
        body: JSON.stringify({
          name: "My Custom Preset",
          description: "Custom filter combo",
          filters: [
            { field: "price", operator: "gt", value: 50, label: "Price > $50" },
          ],
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe("My Custom Preset");
    expect(data.data.description).toBe("Custom filter combo");
    expect(data.data.id).toBe("custom-my-custom-preset");
    expect(data.data.isDefault).toBe(false);
    expect(data.data.filters).toHaveLength(1);
  });

  it("should return 400 when name is missing", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/screener/presets",
      {
        method: "POST",
        body: JSON.stringify({
          filters: [
            { field: "price", operator: "gt", value: 50, label: "Price > $50" },
          ],
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it("should return 400 when filters are empty", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/screener/presets",
      {
        method: "POST",
        body: JSON.stringify({ name: "Test", filters: [] }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it("should return 400 when filters are missing", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/screener/presets",
      {
        method: "POST",
        body: JSON.stringify({ name: "Test" }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it("should preserve exact filter combination in saved preset (Req 26.15)", async () => {
    const filters = [
      { field: "peRatio", operator: "lt", value: 15, label: "P/E < 15" },
      {
        field: "sector",
        operator: "in",
        value: ["Technology", "Healthcare"],
        label: "Sector in list",
      },
      {
        field: "price",
        operator: "between",
        value: [10, 200],
        label: "Price $10-$200",
      },
    ];
    const request = new NextRequest(
      "http://localhost:3000/api/screener/presets",
      {
        method: "POST",
        body: JSON.stringify({ name: "Round Trip", filters }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.filters).toEqual(filters);
  });

  it("should default description to empty string when omitted", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/screener/presets",
      {
        method: "POST",
        body: JSON.stringify({
          name: "No Desc",
          filters: [
            { field: "price", operator: "gt", value: 1, label: "Price > $1" },
          ],
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.description).toBe("");
  });

  it("should generate kebab-case id from name with spaces", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/screener/presets",
      {
        method: "POST",
        body: JSON.stringify({
          name: "High  Growth  Tech",
          filters: [
            {
              field: "sector",
              operator: "eq",
              value: "Technology",
              label: "Tech",
            },
          ],
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(data.data.id).toBe("custom-high-growth-tech");
  });
});

describe("GET /api/screener/export", () => {
  let GET: typeof import("../../screener/export/route").GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("../../screener/export/route");
    GET = mod.GET;
  });

  it("should return CSV with correct headers", async () => {
    vi.mocked(screenerService.fetchScreenerData).mockResolvedValue(mockResults);

    const request = new NextRequest(
      "http://localhost:3000/api/screener/export"
    );

    const response = await GET(request);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="screener-results.csv"'
    );

    const lines = text.split("\n");
    expect(lines[0]).toContain("Symbol");
    expect(lines[0]).toContain("Name");
    expect(lines[0]).toContain("Sector");
    expect(lines[0]).toContain("Price");
  });

  it("should include result data in CSV rows", async () => {
    vi.mocked(screenerService.fetchScreenerData).mockResolvedValue(mockResults);

    const request = new NextRequest(
      "http://localhost:3000/api/screener/export"
    );

    const response = await GET(request);
    const text = await response.text();
    const lines = text.split("\n");

    expect(lines).toHaveLength(3); // header + 2 results
    expect(lines[1]).toContain("AAPL");
    expect(lines[2]).toContain("MSFT");
  });

  it("should apply filters from query params", async () => {
    vi.mocked(screenerService.fetchScreenerData).mockResolvedValue([]);

    const filters = JSON.stringify([
      { field: "price", operator: "gt", value: 100, label: "Price > $100" },
    ]);
    const request = new NextRequest(
      `http://localhost:3000/api/screener/export?filters=${encodeURIComponent(filters)}`
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(screenerService.fetchScreenerData).toHaveBeenCalledWith([
      { field: "price", operator: "gt", value: 100, label: "Price > $100" },
    ]);
  });

  it("should return 400 for invalid filters JSON", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/screener/export?filters=invalid-json"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid filters parameter");
  });

  it("should return 500 on service error", async () => {
    vi.mocked(screenerService.fetchScreenerData).mockRejectedValue(
      new Error("Export failed")
    );

    const request = new NextRequest(
      "http://localhost:3000/api/screener/export"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Export failed");
  });

  it("should return header-only CSV when no results match", async () => {
    vi.mocked(screenerService.fetchScreenerData).mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost:3000/api/screener/export"
    );

    const response = await GET(request);
    const text = await response.text();
    const lines = text.split("\n");

    expect(response.status).toBe(200);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("Symbol");
  });

  it("should render optional fields as empty in CSV", async () => {
    const resultWithoutOptionals = [
      {
        symbol: "XYZ",
        name: "XYZ Corp",
        sector: "Energy",
        price: 50,
        changePercent: -2.1,
        volume: 100000,
        marketCap: 500000000,
        valuationContext: "fair" as const,
        matchScore: 0,
      },
    ];
    vi.mocked(screenerService.fetchScreenerData).mockResolvedValue(
      resultWithoutOptionals
    );

    const request = new NextRequest(
      "http://localhost:3000/api/screener/export"
    );

    const response = await GET(request);
    const text = await response.text();
    const lines = text.split("\n");
    const columns = lines[1].split(",");

    // P/E, P/B, PEG, Dividend Yield, Revenue Growth, Earnings Growth should be empty
    expect(columns[7]).toBe("");
    expect(columns[8]).toBe("");
    expect(columns[9]).toBe("");
    expect(columns[10]).toBe("");
    expect(columns[11]).toBe("");
    expect(columns[12]).toBe("");
  });

  it("should escape double quotes in company names", async () => {
    const resultWithQuotes = [
      {
        symbol: "TEST",
        name: 'Acme "Holdings" Inc.',
        sector: "Industrials",
        price: 25,
        changePercent: 0.5,
        volume: 200000,
        marketCap: 1000000000,
        valuationContext: "fair" as const,
        matchScore: 0,
      },
    ];
    vi.mocked(screenerService.fetchScreenerData).mockResolvedValue(
      resultWithQuotes
    );

    const request = new NextRequest(
      "http://localhost:3000/api/screener/export"
    );

    const response = await GET(request);
    const text = await response.text();

    expect(text).toContain('"Acme ""Holdings"" Inc."');
  });

  it("should export with no filters when param is absent", async () => {
    vi.mocked(screenerService.fetchScreenerData).mockResolvedValue(mockResults);

    const request = new NextRequest(
      "http://localhost:3000/api/screener/export"
    );

    await GET(request);

    expect(screenerService.fetchScreenerData).toHaveBeenCalledWith([]);
  });
});
