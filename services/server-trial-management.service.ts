import { ID, Query } from "node-appwrite";
import { createServerClient } from "@/lib/appwrite";
import {
  assertAppwriteTrialEnv,
  isAppwriteTrialConfigured,
} from "@/lib/appwrite-trial-env";
import { env } from "@/lib/env";
import type { TrialSession, TrialStatus } from "@/types";

export interface TrialIdentity {
  fingerprint: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  ipAddress?: string;
}

type TrialSessionDocument = {
  $id: string;
  fingerprint: string;
  ipAddress?: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  $createdAt: string;
};

export class ServerTrialManagementService {
  private readonly durationMs: number;

  constructor() {
    this.durationMs = env.trial.durationMinutes * 60 * 1000;
  }

  /** Local dev / CI when Appwrite trial collections are not configured. */
  private offlineTrialStatus(): TrialStatus {
    return {
      isActive: true,
      remainingSeconds: Math.floor(this.durationMs / 1000),
      hasUsedTrial: false,
    };
  }

  private offlineTrialSession(identity: TrialIdentity): TrialSession {
    const now = new Date();
    const endTime = new Date(now.getTime() + this.durationMs);
    return {
      id: "offline-trial",
      deviceFingerprint: identity.fingerprint,
      ipAddress: identity.ipAddress,
      startTime: now,
      endTime,
      isActive: true,
      userAgent: identity.userAgent,
      screenResolution: identity.screenResolution,
      timezone: identity.timezone,
      createdAt: now,
    };
  }

  async startTrial(identity: TrialIdentity): Promise<TrialSession> {
    if (!identity.fingerprint) {
      throw new Error("Missing trial fingerprint.");
    }
    if (!isAppwriteTrialConfigured()) {
      return this.offlineTrialSession(identity);
    }
    const eligible = await this.checkTrialEligibility(identity);
    if (!eligible) {
      throw new Error("Trial already used on this device.");
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + this.durationMs);
    const { databaseId, sessionsCollectionId } = assertAppwriteTrialEnv();
    const { databases } = createServerClient();

    const created = (await databases.createDocument(
      databaseId,
      sessionsCollectionId,
      ID.unique(),
      {
        fingerprint: identity.fingerprint,
        ipAddress: identity.ipAddress ?? "",
        startTime: now.toISOString(),
        endTime: endTime.toISOString(),
        isActive: true,
        userAgent: identity.userAgent,
        screenResolution: identity.screenResolution,
        timezone: identity.timezone,
      }
    )) as unknown as TrialSessionDocument;

    return this.toTrialSession(created);
  }

  async getTrialStatus(identity: TrialIdentity): Promise<TrialStatus> {
    if (!isAppwriteTrialConfigured()) {
      return this.offlineTrialStatus();
    }

    const session = await this.getSessionByFingerprint(identity.fingerprint);

    if (!session) {
      const ipUsed = await this.hasSessionForIp(identity.ipAddress);
      return {
        isActive: false,
        remainingSeconds: 0,
        hasUsedTrial: ipUsed,
      };
    }

    const now = Date.now();
    const endMs = new Date(session.endTime).getTime();
    const remainingSeconds = Math.max(0, Math.floor((endMs - now) / 1000));
    const isActive = session.isActive && remainingSeconds > 0;

    if (!isActive && session.isActive) {
      await this.updateSessionActiveFlag(session.$id, false);
    }

    return {
      isActive,
      remainingSeconds,
      hasUsedTrial: true,
    };
  }

  async endTrial(identity: TrialIdentity): Promise<void> {
    if (!isAppwriteTrialConfigured()) {
      return;
    }

    const session = await this.getSessionByFingerprint(identity.fingerprint);
    if (!session || !session.isActive) return;
    await this.updateSessionActiveFlag(session.$id, false);
  }

  async checkTrialEligibility(identity: TrialIdentity): Promise<boolean> {
    if (!identity.fingerprint) return false;
    if (!isAppwriteTrialConfigured()) {
      return true;
    }

    const [fingerprintUsed, ipUsed] = await Promise.all([
      this.hasSessionForFingerprint(identity.fingerprint),
      this.hasSessionForIp(identity.ipAddress),
    ]);

    return !fingerprintUsed && !ipUsed;
  }

  /** Active session lookup — fingerprint only (never inherit another user's time via shared IP). */
  private async getSessionByFingerprint(
    fingerprint: string
  ): Promise<TrialSessionDocument | null> {
    if (!fingerprint) return null;

    const { databaseId, sessionsCollectionId } = assertAppwriteTrialEnv();
    const { databases } = createServerClient();

    const result = (await databases.listDocuments(
      databaseId,
      sessionsCollectionId,
      [
        Query.equal("fingerprint", fingerprint),
        Query.orderDesc("$createdAt"),
        Query.limit(1),
      ]
    )) as unknown as { documents: TrialSessionDocument[] };

    return result.documents[0] ?? null;
  }

  private async hasSessionForFingerprint(
    fingerprint: string
  ): Promise<boolean> {
    const session = await this.getSessionByFingerprint(fingerprint);
    return session !== null;
  }

  /** IP is used only for abuse prevention at start — not for status countdown. */
  private async hasSessionForIp(
    ipAddress: string | undefined
  ): Promise<boolean> {
    if (!ipAddress) return false;

    const { databaseId, sessionsCollectionId } = assertAppwriteTrialEnv();
    const { databases } = createServerClient();

    const result = (await databases.listDocuments(
      databaseId,
      sessionsCollectionId,
      [Query.equal("ipAddress", ipAddress), Query.limit(1)]
    )) as unknown as { documents: TrialSessionDocument[] };

    return result.documents.length > 0;
  }

  private async updateSessionActiveFlag(
    documentId: string,
    isActive: boolean
  ): Promise<void> {
    const { databaseId, sessionsCollectionId } = assertAppwriteTrialEnv();
    const { databases } = createServerClient();
    await databases.updateDocument(
      databaseId,
      sessionsCollectionId,
      documentId,
      {
        isActive,
      }
    );
  }

  private toTrialSession(doc: TrialSessionDocument): TrialSession {
    return {
      id: doc.$id,
      deviceFingerprint: doc.fingerprint,
      ipAddress: doc.ipAddress || undefined,
      startTime: new Date(doc.startTime),
      endTime: new Date(doc.endTime),
      isActive: doc.isActive,
      userAgent: doc.userAgent,
      screenResolution: doc.screenResolution,
      timezone: doc.timezone,
      createdAt: new Date(doc.$createdAt),
    };
  }
}

export const serverTrialManagementService = new ServerTrialManagementService();
