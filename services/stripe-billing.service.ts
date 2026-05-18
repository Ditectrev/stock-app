import Stripe from "stripe";
import type { PricingTier } from "@/types";
import {
  getStripeSecretKey,
  getStripeWebhookSecret,
  getStripePriceByTier,
  getTierByStripePriceId,
} from "@/lib/stripe-billing-env";
import { subscriptionStoreService } from "@/services/subscription-store.service";
import type { StoredSubscriptionStatus } from "@/services/subscription-store.service";

type PaidTier = Exclude<PricingTier, "FREE">;

type SyncPayload = {
  userId: string;
  subscriptionId: string;
  customerId: string;
  priceId: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
};

const VALID_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "canceled",
  "past_due",
  "unpaid",
  "incomplete",
  "incomplete_expired",
] as const);

function normalizeSubscriptionStatus(value: string): StoredSubscriptionStatus {
  return VALID_SUBSCRIPTION_STATUSES.has(value as StoredSubscriptionStatus)
    ? (value as StoredSubscriptionStatus)
    : "canceled";
}

/** Stripe often returns an id string; expanded responses use `{ id }`. */
function stripeObjectId(
  ref: string | { id: string } | null | undefined
): string {
  if (ref == null) return "";
  if (typeof ref === "string") return ref;
  if (typeof ref === "object" && typeof ref.id === "string") return ref.id;
  return "";
}

function requireStripeClient(): Stripe {
  const key = getStripeSecretKey();
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }
  return new Stripe(key);
}

function toIsoFromUnix(timestamp?: number): string | undefined {
  if (!timestamp || Number.isNaN(timestamp)) return undefined;
  return new Date(timestamp * 1000).toISOString();
}

function isStripeMissingResource(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const stripeError = error as Error & { code?: string; statusCode?: number };
  return (
    stripeError.code === "resource_missing" || stripeError.statusCode === 404
  );
}

function getPeriodBounds(subscription: Stripe.Subscription): {
  start?: number;
  end?: number;
} {
  const subAny = subscription as unknown as {
    current_period_start?: number;
    current_period_end?: number;
    items?: {
      data?: Array<{
        current_period_start?: number;
        current_period_end?: number;
      }>;
    };
  };
  return {
    start:
      subAny.current_period_start ??
      subAny.items?.data?.[0]?.current_period_start,
    end:
      subAny.current_period_end ?? subAny.items?.data?.[0]?.current_period_end,
  };
}

export class StripeBillingService {
  createCheckoutSession(args: {
    tier: PaidTier;
    userId: string;
    email?: string;
    baseUrl: string;
  }) {
    const stripe = requireStripeClient();
    const priceId = getStripePriceByTier(args.tier);
    if (!priceId) {
      throw new Error(`Missing Stripe price for tier ${args.tier}.`);
    }

    return stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: {
          appUserId: args.userId,
          targetTier: args.tier,
        },
      },
      success_url: `${args.baseUrl}/pricing?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${args.baseUrl}/pricing?canceled=1`,
      customer_email: args.email,
      metadata: {
        appUserId: args.userId,
        targetTier: args.tier,
        stripePriceId: priceId,
      },
      allow_promotion_codes: true,
      billing_address_collection: "required",
    });
  }

  async cancelActiveSubscription(userId: string): Promise<boolean> {
    const stripe = requireStripeClient();
    const current = await subscriptionStoreService.getMostRecentForUser(userId);
    if (!current) return false;

    const subscriptionId = current.stripeSubscriptionId?.trim();
    if (!subscriptionId) {
      await this.markLocalCancelAtPeriodEnd(current);
      return true;
    }

    try {
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      await this.markLocalCancelAtPeriodEnd(current);
      return true;
    } catch (error) {
      if (!isStripeMissingResource(error)) throw error;
      await this.markLocalCancelAtPeriodEnd(current);
      return true;
    }
  }

  async createBillingPortalSession(args: {
    userId: string;
    baseUrl: string;
  }): Promise<{ url: string }> {
    const stripe = requireStripeClient();
    const customerId = await this.resolveStripeCustomerId(args.userId);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${args.baseUrl}/profile`,
    });
    if (!session.url) {
      throw new Error("Failed to create billing portal session.");
    }
    return { url: session.url };
  }

  constructWebhookEvent(rawBody: string, signature: string): Stripe.Event {
    const stripe = requireStripeClient();
    const webhookSecret = getStripeWebhookSecret();
    if (!webhookSecret) throw new Error("Missing STRIPE_WEBHOOK_SECRET.");
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }

  /**
   * Syncs subscription after the user returns from Checkout with `?session_id=…`.
   * Ensures Appwrite updates when webhooks are not delivered (e.g. local dev
   * without `stripe listen`, or a delayed webhook).
   */
  async confirmCheckoutSessionAfterRedirect(
    sessionId: string,
    appUserId: string
  ): Promise<void> {
    const stripe = requireStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });
    const metaUserId = session.metadata?.appUserId?.trim();
    if (!metaUserId || metaUserId !== appUserId) {
      throw new Error("This checkout session does not belong to your account.");
    }
    if (session.mode !== "subscription") {
      throw new Error("Invalid checkout session.");
    }
    if (session.status !== "complete") {
      throw new Error("Checkout is not complete yet.");
    }
    if (
      session.payment_status !== "paid" &&
      session.payment_status !== "no_payment_required"
    ) {
      throw new Error(`Payment not complete (${session.payment_status}).`);
    }
    await this.syncFromCheckoutCompleted(session);
  }

  async syncFromCheckoutCompleted(session: Stripe.Checkout.Session) {
    const stripe = requireStripeClient();
    const userId = session.metadata?.appUserId;
    const subscriptionId = stripeObjectId(session.subscription);
    const customerId = stripeObjectId(session.customer);
    const priceId = session.metadata?.stripePriceId ?? "";
    if (!userId || !subscriptionId) return;

    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    if (customerId) {
      await stripe.customers.update(customerId, {
        metadata: { appUserId: userId },
      });
    }
    const bounds = getPeriodBounds(sub);
    await this.writeSubscriptionRecord({
      userId,
      subscriptionId,
      customerId,
      priceId:
        priceId ||
        sub.items.data[0]?.price?.id ||
        session.metadata?.stripePriceId ||
        "",
      status: sub.status,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      currentPeriodStart: bounds.start,
      currentPeriodEnd: bounds.end,
    });
  }

  async syncFromSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = stripeObjectId(subscription.customer);
    const priceId = subscription.items.data[0]?.price?.id ?? "";
    const userId = await this.resolveUserIdFromSubscription(subscription);
    if (!userId) return;
    const bounds = getPeriodBounds(subscription);

    await this.writeSubscriptionRecord({
      userId,
      subscriptionId: subscription.id,
      customerId,
      priceId,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: bounds.start,
      currentPeriodEnd: bounds.end,
    });
  }

  async syncFromSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = await this.resolveUserIdFromSubscription(subscription);
    if (!userId) return;
    const priceId = subscription.items.data[0]?.price?.id ?? "";
    const customerId = stripeObjectId(subscription.customer);
    const bounds = getPeriodBounds(subscription);
    await this.writeSubscriptionRecord({
      userId,
      subscriptionId: subscription.id,
      customerId,
      priceId,
      status: "canceled",
      cancelAtPeriodEnd: false,
      currentPeriodStart: bounds.start,
      currentPeriodEnd: bounds.end,
    });
  }

  private async resolveUserIdFromSubscription(
    subscription: Stripe.Subscription
  ): Promise<string | null> {
    const subscriptionId = subscription.id;
    const record =
      await subscriptionStoreService.getByStripeSubscriptionId(subscriptionId);
    if (record?.userId) return record.userId;

    const metadataUserId = subscription.metadata?.appUserId?.trim();
    if (metadataUserId) return metadataUserId;

    const customerId = stripeObjectId(subscription.customer);
    if (customerId) {
      const byCustomer =
        await subscriptionStoreService.getByStripeCustomerId(customerId);
      if (byCustomer?.userId) return byCustomer.userId;

      const stripe = requireStripeClient();
      const customer = await stripe.customers.retrieve(customerId);
      if (!("deleted" in customer) || customer.deleted !== true) {
        const customerMetadataUserId = customer.metadata?.appUserId?.trim();
        if (customerMetadataUserId) return customerMetadataUserId;
      }
    }
    return null;
  }

  private async markLocalCancelAtPeriodEnd(
    record: NonNullable<
      Awaited<ReturnType<typeof subscriptionStoreService.getMostRecentForUser>>
    >
  ): Promise<void> {
    await subscriptionStoreService.updateRecord(record.id, {
      cancelAtPeriodEnd: true,
    });
  }

  private async resolveStripeCustomerId(userId: string): Promise<string> {
    const stripe = requireStripeClient();
    const current = await subscriptionStoreService.getMostRecentForUser(userId);
    if (!current) {
      throw new Error("No subscription found for this account.");
    }

    const storedCustomerId = current.stripeCustomerId?.trim() ?? "";
    if (storedCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(storedCustomerId);
        if (!("deleted" in customer) || customer.deleted !== true) {
          return storedCustomerId;
        }
      } catch (error) {
        if (!isStripeMissingResource(error)) throw error;
      }
    }

    const subscriptionId = current.stripeSubscriptionId?.trim();
    if (subscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const recoveredCustomerId = stripeObjectId(sub.customer);
        if (recoveredCustomerId) {
          await subscriptionStoreService.updateRecord(current.id, {
            stripeCustomerId: recoveredCustomerId,
          });
          return recoveredCustomerId;
        }
      } catch (error) {
        if (!isStripeMissingResource(error)) throw error;
      }
    }

    const search = await stripe.customers.search({
      query: `metadata['appUserId']:'${userId}'`,
      limit: 1,
    });
    const found = search.data[0]?.id?.trim();
    if (found) {
      await subscriptionStoreService.updateRecord(current.id, {
        stripeCustomerId: found,
      });
      return found;
    }

    throw new Error(
      "We could not find your billing account in Stripe. Use Pricing to subscribe again, or contact support if you were charged recently."
    );
  }

  private async writeSubscriptionRecord(payload: SyncPayload): Promise<void> {
    await subscriptionStoreService.upsertByStripeSubscriptionId(
      payload.subscriptionId,
      {
        userId: payload.userId,
        tier: getTierByStripePriceId(payload.priceId),
        status: normalizeSubscriptionStatus(payload.status),
        stripeCustomerId: payload.customerId,
        stripeSubscriptionId: payload.subscriptionId,
        stripePriceId: payload.priceId,
        currentPeriodStart: toIsoFromUnix(payload.currentPeriodStart),
        currentPeriodEnd: toIsoFromUnix(payload.currentPeriodEnd),
        cancelAtPeriodEnd: payload.cancelAtPeriodEnd,
      }
    );
  }
}

export const stripeBillingService = new StripeBillingService();
