/**
 * Property-Based Tests for Authentication Error Handling
 * Feature: the-open-stock, Property 2: Authentication Error Handling
 *
 * Validates: Requirements 1.6
 * "For any authentication failure (invalid credentials, network error, or
 * provider unavailability), the system should display a descriptive error
 * message and not create a session."
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import type { AuthResult } from "@/types";

// ---------------------------------------------------------------------------
// Mock Appwrite SDK before importing the service
// ---------------------------------------------------------------------------

const {
  mockCreateOAuth2Token,
  mockCreateEmailToken,
  mockCreateSession,
  mockGet,
  mockDeleteSession,
  mockSetJWT,
} = vi.hoisted(() => ({
  mockCreateOAuth2Token: vi.fn(),
  mockCreateEmailToken: vi.fn(),
  mockCreateSession: vi.fn(),
  mockGet: vi.fn(),
  mockDeleteSession: vi.fn(),
  mockSetJWT: vi.fn(),
}));

vi.mock("node-appwrite", () => {
  class MockClient {
    setEndpoint() {
      return this;
    }
    setProject() {
      return this;
    }
    setJWT(jwt: string) {
      mockSetJWT(jwt);
      return this;
    }
  }
  class MockAccount {
    createOAuth2Token = mockCreateOAuth2Token;
    createEmailToken = mockCreateEmailToken;
    createSession = mockCreateSession;
    get = mockGet;
    deleteSession = mockDeleteSession;
  }
  return {
    Client: MockClient,
    Account: MockAccount,
    OAuthProvider: { Apple: "apple", Google: "google" },
    ID: { unique: () => "unique-id" },
  };
});

vi.mock("@/lib/env", () => ({
  env: {
    appwrite: { endpoint: "https://test.appwrite.io/v1", projectId: "test" },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  AuthenticationService,
  AuthenticationError,
} from "@/services/authentication.service";

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Valid email addresses */
const emailArb = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/),
    fc.stringMatching(/^[a-z]{2,6}$/),
    fc.constantFrom("com", "org", "net", "io", "dev")
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/** Appwrite-style user IDs */
const userIdArb = fc.stringMatching(/^[a-f0-9]{20}$/);

/** Session secrets */
const secretArb = fc.stringMatching(/^[a-zA-Z0-9]{32}$/);

/** OAuth redirect URLs */
const urlArb = fc
  .stringMatching(/^[a-z]{3,8}$/)
  .map((path) => `https://example.com/${path}`);

/** Auth provider type */
const providerArb = fc.constantFrom("apple", "google", "email") as fc.Arbitrary<
  "apple" | "google" | "email"
>;

/** Error categories that external services can produce */
const errorKindArb = fc.constantFrom(
  "invalid_credentials",
  "network_error",
  "provider_unavailable"
) as fc.Arbitrary<
  "invalid_credentials" | "network_error" | "provider_unavailable"
>;

/** Generates a realistic Error for a given failure kind */
function makeError(kind: string): Error {
  switch (kind) {
    case "invalid_credentials":
      return new Error("Invalid credentials");
    case "network_error":
      return new Error("Network request failed");
    case "provider_unavailable":
      return new Error("Service unavailable");
    default:
      return new Error("Unknown error");
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupMocksForFailure(kind: string) {
  const err = makeError(kind);
  // createOAuth2Token is called synchronously (not awaited) in the service,
  // so it must throw synchronously for the catch block to trigger.
  mockCreateOAuth2Token.mockImplementation(() => {
    throw err;
  });
  mockCreateEmailToken.mockRejectedValue(err);
  mockCreateSession.mockRejectedValue(err);
  mockGet.mockRejectedValue(err);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 2: Authentication Error Handling", () => {
  let service: AuthenticationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthenticationService();
  });

  it("Apple SSO initiation failure throws AuthenticationError with descriptive message", async () => {
    // Feature: the-open-stock, Property 2: Authentication Error Handling
    await fc.assert(
      fc.asyncProperty(
        errorKindArb,
        urlArb,
        urlArb,
        async (errorKind, successUrl, failureUrl) => {
          vi.clearAllMocks();
          setupMocksForFailure(errorKind);

          try {
            await service.signInWithApple(successUrl, failureUrl);
            // Should never reach here
            expect.unreachable("Expected AuthenticationError to be thrown");
          } catch (error) {
            // Property: failure throws AuthenticationError with a descriptive message
            expect(error).toBeInstanceOf(AuthenticationError);
            expect((error as AuthenticationError).message).toBeTruthy();
            expect(
              (error as AuthenticationError).message.length
            ).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Google SSO initiation failure throws AuthenticationError with descriptive message", async () => {
    // Feature: the-open-stock, Property 2: Authentication Error Handling
    await fc.assert(
      fc.asyncProperty(
        errorKindArb,
        urlArb,
        urlArb,
        async (errorKind, successUrl, failureUrl) => {
          vi.clearAllMocks();
          setupMocksForFailure(errorKind);

          try {
            await service.signInWithGoogle(successUrl, failureUrl);
            expect.unreachable("Expected AuthenticationError to be thrown");
          } catch (error) {
            expect(error).toBeInstanceOf(AuthenticationError);
            expect((error as AuthenticationError).message).toBeTruthy();
            expect(
              (error as AuthenticationError).message.length
            ).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Email OTP send failure throws AuthenticationError with descriptive message", async () => {
    // Feature: the-open-stock, Property 2: Authentication Error Handling
    await fc.assert(
      fc.asyncProperty(errorKindArb, emailArb, async (errorKind, email) => {
        vi.clearAllMocks();
        setupMocksForFailure(errorKind);

        try {
          await service.signInWithEmail(email);
          expect.unreachable("Expected AuthenticationError to be thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(AuthenticationError);
          expect((error as AuthenticationError).message).toBeTruthy();
          expect((error as AuthenticationError).message.length).toBeGreaterThan(
            0
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  it("Email OTP verification failure returns error result without creating a session", async () => {
    // Feature: the-open-stock, Property 2: Authentication Error Handling
    await fc.assert(
      fc.asyncProperty(
        errorKindArb,
        userIdArb,
        secretArb,
        async (errorKind, userId, secret) => {
          vi.clearAllMocks();
          setupMocksForFailure(errorKind);

          const result: AuthResult = await service.verifyEmailOTP(
            userId,
            secret
          );

          // Property: failure returns { success: false } with a descriptive error
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          expect(typeof result.error).toBe("string");
          expect(result.error!.length).toBeGreaterThan(0);

          // Property: no session is created (user is undefined)
          expect(result.user).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("OAuth session creation failure returns error result without creating a session", async () => {
    // Feature: the-open-stock, Property 2: Authentication Error Handling
    await fc.assert(
      fc.asyncProperty(
        errorKindArb,
        userIdArb,
        secretArb,
        async (errorKind, userId, secret) => {
          vi.clearAllMocks();
          setupMocksForFailure(errorKind);

          const result: AuthResult = await service.createOAuthSession(
            userId,
            secret
          );

          // Property: failure returns { success: false } with a descriptive error
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          expect(typeof result.error).toBe("string");
          expect(result.error!.length).toBeGreaterThan(0);

          // Property: no session is created (user is undefined)
          expect(result.user).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("no session exists after any authentication failure for any provider", async () => {
    // Feature: the-open-stock, Property 2: Authentication Error Handling
    await fc.assert(
      fc.asyncProperty(
        providerArb,
        errorKindArb,
        userIdArb,
        emailArb,
        secretArb,
        urlArb,
        urlArb,
        async (
          provider,
          errorKind,
          userId,
          email,
          secret,
          successUrl,
          failureUrl
        ) => {
          vi.clearAllMocks();
          setupMocksForFailure(errorKind);

          // Attempt initiation — throws for OAuth/email send
          if (provider === "apple") {
            await expect(
              service.signInWithApple(successUrl, failureUrl)
            ).rejects.toThrow(AuthenticationError);
          } else if (provider === "google") {
            await expect(
              service.signInWithGoogle(successUrl, failureUrl)
            ).rejects.toThrow(AuthenticationError);
          } else {
            await expect(service.signInWithEmail(email)).rejects.toThrow(
              AuthenticationError
            );
          }

          // Attempt session completion — returns error result
          const result: AuthResult =
            provider === "email"
              ? await service.verifyEmailOTP(userId, secret)
              : await service.createOAuthSession(userId, secret);

          expect(result.success).toBe(false);
          expect(result.user).toBeUndefined();

          // Property: getCurrentUser returns null (no session was created)
          const currentUser = await service.getCurrentUser();
          expect(currentUser).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("sign-out failure throws AuthenticationError with descriptive message", async () => {
    // Feature: the-open-stock, Property 2: Authentication Error Handling
    await fc.assert(
      fc.asyncProperty(errorKindArb, async (errorKind) => {
        vi.clearAllMocks();
        mockDeleteSession.mockRejectedValue(makeError(errorKind));

        try {
          await service.signOut();
          expect.unreachable("Expected AuthenticationError to be thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(AuthenticationError);
          expect((error as AuthenticationError).message).toBeTruthy();
          expect((error as AuthenticationError).message.length).toBeGreaterThan(
            0
          );
        }
      }),
      { numRuns: 100 }
    );
  });
});
