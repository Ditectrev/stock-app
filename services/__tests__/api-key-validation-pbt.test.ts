/**
 * Property-Based Tests for API Key Validation
 * Feature: the-open-stock, Property 13: API Key Validation
 *
 * Validates: Requirements 22.14
 * "For any API key provided by a user, the system should validate it with the
 * corresponding AI provider before storing it, and invalid keys should be
 * rejected with an error message."
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

// ---------------------------------------------------------------------------
// Mock Web Crypto API (jsdom doesn't implement SubtleCrypto)
// ---------------------------------------------------------------------------

function xorBytes(data: Uint8Array, key: Uint8Array): Uint8Array {
  return data.map((b, i) => b ^ key[i % key.length]);
}

function makeMockCrypto() {
  const derivedKeyBytes = new Uint8Array(32).fill(0xcd);

  const mockKey: CryptoKey = {
    type: "secret",
    extractable: false,
    algorithm: { name: "AES-GCM" },
    usages: ["encrypt", "decrypt"],
  };

  return {
    getRandomValues: <T extends ArrayBufferView>(arr: T): T => {
      if (arr instanceof Uint8Array) {
        for (let i = 0; i < arr.length; i++) arr[i] = (i * 41 + 17) % 256;
      }
      return arr;
    },
    subtle: {
      importKey: vi.fn().mockResolvedValue(mockKey),
      deriveKey: vi.fn().mockResolvedValue(mockKey),
      encrypt: vi
        .fn()
        .mockImplementation(
          async (
            _algo: { name: string; iv: Uint8Array },
            _key: CryptoKey,
            data: ArrayBuffer
          ) => xorBytes(new Uint8Array(data), derivedKeyBytes).buffer
        ),
      decrypt: vi
        .fn()
        .mockImplementation(
          async (
            _algo: { name: string; iv: Uint8Array },
            _key: CryptoKey,
            data: ArrayBuffer
          ) => xorBytes(new Uint8Array(data), derivedKeyBytes).buffer
        ),
    },
  };
}

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

function makeLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
}

// ---------------------------------------------------------------------------
// fetch mock helpers
// ---------------------------------------------------------------------------

/** Simulates a provider responding with the given HTTP status */
function mockFetchWithStatus(status: number) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve({}),
  });
}

/** Simulates a network-level failure (no response) */
function mockFetchNetworkError(message = "Network error") {
  return vi.fn().mockRejectedValue(new Error(message));
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const providerArb = fc.constantFrom(
  "OPENAI" as const,
  "GEMINI" as const,
  "MISTRAL" as const,
  "DEEPSEEK" as const
);

/** Valid-looking API key shapes per provider */
const openAIKeyArb = fc
  .string({ minLength: 20, maxLength: 60, unit: "grapheme-ascii" })
  .map((s) => `sk-${s}`);

const geminiKeyArb = fc
  .string({ minLength: 30, maxLength: 50, unit: "grapheme-ascii" })
  .map((s) => `AIza${s}`);

const mistralKeyArb = fc.string({
  minLength: 32,
  maxLength: 64,
  unit: "grapheme-ascii",
});

const deepseekKeyArb = fc.string({
  minLength: 32,
  maxLength: 64,
  unit: "grapheme-ascii",
});

const validApiKeyArb = fc.oneof(
  openAIKeyArb,
  geminiKeyArb,
  mistralKeyArb,
  deepseekKeyArb
);

/** HTTP status codes that indicate an invalid/rejected key */
const invalidKeyStatusArb = fc.constantFrom(401, 403);

/** HTTP status codes that indicate a valid key (200 = success, 429 = rate-limited but valid) */
const validKeyStatusArb = fc.constantFrom(200, 429);

/** Any non-auth error status (server errors, etc.) */
const serverErrorStatusArb = fc.constantFrom(400, 500, 502, 503);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 13: API Key Validation", () => {
  let localStorageMock: ReturnType<typeof makeLocalStorageMock>;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    localStorageMock = makeLocalStorageMock();
    vi.stubGlobal("localStorage", localStorageMock);
    vi.stubGlobal("crypto", makeMockCrypto());
    vi.stubGlobal("Buffer", Buffer);
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("validateKey returns valid=true when provider responds with 200", async () => {
    // Feature: the-open-stock, Property 13: API Key Validation
    // **Validates: Requirements 22.14**
    const { APIKeyManagerService } =
      await import("@/services/api-key-manager.service");

    await fc.assert(
      fc.asyncProperty(
        providerArb,
        validApiKeyArb,
        async (provider, apiKey) => {
          global.fetch = mockFetchWithStatus(200) as any;

          const service = new APIKeyManagerService();
          const result = await service.validateKey(provider, apiKey);

          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("validateKey returns valid=true when provider rate-limits (429) — key is still valid", async () => {
    // Feature: the-open-stock, Property 13: API Key Validation
    // **Validates: Requirements 22.14**
    const { APIKeyManagerService } =
      await import("@/services/api-key-manager.service");

    await fc.assert(
      fc.asyncProperty(
        providerArb,
        validApiKeyArb,
        async (provider, apiKey) => {
          global.fetch = mockFetchWithStatus(429) as any;

          const service = new APIKeyManagerService();
          const result = await service.validateKey(provider, apiKey);

          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("validateKey returns valid=false with error message for 401/403 responses", async () => {
    // Feature: the-open-stock, Property 13: API Key Validation
    // **Validates: Requirements 22.14**
    const { APIKeyManagerService } =
      await import("@/services/api-key-manager.service");

    await fc.assert(
      fc.asyncProperty(
        providerArb,
        validApiKeyArb,
        invalidKeyStatusArb,
        async (provider, apiKey, status) => {
          global.fetch = mockFetchWithStatus(status) as any;

          const service = new APIKeyManagerService();
          const result = await service.validateKey(provider, apiKey);

          expect(result.valid).toBe(false);
          // Must provide a descriptive error — never fail silently
          expect(result.error).toBeDefined();
          expect(result.error!.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("validateKey returns valid=false with error message when network is unreachable", async () => {
    // Feature: the-open-stock, Property 13: API Key Validation
    // **Validates: Requirements 22.14**
    const { APIKeyManagerService } =
      await import("@/services/api-key-manager.service");

    await fc.assert(
      fc.asyncProperty(
        providerArb,
        validApiKeyArb,
        fc.string({ minLength: 5, maxLength: 50 }),
        async (provider, apiKey, errorMessage) => {
          global.fetch = mockFetchNetworkError(errorMessage) as any;

          const service = new APIKeyManagerService();
          const result = await service.validateKey(provider, apiKey);

          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error!.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("validateAndStore does NOT persist the key when validation fails (401/403)", async () => {
    // Feature: the-open-stock, Property 13: API Key Validation
    // **Validates: Requirements 22.14**
    const { APIKeyManagerService } =
      await import("@/services/api-key-manager.service");

    await fc.assert(
      fc.asyncProperty(
        providerArb,
        validApiKeyArb,
        invalidKeyStatusArb,
        async (provider, apiKey, status) => {
          localStorageMock.clear();
          global.fetch = mockFetchWithStatus(status) as any;

          const service = new APIKeyManagerService();
          const result = await service.validateAndStore(provider, apiKey);

          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();

          // Key must NOT have been written to storage
          const stored = localStorageMock.getItem(`byok_key_${provider}`);
          expect(stored).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("validateAndStore persists the key only after successful validation (200)", async () => {
    // Feature: the-open-stock, Property 13: API Key Validation
    // **Validates: Requirements 22.14**
    const { APIKeyManagerService } =
      await import("@/services/api-key-manager.service");

    await fc.assert(
      fc.asyncProperty(
        providerArb,
        validApiKeyArb,
        async (provider, apiKey) => {
          localStorageMock.clear();
          global.fetch = mockFetchWithStatus(200) as any;

          const service = new APIKeyManagerService();
          const result = await service.validateAndStore(provider, apiKey);

          expect(result.valid).toBe(true);

          // Key MUST have been written to storage after successful validation
          const stored = localStorageMock.getItem(`byok_key_${provider}`);
          expect(stored).not.toBeNull();

          const parsed = JSON.parse(stored!);
          expect(parsed.encryptedKey).toBeDefined();
          expect(parsed.iv).toBeDefined();
          // Stored value must not be the raw plaintext
          expect(parsed.encryptedKey).not.toBe(apiKey);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("validateAndStore does NOT persist the key when network is unreachable", async () => {
    // Feature: the-open-stock, Property 13: API Key Validation
    // **Validates: Requirements 22.14**
    const { APIKeyManagerService } =
      await import("@/services/api-key-manager.service");

    await fc.assert(
      fc.asyncProperty(
        providerArb,
        validApiKeyArb,
        async (provider, apiKey) => {
          localStorageMock.clear();
          global.fetch = mockFetchNetworkError() as any;

          const service = new APIKeyManagerService();
          const result = await service.validateAndStore(provider, apiKey);

          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();

          const stored = localStorageMock.getItem(`byok_key_${provider}`);
          expect(stored).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("validation result is always a definitive boolean — never undefined or null", async () => {
    // Feature: the-open-stock, Property 13: API Key Validation
    // **Validates: Requirements 22.14**
    const { APIKeyManagerService } =
      await import("@/services/api-key-manager.service");

    await fc.assert(
      fc.asyncProperty(
        providerArb,
        validApiKeyArb,
        fc.boolean(),
        fc.integer({ min: 200, max: 503 }),
        async (provider, apiKey, networkFail, status) => {
          if (networkFail) {
            global.fetch = mockFetchNetworkError() as any;
          } else {
            global.fetch = mockFetchWithStatus(status) as any;
          }

          const service = new APIKeyManagerService();
          const result = await service.validateKey(provider, apiKey);

          // Result must always be a definitive boolean
          expect(typeof result.valid).toBe("boolean");

          // If invalid, an error message must always be present
          if (!result.valid) {
            expect(result.error).toBeDefined();
            expect(typeof result.error).toBe("string");
            expect(result.error!.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("server errors (5xx) produce valid=false with a descriptive error message", async () => {
    // Feature: the-open-stock, Property 13: API Key Validation
    // **Validates: Requirements 22.14**
    const { APIKeyManagerService } =
      await import("@/services/api-key-manager.service");

    await fc.assert(
      fc.asyncProperty(
        providerArb,
        validApiKeyArb,
        serverErrorStatusArb,
        async (provider, apiKey, status) => {
          global.fetch = mockFetchWithStatus(status) as any;

          const service = new APIKeyManagerService();
          const result = await service.validateKey(provider, apiKey);

          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error!.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
