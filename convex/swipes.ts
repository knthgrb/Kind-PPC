import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get job interactions by user
export const getJobInteractionsByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kindtao_job_interactions")
      .withIndex("by_kindtao_user_id")
      .filter((q) => q.eq(q.field("kindtao_user_id"), args.userId))
      .collect();
  },
});

// Create job interaction
export const createJobInteraction = mutation({
  args: {
    kindtao_user_id: v.string(),
    job_post_id: v.string(),
    action: v.string(), // "swipe_right", "swipe_left", "apply", etc.
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("kindtao_job_interactions", {
      ...args,
      is_rewound: false,
      created_at: Date.now(),
    });
  },
});

// Check if user has interacted with job
export const hasInteractedWithJob = query({
  args: {
    userId: v.string(),
    jobId: v.string(),
  },
  handler: async (ctx, args) => {
    const interaction = await ctx.db
      .query("kindtao_job_interactions")
      .withIndex("by_kindtao_user_id")
      .filter((q) => 
        q.and(
          q.eq(q.field("kindtao_user_id"), args.userId),
          q.eq(q.field("job_post_id"), args.jobId),
          q.eq(q.field("is_rewound"), false)
        )
      )
      .first();
    return !!interaction;
  },
});

// Get most recent interaction (not rewound)
export const getMostRecentInteraction = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const interactions = await ctx.db
      .query("kindtao_job_interactions")
      .withIndex("by_kindtao_user_id")
      .filter((q) => 
        q.and(
          q.eq(q.field("kindtao_user_id"), args.userId),
          q.eq(q.field("is_rewound"), false)
        )
      )
      .collect();
    
    // Sort by created_at descending and get the most recent
    if (interactions.length === 0) return null;
    
    const sorted = interactions.sort((a, b) => b.created_at - a.created_at);
    return sorted[0];
  },
});

// Rewind interaction
export const rewindInteraction = mutation({
  args: {
    interactionId: v.id("kindtao_job_interactions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.interactionId, {
      is_rewound: true,
      rewound_at: Date.now(),
    });
  },
});

// Rewind most recent interaction by user
export const rewindMostRecentInteraction = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const interactions = await ctx.db
      .query("kindtao_job_interactions")
      .withIndex("by_kindtao_user_id")
      .filter((q) => 
        q.and(
          q.eq(q.field("kindtao_user_id"), args.userId),
          q.eq(q.field("is_rewound"), false)
        )
      )
      .collect();
    
    if (interactions.length === 0) {
      return { success: false, error: "No interactions to rewind" };
    }
    
    // Sort by created_at descending and get the most recent
    const sorted = interactions.sort((a, b) => b.created_at - a.created_at);
    const mostRecent = sorted[0];
    
    await ctx.db.patch(mostRecent._id, {
      is_rewound: true,
      rewound_at: Date.now(),
    });
    
    return { success: true, jobId: mostRecent.job_post_id };
  },
});


