import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Create admin action
export const createAdminAction = mutation({
  args: {
    admin_id: v.string(),
    target_user_id: v.string(),
    action_type: v.string(),
    description: v.optional(v.string()),
    details: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("admin_actions", {
      ...args,
      created_at: Date.now(),
    });
  },
});

// Get admin actions by target user
export const getAdminActionsByTarget = query({
  args: { targetUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("admin_actions")
      .withIndex("by_target_user_id")
      .filter((q) => q.eq(q.field("target_user_id"), args.targetUserId))
      .collect();
  },
});

// Get admin actions by admin
export const getAdminActionsByAdmin = query({
  args: { adminId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("admin_actions")
      .withIndex("by_admin_id")
      .filter((q) => q.eq(q.field("admin_id"), args.adminId))
      .collect();
  },
});

// Check if user is blocked
export const isUserBlocked = query({
  args: {
    blockerId: v.string(),
    blockedUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const actions = await ctx.db
      .query("admin_actions")
      .withIndex("by_target_user_id")
      .filter((q) => 
        q.and(
          q.eq(q.field("target_user_id"), args.blockedUserId),
          q.eq(q.field("action_type"), "user_blocked")
        )
      )
      .collect();

    // Check if any action has blocker_id in details
    return actions.some(action => 
      action.details && 
      typeof action.details === 'object' && 
      'blocker_id' in action.details &&
      (action.details as any).blocker_id === args.blockerId
    );
  },
});

// Get blocked users for a blocker
export const getBlockedUsers = query({
  args: { blockerId: v.string() },
  handler: async (ctx, args) => {
    const actions = await ctx.db
      .query("admin_actions")
      .filter((q) => q.eq(q.field("action_type"), "user_blocked"))
      .collect();

    // Filter actions where blocker_id matches
    const blockedActions = actions.filter(action =>
      action.details &&
      typeof action.details === 'object' &&
      'blocker_id' in action.details &&
      (action.details as any).blocker_id === args.blockerId
    );

    return blockedActions.map(action => ({
      target_user_id: action.target_user_id,
      created_at: action.created_at,
      details: action.details,
    }));
  },
});

// Block a user (create admin action)
export const blockUser = mutation({
  args: {
    blockerId: v.string(),
    blockedUserId: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if already blocked
    const existing = await ctx.db
      .query("admin_actions")
      .withIndex("by_target_user_id")
      .filter((q) => 
        q.and(
          q.eq(q.field("target_user_id"), args.blockedUserId),
          q.eq(q.field("action_type"), "user_blocked")
        )
      )
      .collect();

    const alreadyBlocked = existing.some(action => 
      action.details && 
      typeof action.details === 'object' && 
      'blocker_id' in action.details &&
      (action.details as any).blocker_id === args.blockerId
    );

    if (alreadyBlocked) {
      return { success: false, error: "User already blocked" };
    }

    // Create block action
    await ctx.db.insert("admin_actions", {
      admin_id: args.blockerId, // Using blocker as admin for user-initiated blocks
      target_user_id: args.blockedUserId,
      action_type: "user_blocked",
      description: args.reason || "User blocked",
      details: {
        blocker_id: args.blockerId,
        reason: args.reason,
      },
      created_at: Date.now(),
    });

    return { success: true };
  },
});


