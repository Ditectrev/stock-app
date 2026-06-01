import { describe, it, expect, beforeEach } from "vitest";
import {
  readSelectedBYOKProvider,
  saveSelectedBYOKProvider,
} from "@/services/api-key-manager.service";

describe("BYOK selected provider persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to OPENAI when nothing stored", () => {
    expect(readSelectedBYOKProvider()).toBe("OPENAI");
  });

  it("round-trips selected provider", () => {
    saveSelectedBYOKProvider("GEMINI");
    expect(readSelectedBYOKProvider()).toBe("GEMINI");
  });
});
