import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get job preferences by user
export const getJobPreferencesByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kindtao_job_preferences")
      .withIndex("by_kindtao_user_id")
      .filter((q) => q.eq(q.field("kindtao_user_id"), args.userId))
      .first();
  },
});

// Create or update job preferences
export const upsertJobPreferences = mutation({
  args: {
    kindtao_user_id: v.string(),
    desired_jobs: v.optional(v.array(v.string())),
    desired_locations: v.optional(v.array(v.string())),
    desired_job_types: v.optional(v.array(v.string())),
    salary_range_min: v.optional(v.number()),
    salary_range_max: v.optional(v.number()),
    salary_type: v.optional(v.string()),
    desired_languages: v.optional(v.array(v.string())),
    desired_job_location_radius: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("kindtao_job_preferences")
      .withIndex("by_kindtao_user_id")
      .filter((q) => q.eq(q.field("kindtao_user_id"), args.kindtao_user_id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updated_at: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("kindtao_job_preferences", {
        ...args,
        created_at: Date.now(),
      });
    }
  },
});


