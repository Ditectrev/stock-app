/**
 * Property-Based Tests for Trial Enforcement
 * Feature: the-open-stock, Property 8: Trial Enforcement
 *
 * Validates: Requirements 21.4, 21.5, 21.19
 * "For any device fingerprint that has previously been used for a trial,
 * subsequent trial attempts should be denied and an authentication prompt
 * should be displayed, regardless of browser mode or cleared cookies."
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

describe("Property 8: Trial Enforcement", () => {
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

  it("a device fingerprint used for a trial is stored for tracking", async () => {
    // Feature: the-open-stock, Property 8: Trial Enforcement
    // **Validates: Requirements 21.4**
    await fc.assert(
      fc.asyncProperty(browserCharacteristicsArb, async (chars) => {
        storageMock.clear();
        vi.clearAllMocks();
        setupMocks(chars);

        const service = new TrialManagementService();
        await service.startTrial();

        // The fingerprint should be persisted in the used-fingerprints list
        const stored = storageMock.getItem("trial_used_fingerprints");
        expect(stored).not.toBeNull();
        const usedFingerprints: string[] = JSON.parse(stored!);
        expect(usedFingerprints).toContain(chars.fingerprint);
      }),
      { numRuns: 100 }
    );
  });

  it("subsequent trial attempts with the same fingerprint are denied", async () => {
    // Feature: the-open-stock, Property 8: Trial Enforcement
    // **Validates: Requirements 21.5**
    await fc.assert(
      fc.asyncProperty(browserCharacteristicsArb, async (chars) => {
        storageMock.clear();
        vi.clearAllMocks();
        setupMocks(chars);

        const service = new TrialManagementService();

        // First trial should succeed
        const session = await service.startTrial();
        expect(session.isActive).toBe(true);

        // Expire the session so it's no longer active
        session.isActive = false;
        storageMock.setItem("trial_session", JSON.stringify(session));

        // Second trial attempt with the same fingerprint should be denied
        await expect(service.startTrial()).rejects.toThrow(
          "Trial already used on this device."
        );
      }),
      { numRuns: 100 }
    );
  });

  it("checkTrialEligibility returns false for a previously used fingerprint", async () => {
    // Feature: the-open-stock, Property 8: Trial Enforcement
    // **Validates: Requirements 21.4, 21.5**
    await fc.assert(
      fc.asyncProperty(browserCharacteristicsArb, async (chars) => {
        storageMock.clear();
        vi.clearAllMocks();
        setupMocks(chars);

        const service = new TrialManagementService();

        // Initially eligible
        const eligibleBefore = await service.checkTrialEligibility();
        expect(eligibleBefore).toBe(true);

        // Start and expire a trial
        const session = await service.startTrial();
        session.isActive = false;
        storageMock.setItem("trial_session", JSON.stringify(session));

        // No longer eligible
        const eligibleAfter = await service.checkTrialEligibility();
        expect(eligibleAfter).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("trial enforcement persists regardless of cleared cookies (simulated by clearing session but keeping fingerprints)", async () => {
    // Feature: the-open-stock, Property 8: Trial Enforcement
    // **Validates: Requirements 21.19**
    await fc.assert(
      fc.asyncProperty(browserCharacteristicsArb, async (chars) => {
        storageMock.clear();
        vi.clearAllMocks();
        setupMocks(chars);

        const service = new TrialManagementService();

        // Start a trial
        await service.startTrial();

        // Simulate "clearing cookies" by removing the session key
        // but the used-fingerprints list persists (as it would in
        // localStorage even when cookies are cleared)
        storageMock.removeItem("trial_session");

        // The fingerprint is still tracked — new trial should be denied
        const eligible = await service.checkTrialEligibility();
        expect(eligible).toBe(false);

        await expect(service.startTrial()).rejects.toThrow(
          "Trial already used on this device."
        );
      }),
      { numRuns: 100 }
    );
  });

  it("different device fingerprints can each start independent trials", async () => {
    // Feature: the-open-stock, Property 8: Trial Enforcement
    // **Validates: Requirements 21.4, 21.5**
    // Ensures enforcement is per-fingerprint, not global
    await fc.assert(
      fc.asyncProperty(
        browserCharacteristicsArb,
        browserCharacteristicsArb,
        async (chars1, chars2) => {
          // Skip if fingerprints happen to collide
          fc.pre(chars1.fingerprint !== chars2.fingerprint);

          storageMock.clear();
          vi.clearAllMocks();
          setupMocks(chars1);

          const service1 = new TrialManagementService();
          const session1 = await service1.startTrial();
          expect(session1.isActive).toBe(true);

          // Expire first session
          session1.isActive = false;
          storageMock.setItem("trial_session", JSON.stringify(session1));

          // Switch to a different device fingerprint
          vi.clearAllMocks();
          setupMocks(chars2);

          const service2 = new TrialManagementService();
          const session2 = await service2.startTrial();
          expect(session2.isActive).toBe(true);
          expect(session2.deviceFingerprint).toBe(chars2.fingerprint);
        }
      ),
      { numRuns: 100 }
    );
  });
});
