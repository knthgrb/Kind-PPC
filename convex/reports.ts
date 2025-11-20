import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get reports by reporter
export const getReportsByReporter = query({
  args: { reporterId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_reporter_id")
      .filter((q) => q.eq(q.field("reporter_id"), args.reporterId))
      .collect();
  },
});

// Get reports by reported user
export const getReportsByReportedUser = query({
  args: { reportedUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_reported_user_id")
      .filter((q) => q.eq(q.field("reported_user_id"), args.reportedUserId))
      .collect();
  },
});

// Get all reports (for admin)
export const getAllReports = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("investigating"),
        v.literal("resolved"),
        v.literal("dismissed")
      )
    ),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("reports")
        .withIndex("by_status")
        .filter((q) => q.eq(q.field("status"), args.status))
        .collect();
    }

    return await ctx.db.query("reports").collect();
  },
});

// Create report
export const createReport = mutation({
  args: {
    reporter_id: v.string(),
    reported_user_id: v.string(),
    report_type: v.string(),
    description: v.optional(v.string()),
    evidence_urls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Get next code number
    const allReports = await ctx.db.query("reports").collect();
    const codeNumber = allReports.length + 1;
    const code = `RP${String(codeNumber).padStart(3, "0")}`;

    return await ctx.db.insert("reports", {
      ...args,
      status: "pending",
      code_number: codeNumber,
      code,
      created_at: Date.now(),
    });
  },
});

// Update report status
export const updateReportStatus = mutation({
  args: {
    reportId: v.id("reports"),
    status: v.union(
      v.literal("pending"),
      v.literal("investigating"),
      v.literal("resolved"),
      v.literal("dismissed")
    ),
    handled_by: v.optional(v.string()),
    resolution_notes: v.optional(v.string()),
    dismissed_reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
    };

    if (args.handled_by) {
      updates.handled_by = args.handled_by;
      updates.handled_at = Date.now();
    }

    if (args.resolution_notes) {
      updates.resolution_notes = args.resolution_notes;
    }

    if (args.dismissed_reason) {
      updates.dismissed_reason = args.dismissed_reason;
    }

    if (args.status === "resolved" || args.status === "dismissed") {
      updates.closed_at = Date.now();
    }

    await ctx.db.patch(args.reportId, updates);
  },
});
