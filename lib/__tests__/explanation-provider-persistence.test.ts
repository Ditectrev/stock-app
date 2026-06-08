import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  EXPLANATIONS_PROVIDER_STORAGE_KEY,
  readStoredExplanationProvider,
  saveExplanationProvider,
} from "@/lib/explanation-provider";

describe("explanation provider persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists provider to localStorage on save", () => {
    saveExplanationProvider("GEMINI");
    expect(localStorage.getItem(EXPLANATIONS_PROVIDER_STORAGE_KEY)).toBe(
      "GEMINI"
    );
    expect(readStoredExplanationProvider()).toBe("GEMINI");
  });

  it("does not clear storage when reading after save", () => {
    saveExplanationProvider("OPENAI");
    expect(readStoredExplanationProvider()).toBe("OPENAI");
    // Simulate tier sync that used to wipe storage — read again
    expect(readStoredExplanationProvider()).toBe("OPENAI");
  });

  it("dispatches change event on save", () => {
    const handler = vi.fn();
    window.addEventListener("explanations-provider-changed", handler);
    saveExplanationProvider("MISTRAL");
    expect(handler).toHaveBeenCalled();
    window.removeEventListener("explanations-provider-changed", handler);
  });
});
