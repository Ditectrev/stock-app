/**
 * Unit tests for AdBanner component
 * Ads UI disabled during AdSense verification (ads.txt only).
 * Requirements: 22.5, 22.7
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AdBanner } from "../AdBanner";
import { PricingTier } from "@/types";
import { AdPlacement } from "@/services/ads.service";

const ALL_TIERS: PricingTier[] = [
  "FREE",
  "ADS_FREE",
  "LOCAL",
  "BYOK",
  "HOSTED_AI",
];

const PLACEMENTS: AdPlacement[] = [
  "banner-top",
  "banner-bottom",
  "sidebar",
  "inline",
];

describe("AdBanner", () => {
  it.each(ALL_TIERS)(
    "renders nothing for %s tier while ads are disabled",
    (tier) => {
      const { container } = render(
        <AdBanner placement="banner-top" tier={tier} />
      );
      expect(container).toBeEmptyDOMElement();
    }
  );

  it.each(PLACEMENTS)(
    "renders nothing at %s placement while ads are disabled",
    (placement) => {
      const { container } = render(
        <AdBanner placement={placement} tier="FREE" />
      );
      expect(container).toBeEmptyDOMElement();
    }
  );
});
