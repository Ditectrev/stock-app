/**
 * Authentication Service
 * Handles user authentication via Appwrite (Apple SSO, Google SSO, Email OTP)
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { Client, Account, OAuthProvider, ID } from "node-appwrite";
import { getAppwriteServerEnv } from "@/lib/appwrite-server-env";
import { logger } from "@/lib/logger";
import { AUTH_UI_COPY } from "@/lib/auth-ui-copy";
import { AuthResult } from "@/types";

export class AuthenticationService {
  private client: Client;
  private account: Account;

  constructor() {
    const { endpoint, projectId } = getAppwriteServerEnv();
    this.client = new Client().setEndpoint(endpoint).setProject(projectId);

    this.account = new Account(this.client);
  }

  /**
   * Set the session for server-side operations.
   * Call this with the user's session token (from cookie) before
   * calling getCurrentUser / signOut on the server.
   */
  setSession(jwt: string): void {
    this.client.setJWT(jwt);
  }

  /**
   * Sign in with Apple SSO (Req 1.2)
   * Returns the OAuth URL the client should redirect to.
   */
  async signInWithApple(
    successUrl: string,
    failureUrl: string
  ): Promise<string> {
    try {
      logger.info("Initiating Apple SSO sign-in");
      const result = this.account.createOAuth2Token(
        OAuthProvider.Apple,
        successUrl,
        failureUrl
      );
      return result as unknown as string;
    } catch (error) {
      logger.error(
        "Apple SSO sign-in failed",
        error instanceof Error ? error : new Error(String(error))
      );
      throw new AuthenticationError(AUTH_UI_COPY.appleSignInFailed);
    }
  }

  /**
   * Sign in with Google SSO (Req 1.3)
   * Returns the OAuth URL the client should redirect to.
   */
  async signInWithGoogle(
    successUrl: string,
    failureUrl: string
  ): Promise<string> {
    try {
      logger.info("Initiating Google SSO sign-in");
      const result = this.account.createOAuth2Token(
        OAuthProvider.Google,
        successUrl,
        failureUrl
      );
      return result as unknown as string;
    } catch (error) {
      logger.error(
        "Google SSO sign-in failed",
        error instanceof Error ? error : new Error(String(error))
      );
      throw new AuthenticationError(AUTH_UI_COPY.googleSignInFailed);
    }
  }

  /**
   * Sign in with Email OTP / Magic URL (Req 1.4)
   * Sends a one-time password token to the user's email.
   */
  async signInWithEmail(email: string): Promise<void> {
    try {
      logger.info("Sending email OTP", { email });
      await this.account.createEmailToken(ID.unique(), email);
      logger.info("Email OTP sent successfully", { email });
    } catch (error) {
      logger.error(
        "Email OTP send failed",
        error instanceof Error ? error : new Error(String(error)),
        { email }
      );
      throw new AuthenticationError(AUTH_UI_COPY.verificationEmailFailed);
    }
  }

  /**
   * Verify Email OTP / Magic link token (Req 1.4, 1.5)
   * Completes the email-based authentication flow.
   */
  async verifyEmailOTP(userId: string, secret: string): Promise<AuthResult> {
    try {
      logger.info("Verifying email OTP", { userId });
      const session = await this.account.createSession(userId, secret);
      logger.info("Email OTP verified, session created", { userId });

      return {
        success: true,
        sessionSecret: session.secret ?? undefined,
      };
    } catch (error) {
      logger.error(
        "Email OTP verification failed",
        error instanceof Error ? error : new Error(String(error)),
        { userId }
      );
      return {
        success: false,
        error: AUTH_UI_COPY.emailOtpVerifyFailed,
      };
    }
  }

  /**
   * Complete an OAuth session after the provider redirects back (Req 1.5)
   */
  async createOAuthSession(
    userId: string,
    secret: string
  ): Promise<AuthResult> {
    try {
      logger.info("Creating OAuth session", { userId });
      const session = await this.account.createSession(userId, secret);
      logger.info("OAuth session created", { userId });

      return {
        success: true,
        sessionSecret: session.secret ?? undefined,
      };
    } catch (error) {
      logger.error(
        "OAuth session creation failed",
        error instanceof Error ? error : new Error(String(error)),
        { userId }
      );
      return {
        success: false,
        error: AUTH_UI_COPY.oauthSessionFailed,
      };
    }
  }

  /**
   * Sign out the current user and destroy the session.
   */
  async signOut(): Promise<void> {
    try {
      logger.info("Signing out user");
      await this.account.deleteSession("current");
      logger.info("User signed out successfully");
    } catch (error) {
      logger.error(
        "Sign-out failed",
        error instanceof Error ? error : new Error(String(error))
      );
      throw new AuthenticationError(AUTH_UI_COPY.signOutFailed);
    }
  }

  /**
   * Get the currently authenticated user, or null if not signed in.
   */
  async getCurrentUser(): Promise<AuthResult["user"] | null> {
    try {
      const user = await this.account.get();
      return {
        id: user.$id,
        email: user.email,
        name: user.name || undefined,
      };
    } catch {
      // Not authenticated — this is expected for anonymous visitors
      return null;
    }
  }
}

/**
 * Custom error class for authentication failures (Req 1.6)
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

// Export singleton instance
export const authenticationService = new AuthenticationService();
