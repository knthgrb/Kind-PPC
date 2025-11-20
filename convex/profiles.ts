import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get user profile
export const getUserProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email")
      .filter((q) => q.eq(q.field("id"), args.userId))
      .first();
  },
});

// Get complete KindTao profile
export const getCompleteKindTaoProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email")
      .filter((q) => q.eq(q.field("id"), args.userId))
      .first();

    if (!user) return null;

    const kindtao = await ctx.db
      .query("kindtaos")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .first();

    const workExperiences = await ctx.db
      .query("kindtao_work_experiences")
      .withIndex("by_kindtao_user_id")
      .filter((q) => q.eq(q.field("kindtao_user_id"), args.userId))
      .collect();

    // Get attachments for each work experience
    const experiencesWithAttachments = await Promise.all(
      workExperiences.map(async (exp) => {
        const attachments = await ctx.db
          .query("kindtao_work_experience_attachments")
          .withIndex("by_kindtao_work_experience_id")
          .filter((q) => q.eq(q.field("kindtao_work_experience_id"), exp._id))
          .collect();
        return { ...exp, attachments };
      })
    );

    const verificationRequests = await ctx.db
      .query("verification_requests")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .collect();

    return {
      ...user,
      kindtao_profile: kindtao,
      work_experiences: experiencesWithAttachments,
      verification_requests: verificationRequests,
    };
  },
});

// Get KindBossing profile
export const getKindBossingProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email")
      .filter((q) => q.eq(q.field("id"), args.userId))
      .first();

    if (!user) return null;

    const kindbossing = await ctx.db
      .query("kindbossings")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .first();

    const jobPosts = await ctx.db
      .query("job_posts")
      .withIndex("by_kindbossing_user_id")
      .filter((q) => q.eq(q.field("kindbossing_user_id"), args.userId))
      .collect();

    return {
      ...user,
      kindbossing_profile: kindbossing,
      job_posts: jobPosts,
    };
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    userId: v.string(),
    profileData: v.object({
      first_name: v.optional(v.string()),
      last_name: v.optional(v.string()),
      phone: v.optional(v.string()),
      date_of_birth: v.optional(v.string()),
      gender: v.optional(v.string()),
      profile_image_url: v.optional(v.string()),
      barangay: v.optional(v.string()),
      municipality: v.optional(v.string()),
      province: v.optional(v.string()),
      zip_code: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email")
      .filter((q) => q.eq(q.field("id"), args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      ...args.profileData,
      updated_at: Date.now(),
    });
  },
});

