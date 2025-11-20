import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get notifications by user
export const getNotificationsByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .order("desc")
      .collect();
  },
});

// Get unread notifications count
export const getUnreadNotificationsCount = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_id")
      .filter((q) => 
        q.and(
          q.eq(q.field("user_id"), args.userId),
          q.eq(q.field("status"), "unread")
        )
      )
      .collect();
    return notifications.length;
  },
});

// Create notification
export const createNotification = mutation({
  args: {
    user_id: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      ...args,
      status: "unread",
      created_at: Date.now(),
    });
    return notificationId;
  },
});

// Mark notification as read
export const markNotificationAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      status: "read",
      read_at: Date.now(),
    });
  },
});

// Delete notification
export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
  },
});

