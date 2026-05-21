/**
 * Property-Based Tests for Trial Session Creation
 * Feature: the-open-stock, Property 7: Trial Session Creation
 *
 * Validates: Requirements 21.1, 21.2, 21.3
 * "For any unauthenticated user accessing the application, a trial session
 * should be created with start_time, end_time (15 minutes after start),
 * is_active flag set to true, and a device_fingerprint generated from
 * browser characteristics."
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

/** Plugin lists */
const pluginsArb = fc
  .array(
    fc.constantFrom(
      "Chrome PDF Plugin",
      "Widevine Content Decryption Module",
      "Native Client",
      "Shockwave Flash",
      ""
    ),
    { minLength: 0, maxLength: 5 }
  )
  .map((plugins) => plugins.filter(Boolean).join(","));

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
  plugins: pluginsArb,
  fingerprint: fingerprintArb,
  ipAddress: ipAddressArb,
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 7: Trial Session Creation", () => {
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

  it("startTrial creates a TrialSession with all required fields (start_time, end_time, is_active, device_fingerprint)", async () => {
    // Feature: the-open-stock, Property 7: Trial Session Creation
    await fc.assert(
      fc.asyncProperty(browserCharacteristicsArb, async (chars) => {
        // Reset storage for each iteration so fingerprint is not "used"
        storageMock.clear();
        vi.clearAllMocks();

        mockGenerateDeviceFingerprint.mockReturnValue(chars.fingerprint);
        mockGetBrowserCharacteristics.mockReturnValue({
          userAgent: chars.userAgent,
          screenResolution: chars.screenResolution,
          timezone: chars.timezone,
        });
        mockGetUserIdentifier.mockResolvedValue(chars.ipAddress);

        const service = new TrialManagementService();
        const session = await service.startTrial();

        // Req 21.1: session contains start_time, end_time, is_active, device_fingerprint
        expect(session.startTime).toBeInstanceOf(Date);
        expect(session.endTime).toBeInstanceOf(Date);
        expect(typeof session.isActive).toBe("boolean");
        expect(typeof session.deviceFingerprint).toBe("string");
        expect(session.id).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it("end_time is exactly 15 minutes after start_time", async () => {
    // Feature: the-open-stock, Property 7: Trial Session Creation
    // **Validates: Requirements 21.2**
    await fc.assert(
      fc.asyncProperty(browserCharacteristicsArb, async (chars) => {
        storageMock.clear();
        vi.clearAllMocks();

        mockGenerateDeviceFingerprint.mockReturnValue(chars.fingerprint);
        mockGetBrowserCharacteristics.mockReturnValue({
          userAgent: chars.userAgent,
          screenResolution: chars.screenResolution,
          timezone: chars.timezone,
        });
        mockGetUserIdentifier.mockResolvedValue(chars.ipAddress);

        const service = new TrialManagementService();
        const session = await service.startTrial();

        const duration =
          session.endTime.getTime() - session.startTime.getTime();
        expect(duration).toBe(FIFTEEN_MINUTES_MS);
      }),
      { numRuns: 100 }
    );
  });

  it("is_active is set to true on creation", async () => {
    // Feature: the-open-stock, Property 7: Trial Session Creation
    // **Validates: Requirements 21.1**
    await fc.assert(
      fc.asyncProperty(browserCharacteristicsArb, async (chars) => {
        storageMock.clear();
        vi.clearAllMocks();

        mockGenerateDeviceFingerprint.mockReturnValue(chars.fingerprint);
        mockGetBrowserCharacteristics.mockReturnValue({
          userAgent: chars.userAgent,
          screenResolution: chars.screenResolution,
          timezone: chars.timezone,
        });
        mockGetUserIdentifier.mockResolvedValue(chars.ipAddress);

        const service = new TrialManagementService();
        const session = await service.startTrial();

        expect(session.isActive).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("device_fingerprint is generated and non-empty for any browser characteristics", async () => {
    // Feature: the-open-stock, Property 7: Trial Session Creation
    // **Validates: Requirements 21.3**
    await fc.assert(
      fc.asyncProperty(browserCharacteristicsArb, async (chars) => {
        storageMock.clear();
        vi.clearAllMocks();

        mockGenerateDeviceFingerprint.mockReturnValue(chars.fingerprint);
        mockGetBrowserCharacteristics.mockReturnValue({
          userAgent: chars.userAgent,
          screenResolution: chars.screenResolution,
          timezone: chars.timezone,
        });
        mockGetUserIdentifier.mockResolvedValue(chars.ipAddress);

        const service = new TrialManagementService();
        const session = await service.startTrial();

        expect(typeof session.deviceFingerprint).toBe("string");
        expect(session.deviceFingerprint.length).toBeGreaterThan(0);
        expect(session.deviceFingerprint).toBe(chars.fingerprint);
      }),
      { numRuns: 100 }
    );
  });

  it("session stores browser characteristics (userAgent, screenResolution, timezone)", async () => {
    // Feature: the-open-stock, Property 7: Trial Session Creation
    // **Validates: Requirements 21.1, 21.3**
    await fc.assert(
      fc.asyncProperty(browserCharacteristicsArb, async (chars) => {
        storageMock.clear();
        vi.clearAllMocks();

        mockGenerateDeviceFingerprint.mockReturnValue(chars.fingerprint);
        mockGetBrowserCharacteristics.mockReturnValue({
          userAgent: chars.userAgent,
          screenResolution: chars.screenResolution,
          timezone: chars.timezone,
        });
        mockGetUserIdentifier.mockResolvedValue(chars.ipAddress);

        const service = new TrialManagementService();
        const session = await service.startTrial();

        // The session should capture the browser characteristics used for fingerprinting
        expect(session.userAgent).toBe(chars.userAgent);
        expect(session.screenResolution).toBe(chars.screenResolution);
        expect(session.timezone).toBe(chars.timezone);
      }),
      { numRuns: 100 }
    );
  });
});
