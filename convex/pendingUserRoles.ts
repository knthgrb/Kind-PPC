import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pending_user_roles")
      .withIndex("by_email")
      .filter((q) => q.eq(q.field("email"), args.email.toLowerCase()))
      .first();
  },
});

export const upsertPendingUser = mutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("kindbossing"), v.literal("kindtao"), v.literal("admin")),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase();
    const existing = await ctx.db
      .query("pending_user_roles")
      .withIndex("by_email")
      .filter((q) => q.eq(q.field("email"), normalizedEmail))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        role: args.role,
        first_name: args.first_name,
        last_name: args.last_name,
        created_at: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("pending_user_roles", {
      email: normalizedEmail,
      role: args.role,
      first_name: args.first_name,
      last_name: args.last_name,
      created_at: Date.now(),
    });
  },
});

export const deleteByEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase();
    const existing = await ctx.db
      .query("pending_user_roles")
      .withIndex("by_email")
      .filter((q) => q.eq(q.field("email"), normalizedEmail))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

