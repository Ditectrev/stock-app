"use client";

/**
 * Ad slots for Free tier (Requirements 22.5, 22.7).
 * Disabled while AdSense is in verification — only public/ads.txt is deployed.
 * Re-enable by rendering AdSense units here after approval.
 */

import { AdPlacement } from "@/services/ads.service";
import { PricingTier } from "@/types";

export interface AdBannerProps {
  placement: AdPlacement;
  tier: PricingTier;
  className?: string;
}

export function AdBanner(_props: AdBannerProps) {
  return null;
}
