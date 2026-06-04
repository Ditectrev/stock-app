"use client";

/**
 * ScreenerPresets Component
 * Displays default and custom screener presets in a horizontal scrollable row.
 * Allows selecting a preset to apply its filters, and saving current filters
 * as a custom preset.
 *
 * Requirements: 26.12, 26.13, 26.15
 */

import { DNA_BODY_SECONDARY, DNA_CAPTION, DNA_LABEL } from "@/lib/design-dna";
import { useState, useEffect, useCallback } from "react";
import type { ScreenerFilter, ScreenerPreset } from "@/types";
import {
  HOME_INPUT_SM,
  HOME_PRIMARY_BUTTON,
  HOME_SECONDARY_BUTTON,
} from "@/lib/home-ui";
import { MARKET_DOWN_TEXT, MARKET_NEUTRAL_BADGE } from "@/lib/market-semantics";
import { MARKET_UI_COPY } from "@/lib/market-ui-copy";

export interface ScreenerPresetsProps {
  currentFilters: ScreenerFilter[];
  onPresetSelect: (preset: ScreenerPreset) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScreenerPresets({
  currentFilters,
  onPresetSelect,
}: ScreenerPresetsProps) {
  const [presets, setPresets] = useState<ScreenerPreset[]>([]);
  const [customPresets, setCustomPresets] = useState<ScreenerPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Save form state
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch default presets on mount
  useEffect(() => {
    async function fetchPresets() {
      try {
        const res = await fetch("/api/screener/presets");
        if (!res.ok) {
          throw new Error(MARKET_UI_COPY.load.screenerPresetsLoad);
        }
        const json = await res.json();
        setPresets(json.data ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : MARKET_UI_COPY.load.screenerPresetsLoad
        );
      } finally {
        setLoading(false);
      }
    }
    fetchPresets();
  }, []);

  const handlePresetClick = useCallback(
    (preset: ScreenerPreset) => {
      setSelectedPresetId(preset.id);
      onPresetSelect(preset);
    },
    [onPresetSelect]
  );

  const handleSave = useCallback(async () => {
    if (!saveName.trim() || currentFilters.length === 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/screener/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: saveName.trim(),
          description: saveDescription.trim(),
          filters: currentFilters,
        }),
      });

      if (!res.ok) {
        throw new Error(MARKET_UI_COPY.load.screenerPresetsSave);
      }

      const json = await res.json();
      const saved: ScreenerPreset = json.data;
      setCustomPresets((prev) => [...prev, saved]);
      setShowSaveForm(false);
      setSaveName("");
      setSaveDescription("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : MARKET_UI_COPY.load.screenerPresetsSave
      );
    } finally {
      setSaving(false);
    }
  }, [saveName, saveDescription, currentFilters]);

  const allPresets = [...presets, ...customPresets];

  if (loading) {
    return (
      <div className={`${DNA_BODY_SECONDARY}`} data-testid="presets-loading">
        Loading presets…
      </div>
    );
  }

  return (
    <div data-testid="screener-presets" className="space-y-3">
      {/* Preset row */}
      <div className="flex items-center gap-2">
        <span className={`shrink-0 ${DNA_LABEL}`}>Presets:</span>
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1"
          data-testid="presets-row"
        >
          {allPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetClick(preset)}
              data-testid={`preset-${preset.id}`}
              className={`relative shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600 ${
                selectedPresetId === preset.id
                  ? "border-stone-600 bg-stone-900 text-stone-50 dark:border-stone-400 dark:bg-stone-100 dark:text-stone-900"
                  : "border-stone-200 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:hover:border-stone-500 dark:hover:bg-stone-700"
              }`}
              aria-pressed={selectedPresetId === preset.id}
              title={preset.description}
            >
              {preset.name}
              {!preset.isDefault && (
                <span
                  className={`ml-1.5 inline-block px-1 py-0.5 text-[10px] font-semibold ${MARKET_NEUTRAL_BADGE}`}
                  data-testid={`custom-badge-${preset.id}`}
                >
                  Custom
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Save current filters */}
      <div className="flex items-center gap-2">
        {!showSaveForm ? (
          <button
            type="button"
            onClick={() => setShowSaveForm(true)}
            disabled={currentFilters.length === 0}
            className={`${HOME_SECONDARY_BUTTON} px-3 py-1.5 text-xs disabled:opacity-50`}
            data-testid="save-preset-btn"
          >
            Save Current Filters
          </button>
        ) : (
          <div
            className="flex flex-wrap items-end gap-2"
            data-testid="save-preset-form"
          >
            <div className="space-y-1">
              <label
                htmlFor="preset-name"
                className={`text-xs font-medium ${DNA_CAPTION}`}
              >
                Name
              </label>
              <input
                id="preset-name"
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="My preset"
                className={HOME_INPUT_SM}
                data-testid="preset-name-input"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="preset-description"
                className={`text-xs font-medium ${DNA_CAPTION}`}
              >
                Description
              </label>
              <input
                id="preset-description"
                type="text"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="Optional description"
                className={HOME_INPUT_SM}
                data-testid="preset-description-input"
              />
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !saveName.trim()}
              className={`${HOME_PRIMARY_BUTTON} px-3 py-1.5 text-xs disabled:opacity-50`}
              data-testid="save-preset-confirm"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSaveForm(false);
                setSaveName("");
                setSaveDescription("");
              }}
              className={`${HOME_SECONDARY_BUTTON} px-3 py-1.5 text-xs`}
              data-testid="save-preset-cancel"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className={`text-sm ${MARKET_DOWN_TEXT}`}
          data-testid="presets-error"
        >
          {error}
        </div>
      )}
    </div>
  );
}
