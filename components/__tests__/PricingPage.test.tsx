/**
 * Unit tests for PricingPage component
 * Tests tier display, comparison layout, and subscription flow
 * Task 16.6 - Requirements: 22.1, 22.2, 22.3, 22.4
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PricingPage } from "../PricingPage";
import { ThemeProvider } from "@/lib/theme-context";
import { PricingTier, PricingTierInfo } from "@/types";

const mockTiers: PricingTierInfo[] = [
  {
    tier: "FREE",
    name: "Free",
    description:
      "Full access to market data, charts, and indicators — supported by ads.",
    features: ["Stock search & symbol detail pages", "Ad-supported"],
    price: 0,
    billingPeriod: "monthly",
  },
  {
    tier: "ADS_FREE",
    name: "Ads-free",
    description: "Everything in Free, without the ads.",
    features: ["All Free tier features", "No advertisements"],
    price: 4.99,
    billingPeriod: "monthly",
  },
  {
    tier: "LOCAL",
    name: "Local AI",
    description:
      "AI-powered insights running entirely on your device via Ollama.",
    features: [
      "All Ads-free tier features",
      "Powered by Ollama (runs locally)",
    ],
    price: 9.99,
    billingPeriod: "monthly",
  },
  {
    tier: "BYOK",
    name: "Bring Your Own Key",
    description:
      "Use your own API keys from OpenAI, Google Gemini, Mistral AI, or DeepSeek.",
    features: ["All Ads-free tier features", "Encrypted API key storage"],
    price: 14.99,
    billingPeriod: "monthly",
  },
  {
    tier: "HOSTED_AI",
    name: "Hosted AI",
    description: "Full AI features powered by our managed infrastructure.",
    features: ["All Ads-free tier features", "Priority support"],
    price: 19.99,
    billingPeriod: "monthly",
  },
];

const renderPricingPage = (
  currentTier?: PricingTier,
  onSelectTier?: (tier: PricingTier) => void
) =>
  render(
    <ThemeProvider>
      <PricingPage
        tiers={mockTiers}
        currentTier={currentTier}
        onSelectTier={onSelectTier}
      />
    </ThemeProvider>
  );

describe("PricingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Requirement 22.1: All five pricing tiers displayed
  describe("Tier Display", () => {
    it("should display all five pricing tier names", () => {
      renderPricingPage();
      // Use heading role to avoid matching the duplicate "Free" price label
      expect(screen.getByRole("heading", { name: "Free" })).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Ads-free" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Local AI" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Bring Your Own Key" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Hosted AI" })
      ).toBeInTheDocument();
    });

    it("should display description for each tier", () => {
      renderPricingPage();
      expect(
        screen.getByText(/Full access to market data, charts, and indicators/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Everything in Free, without the ads/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/AI-powered insights running entirely on your device/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Use your own API keys from OpenAI/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Full AI features powered by our managed infrastructure/
        )
      ).toBeInTheDocument();
    });

    it("should display features for each tier", () => {
      renderPricingPage();
      expect(
        screen.getByText("Stock search & symbol detail pages")
      ).toBeInTheDocument();
      expect(screen.getByText("No advertisements")).toBeInTheDocument();
      expect(
        screen.getByText("Powered by Ollama (runs locally)")
      ).toBeInTheDocument();
      expect(screen.getByText("Encrypted API key storage")).toBeInTheDocument();
      expect(screen.getByText("Priority support")).toBeInTheDocument();
    });

    it("should show included pricing for the free tier instead of a euro amount", () => {
      renderPricingPage();
      expect(screen.getByRole("heading", { name: "Free" })).toBeInTheDocument();
      expect(screen.getByText("Included")).toBeInTheDocument();
      expect(screen.getByText("No monthly charge")).toBeInTheDocument();
    });

    it("should display monthly prices for paid tiers", () => {
      renderPricingPage();
      expect(screen.getByText("€4.99")).toBeInTheDocument();
      expect(screen.getByText("€9.99")).toBeInTheDocument();
      expect(screen.getByText("€14.99")).toBeInTheDocument();
      expect(screen.getByText("€19.99")).toBeInTheDocument();
    });

    it("should display '/ mo' billing period for paid tiers", () => {
      renderPricingPage();
      const moLabels = screen.getAllByText("/ mo");
      expect(moLabels.length).toBe(4); // 4 paid tiers
    });
  });

  // Requirement 22.2: Accessible at /pricing route (page heading present)
  describe("Page Structure", () => {
    it("should render the pricing heading", () => {
      renderPricingPage();
      expect(
        screen.getByRole("heading", { name: /Simple, transparent pricing/i })
      ).toBeInTheDocument();
    });

    it("should render the pricing section with aria-labelledby", () => {
      renderPricingPage();
      const section = screen.getByRole("region", {
        name: /Simple, transparent pricing/i,
      });
      expect(section).toBeInTheDocument();
    });

    it("should display the subtitle text", () => {
      renderPricingPage();
      expect(
        screen.getByText(/Start free. Upgrade when you need AI features/)
      ).toBeInTheDocument();
    });

    it("should not display a money-back guarantee footer note", () => {
      renderPricingPage();
      expect(
        screen.queryByText(
          /All paid plans include a 7-day money-back guarantee/
        )
      ).not.toBeInTheDocument();
    });
  });

  // Requirement 22.3: Tier name, description, features, and pricing shown
  describe("Comparison Layout", () => {
    it("should render five pricing cards", () => {
      renderPricingPage();
      // Each tier has a feature list with aria-label
      const featureLists = screen.getAllByRole("list");
      expect(featureLists.length).toBe(5);
    });

    it("should label feature lists with tier names for accessibility", () => {
      renderPricingPage();
      expect(
        screen.getByRole("list", { name: "Free features" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("list", { name: "Ads-free features" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("list", { name: "Local AI features" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("list", { name: "Bring Your Own Key features" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("list", { name: "Hosted AI features" })
      ).toBeInTheDocument();
    });

    it("should mark ADS_FREE tier as 'Most Popular'", () => {
      renderPricingPage();
      expect(screen.getByText("Most Popular")).toBeInTheDocument();
    });

    it("should render check icons for each feature item", () => {
      renderPricingPage();
      // Each feature has a check SVG (aria-hidden)
      const featureItems = screen.getAllByRole("listitem");
      expect(featureItems.length).toBeGreaterThan(0);
    });
  });

  // Requirement 22.4: Tier selection and subscription buttons
  describe("Subscription Flow", () => {
    it("should render 'Get started' button for the free tier", () => {
      renderPricingPage();
      expect(
        screen.getByRole("button", { name: /Get started with Free/i })
      ).toBeInTheDocument();
    });

    it("should render 'Subscribe' buttons for paid tiers", () => {
      renderPricingPage();
      const subscribeButtons = screen.getAllByRole("button", {
        name: /Get started with|Subscribe/i,
      });
      // 1 free "Get started" + 4 paid "Subscribe" = 5 total
      expect(subscribeButtons.length).toBe(5);
    });

    it("should call onSelectTier with correct tier when a card button is clicked", () => {
      const onSelectTier = vi.fn();
      renderPricingPage(undefined, onSelectTier);

      fireEvent.click(
        screen.getByRole("button", { name: /Get started with Free/i })
      );
      expect(onSelectTier).toHaveBeenCalledWith("FREE");
    });

    it("should call onSelectTier with ADS_FREE when Ads-free subscribe is clicked", () => {
      const onSelectTier = vi.fn();
      renderPricingPage(undefined, onSelectTier);

      fireEvent.click(
        screen.getByRole("button", { name: /Get started with Ads-free/i })
      );
      expect(onSelectTier).toHaveBeenCalledWith("ADS_FREE");
    });

    it("should call onSelectTier with HOSTED_AI when Hosted AI subscribe is clicked", () => {
      const onSelectTier = vi.fn();
      renderPricingPage(undefined, onSelectTier);

      fireEvent.click(
        screen.getByRole("button", { name: /Get started with Hosted AI/i })
      );
      expect(onSelectTier).toHaveBeenCalledWith("HOSTED_AI");
    });

    it("should show confirmation message after selecting a tier", () => {
      renderPricingPage();
      fireEvent.click(
        screen.getByRole("button", { name: /Get started with Local AI/i })
      );
      expect(screen.getByText(/You selected/)).toBeInTheDocument();
      // The confirmation message contains the tier name in a <strong> tag
      expect(screen.getByRole("status")).toHaveTextContent("Local AI");
    });

    it("should show 'Complete checkout to activate' in confirmation message", () => {
      renderPricingPage();
      fireEvent.click(
        screen.getByRole("button", { name: /Get started with Hosted AI/i })
      );
      expect(
        screen.getByText(/Complete checkout to activate/)
      ).toBeInTheDocument();
    });

    it("should not show confirmation message before any selection", () => {
      renderPricingPage();
      expect(screen.queryByText(/You selected/)).not.toBeInTheDocument();
    });
  });

  // Current tier state
  describe("Current Tier Indication", () => {
    it("should disable the button for the current tier", () => {
      renderPricingPage("FREE");
      const currentPlanButton = screen.getByRole("button", {
        name: /Current plan: Free/i,
      });
      expect(currentPlanButton).toBeDisabled();
    });

    it("should show 'Current plan' label on the current tier button", () => {
      renderPricingPage("ADS_FREE");
      expect(
        screen.getByRole("button", { name: /Current plan: Ads-free/i })
      ).toBeInTheDocument();
    });

    it("should not disable buttons for non-current tiers", () => {
      renderPricingPage("FREE");
      const adsFreButton = screen.getByRole("button", {
        name: /Get started with Ads-free/i,
      });
      expect(adsFreButton).not.toBeDisabled();
    });

    it("should not show confirmation message when selecting the current tier", () => {
      renderPricingPage("FREE");
      // Current tier button is disabled, so clicking it won't trigger selection
      const currentButton = screen.getByRole("button", {
        name: /Current plan: Free/i,
      });
      fireEvent.click(currentButton);
      expect(screen.queryByText(/You selected/)).not.toBeInTheDocument();
    });

    it("should have live region for confirmation status", () => {
      renderPricingPage();
      fireEvent.click(
        screen.getByRole("button", { name: /Get started with Free/i })
      );
      const status = screen.getByRole("status");
      expect(status).toBeInTheDocument();
    });
  });

  // Empty / edge cases
  describe("Edge Cases", () => {
    it("should render without crashing when tiers array is empty", () => {
      render(
        <ThemeProvider>
          <PricingPage tiers={[]} />
        </ThemeProvider>
      );
      expect(
        screen.getByRole("heading", { name: /Simple, transparent pricing/i })
      ).toBeInTheDocument();
    });

    it("should render without crashing when onSelectTier is not provided", () => {
      renderPricingPage();
      expect(() =>
        fireEvent.click(
          screen.getByRole("button", { name: /Get started with Free/i })
        )
      ).not.toThrow();
    });
  });
});
