/**
 * Property-Based Tests for Trial State Persistence
 * Feature: the-open-stock, Property 11: Trial State Persistence
 *
 * Validates: Requirements 21.18
 * "For any trial session, refreshing the page should preserve the trial state
 * (start_time, end_time, is_active, remaining time) using browser storage."
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
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
// localStorage mock — backed by a plain object so data survives across
// TrialManagementService instances (simulating a page refresh).
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
// Arbitraries — generate arbitrary browser characteristics
// ---------------------------------------------------------------------------

/** User agent strings */
const userAgentArb = fc.oneof(
  fc.constant("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"),
  fc.constant("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"),
  fc.constant("Mozilla/5.0 (X11; Linux x86_64)"),
  fc
    .tuple(
      fc.constantFrom("Mozilla/5.0", "AppleWebKit/537.36"),
      fc.stringMatching(/^[A-Za-z0-9/ .();]{5,30}$/)
    )
    .map(([prefix, suffix]) => `${prefix} ${suffix}`)
);

/** Screen resolutions */
const screenResolutionArb = fc
  .tuple(
    fc.integer({ min: 320, max: 7680 }),
    fc.integer({ min: 240, max: 4320 })
  )
  .map(([w, h]) => `${w}x${h}`);

/** Timezone strings */
const timezoneArb = fc.oneof(
  fc.constantFrom(
    "America/New_York",
    "Europe/London",
    "Asia/Tokyo",
    "Pacific/Auckland",
    "UTC"
  ),
  fc
    .tuple(
      fc.constantFrom("America", "Europe", "Asia", "Africa", "Pacific"),
      fc.stringMatching(/^[A-Z][a-z]{2,10}$/)
    )
    .map(([region, city]) => `${region}/${city}`)
);

/** Fingerprint hash strings (simulating the djb2 hash output) */
const fingerprintArb = fc.stringMatching(/^[a-z0-9]{4,10}$/);

/** IP address strings */
const ipAddressArb = fc
  .tuple(
    fc.integer({ min: 1, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 1, max: 254 })
  )
  .map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

/** Combined browser characteristics record */
const browserCharacteristicsArb = fc.record({
  userAgent: userAgentArb,
  screenResolution: screenResolutionArb,
  timezone: timezoneArb,
  fingerprint: fingerprintArb,
  ipAddress: ipAddressArb,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 11: Trial State Persistence", () => {
  let storageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    storageMock = createLocalStorageMock();
    Object.defineProperty(globalThis, "localStorage", {
      value: storageMock,
      writable: true,
      configurable: true,
    });
  });

  /**
   * Helper: set up mocks for a given set of browser characteristics.
   */
  function setupMocks(chars: {
    userAgent: string;
    screenResolution: string;
    timezone: string;
    fingerprint: string;
    ipAddress: string;
  }) {
    mockGenerateDeviceFingerprint.mockReturnValue(chars.fingerprint);
    mockGetBrowserCharacteristics.mockReturnValue({
      userAgent: chars.userAgent,
      screenResolution: chars.screenResolution,
      timezone: chars.timezone,
    });
    mockGetUserIdentifier.mockResolvedValue(chars.ipAddress);
  }

  it("trial session state is persisted to browser storage after creation", async () => {
    // Feature: the-open-stock, Property 11: Trial State Persistence
    // **Validates: Requirements 21.18**
    await fc.assert(
      fc.asyncProperty(browserCharacteristicsArb, async (chars) => {
        storageMock.clear();
        vi.clearAllMocks();
        setupMocks(chars);

        const service = new TrialManagementService();
        await service.startTrial();

        // Session should be stored in localStorage
        const stored = storageMock.getItem("trial_session");
        expect(stored).not.toBeNull();

        const parsed = JSON.parse(stored!);
        expect(parsed.startTime).toBeDefined();
        expect(parsed.endTime).toBeDefined();
        expect(parsed.isActive).toBe(true);
        expect(parsed.deviceFingerprint).toBe(chars.fingerprint);
      }),
      { numRuns: 100 }
    );
  });

  it("a new service instance (simulating page refresh) restores trial state from storage", async () => {
    // Feature: the-open-stock, Property 11: Trial State Persistence
    // **Validates: Requirements 21.18**
    await fc.assert(
      fc.asyncProperty(browserCharacteristicsArb, async (chars) => {
        storageMock.clear();
        vi.clearAllMocks();
        setupMocks(chars);

        // Start a trial with the first service instance
        const service1 = new TrialManagementService();
        const originalSession = await service1.startTrial();

        // Simulate page refresh: create a new service instance
        // (in-memory state is gone, but localStorage persists)
        const service2 = new TrialManagementService();
        const status = service2.getTrialStatus();

        // The restored status should reflect the original session
        expect(status.isActive).toBe(true);
        expect(status.remainingSeconds).toBeGreaterThan(0);
        expect(status.remainingSeconds).toBeLessThanOrEqual(15 * 60);
        expect(status.hasUsedTrial).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("start_time and end_time are preserved exactly across simulated page refresh", async () => {
    // Feature: the-open-stock, Property 11: Trial State Persistence
    // **Validates: Requirements 21.18**
    await fc.assert(
      fc.asyncProperty(browserCharacteristicsArb, async (chars) => {
        storageMock.clear();
        vi.clearAllMocks();
        setupMocks(chars);

        const service1 = new TrialManagementService();
        const originalSession = await service1.startTrial();

        // Read back from storage (simulating what a new instance reads)
        const raw = storageMock.getItem("trial_session");
        expect(raw).not.toBeNull();
        const restored = JSON.parse(raw!);

        // Dates are serialized as ISO strings — verify they round-trip
        expect(new Date(restored.startTime).getTime()).toBe(
          originalSession.startTime.getTime()
        );
        expect(new Date(restored.endTime).getTime()).toBe(
          originalSession.endTime.getTime()
        );
      }),
      { numRuns: 100 }
    );
  });

  it("is_active flag and device_fingerprint are preserved across simulated page refresh", async () => {
    // Feature: the-open-stock, Property 11: Trial State Persistence
    // **Validates: Requirements 21.18**
    await fc.assert(
      fc.asyncProperty(browserCharacteristicsArb, async (chars) => {
        storageMock.clear();
        vi.clearAllMocks();
        setupMocks(chars);

        const service1 = new TrialManagementService();
        const originalSession = await service1.startTrial();

        // Read back from storage
        const raw = storageMock.getItem("trial_session");
        const restored = JSON.parse(raw!);

        expect(restored.isActive).toBe(originalSession.isActive);
        expect(restored.deviceFingerprint).toBe(
          originalSession.deviceFingerprint
        );
      }),
      { numRuns: 100 }
    );
  });

  it("remaining time is consistent after simulated page refresh", async () => {
    // Feature: the-open-stock, Property 11: Trial State Persistence
    // **Validates: Requirements 21.18**
    await fc.assert(
      fc.asyncProperty(browserCharacteristicsArb, async (chars) => {
        storageMock.clear();
        vi.clearAllMocks();
        setupMocks(chars);

        const service1 = new TrialManagementService();
        await service1.startTrial();
        const statusBefore = service1.getTrialStatus();

        // Simulate page refresh
        const service2 = new TrialManagementService();
        const statusAfter = service2.getTrialStatus();

        // Remaining time should be very close (within 1 second tolerance
        // since both calls happen nearly simultaneously)
        expect(
          Math.abs(statusBefore.remainingSeconds - statusAfter.remainingSeconds)
        ).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });
});
