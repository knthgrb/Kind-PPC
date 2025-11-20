import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get work experiences by user
export const getWorkExperiencesByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const experiences = await ctx.db
      .query("kindtao_work_experiences")
      .withIndex("by_kindtao_user_id")
      .filter((q) => q.eq(q.field("kindtao_user_id"), args.userId))
      .collect();

    // Get attachments for each experience
    const experiencesWithAttachments = await Promise.all(
      experiences.map(async (exp) => {
        const attachments = await ctx.db
          .query("kindtao_work_experience_attachments")
          .withIndex("by_kindtao_work_experience_id")
          .filter((q) => q.eq(q.field("kindtao_work_experience_id"), exp._id))
          .collect();
        return { ...exp, attachments };
      })
    );

    // Sort by start_date descending
    experiencesWithAttachments.sort((a, b) => b.start_date - a.start_date);

    return experiencesWithAttachments;
  },
});

// Create work experience
export const createWorkExperience = mutation({
  args: {
    kindtao_user_id: v.string(),
    employer: v.optional(v.string()),
    job_title: v.optional(v.string()),
    is_current_job: v.optional(v.boolean()),
    start_date: v.number(),
    end_date: v.optional(v.number()),
    location: v.optional(v.string()),
    skills_used: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("kindtao_work_experiences", {
      ...args,
      created_at: Date.now(),
    });
  },
});

// Create multiple work experiences
export const createWorkExperiences = mutation({
  args: {
    experiences: v.array(v.object({
      kindtao_user_id: v.string(),
      employer: v.optional(v.string()),
      job_title: v.optional(v.string()),
      is_current_job: v.optional(v.boolean()),
      start_date: v.number(),
      end_date: v.optional(v.number()),
      location: v.optional(v.string()),
      skills_used: v.optional(v.array(v.string())),
      notes: v.optional(v.string()),
      description: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const exp of args.experiences) {
      const id = await ctx.db.insert("kindtao_work_experiences", {
        ...exp,
        created_at: Date.now(),
      });
      ids.push(id);
    }
    return ids;
  },
});

// Update work experience
export const updateWorkExperience = mutation({
  args: {
    experienceId: v.id("kindtao_work_experiences"),
    updates: v.object({
      employer: v.optional(v.string()),
      job_title: v.optional(v.string()),
      is_current_job: v.optional(v.boolean()),
      start_date: v.optional(v.number()),
      end_date: v.optional(v.number()),
      location: v.optional(v.string()),
      skills_used: v.optional(v.array(v.string())),
      notes: v.optional(v.string()),
      description: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.experienceId, args.updates);
  },
});

// Delete work experience
export const deleteWorkExperience = mutation({
  args: { experienceId: v.id("kindtao_work_experiences") },
  handler: async (ctx, args) => {
    // Delete attachments first
    const attachments = await ctx.db
      .query("kindtao_work_experience_attachments")
      .withIndex("by_kindtao_work_experience_id")
      .filter((q) => q.eq(q.field("kindtao_work_experience_id"), args.experienceId))
      .collect();

    for (const attachment of attachments) {
      await ctx.db.delete(attachment._id);
    }

    // Delete experience
    await ctx.db.delete(args.experienceId);
  },
});

// Create work experience attachment
export const createWorkExperienceAttachment = mutation({
  args: {
    kindtao_work_experience_id: v.string(),
    file_url: v.string(),
    title: v.string(),
    size: v.number(),
    content_type: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("kindtao_work_experience_attachments", {
      ...args,
      created_at: Date.now(),
    });
  },
});
