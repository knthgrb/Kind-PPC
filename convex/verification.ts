import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get verification request by user
export const getVerificationRequestByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("verification_requests")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .order("desc")
      .first();
  },
});

// Get all verification requests (for admin)
export const getAllVerificationRequests = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected")
      )
    ),
  },
  handler: async (ctx, args) => {
    // Build query conditionally
    const requests = args.status
      ? await ctx.db
          .query("verification_requests")
          .withIndex("by_status")
          .filter((q) => q.eq(q.field("status"), args.status))
          .collect()
      : await ctx.db.query("verification_requests").collect();

    // Get user details for each request
    const requestsWithUsers = await Promise.all(
      requests.map(async (req) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_user_id")
          .filter((q) => q.eq(q.field("id"), req.user_id))
          .first();
        const documents = await ctx.db
          .query("verification_documents")
          .withIndex("by_user_id")
          .filter((q) => q.eq(q.field("user_id"), req.user_id))
          .collect();
        return { ...req, user, documents };
      })
    );
    return requestsWithUsers;
  },
});

// Create verification request
export const createVerificationRequest = mutation({
  args: {
    user_id: v.string(),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected")
      )
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("verification_requests", {
      ...args,
      status: args.status || "pending",
      created_at: Date.now(),
    });
  },
});

// Update verification request
export const updateVerificationRequest = mutation({
  args: {
    requestId: v.id("verification_requests"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, {
      status: args.status,
      notes: args.notes,
      updated_at: Date.now(),
    });

    // If approved, update kindtao is_verified
    if (args.status === "approved") {
      const request = await ctx.db.get(args.requestId);
      if (request) {
        const kindtao = await ctx.db
          .query("kindtaos")
          .withIndex("by_user_id")
          .filter((q) => q.eq(q.field("user_id"), request.user_id))
          .first();
        if (kindtao) {
          await ctx.db.patch(kindtao._id, {
            is_verified: true,
          });
        }
      }
    }
  },
});
