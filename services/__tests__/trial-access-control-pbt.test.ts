/**
 * Property-Based Tests for Trial Access Control
 * Feature: the-open-stock, Property 10: Trial Access Control
 *
 * Validates: Requirements 21.11, 21.12
 * "For any trial session where is_active is true, all application features
 * should be accessible; when is_active is false, an authentication prompt
 * should be displayed."
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
// localStorage mock — backed by a plain object so data survives across calls
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
// Arbitraries
// ---------------------------------------------------------------------------

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

const screenResolutionArb = fc
  .tuple(
    fc.integer({ min: 320, max: 7680 }),
    fc.integer({ min: 240, max: 4320 })
  )
  .map(([w, h]) => `${w}x${h}`);

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

const fingerprintArb = fc.stringMatching(/^[a-z0-9]{4,10}$/);

const ipAddressArb = fc
  .tuple(
    fc.integer({ min: 1, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 1, max: 254 })
  )
  .map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

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

describe("Property 10: Trial Access Control", () => {
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

  it("while is_active is true, getTrialStatus reports active with remaining time > 0", async () => {
    // Feature: the-open-stock, Property 10: Trial Access Control
    // **Validates: Requirement 21.11**
    await fc.assert(
      fc.asyncProperty(browserCharacteristicsArb, async (chars) => {
        storageMock.clear();
        vi.clearAllMocks();
        setupMocks(chars);

        const service = new TrialManagementService();
        const session = await service.startTrial();

        // Session was just created — it must be active
        expect(session.isActive).toBe(true);

        // getTrialStatus should confirm active access
        const status = service.getTrialStatus();
        expect(status.isActive).toBe(true);
        expect(status.remainingSeconds).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it("when trial expires, is_active becomes false", async () => {
    // Feature: the-open-stock, Property 10: Trial Access Control
    // **Validates: Requirement 21.12**
    await fc.assert(
      fc.asyncProperty(browserCharacteristicsArb, async (chars) => {
        storageMock.clear();
        vi.clearAllMocks();
        setupMocks(chars);

        const service = new TrialManagementService();
        const session = await service.startTrial();

        // Simulate expiration by setting endTime to the past
        const expiredSession = {
          ...session,
          endTime: new Date(Date.now() - 1000),
        };
        storageMock.setItem("trial_session", JSON.stringify(expiredSession));

        const status = service.getTrialStatus();
        expect(status.isActive).toBe(false);
        expect(status.remainingSeconds).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it("endTrial sets is_active to false, denying further access", async () => {
    // Feature: the-open-stock, Property 10: Trial Access Control
    // **Validates: Requirements 21.11, 21.12**
    await fc.assert(
      fc.asyncProperty(browserCharacteristicsArb, async (chars) => {
        storageMock.clear();
        vi.clearAllMocks();
        setupMocks(chars);

        const service = new TrialManagementService();
        await service.startTrial();

        // Verify active before ending
        const statusBefore = service.getTrialStatus();
        expect(statusBefore.isActive).toBe(true);

        // End the trial explicitly
        service.endTrial();

        // Access should now be denied
        const statusAfter = service.getTrialStatus();
        expect(statusAfter.isActive).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("expired trial reports hasUsedTrial true, signaling auth prompt is needed", async () => {
    // Feature: the-open-stock, Property 10: Trial Access Control
    // **Validates: Requirement 21.12**
    await fc.assert(
      fc.asyncProperty(browserCharacteristicsArb, async (chars) => {
        storageMock.clear();
        vi.clearAllMocks();
        setupMocks(chars);

        const service = new TrialManagementService();
        const session = await service.startTrial();

        // Simulate expiration
        const expiredSession = {
          ...session,
          endTime: new Date(Date.now() - 1000),
        };
        storageMock.setItem("trial_session", JSON.stringify(expiredSession));

        const status = service.getTrialStatus();
        expect(status.isActive).toBe(false);
        expect(status.hasUsedTrial).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("no trial session means no access and no prior trial usage", () => {
    // Feature: the-open-stock, Property 10: Trial Access Control
    // **Validates: Requirements 21.11, 21.12**
    fc.assert(
      fc.property(browserCharacteristicsArb, (chars) => {
        storageMock.clear();
        vi.clearAllMocks();
        setupMocks(chars);

        const service = new TrialManagementService();
        const status = service.getTrialStatus();

        // No session → not active, no remaining time
        expect(status.isActive).toBe(false);
        expect(status.remainingSeconds).toBe(0);
        expect(status.hasUsedTrial).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
