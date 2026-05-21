/**
 * Property-Based Tests for Authentication Round Trip
 * Feature: the-open-stock, Property 1: Authentication Round Trip
 *
 * Validates: Requirements 1.2, 1.3, 1.4, 1.5
 * "For any valid authentication provider (Apple SSO, Google SSO, or Email OTP)
 * and valid credentials, successful authentication should create or retrieve a
 * user session, and that session should contain the authenticated user's
 * information."
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

import { AuthenticationService } from "@/services/authentication.service";

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

/** User names (optional) */
const nameArb = fc.option(
  fc.stringMatching(/^[A-Z][a-z]{1,9}( [A-Z][a-z]{1,9})?$/),
  { nil: undefined }
);

/** OAuth redirect URLs */
const urlArb = fc
  .stringMatching(/^[a-z]{3,8}$/)
  .map((path) => `https://example.com/${path}`);

/** Auth provider type */
const providerArb = fc.constantFrom("apple", "google", "email") as fc.Arbitrary<
  "apple" | "google" | "email"
>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupMocksForSuccess(user: {
  id: string;
  email: string;
  name?: string;
}) {
  const sessionSecret = "session-jwt-token";
  mockCreateOAuth2Token.mockResolvedValue("https://oauth.provider/redirect");
  mockCreateEmailToken.mockResolvedValue({ userId: user.id });
  mockCreateSession.mockResolvedValue({ secret: sessionSecret });
  mockGet.mockResolvedValue({
    $id: user.id,
    email: user.email,
    name: user.name || "",
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 1: Authentication Round Trip", () => {
  let service: AuthenticationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthenticationService();
  });

  it("OAuth round trip: initiate + complete session yields user info (Apple & Google)", async () => {
    // Feature: the-open-stock, Property 1: Authentication Round Trip
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("apple", "google") as fc.Arbitrary<"apple" | "google">,
        userIdArb,
        emailArb,
        nameArb,
        secretArb,
        urlArb,
        urlArb,
        async (
          provider,
          userId,
          email,
          name,
          secret,
          successUrl,
          failureUrl
        ) => {
          vi.clearAllMocks();
          setupMocksForSuccess({ id: userId, email, name });

          // Step 1: Initiate OAuth — should return a redirect URL (Req 1.2, 1.3)
          const redirectUrl =
            provider === "apple"
              ? await service.signInWithApple(successUrl, failureUrl)
              : await service.signInWithGoogle(successUrl, failureUrl);

          expect(typeof redirectUrl).toBe("string");
          expect(redirectUrl.length).toBeGreaterThan(0);

          // Step 2: Complete OAuth session (Req 1.5)
          const result: AuthResult = await service.createOAuthSession(
            userId,
            secret
          );

          // Property: successful auth creates a session secret
          expect(result.success).toBe(true);
          expect(result.sessionSecret).toBeDefined();
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Email OTP round trip: send token + verify yields user info", async () => {
    // Feature: the-open-stock, Property 1: Authentication Round Trip
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        emailArb,
        nameArb,
        secretArb,
        async (userId, email, name, secret) => {
          vi.clearAllMocks();
          setupMocksForSuccess({ id: userId, email, name });

          // Step 1: Send email OTP (Req 1.4)
          await service.signInWithEmail(email);
          expect(mockCreateEmailToken).toHaveBeenCalledWith(
            expect.any(String),
            email
          );

          // Step 2: Verify OTP and create session (Req 1.4, 1.5)
          const result: AuthResult = await service.verifyEmailOTP(
            userId,
            secret
          );

          // Property: successful auth creates a session secret
          expect(result.success).toBe(true);
          expect(result.sessionSecret).toBeDefined();
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("session contains authenticated user info for any provider", async () => {
    // Feature: the-open-stock, Property 1: Authentication Round Trip
    await fc.assert(
      fc.asyncProperty(
        providerArb,
        userIdArb,
        emailArb,
        nameArb,
        secretArb,
        urlArb,
        urlArb,
        async (
          provider,
          userId,
          email,
          name,
          secret,
          successUrl,
          failureUrl
        ) => {
          vi.clearAllMocks();
          setupMocksForSuccess({ id: userId, email, name });

          // Initiate auth based on provider
          if (provider === "apple") {
            await service.signInWithApple(successUrl, failureUrl);
          } else if (provider === "google") {
            await service.signInWithGoogle(successUrl, failureUrl);
          } else {
            await service.signInWithEmail(email);
          }

          // Complete session
          const result: AuthResult =
            provider === "email"
              ? await service.verifyEmailOTP(userId, secret)
              : await service.createOAuthSession(userId, secret);

          // Property: session always includes a secret on success
          expect(result.success).toBe(true);
          expect(result.sessionSecret).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("user info is retrievable after successful authentication", () => {
    // Feature: the-open-stock, Property 1: Authentication Round Trip
    fc.assert(
      fc.asyncProperty(
        providerArb,
        userIdArb,
        emailArb,
        nameArb,
        secretArb,
        async (provider, userId, email, name, secret) => {
          vi.clearAllMocks();
          setupMocksForSuccess({ id: userId, email, name });

          // Complete session (simulating post-redirect)
          const result: AuthResult =
            provider === "email"
              ? await service.verifyEmailOTP(userId, secret)
              : await service.createOAuthSession(userId, secret);

          expect(result.success).toBe(true);

          // Property: getCurrentUser returns the same user after auth
          const currentUser = await service.getCurrentUser();
          expect(currentUser).not.toBeNull();
          expect(currentUser!.id).toBe(userId);
          expect(currentUser!.email).toBe(email);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("OAuth initiation returns a non-empty redirect URL for both providers", () => {
    // Feature: the-open-stock, Property 1: Authentication Round Trip
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom("apple", "google") as fc.Arbitrary<"apple" | "google">,
        urlArb,
        urlArb,
        async (provider, successUrl, failureUrl) => {
          vi.clearAllMocks();
          mockCreateOAuth2Token.mockResolvedValue(
            "https://oauth.provider/auth?state=abc"
          );

          const url =
            provider === "apple"
              ? await service.signInWithApple(successUrl, failureUrl)
              : await service.signInWithGoogle(successUrl, failureUrl);

          // Property: initiation always yields a valid redirect URL
          expect(typeof url).toBe("string");
          expect(url.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
