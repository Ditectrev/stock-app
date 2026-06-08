/**
 * API Key Manager Service
 * Browser client for server-side BYOK key management APIs.
 * Requirements: 22.12, 22.13, 22.14, 22.15
 */
import type { AIProvider } from "@/types";

export type BYOKProvider = Extract<
  AIProvider,
  "OPENAI" | "GEMINI" | "MISTRAL" | "DEEPSEEK"
>;

const BYOK_SELECTED_PROVIDER_KEY = "byok_selected_provider";

const BYOK_PROVIDERS: BYOKProvider[] = [
  "OPENAI",
  "GEMINI",
  "MISTRAL",
  "DEEPSEEK",
];

export function isBYOKProvider(value: string | null): value is BYOKProvider {
  return BYOK_PROVIDERS.includes(value as BYOKProvider);
}

export function readSelectedBYOKProvider(): BYOKProvider {
  if (typeof window === "undefined") return "OPENAI";
  const stored = localStorage.getItem(BYOK_SELECTED_PROVIDER_KEY);
  return isBYOKProvider(stored) ? stored : "OPENAI";
}

export function saveSelectedBYOKProvider(provider: BYOKProvider): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BYOK_SELECTED_PROVIDER_KEY, provider);
}

export interface StoredAPIKey {
  provider: BYOKProvider;
  addedAt: Date;
  lastValidated?: Date;
}

export interface APIKeyValidationResult {
  valid: boolean;
  error?: string;
}

interface EncryptedPayload {
  encryptedKey: string;
  iv: string;
}

export class APIKeyManagerService {
  private getStorageKey(provider: BYOKProvider): string {
    return `byok_key_${provider}`;
  }

  private getPassphrase(provider: BYOKProvider): string {
    return `stock-app-byok-${provider}`;
  }

  private base64Encode(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString("base64");
  }

  private base64DecodeToArrayBuffer(value: string): ArrayBuffer {
    const bytes = Uint8Array.from(Buffer.from(value, "base64"));
    return bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;
  }

  private async deriveEncryptionKey(
    provider: BYOKProvider
  ): Promise<CryptoKey> {
    const subtle = crypto.subtle;
    const encoder = new TextEncoder();
    const keyMaterial = await subtle.importKey(
      "raw",
      encoder.encode(this.getPassphrase(provider)),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    return subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode(`byok-salt-${provider}`),
        iterations: 100_000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async encrypt(
    apiKey: string,
    provider: BYOKProvider = "OPENAI"
  ): Promise<EncryptedPayload> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveEncryptionKey(provider);
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(apiKey)
    );

    return {
      encryptedKey: this.base64Encode(new Uint8Array(encrypted)),
      iv: this.base64Encode(iv),
    };
  }

  async decrypt(
    encryptedKey: string,
    iv: string,
    provider: BYOKProvider = "OPENAI"
  ): Promise<string> {
    const key = await this.deriveEncryptionKey(provider);
    const ivBuffer = this.base64DecodeToArrayBuffer(iv);
    const encryptedBuffer = this.base64DecodeToArrayBuffer(encryptedKey);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBuffer },
      key,
      encryptedBuffer
    );

    return new TextDecoder().decode(decrypted);
  }

  async storeKey(provider: BYOKProvider, apiKey: string): Promise<void> {
    const payload = await this.encrypt(apiKey, provider);
    localStorage.setItem(this.getStorageKey(provider), JSON.stringify(payload));
  }

  async validateAndStore(
    provider: BYOKProvider,
    apiKey: string
  ): Promise<APIKeyValidationResult> {
    const validationResult = await this.validateKey(provider, apiKey);
    if (!validationResult.valid) {
      return validationResult;
    }

    const persist = await fetch("/api/ai/keys", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey }),
    });

    if (!persist.ok) {
      const body = (await persist.json().catch(() => ({}))) as {
        error?: string;
      };
      return {
        valid: false,
        error:
          body.error ??
          "Could not store the API key on the server for BYOK. Try again or check your subscription tier.",
      };
    }

    await this.storeKey(provider, apiKey);
    return { valid: true };
  }

  async removeKey(provider: BYOKProvider): Promise<void> {
    localStorage.removeItem(this.getStorageKey(provider));
    await fetch(`/api/ai/keys/${encodeURIComponent(provider)}`, {
      method: "DELETE",
      credentials: "include",
    }).catch(() => {});
  }

  async getStoredKeyInfo(provider: BYOKProvider): Promise<StoredAPIKey | null> {
    const all = await this.listStoredKeyInfo();
    return all.find((x) => x.provider === provider) ?? null;
  }

  async listStoredKeyInfo(): Promise<StoredAPIKey[]> {
    const response = await fetch("/api/ai/keys", {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) return [];
    const data = (await response.json().catch(() => ({}))) as {
      data?: Array<{
        provider: BYOKProvider;
        addedAt: string;
        lastValidated?: string;
      }>;
    };
    const rows = data.data ?? [];
    return rows.map((row) => ({
      provider: row.provider,
      addedAt: new Date(row.addedAt),
      lastValidated: row.lastValidated
        ? new Date(row.lastValidated)
        : undefined,
    }));
  }

  async getKey(provider: BYOKProvider): Promise<string | null> {
    const raw = localStorage.getItem(this.getStorageKey(provider));
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as EncryptedPayload;
      if (!parsed.encryptedKey || !parsed.iv) return null;
      return await this.decrypt(parsed.encryptedKey, parsed.iv, provider);
    } catch {
      return null;
    }
  }

  async validateKey(
    provider: BYOKProvider,
    apiKey: string
  ): Promise<APIKeyValidationResult> {
    try {
      const response = await fetch("/api/ai/keys/validate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey }),
      });

      if (response.status === 200 || response.status === 429) {
        return { valid: true };
      }

      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (response.status === 401 || response.status === 403) {
        return {
          valid: false,
          error:
            body.error ??
            "API key rejected by provider. Please verify and try again.",
        };
      }

      if (body.error) {
        return { valid: false, error: body.error };
      }

      return {
        valid: false,
        error: "Unable to validate API key with provider.",
      };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : "Network error while validating API key.",
      };
    }
  }

  getStoredProviders(): BYOKProvider[] {
    return BYOK_PROVIDERS.filter((provider) =>
      localStorage.getItem(this.getStorageKey(provider))
    );
  }

  hasLocalKey(provider: BYOKProvider): boolean {
    return Boolean(localStorage.getItem(this.getStorageKey(provider)));
  }
}

export const apiKeyManagerService = new APIKeyManagerService();
