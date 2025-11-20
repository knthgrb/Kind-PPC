import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get KindBossing documents
export const getKindBossingDocuments = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kindbossing_documents")
      .withIndex("by_kindbossing_user_id")
      .filter((q) => q.eq(q.field("kindbossing_user_id"), args.userId))
      .collect();
  },
});

// Create KindBossing document
export const createKindBossingDocument = mutation({
  args: {
    kindbossing_user_id: v.string(),
    file_url: v.string(),
    title: v.string(),
    size: v.number(),
    content_type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("kindbossing_documents", {
      ...args,
      created_at: Date.now(),
    });
  },
});

// Delete KindBossing document
export const deleteKindBossingDocument = mutation({
  args: { documentId: v.id("kindbossing_documents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.documentId);
  },
});

// Get KindTao portfolio
export const getKindTaoPortfolio = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kindtao_portfolio")
      .withIndex("by_kindtao_user_id")
      .filter((q) => q.eq(q.field("kindtao_user_id"), args.userId))
      .collect();
  },
});

// Create KindTao portfolio item
export const createKindTaoPortfolioItem = mutation({
  args: {
    kindtao_user_id: v.string(),
    file_url: v.string(),
    title: v.string(),
    size: v.number(),
    content_type: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("kindtao_portfolio", {
      ...args,
      created_at: Date.now(),
    });
  },
});

// Get verification documents
export const getVerificationDocuments = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("verification_documents")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .collect();
  },
});

// Create verification document
export const createVerificationDocument = mutation({
  args: {
    user_id: v.string(),
    file_url: v.string(),
    size: v.number(),
    title: v.string(),
    content_type: v.string(),
    document_type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("verification_documents", {
      ...args,
      created_at: Date.now(),
    });
  },
});


