/**
 * Property-Based Tests for Ollama Verification
 * Feature: the-open-stock, Property 21: Ollama Verification
 *
 * Validates: Requirements 22.10
 * "For any Local tier activation, the system should verify Ollama installation
 * and accessibility before completing the activation, and should fail with an
 * error message if Ollama is not available."
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fc from "fast-check";

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { OllamaService } from "@/services/ollama.service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a mock fetch that simulates Ollama being available */
function mockOllamaAvailable(
  version: string,
  models: Array<{
    name: string;
    size: number;
    digest: string;
    modified_at: string;
  }>
) {
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes("/api/version")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ version }),
      });
    }
    if (url.includes("/api/tags")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ models }),
      });
    }
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    });
  });
}

/** Creates a mock fetch that simulates Ollama being unavailable */
function mockOllamaUnavailable() {
  return vi.fn().mockRejectedValue(new Error("Connection refused"));
}

/** Creates a mock fetch that returns a non-OK status */
function mockOllamaBadStatus(status: number) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({}),
  });
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const versionArb = fc.stringMatching(/^\d+\.\d+\.\d+$/);

const modelNameArb = fc
  .tuple(
    fc.constantFrom("llama", "mistral", "gemma", "phi", "qwen"),
    fc.constantFrom("3.2", "2", "7b", "3b", "1b")
  )
  .map(([name, tag]) => `${name}:${tag}`);

const modelArb = fc.record({
  name: modelNameArb,
  size: fc.integer({ min: 1_000_000, max: 10_000_000_000 }),
  digest: fc.stringMatching(/^[0-9a-f]{12}$/),
  modified_at: fc
    .date({
      min: new Date("2024-01-01"),
      max: new Date("2026-12-31"),
      noInvalidDate: true,
    })
    .map((d) => d.toISOString()),
});

const baseUrlArb = fc
  .integer({ min: 1024, max: 65535 })
  .map((port) => `http://localhost:${port}`);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 21: Ollama Verification", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("verification returns available=true with version and models when Ollama is running", async () => {
    // Feature: the-open-stock, Property 21: Ollama Verification
    // **Validates: Requirements 22.10**
    await fc.assert(
      fc.asyncProperty(
        versionArb,
        fc.array(modelArb, { minLength: 1, maxLength: 5 }),
        baseUrlArb,
        async (version, models, baseUrl) => {
          global.fetch = mockOllamaAvailable(version, models) as typeof fetch;

          const service = new OllamaService(baseUrl);
          const result = await service.verify();

          expect(result.available).toBe(true);
          expect(result.version).toBe(version);
          expect(result.models).toBeDefined();
          expect(result.models!.length).toBe(models.length);
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("verification returns available=false with error message when Ollama is not running", async () => {
    // Feature: the-open-stock, Property 21: Ollama Verification
    // **Validates: Requirements 22.10**
    await fc.assert(
      fc.asyncProperty(baseUrlArb, async (baseUrl) => {
        global.fetch = mockOllamaUnavailable() as typeof fetch;

        const service = new OllamaService(baseUrl);
        const result = await service.verify();

        expect(result.available).toBe(false);
        // Must provide a descriptive error message — not fail silently
        expect(result.error).toBeDefined();
        expect(result.error!.length).toBeGreaterThan(0);
        expect(result.version).toBeUndefined();
        expect(result.models).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it("verification returns available=false when Ollama returns a non-OK status", async () => {
    // Feature: the-open-stock, Property 21: Ollama Verification
    // **Validates: Requirements 22.10**
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(400, 401, 403, 500, 502, 503),
        baseUrlArb,
        async (status, baseUrl) => {
          global.fetch = mockOllamaBadStatus(status) as typeof fetch;

          const service = new OllamaService(baseUrl);
          const result = await service.verify();

          expect(result.available).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("model list from verification always matches the models returned by Ollama", async () => {
    // Feature: the-open-stock, Property 21: Ollama Verification
    // **Validates: Requirements 22.10**
    await fc.assert(
      fc.asyncProperty(
        versionArb,
        fc.array(modelArb, { minLength: 0, maxLength: 10 }),
        async (version, models) => {
          global.fetch = mockOllamaAvailable(version, models) as typeof fetch;

          const service = new OllamaService();
          const result = await service.verify();

          expect(result.available).toBe(true);
          expect(result.models!.length).toBe(models.length);

          // Each returned model name must match the source
          result.models!.forEach((m, i) => {
            expect(m.name).toBe(models[i].name);
            expect(m.size).toBe(models[i].size);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it("verification result is always one of two states: available or not available", async () => {
    // Feature: the-open-stock, Property 21: Ollama Verification
    // **Validates: Requirements 22.10**
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        versionArb,
        fc.array(modelArb, { minLength: 0, maxLength: 3 }),
        async (isAvailable, version, models) => {
          if (isAvailable) {
            global.fetch = mockOllamaAvailable(version, models) as typeof fetch;
          } else {
            global.fetch = mockOllamaUnavailable() as typeof fetch;
          }

          const service = new OllamaService();
          const result = await service.verify();

          // Result must always be a definitive boolean — never undefined
          expect(typeof result.available).toBe("boolean");

          if (result.available) {
            expect(result.version).toBeDefined();
            expect(result.models).toBeDefined();
          } else {
            expect(result.error).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
