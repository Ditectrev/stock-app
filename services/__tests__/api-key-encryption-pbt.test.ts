/**
 * Property-Based Tests for API Key Encryption
 * Feature: the-open-stock, Property 12: API Key Encryption
 *
 * Validates: Requirements 22.13
 * "For any API key stored by the API_Key_Manager, the stored value should be
 * encrypted, and decryption should yield the original key."
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";

// ---------------------------------------------------------------------------
// Mock Web Crypto API (jsdom doesn't implement SubtleCrypto)
// ---------------------------------------------------------------------------

/**
 * Minimal AES-GCM simulation using XOR + IV for test purposes.
 * Preserves the encrypt/decrypt round-trip contract without requiring
 * a real SubtleCrypto implementation in jsdom.
 */
function xorBytes(data: Uint8Array, key: Uint8Array): Uint8Array {
  return data.map((b, i) => b ^ key[i % key.length]);
}

function makeMockCrypto() {
  const derivedKeyBytes = new Uint8Array(32).fill(0xab);

  const mockKey: CryptoKey = {
    type: "secret",
    extractable: false,
    algorithm: { name: "AES-GCM" },
    usages: ["encrypt", "decrypt"],
  };

  return {
    getRandomValues: <T extends ArrayBufferView>(arr: T): T => {
      if (arr instanceof Uint8Array) {
        for (let i = 0; i < arr.length; i++) arr[i] = (i * 37 + 13) % 256;
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
          ) => {
            const bytes = new Uint8Array(data);
            return xorBytes(bytes, derivedKeyBytes).buffer;
          }
        ),
      decrypt: vi
        .fn()
        .mockImplementation(
          async (
            _algo: { name: string; iv: Uint8Array },
            _key: CryptoKey,
            data: ArrayBuffer
          ) => {
            const bytes = new Uint8Array(data);
            return xorBytes(bytes, derivedKeyBytes).buffer;
          }
        ),
    },
  };
}

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

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
// Arbitraries
// ---------------------------------------------------------------------------

/** Realistic API key shapes for each provider */
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

const apiKeyArb = fc.oneof(
  openAIKeyArb,
  geminiKeyArb,
  mistralKeyArb,
  deepseekKeyArb
);

const providerArb = fc.constantFrom(
  "OPENAI" as const,
  "GEMINI" as const,
  "MISTRAL" as const,
  "DEEPSEEK" as const
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 12: API Key Encryption", () => {
  let localStorageMock: ReturnType<typeof makeLocalStorageMock>;

  beforeEach(() => {
    localStorageMock = makeLocalStorageMock();
    vi.stubGlobal("localStorage", localStorageMock);
    vi.stubGlobal("crypto", makeMockCrypto());
    vi.stubGlobal("Buffer", Buffer);
  });

  it("encrypted value is never equal to the original plaintext key", async () => {
    // Feature: the-open-stock, Property 12: API Key Encryption
    // **Validates: Requirements 22.13**
    const { APIKeyManagerService } =
      await import("@/services/api-key-manager.service");

    await fc.assert(
      fc.asyncProperty(apiKeyArb, async (apiKey) => {
        const service = new APIKeyManagerService();
        const { encryptedKey } = await service.encrypt(apiKey);

        // The stored ciphertext must differ from the plaintext
        expect(encryptedKey).not.toBe(apiKey);
        // Base64-encoded ciphertext should not contain the raw key
        const decoded = Buffer.from(encryptedKey, "base64").toString("utf8");
        expect(decoded).not.toBe(apiKey);
      }),
      { numRuns: 100 }
    );
  });

  it("decryption of an encrypted key always yields the original plaintext", async () => {
    // Feature: the-open-stock, Property 12: API Key Encryption
    // **Validates: Requirements 22.13**
    const { APIKeyManagerService } =
      await import("@/services/api-key-manager.service");

    await fc.assert(
      fc.asyncProperty(apiKeyArb, async (apiKey) => {
        const service = new APIKeyManagerService();
        const { encryptedKey, iv } = await service.encrypt(apiKey);
        const decrypted = await service.decrypt(encryptedKey, iv);

        expect(decrypted).toBe(apiKey);
      }),
      { numRuns: 100 }
    );
  });

  it("two encryptions of the same key produce different ciphertexts (IV uniqueness)", async () => {
    // Feature: the-open-stock, Property 12: API Key Encryption
    // **Validates: Requirements 22.13**
    const { APIKeyManagerService } =
      await import("@/services/api-key-manager.service");

    await fc.assert(
      fc.asyncProperty(apiKeyArb, async (apiKey) => {
        // Reset crypto mock so each call gets a fresh IV counter
        vi.stubGlobal("crypto", makeMockCrypto());
        const service = new APIKeyManagerService();

        const first = await service.encrypt(apiKey);
        // Mutate the mock IV counter by re-stubbing with a shifted version
        const shifted = makeMockCrypto();
        shifted.getRandomValues = <T extends ArrayBufferView>(arr: T): T => {
          if (arr instanceof Uint8Array) {
            for (let i = 0; i < arr.length; i++) arr[i] = (i * 53 + 7) % 256;
          }
          return arr;
        };
        vi.stubGlobal("crypto", shifted);

        const second = await service.encrypt(apiKey);

        // IVs must differ — same plaintext should not produce identical ciphertexts
        expect(first.iv).not.toBe(second.iv);
      }),
      { numRuns: 50 }
    );
  });

  it("storeKey persists an encrypted (non-plaintext) value in localStorage", async () => {
    // Feature: the-open-stock, Property 12: API Key Encryption
    // **Validates: Requirements 22.13**
    const { APIKeyManagerService } =
      await import("@/services/api-key-manager.service");

    await fc.assert(
      fc.asyncProperty(providerArb, apiKeyArb, async (provider, apiKey) => {
        localStorageMock.clear();
        const service = new APIKeyManagerService();
        await service.storeKey(provider, apiKey);

        const raw = localStorageMock.getItem(`byok_key_${provider}`);
        expect(raw).not.toBeNull();

        const stored = JSON.parse(raw!);
        // The stored encryptedKey field must not equal the plaintext
        expect(stored.encryptedKey).toBeDefined();
        expect(stored.encryptedKey).not.toBe(apiKey);
        // IV must be present
        expect(stored.iv).toBeDefined();
        expect(stored.iv.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it("getKey round-trips through storage and returns the original plaintext", async () => {
    // Feature: the-open-stock, Property 12: API Key Encryption
    // **Validates: Requirements 22.13**
    const { APIKeyManagerService } =
      await import("@/services/api-key-manager.service");

    await fc.assert(
      fc.asyncProperty(providerArb, apiKeyArb, async (provider, apiKey) => {
        localStorageMock.clear();
        const service = new APIKeyManagerService();
        await service.storeKey(provider, apiKey);

        const retrieved = await service.getKey(provider);
        expect(retrieved).toBe(apiKey);
      }),
      { numRuns: 100 }
    );
  });

  it("getKey returns null when no key has been stored for a provider", async () => {
    // Feature: the-open-stock, Property 12: API Key Encryption
    // **Validates: Requirements 22.13**
    const { APIKeyManagerService } =
      await import("@/services/api-key-manager.service");

    await fc.assert(
      fc.asyncProperty(providerArb, async (provider) => {
        localStorageMock.clear();
        const service = new APIKeyManagerService();
        const result = await service.getKey(provider);
        expect(result).toBeNull();
      }),
      { numRuns: 50 }
    );
  });

  it("removeKey clears the stored key so getKey returns null afterwards", async () => {
    // Feature: the-open-stock, Property 12: API Key Encryption
    // **Validates: Requirements 22.13**
    const { APIKeyManagerService } =
      await import("@/services/api-key-manager.service");

    await fc.assert(
      fc.asyncProperty(providerArb, apiKeyArb, async (provider, apiKey) => {
        localStorageMock.clear();
        const service = new APIKeyManagerService();
        await service.storeKey(provider, apiKey);

        service.removeKey(provider);
        const result = await service.getKey(provider);
        expect(result).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});
