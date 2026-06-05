/**
 * Server trial management — fingerprint vs IP session lookup
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockListDocuments = vi.fn();
const mockCreateDocument = vi.fn();
const mockUpdateDocument = vi.fn();

vi.mock("@/lib/appwrite", () => ({
  createServerClient: () => ({
    databases: {
      listDocuments: mockListDocuments,
      createDocument: mockCreateDocument,
      updateDocument: mockUpdateDocument,
    },
  }),
}));

vi.mock("@/lib/appwrite-trial-env", () => ({
  assertAppwriteTrialEnv: () => ({
    databaseId: "db",
    sessionsCollectionId: "trials",
  }),
  isAppwriteTrialConfigured: () => true,
}));

vi.mock("@/lib/env", () => ({
  env: {
    trial: { durationMinutes: 60 },
  },
}));

import { ServerTrialManagementService } from "@/services/server-trial-management.service";

const SHARED_IP = "203.0.113.10";
const USER_A_FP = "fp-user-a";
const USER_B_FP = "fp-user-b";

function activeSessionDoc(
  fingerprint: string,
  remainingMs: number,
  id = "doc-1"
) {
  const now = Date.now();
  return {
    $id: id,
    fingerprint,
    ipAddress: SHARED_IP,
    startTime: new Date(now - (60 * 60_000 - remainingMs)).toISOString(),
    endTime: new Date(now + remainingMs).toISOString(),
    isActive: true,
    userAgent: "Mozilla/5.0",
    screenResolution: "1920x1080",
    timezone: "UTC",
    $createdAt: new Date(now - 1000).toISOString(),
  };
}

describe("ServerTrialManagementService", () => {
  let service: ServerTrialManagementService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ServerTrialManagementService();
  });

  it("returns full remaining time for fingerprint session, not a shared-IP session", async () => {
    const userASession = activeSessionDoc(USER_A_FP, 5 * 60_000);

    mockListDocuments.mockImplementation((_db, _col, queries: unknown[]) => {
      const q = JSON.stringify(queries);
      if (q.includes(USER_B_FP)) {
        return Promise.resolve({ documents: [] });
      }
      if (q.includes(USER_A_FP)) {
        return Promise.resolve({ documents: [userASession] });
      }
      if (q.includes(SHARED_IP)) {
        return Promise.resolve({ documents: [userASession] });
      }
      return Promise.resolve({ documents: [] });
    });

    const status = await service.getTrialStatus({
      fingerprint: USER_B_FP,
      userAgent: "Mozilla/5.0",
      screenResolution: "1920x1080",
      timezone: "UTC",
      ipAddress: SHARED_IP,
    });

    expect(status.isActive).toBe(false);
    expect(status.remainingSeconds).toBe(0);
    expect(status.hasUsedTrial).toBe(true);
  });

  it("uses fingerprint session remaining time when one exists", async () => {
    const userBSession = activeSessionDoc(USER_B_FP, 45 * 60_000, "doc-b");

    mockListDocuments.mockImplementation((_db, _col, queries: unknown[]) => {
      const q = JSON.stringify(queries);
      if (q.includes(USER_B_FP)) {
        return Promise.resolve({ documents: [userBSession] });
      }
      return Promise.resolve({ documents: [] });
    });

    const status = await service.getTrialStatus({
      fingerprint: USER_B_FP,
      userAgent: "Mozilla/5.0",
      screenResolution: "1920x1080",
      timezone: "UTC",
      ipAddress: SHARED_IP,
    });

    expect(status.isActive).toBe(true);
    expect(status.remainingSeconds).toBeGreaterThanOrEqual(44 * 60);
    expect(status.remainingSeconds).toBeLessThanOrEqual(45 * 60);
  });

  it("creates sessions with 60-minute duration", async () => {
    mockListDocuments.mockResolvedValue({ documents: [] });
    mockCreateDocument.mockImplementation((_db, _col, _id, payload) =>
      Promise.resolve({
        $id: "new-doc",
        ...payload,
        $createdAt: new Date().toISOString(),
      })
    );

    const before = Date.now();
    const session = await service.startTrial({
      fingerprint: USER_B_FP,
      userAgent: "Mozilla/5.0",
      screenResolution: "1920x1080",
      timezone: "UTC",
      ipAddress: SHARED_IP,
    });
    const durationMs = session.endTime.getTime() - session.startTime.getTime();

    expect(durationMs).toBe(60 * 60_000);
    expect(session.startTime.getTime()).toBeGreaterThanOrEqual(before);
  });
});
