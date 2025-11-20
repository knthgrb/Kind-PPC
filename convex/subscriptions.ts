import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get subscription by user
export const getSubscriptionByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .first();
  },
});

// Get subscription by Xendit subscription ID
export const getSubscriptionByXenditId = query({
  args: { xenditSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .filter((q) => q.eq(q.field("xendit_subscription_id"), args.xenditSubscriptionId))
      .collect();
  },
});

// Create or update subscription
export const upsertSubscription = mutation({
  args: {
    user_id: v.string(),
    subscription_tier: v.string(),
    plan_id: v.optional(v.string()),
    current_period_start: v.optional(v.number()),
    current_period_end: v.optional(v.number()),
    cancel_at_period_end: v.optional(v.boolean()),
    cancelled_at: v.optional(v.number()),
    cancellation_reason: v.optional(v.string()),
    daily_swipe_limit: v.optional(v.number()),
    amount_paid: v.optional(v.number()),
    currency: v.optional(v.string()),
    subscription_expires_at: v.optional(v.number()),
    xendit_subscription_id: v.optional(v.string()),
    xendit_customer_id: v.optional(v.string()),
    xendit_plan_id: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("user_id"), args.user_id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updated_at: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("subscriptions", {
        ...args,
        created_at: Date.now(),
      });
    }
  },
});

// Update subscription
export const updateSubscription = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    updates: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
      ...args.updates,
      updated_at: Date.now(),
    });
    return args.subscriptionId;
  },
});

// Create payment transaction
export const createPaymentTransaction = mutation({
  args: {
    user_id: v.string(),
    subscription_id: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    payment_method: v.optional(v.string()),
    xendit_payment_id: v.optional(v.string()),
    xendit_action_id: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("payment_transactions", {
      ...args,
      created_at: Date.now(),
    });
  },
});

// Cancel all active subscriptions for a user (to ensure only 1 active)
export const cancelActiveSubscriptions = mutation({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    const activeSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_id")
      .filter((q) => 
        q.and(
          q.eq(q.field("user_id"), args.user_id),
          q.eq(q.field("status"), "active")
        )
      )
      .collect();

    for (const sub of activeSubscriptions) {
      await ctx.db.patch(sub._id, {
        status: "cancelled",
        cancel_at_period_end: true,
        cancelled_at: Date.now(),
        updated_at: Date.now(),
      });
    }

    return activeSubscriptions.length;
  },
});


