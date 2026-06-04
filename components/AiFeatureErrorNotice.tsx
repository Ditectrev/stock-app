"use client";

import { DNA_CAPTION } from "@/lib/design-dna";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  AccountNotice,
  type AccountNoticeTone,
} from "@/components/AccountNotice";
import { isMissingByokApiKeyMessage } from "@/lib/missing-byok-api-key";
import { HOME_PRIMARY_BUTTON } from "@/lib/home-ui";

export const BYOK_PROFILE_HINT =
  "Add your key in Profile → API keys, then select the same provider as your explanations model.";

export interface AiFeatureErrorNoticeProps {
  error: string;
  title?: string;
  hostedSetupTitle?: string;
  isHostedSetup?: boolean;
  hostedSetupHint?: ReactNode;
  /** Used when not BYOK and not hosted setup (e.g. stock-of-the-day fetch errors). */
  defaultTone?: AccountNoticeTone;
}

export function AiFeatureErrorNotice({
  error,
  title = "Unavailable",
  hostedSetupTitle = "Ditectrev AI configuration needed",
  isHostedSetup = false,
  hostedSetupHint,
  defaultTone = "warning",
}: AiFeatureErrorNoticeProps) {
  const isByok = isMissingByokApiKeyMessage(error);
  const tone: AccountNoticeTone = isHostedSetup
    ? "warning"
    : isByok
      ? "error"
      : defaultTone;
  const displayTitle = isHostedSetup ? hostedSetupTitle : title;

  return (
    <AccountNotice tone={tone} title={displayTitle}>
      <span>{error}</span>
      {isByok && (
        <div className="mt-3 space-y-2">
          <p className={`${DNA_CAPTION}`}>{BYOK_PROFILE_HINT}</p>
          <Link href="/profile" className={HOME_PRIMARY_BUTTON}>
            Open profile
          </Link>
        </div>
      )}
      {isHostedSetup && hostedSetupHint ? (
        <div className="mt-2 text-xs">{hostedSetupHint}</div>
      ) : null}
    </AccountNotice>
  );
}
