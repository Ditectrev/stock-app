import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/appwrite", () => ({
  createServerClient: () => {
    throw new Error("Appwrite should not be called when trial is offline");
  },
}));

vi.mock("@/lib/appwrite-trial-env", () => ({
  assertAppwriteTrialEnv: () => {
    throw new Error("Appwrite trial env is not configured");
  },
  isAppwriteTrialConfigured: () => false,
}));

vi.mock("@/lib/env", () => ({
  env: {
    trial: { durationMinutes: 60 },
  },
}));

import { ServerTrialManagementService } from "@/services/server-trial-management.service";

describe("ServerTrialManagementService (offline / CI)", () => {
  let service: ServerTrialManagementService;

  beforeEach(() => {
    service = new ServerTrialManagementService();
  });

  it("returns an active trial status without Appwrite", async () => {
    const status = await service.getTrialStatus({
      fingerprint: "ci-fingerprint",
      userAgent: "CI",
      screenResolution: "1280x720",
      timezone: "UTC",
    });

    expect(status.isActive).toBe(true);
    expect(status.remainingSeconds).toBe(3600);
    expect(status.hasUsedTrial).toBe(false);
  });

  it("reports eligible when Appwrite is not configured", async () => {
    const eligible = await service.checkTrialEligibility({
      fingerprint: "ci-fingerprint",
      userAgent: "CI",
      screenResolution: "1280x720",
      timezone: "UTC",
    });

    expect(eligible).toBe(true);
  });
});
