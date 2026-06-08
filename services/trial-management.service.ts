/**
 * Trial Management Service
 * Manages trial sessions with device fingerprinting and IP tracking.
 * Stores trial state in browser storage for persistence across page refreshes.
 * Requirements: 21.1, 21.2, 21.4, 21.5, 21.18, 21.19, 21.20
 */

import { env } from "@/lib/env";
import {
  generateDeviceFingerprint,
  getBrowserCharacteristics,
} from "@/lib/device-fingerprint";
import { getUserIdentifier } from "@/lib/ip-tracking";
import type { TrialSession, TrialStatus } from "@/types";

const SESSION_KEY = "trial_session";
const USED_FINGERPRINTS_KEY = "trial_used_fingerprints";

export class TrialManagementService {
  private durationMs: number;

  constructor() {
    this.durationMs = env.trial.durationMinutes * 60 * 1000;
  }

  /**
   * Start a new trial session.
   * Throws if the device has already used a trial.
   */
  async startTrial(): Promise<TrialSession> {
    const eligible = await this.checkTrialEligibility();
    if (!eligible) {
      throw new Error("Trial already used on this device.");
    }

    const fingerprint = generateDeviceFingerprint();
    const chars = getBrowserCharacteristics();
    const ipAddress = await getUserIdentifier();
    const now = new Date();

    const session: TrialSession = {
      id: `trial_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      deviceFingerprint: fingerprint,
      ipAddress,
      startTime: now,
      endTime: new Date(now.getTime() + this.durationMs),
      isActive: true,
      userAgent: chars.userAgent,
      screenResolution: chars.screenResolution,
      timezone: chars.timezone,
      createdAt: now,
    };

    this.saveSession(session);
    this.markFingerprintUsed(fingerprint);

    return session;
  }

  /**
   * Get current trial status with remaining time.
   */
  getTrialStatus(): TrialStatus {
    const session = this.loadSession();

    if (!session) {
      return {
        isActive: false,
        remainingSeconds: 0,
        hasUsedTrial: this.hasUsedTrial(),
      };
    }

    const now = Date.now();
    const endTime = new Date(session.endTime).getTime();
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

    // Auto-deactivate if expired
    if (remaining <= 0 && session.isActive) {
      session.isActive = false;
      this.saveSession(session);
    }

    return {
      isActive: session.isActive && remaining > 0,
      remainingSeconds: remaining,
      hasUsedTrial: true,
    };
  }

  /**
   * End the current trial session.
   */
  endTrial(): void {
    const session = this.loadSession();
    if (session) {
      session.isActive = false;
      this.saveSession(session);
    }
  }

  /**
   * Check if the current device is eligible for a trial.
   * Returns false if the device fingerprint has been used before.
   */
  async checkTrialEligibility(): Promise<boolean> {
    // Check if there's an active session already
    const session = this.loadSession();
    if (session?.isActive) {
      const endTime = new Date(session.endTime).getTime();
      if (Date.now() < endTime) return false; // active trial exists
    }

    const fingerprint = generateDeviceFingerprint();
    return !this.isFingerprintUsed(fingerprint);
  }

  // --- Storage helpers ---

  private saveSession(session: TrialSession): void {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }
    } catch {
      // Storage unavailable
    }
  }

  private loadSession(): TrialSession | null {
    try {
      if (typeof localStorage === "undefined") return null;
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as TrialSession;
    } catch {
      return null;
    }
  }

  private markFingerprintUsed(fingerprint: string): void {
    try {
      if (typeof localStorage === "undefined") return;
      const used = this.getUsedFingerprints();
      if (!used.includes(fingerprint)) {
        used.push(fingerprint);
        localStorage.setItem(USED_FINGERPRINTS_KEY, JSON.stringify(used));
      }
    } catch {
      // Storage unavailable
    }
  }

  private isFingerprintUsed(fingerprint: string): boolean {
    return this.getUsedFingerprints().includes(fingerprint);
  }

  private getUsedFingerprints(): string[] {
    try {
      if (typeof localStorage === "undefined") return [];
      const raw = localStorage.getItem(USED_FINGERPRINTS_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }

  private hasUsedTrial(): boolean {
    const fingerprint = generateDeviceFingerprint();
    return this.isFingerprintUsed(fingerprint);
  }
}

// Export singleton instance
export const trialManagementService = new TrialManagementService();
