import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get job by ID
export const getJobById = query({
  args: { jobId: v.string() },
  handler: async (ctx, args) => {
    // jobId is a Convex document ID string
    let job = null;
    try {
      job = await ctx.db.get(args.jobId as Id<"job_posts">);
    } catch (error) {
      // Job not found - job will remain null
      job = null;
    }

    if (!job) return null;

    // Get kindbossing user info
    const kindbossing = await ctx.db
      .query("users")
      .withIndex("by_email")
      .filter((q) => q.eq(q.field("id"), job.kindbossing_user_id))
      .first();

    const kindbossingProfile = await ctx.db
      .query("kindbossings")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("user_id"), job.kindbossing_user_id))
      .first();

    return {
      ...job,
      kindbossing: kindbossing
        ? {
            ...kindbossing,
            profile: kindbossingProfile,
          }
        : null,
    };
  },
});

// Get jobs with filters
export const getJobs = query({
  args: {
    filters: v.optional(
      v.object({
        jobType: v.optional(v.string()),
        search: v.optional(v.string()),
        province: v.optional(v.string()),
        limit: v.optional(v.number()),
        offset: v.optional(v.number()),
        page: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let jobs = await ctx.db
      .query("job_posts")
      .withIndex("by_status")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "active"),
          q.or(
            q.eq(q.field("expires_at"), undefined),
            q.gt(q.field("expires_at"), now)
          )
        )
      )
      .collect();

    // Apply filters
    if (args.filters?.jobType && args.filters.jobType !== "All") {
      jobs = jobs.filter((job) => job.job_type === args.filters?.jobType);
    }

    if (args.filters?.search && args.filters.search.trim().length > 0) {
      const searchTerm = args.filters.search.trim().toLowerCase();
      jobs = jobs.filter(
        (job) =>
          job.job_title.toLowerCase().includes(searchTerm) ||
          job.job_description?.toLowerCase().includes(searchTerm) ||
          job.required_skills?.some((skill) =>
            skill.toLowerCase().includes(searchTerm)
          )
      );
    }

    if (args.filters?.province && args.filters.province !== "All") {
      jobs = jobs.filter((job) =>
        job.location
          .toLowerCase()
          .includes(args.filters!.province!.toLowerCase())
      );
    }

    // Sort by created_at descending
    jobs.sort((a, b) => b.created_at - a.created_at);

    // Apply pagination
    if (args.filters?.limit) {
      const offset =
        args.filters.offset ??
        (args.filters.page ? (args.filters.page - 1) * args.filters.limit : 0);
      jobs = jobs.slice(offset, offset + args.filters.limit);
    }

    return jobs;
  },
});

// Get jobs by kindbossing user
export const getJobsByKindBossing = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("job_posts")
      .withIndex("by_kindbossing_user_id")
      .filter((q) => q.eq(q.field("kindbossing_user_id"), args.userId))
      .collect();
  },
});

// Create job
export const createJob = mutation({
  args: {
    kindbossing_user_id: v.string(),
    job_title: v.string(),
    job_description: v.optional(v.string()),
    required_skills: v.optional(v.array(v.string())),
    salary: v.optional(v.string()),
    salary_min: v.optional(v.number()),
    salary_max: v.optional(v.number()),
    salary_type: v.optional(v.string()),
    work_schedule: v.any(),
    required_years_of_experience: v.optional(v.number()),
    location: v.string(),
    location_coordinates: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
    preferred_languages: v.optional(v.array(v.string())),
    status: v.string(),
    job_type: v.string(),
    province: v.optional(v.string()),
    region: v.optional(v.string()),
    expires_at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const jobId = await ctx.db.insert("job_posts", {
      ...args,
      created_at: Date.now(),
    });
    return jobId;
  },
});

// Update job
export const updateJob = mutation({
  args: {
    jobId: v.id("job_posts"),
    updates: v.object({
      job_title: v.optional(v.string()),
      job_description: v.optional(v.string()),
      required_skills: v.optional(v.array(v.string())),
      salary: v.optional(v.string()),
      salary_min: v.optional(v.number()),
      salary_max: v.optional(v.number()),
      salary_type: v.optional(v.string()),
      work_schedule: v.optional(v.any()),
      required_years_of_experience: v.optional(v.number()),
      location: v.optional(v.string()),
      location_coordinates: v.optional(
        v.object({
          lat: v.number(),
          lng: v.number(),
        })
      ),
      preferred_languages: v.optional(v.array(v.string())),
      status: v.optional(v.string()),
      job_type: v.optional(v.string()),
      province: v.optional(v.string()),
      region: v.optional(v.string()),
      expires_at: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      ...args.updates,
      updated_at: Date.now(),
    });
  },
});

// Boost job
export const boostJob = mutation({
  args: {
    jobId: v.id("job_posts"),
    boostExpiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      is_boosted: true,
      boost_expires_at: args.boostExpiresAt,
    });
  },
});

// Deactivate job
export const deactivateJob = mutation({
  args: { jobId: v.id("job_posts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "inactive",
      updated_at: Date.now(),
    });
  },
});

// Delete job
export const deleteJob = mutation({
  args: { jobId: v.id("job_posts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.jobId);
  },
});
