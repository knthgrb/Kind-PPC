import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get payment transactions by user
export const getPaymentTransactionsByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payment_transactions")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .order("desc")
      .collect();
  },
});

// Create payment transaction
export const createPaymentTransaction = mutation({
  args: {
    user_id: v.string(),
    subscription_id: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    status: v.optional(v.string()),
    payment_method: v.optional(v.string()),
    xendit_payment_id: v.optional(v.string()),
    xendit_action_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("payment_transactions", {
      ...args,
      created_at: Date.now(),
    });
  },
});

// Update payment transaction
export const updatePaymentTransaction = mutation({
  args: {
    transactionId: v.id("payment_transactions"),
    updates: v.object({
      status: v.optional(v.string()),
      xendit_payment_id: v.optional(v.string()),
      xendit_action_id: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.transactionId, {
      ...args.updates,
      updated_at: Date.now(),
    });
  },
});


