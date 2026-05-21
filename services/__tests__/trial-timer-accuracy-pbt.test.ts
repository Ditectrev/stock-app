/**
 * Property-Based Tests for Trial Timer Accuracy
 * Feature: the-open-stock, Property 9: Trial Timer Accuracy
 *
 * Validates: Requirements 21.9
 * "For any active trial session, the displayed remaining time should equal
 * the difference between end_time and current time, accurate to the second."
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fc from "fast-check";

// ---------------------------------------------------------------------------
// Mock dependencies before importing the service
// ---------------------------------------------------------------------------

const { mockGenerateDeviceFingerprint, mockGetBrowserCharacteristics } =
  vi.hoisted(() => ({
    mockGenerateDeviceFingerprint: vi.fn(),
    mockGetBrowserCharacteristics: vi.fn(),
  }));

const { mockGetUserIdentifier } = vi.hoisted(() => ({
  mockGetUserIdentifier: vi.fn(),
}));

vi.mock("@/lib/device-fingerprint", () => ({
  generateDeviceFingerprint: mockGenerateDeviceFingerprint,
  getBrowserCharacteristics: mockGetBrowserCharacteristics,
}));

vi.mock("@/lib/ip-tracking", () => ({
  getUserIdentifier: mockGetUserIdentifier,
}));

vi.mock("@/lib/env", () => ({
  env: {
    trial: { durationMinutes: 15 },
  },
}));

import { TrialManagementService } from "@/services/trial-management.service";

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

function createLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      for (const key of Object.keys(store)) delete store[key];
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  };
}

// ---------------------------------------------------------------------------
// formatTime — mirrors the TrialTimer component's display logic
// ---------------------------------------------------------------------------

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupMocks(fingerprint: string) {
  mockGenerateDeviceFingerprint.mockReturnValue(fingerprint);
  mockGetBrowserCharacteristics.mockReturnValue({
    userAgent: "Mozilla/5.0",
    screenResolution: "1920x1080",
    timezone: "UTC",
  });
  mockGetUserIdentifier.mockResolvedValue("127.0.0.1");
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Elapsed seconds since trial started (0 to just under 15 min) */
const elapsedSecondsArb = fc.integer({ min: 0, max: 14 * 60 + 59 });

/** Elapsed seconds that exceed the trial (trial already expired) */
const expiredElapsedSecondsArb = fc.integer({
  min: 15 * 60,
  max: 30 * 60,
});

/** Fingerprint hash strings */
const fingerprintArb = fc.stringMatching(/^[a-z0-9]{4,10}$/);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_TIME = 1700000000000;
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 9: Trial Timer Accuracy", () => {
  let storageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME);
    vi.clearAllMocks();
    storageMock = createLocalStorageMock();
    Object.defineProperty(globalThis, "localStorage", {
      value: storageMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("remaining seconds equals floor((endTime - now) / 1000) for any active trial", async () => {
    // Feature: the-open-stock, Property 9: Trial Timer Accuracy
    // **Validates: Requirements 21.9**
    await fc.assert(
      fc.asyncProperty(
        elapsedSecondsArb,
        fingerprintArb,
        async (elapsedSeconds, fingerprint) => {
          storageMock.clear();
          vi.clearAllMocks();
          vi.setSystemTime(BASE_TIME);
          setupMocks(fingerprint);

          const service = new TrialManagementService();
          const session = await service.startTrial();

          // Advance time by elapsedSeconds
          vi.setSystemTime(BASE_TIME + elapsedSeconds * 1000);

          const status = service.getTrialStatus();

          // Expected remaining = floor((endTime - now) / 1000)
          const endTimeMs = new Date(session.endTime).getTime();
          const currentTime = BASE_TIME + elapsedSeconds * 1000;
          const expectedRemaining = Math.max(
            0,
            Math.floor((endTimeMs - currentTime) / 1000)
          );

          expect(status.remainingSeconds).toBe(expectedRemaining);
          expect(status.isActive).toBe(expectedRemaining > 0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("displayed time format matches remaining seconds for any active trial", async () => {
    // Feature: the-open-stock, Property 9: Trial Timer Accuracy
    // **Validates: Requirements 21.9**
    await fc.assert(
      fc.asyncProperty(
        elapsedSecondsArb,
        fingerprintArb,
        async (elapsedSeconds, fingerprint) => {
          storageMock.clear();
          vi.clearAllMocks();
          vi.setSystemTime(BASE_TIME);
          setupMocks(fingerprint);

          const service = new TrialManagementService();
          const session = await service.startTrial();

          // Advance time
          const currentTime = BASE_TIME + elapsedSeconds * 1000;
          vi.setSystemTime(currentTime);

          const status = service.getTrialStatus();
          const remaining = status.remainingSeconds;

          // The formatted display should match mm:ss of remaining seconds
          const expectedDisplay = formatTime(remaining);
          const expectedMinutes = Math.floor(remaining / 60);
          const expectedSecs = remaining % 60;

          expect(expectedDisplay).toBe(
            `${expectedMinutes}:${expectedSecs.toString().padStart(2, "0")}`
          );

          // Verify remaining is accurate to the second
          const endTimeMs = new Date(session.endTime).getTime();
          const exactDiffSeconds = (endTimeMs - currentTime) / 1000;
          expect(remaining).toBe(Math.max(0, Math.floor(exactDiffSeconds)));
        }
      ),
      { numRuns: 100 }
    );
  });

  it("remaining time is zero when current time is at or past end_time", async () => {
    // Feature: the-open-stock, Property 9: Trial Timer Accuracy
    // **Validates: Requirements 21.9**
    await fc.assert(
      fc.asyncProperty(
        expiredElapsedSecondsArb,
        fingerprintArb,
        async (elapsedSeconds, fingerprint) => {
          storageMock.clear();
          vi.clearAllMocks();
          vi.setSystemTime(BASE_TIME);
          setupMocks(fingerprint);

          const service = new TrialManagementService();
          await service.startTrial();

          // Advance past the trial end time
          vi.setSystemTime(BASE_TIME + elapsedSeconds * 1000);

          const status = service.getTrialStatus();

          expect(status.remainingSeconds).toBe(0);
          expect(status.isActive).toBe(false);
          expect(formatTime(status.remainingSeconds)).toBe("0:00");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("remaining seconds decreases by exactly 1 for each second elapsed", async () => {
    // Feature: the-open-stock, Property 9: Trial Timer Accuracy
    // **Validates: Requirements 21.9**
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 14 * 60 + 58 }),
        fingerprintArb,
        async (elapsedSeconds, fingerprint) => {
          storageMock.clear();
          vi.clearAllMocks();
          vi.setSystemTime(BASE_TIME);
          setupMocks(fingerprint);

          const service = new TrialManagementService();
          await service.startTrial();

          // Check at time T
          vi.setSystemTime(BASE_TIME + elapsedSeconds * 1000);
          const statusT = service.getTrialStatus();

          // Check at time T+1
          vi.setSystemTime(BASE_TIME + (elapsedSeconds + 1) * 1000);
          const statusTPlus1 = service.getTrialStatus();

          // Remaining should decrease by exactly 1
          expect(statusT.remainingSeconds - statusTPlus1.remainingSeconds).toBe(
            1
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
