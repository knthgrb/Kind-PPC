import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get applications by job
export const getApplicationsByJob = query({
  args: { jobId: v.string() },
  handler: async (ctx, args) => {
    const applications = await ctx.db
      .query("job_applications")
      .withIndex("by_job_post_id")
      .filter((q) => q.eq(q.field("job_post_id"), args.jobId))
      .collect();

    // Get user details for each application
    const applicationsWithUsers = await Promise.all(
      applications.map(async (app) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_email")
          .filter((q) => q.eq(q.field("id"), app.kindtao_user_id))
          .first();
        return { ...app, user };
      })
    );

    return applicationsWithUsers;
  },
});

// Get applications by kindtao user
export const getApplicationsByKindTao = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("job_applications")
      .withIndex("by_kindtao_user_id")
      .filter((q) => q.eq(q.field("kindtao_user_id"), args.userId))
      .collect();
  },
});

// Create application
export const createApplication = mutation({
  args: {
    kindtao_user_id: v.string(),
    job_post_id: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const applicationId = await ctx.db.insert("job_applications", {
      ...args,
      applied_at: Date.now(),
      created_at: Date.now(),
    });
    return applicationId;
  },
});

// Update application status
export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("job_applications"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.applicationId, {
      status: args.status,
      updated_at: Date.now(),
    });
  },
});

// Check if user has applied for job
export const hasAppliedForJob = query({
  args: {
    jobId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const application = await ctx.db
      .query("job_applications")
      .withIndex("by_job_post_id")
      .filter((q) =>
        q.and(
          q.eq(q.field("job_post_id"), args.jobId),
          q.eq(q.field("kindtao_user_id"), args.userId)
        )
      )
      .first();
    return !!application;
  },
});

// Get application by job and user
export const getApplicationByJobAndUser = query({
  args: {
    jobId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("job_applications")
      .withIndex("by_job_post_id")
      .filter((q) =>
        q.and(
          q.eq(q.field("job_post_id"), args.jobId),
          q.eq(q.field("kindtao_user_id"), args.userId)
        )
      )
      .first();
  },
});

// Get application by Convex document id
export const getApplicationById = query({
  args: {
    applicationId: v.id("job_applications"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.applicationId);
  },
});

// Get applications for kindbossing user (pending only)
export const getPendingApplicationsForKindBossing = query({
  args: {
    kindbossingUserId: v.string(),
    jobId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get job IDs for this kindbossing user
    let jobIds: string[] = [];
    if (args.jobId) {
      // Verify the job belongs to this user
      const job = await ctx.db.get(args.jobId as Id<"job_posts">);
      if (job && job.kindbossing_user_id === args.kindbossingUserId) {
        jobIds = [String(job._id)];
      }
    } else {
      // Get all jobs for this user
      const jobs = await ctx.db
        .query("job_posts")
        .withIndex("by_kindbossing_user_id")
        .filter((q) =>
          q.eq(q.field("kindbossing_user_id"), args.kindbossingUserId)
        )
        .collect();
      jobIds = jobs.map((job) => String(job._id));
    }

    if (jobIds.length === 0) {
      return [];
    }

    // Get all pending applications for these jobs
    const allApplications = await ctx.db
      .query("job_applications")
      .withIndex("by_job_post_id")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const filteredApplications = allApplications.filter((app) =>
      jobIds.includes(app.job_post_id)
    );

    // Get job details, user details, and kindtao boost status
    const formatLocation = (user: any | null) => {
      if (!user) return null;
      const parts = [user.barangay, user.municipality, user.province].filter(
        Boolean
      );
      return parts.length ? parts.join(", ") : null;
    };

    const applicationsWithDetails = await Promise.all(
      filteredApplications.map(async (app) => {
        const job = await ctx.db
          .get(app.job_post_id as Id<"job_posts">)
          .catch(() => null);
        const user = await ctx.db
          .query("users")
          .withIndex("by_user_id")
          .filter((q) => q.eq(q.field("id"), app.kindtao_user_id))
          .first();
        const kindtao = await ctx.db
          .query("kindtaos")
          .withIndex("by_user_id")
          .filter((q) => q.eq(q.field("user_id"), app.kindtao_user_id))
          .first();
        const experiences = await ctx.db
          .query("kindtao_work_experiences")
          .withIndex("by_kindtao_user_id")
          .filter((q) => q.eq(q.field("kindtao_user_id"), app.kindtao_user_id))
          .collect();

        experiences.sort((a, b) => (b.start_date || 0) - (a.start_date || 0));

        return {
          ...app,
          job,
          user,
          kindtao,
          location: formatLocation(user),
          experiences,
        };
      })
    );

    // Sort by boost status and applied_at
    applicationsWithDetails.sort((a, b) => {
      const aBoosted =
        a.kindtao?.is_boosted &&
        a.kindtao?.boost_expires_at &&
        a.kindtao.boost_expires_at > Date.now();
      const bBoosted =
        b.kindtao?.is_boosted &&
        b.kindtao?.boost_expires_at &&
        b.kindtao.boost_expires_at > Date.now();

      if (aBoosted && !bBoosted) return -1;
      if (!aBoosted && bBoosted) return 1;
      return (b.applied_at || 0) - (a.applied_at || 0);
    });

    return applicationsWithDetails;
  },
});
