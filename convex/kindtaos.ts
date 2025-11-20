import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get KindTao profile by user ID
export const getKindTaoByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kindtaos")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .first();
  },
});

// Create or update KindTao profile
export const upsertKindTao = mutation({
  args: {
    user_id: v.string(),
    skills: v.optional(v.array(v.string())),
    languages: v.optional(v.array(v.string())),
    expected_salary_range: v.optional(v.string()),
    availability_schedule: v.optional(v.any()),
    highest_educational_attainment: v.optional(v.string()),
    rating: v.optional(v.number()),
    reviews: v.optional(v.array(v.string())),
    is_verified: v.optional(v.boolean()),
    is_boosted: v.optional(v.boolean()),
    boost_expires_at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("kindtaos")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("user_id"), args.user_id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("kindtaos", {
        ...args,
        created_at: Date.now(),
      });
    }
  },
});

// Boost KindTao profile
export const boostKindTao = mutation({
  args: {
    userId: v.string(),
    boostExpiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const kindtao = await ctx.db
      .query("kindtaos")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .first();

    if (kindtao) {
      await ctx.db.patch(kindtao._id, {
        is_boosted: true,
        boost_expires_at: args.boostExpiresAt,
      });
    }
  },
});


