import { AUTH_UI_COPY } from "@/lib/auth-ui-copy";
import {
  generateDeviceFingerprint,
  getBrowserCharacteristics,
} from "@/lib/device-fingerprint";
import { getUserIdentifier } from "@/lib/ip-tracking";
import type { TrialSession, TrialStatus } from "@/types";

type TrialApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type TrialIdentityPayload = {
  fingerprint: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  /** From browser-side IP services (Practice-Tests-Exams-Platform pattern), not TCP peer (::1). */
  ipAddress: string;
};

/** One stable identity per tab/session so status/start/end hit the same fingerprint + IP. */
let cachedIdentity: TrialIdentityPayload | null = null;
let identityPromise: Promise<TrialIdentityPayload> | null = null;

async function ensureIdentity(): Promise<TrialIdentityPayload> {
  if (cachedIdentity) {
    return cachedIdentity;
  }
  if (!identityPromise) {
    identityPromise = (async () => {
      const fingerprint = generateDeviceFingerprint();
      const chars = getBrowserCharacteristics();
      const ipAddress = await getUserIdentifier();
      return {
        fingerprint,
        userAgent: chars.userAgent,
        screenResolution: chars.screenResolution,
        timezone: chars.timezone,
        ipAddress,
      };
    })();
  }
  cachedIdentity = await identityPromise;
  identityPromise = null;
  return cachedIdentity;
}

async function parseJson<T>(res: Response): Promise<TrialApiResponse<T>> {
  return (await res.json().catch(() => ({
    success: false,
    error: "Invalid server response.",
  }))) as TrialApiResponse<T>;
}

export class TrialApiService {
  async startTrial(): Promise<TrialSession> {
    const identity = await ensureIdentity();
    const res = await fetch("/api/trial/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(identity),
    });
    const data = await parseJson<TrialSession>(res);
    if (!res.ok || !data.success || !data.data) {
      throw new Error(data.error ?? AUTH_UI_COPY.trialStartFailed);
    }
    return data.data;
  }

  async getTrialStatus(): Promise<TrialStatus> {
    const identity = await ensureIdentity();
    const res = await fetch("/api/trial/status", {
      method: "GET",
      headers: {
        "x-trial-fingerprint": identity.fingerprint,
        "x-trial-screen-resolution": identity.screenResolution,
        "x-trial-timezone": identity.timezone,
        "x-trial-client-ip": identity.ipAddress,
      },
    });
    const data = await parseJson<TrialStatus>(res);
    if (!res.ok || !data.success || !data.data) {
      throw new Error(data.error ?? AUTH_UI_COPY.trialStatusFailed);
    }
    return data.data;
  }

  async endTrial(): Promise<void> {
    const identity = await ensureIdentity();
    const res = await fetch("/api/trial/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(identity),
    });
    const data = await parseJson<{ ended: boolean }>(res);
    if (!res.ok || !data.success) {
      throw new Error(data.error ?? AUTH_UI_COPY.trialEndFailed);
    }
  }

  async checkTrialEligibility(): Promise<boolean> {
    const identity = await ensureIdentity();
    const res = await fetch("/api/trial/eligibility", {
      method: "GET",
      headers: {
        "x-trial-fingerprint": identity.fingerprint,
        "x-trial-screen-resolution": identity.screenResolution,
        "x-trial-timezone": identity.timezone,
        "x-trial-client-ip": identity.ipAddress,
      },
    });
    const data = await parseJson<{ eligible: boolean }>(res);
    if (!res.ok || !data.success || !data.data) {
      throw new Error(data.error ?? AUTH_UI_COPY.trialEligibilityFailed);
    }
    return Boolean(data.data.eligible);
  }
}

export const trialApiService = new TrialApiService();
