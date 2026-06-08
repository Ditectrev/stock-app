function readEnv(key: string): string {
  const value = process.env[key];
  return typeof value === "string" ? value.trim() : "";
}

export function getAppwriteTrialEnv(): {
  databaseId: string;
  sessionsCollectionId: string;
} {
  return {
    databaseId: readEnv("APPWRITE_DATABASE_ID"),
    sessionsCollectionId: readEnv("APPWRITE_COLLECTION_ID_TRIAL_SESSIONS"),
  };
}

export function isAppwriteTrialConfigured(): boolean {
  const trialEnv = getAppwriteTrialEnv();
  return Boolean(trialEnv.databaseId && trialEnv.sessionsCollectionId);
}

export function assertAppwriteTrialEnv(): {
  databaseId: string;
  sessionsCollectionId: string;
} {
  const env = getAppwriteTrialEnv();
  if (!env.databaseId || !env.sessionsCollectionId) {
    throw new Error(
      "Missing APPWRITE_DATABASE_ID or APPWRITE_COLLECTION_ID_TRIAL_SESSIONS."
    );
  }
  return env;
}
