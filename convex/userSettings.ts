import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get user settings
export const getUserSettings = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("user_settings")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .first();
  },
});

// Create or update user settings
export const upsertUserSettings = mutation({
  args: {
    user_id: v.string(),
    settings: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("user_settings")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("user_id"), args.user_id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        settings: args.settings,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("user_settings", {
        ...args,
        created_at: Date.now(),
      });
    }
  },
});

// Ensure default settings exist
export const ensureDefaultSettings = mutation({
  args: {
    user_id: v.string(),
    defaultSettings: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("user_settings")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("user_id"), args.user_id))
      .first();

    if (!existing) {
      await ctx.db.insert("user_settings", {
        user_id: args.user_id,
        settings: args.defaultSettings,
        created_at: Date.now(),
      });
    }
  },
});


