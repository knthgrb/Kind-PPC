import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Mark onboarding as completed
export const markOnboardingCompleted = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("id"), args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      has_completed_onboarding: true,
      updated_at: Date.now(),
    });
  },
});

// Check if onboarding is completed
export const isOnboardingCompleted = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("id"), args.userId))
      .first();

    return user?.has_completed_onboarding || false;
  },
});


