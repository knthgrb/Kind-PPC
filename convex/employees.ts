import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get employees by kindbossing user
export const getEmployeesByKindBossing = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const employees = await ctx.db
      .query("employees")
      .withIndex("by_kindbossing_user_id")
      .filter((q) => q.eq(q.field("kindbossing_user_id"), args.userId))
      .collect();

    // Get job and kindtao details
    const employeesWithDetails = await Promise.all(
      employees.map(async (emp) => {
        // job_post_id is stored as Convex document ID
        const job = emp.job_post_id
          ? await ctx.db.get(emp.job_post_id as any).catch(() => null)
          : null;
        const kindtao = await ctx.db
          .query("users")
          .withIndex("by_email")
          .filter((q) => q.eq(q.field("id"), emp.kindtao_user_id))
          .first();
        const kindtaoProfile = await ctx.db
          .query("kindtaos")
          .withIndex("by_user_id")
          .filter((q) => q.eq(q.field("user_id"), emp.kindtao_user_id))
          .first();
        return {
          ...emp,
          job,
          kindtao: { ...kindtao, profile: kindtaoProfile },
        };
      })
    );

    return employeesWithDetails;
  },
});

// Get employee by composite key
export const getEmployeeByCompositeKey = query({
  args: {
    kindbossingUserId: v.string(),
    kindtaoUserId: v.string(),
    jobPostId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("employees")
      .withIndex("by_kindbossing_user_id")
      .filter((q) =>
        q.and(
          q.eq(q.field("kindbossing_user_id"), args.kindbossingUserId),
          q.eq(q.field("kindtao_user_id"), args.kindtaoUserId),
          q.eq(q.field("job_post_id"), args.jobPostId)
        )
      )
      .first();
  },
});

// Get employee by id
export const getEmployeeById = query({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.employeeId);
  },
});

// Create employee
export const createEmployee = mutation({
  args: {
    kindbossing_user_id: v.string(),
    kindtao_user_id: v.string(),
    job_post_id: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    const employeeId = await ctx.db.insert("employees", {
      ...args,
      created_at: Date.now(),
    });
    return employeeId;
  },
});

// Update employee status
export const updateEmployeeStatus = mutation({
  args: {
    employeeId: v.id("employees"),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.employeeId, {
      status: args.status,
      updated_at: Date.now(),
    });
  },
});

// Remove employee
export const removeEmployee = mutation({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.employeeId);
  },
});
