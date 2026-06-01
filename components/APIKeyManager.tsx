"use client";

/**
 * APIKeyManager Component
 * Allows BYOK tier users to securely add, validate, and manage API keys
 * for multiple AI providers.
 * Requirements: 22.12, 22.13, 22.14, 22.15
 */

import { useState, useEffect, useCallback } from "react";
import {
  apiKeyManagerService,
  saveSelectedBYOKProvider,
  type BYOKProvider,
} from "@/services/api-key-manager.service";
import {
  HOME_INPUT,
  HOME_INSTRUMENT_PANEL,
  HOME_MUTED_TEXT,
  HOME_PRIMARY_BUTTON,
  HOME_RANGE_BUTTON_ACTIVE,
  HOME_RANGE_BUTTON_IDLE,
  HOME_SUBTLE_TEXT,
} from "@/lib/home-ui";

const PROVIDERS: Array<{
  id: BYOKProvider;
  name: string;
  placeholder: string;
  docsUrl: string;
}> = [
  {
    id: "OPENAI",
    name: "OpenAI",
    placeholder: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "GEMINI",
    name: "Google Gemini",
    placeholder: "AIza...",
    docsUrl: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "MISTRAL",
    name: "Mistral AI",
    placeholder: "...",
    docsUrl: "https://console.mistral.ai/api-keys",
  },
  {
    id: "DEEPSEEK",
    name: "DeepSeek",
    placeholder: "sk-...",
    docsUrl: "https://platform.deepseek.com/api_keys",
  },
];

interface ProviderRowState {
  inputValue: string;
  showKey: boolean;
  isValidating: boolean;
  validationError: string | null;
  isStored: boolean;
  addedAt?: Date;
}

interface APIKeyManagerProps {
  selectedProvider?: BYOKProvider;
  onProviderSelect?: (provider: BYOKProvider) => void;
}

export default function APIKeyManager({
  selectedProvider,
  onProviderSelect,
}: APIKeyManagerProps) {
  const [rows, setRows] = useState<Record<BYOKProvider, ProviderRowState>>(
    () =>
      Object.fromEntries(
        PROVIDERS.map((p) => [
          p.id,
          {
            inputValue: "",
            showKey: false,
            isValidating: false,
            validationError: null,
            isStored: false,
          },
        ])
      ) as Record<BYOKProvider, ProviderRowState>
  );

  const hydrateStoredKeys = useCallback(async () => {
    const stored = await apiKeyManagerService.listStoredKeyInfo();
    const storedByProvider = new Map(stored.map((row) => [row.provider, row]));

    setRows((prev) => {
      const next = { ...prev };
      for (const p of PROVIDERS) {
        const info = storedByProvider.get(p.id);
        const hasLocal = apiKeyManagerService.hasLocalKey(p.id);
        if (!info && !hasLocal) continue;
        next[p.id] = {
          ...next[p.id],
          isStored: true,
          addedAt: info?.addedAt ?? new Date(),
          inputValue: "••••••••••••••••",
          validationError: null,
        };
      }
      return next;
    });
  }, []);

  useEffect(() => {
    void hydrateStoredKeys();
    const onAuthChanged = () => void hydrateStoredKeys();
    window.addEventListener("auth-state-changed", onAuthChanged);
    return () =>
      window.removeEventListener("auth-state-changed", onAuthChanged);
  }, [hydrateStoredKeys]);

  const updateRow = useCallback(
    (provider: BYOKProvider, patch: Partial<ProviderRowState>) => {
      setRows((prev) => ({
        ...prev,
        [provider]: { ...prev[provider], ...patch },
      }));
    },
    []
  );

  const handleSave = async (provider: BYOKProvider) => {
    const row = rows[provider];
    const key = row.inputValue.trim();

    if (!key || key.startsWith("•")) return;

    updateRow(provider, { isValidating: true, validationError: null });

    const result = await apiKeyManagerService.validateAndStore(provider, key);

    if (result.valid) {
      updateRow(provider, {
        isValidating: false,
        isStored: true,
        addedAt: new Date(),
        inputValue: "••••••••••••••••",
        validationError: null,
      });
    } else {
      updateRow(provider, {
        isValidating: false,
        validationError: result.error ?? "Invalid API key",
      });
    }
  };

  const handleRemove = async (provider: BYOKProvider) => {
    await apiKeyManagerService.removeKey(provider);
    updateRow(provider, {
      isStored: false,
      inputValue: "",
      addedAt: undefined,
      validationError: null,
    });
    if (selectedProvider === provider) {
      const fallback = PROVIDERS[0].id;
      saveSelectedBYOKProvider(fallback);
      onProviderSelect?.(fallback);
    }
  };

  const handleEdit = async (provider: BYOKProvider) => {
    const decrypted = await apiKeyManagerService.getKey(provider);
    updateRow(provider, {
      inputValue: decrypted ?? "",
      isStored: false,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className={`text-base ${HOME_MUTED_TEXT} font-semibold`}>
          AI Provider API Keys
        </h3>
        <p className={`mt-1 text-sm ${HOME_SUBTLE_TEXT}`}>
          Keys are encrypted and stored in your Appwrite account scope for
          server-side BYOK usage.
        </p>
      </div>

      <div className="space-y-3">
        {PROVIDERS.map((provider) => {
          const row = rows[provider.id];
          const isSelected = selectedProvider === provider.id;

          return (
            <div
              key={provider.id}
              className={`${HOME_INSTRUMENT_PANEL} !p-4 transition-colors ${
                isSelected ? "ring-1 ring-stone-600 dark:ring-stone-400" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium text-stone-900 dark:text-stone-50`}
                  >
                    {provider.name}
                  </span>
                  {row.isStored && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Saved
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {row.isStored && onProviderSelect && (
                    <button
                      onClick={() => onProviderSelect(provider.id)}
                      className={`rounded px-2 py-1 text-xs transition-colors ${
                        isSelected
                          ? HOME_RANGE_BUTTON_ACTIVE
                          : HOME_RANGE_BUTTON_IDLE
                      }`}
                      aria-pressed={isSelected}
                    >
                      {isSelected ? "Active" : "Use this"}
                    </button>
                  )}
                  <a
                    href={provider.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs ${HOME_MUTED_TEXT} underline-offset-2 hover:underline`}
                    aria-label={`Get ${provider.name} API key`}
                  >
                    Get key
                  </a>
                </div>
              </div>

              {row.isStored ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={row.inputValue}
                    readOnly
                    className={`flex-1 font-mono text-sm ${HOME_INPUT} bg-stone-50 dark:bg-stone-950`}
                    aria-label={`${provider.name} API key (stored)`}
                  />
                  <button
                    onClick={() => handleEdit(provider.id)}
                    className={`text-xs ${HOME_MUTED_TEXT} underline-offset-2 hover:underline`}
                    aria-label={`Edit ${provider.name} API key`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRemove(provider.id)}
                    className="text-xs text-red-500 hover:underline"
                    aria-label={`Remove ${provider.name} API key`}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={row.showKey ? "text" : "password"}
                        value={row.inputValue}
                        onChange={(e) =>
                          updateRow(provider.id, {
                            inputValue: e.target.value,
                            validationError: null,
                          })
                        }
                        placeholder={provider.placeholder}
                        className={`w-full font-mono ${HOME_INPUT} pr-10`}
                        aria-label={`${provider.name} API key input`}
                        aria-describedby={
                          row.validationError
                            ? `${provider.id}-error`
                            : undefined
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSave(provider.id);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateRow(provider.id, { showKey: !row.showKey })
                        }
                        className={`absolute right-2 top-1/2 -translate-y-1/2 ${HOME_SUBTLE_TEXT} hover:text-stone-900 dark:hover:text-stone-50`}
                        aria-label={row.showKey ? "Hide key" : "Show key"}
                      >
                        {row.showKey ? (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => handleSave(provider.id)}
                      disabled={row.isValidating || !row.inputValue.trim()}
                      className={`${HOME_PRIMARY_BUTTON} px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50`}
                      aria-label={`Save ${provider.name} API key`}
                    >
                      {row.isValidating ? "Validating…" : "Save"}
                    </button>
                  </div>

                  {row.validationError && (
                    <p
                      id={`${provider.id}-error`}
                      className="text-xs text-red-500 dark:text-red-400"
                      role="alert"
                    >
                      {row.validationError}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
