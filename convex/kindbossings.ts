import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get KindBossing profile by user ID
export const getKindBossingByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kindbossings")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .first();
  },
});

// Create or update KindBossing profile
export const upsertKindBossing = mutation({
  args: {
    user_id: v.string(),
    rating: v.optional(v.number()),
    reviews: v.optional(v.array(v.string())),
    business_name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("kindbossings")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("user_id"), args.user_id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("kindbossings", {
        ...args,
        created_at: Date.now(),
      });
    }
  },
});


