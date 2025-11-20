import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all skills
export const getAllSkills = query({
  args: {
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.type) {
      return await ctx.db
        .query("skills")
        .withIndex("by_type")
        .filter((q) => q.eq(q.field("type"), args.type))
        .collect();
    }
    return await ctx.db.query("skills").collect();
  },
});

// Create skill
export const createSkill = mutation({
  args: {
    skill_name: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("skills", {
      ...args,
      created_at: Date.now(),
    });
  },
});


