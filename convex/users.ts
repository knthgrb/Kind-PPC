import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get user by ID (Better Auth user ID)
export const getUserById = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("id"), args.userId))
      .first();
  },
});

// Get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
  },
});

// Create user
export const createUser = mutation({
  args: {
    id: v.string(),
    email: v.string(),
    role: v.union(v.literal("kindbossing"), v.literal("kindtao"), v.literal("admin")),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    phone: v.optional(v.string()),
    date_of_birth: v.optional(v.string()),
    gender: v.optional(v.string()),
    profile_image_url: v.optional(v.union(v.string(), v.null())),
    barangay: v.optional(v.string()),
    municipality: v.optional(v.string()),
    province: v.optional(v.string()),
    zip_code: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended"))),
    swipe_credits: v.optional(v.number()),
    boost_credits: v.optional(v.number()),
    has_completed_onboarding: v.optional(v.boolean()),
    location_coordinates: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first();

    if (existing) {
      throw new Error("User already exists");
    }

    return await ctx.db.insert("users", {
      ...args,
      status: args.status || "active",
      swipe_credits: args.swipe_credits || 0,
      boost_credits: args.boost_credits || 0,
      has_completed_onboarding: args.has_completed_onboarding ?? false,
      created_at: Date.now(),
    });
  },
});

// Update user
export const updateUser = mutation({
  args: {
    userId: v.string(),
    updates: v.object({
      role: v.optional(v.union(v.literal("kindbossing"), v.literal("kindtao"), v.literal("admin"))),
      first_name: v.optional(v.string()),
      last_name: v.optional(v.string()),
      phone: v.optional(v.string()),
      date_of_birth: v.optional(v.string()),
      gender: v.optional(v.string()),
      profile_image_url: v.optional(v.union(v.string(), v.null())),
      barangay: v.optional(v.string()),
      municipality: v.optional(v.string()),
      province: v.optional(v.string()),
      zip_code: v.optional(v.number()),
      status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended"))),
      swipe_credits: v.optional(v.number()),
      boost_credits: v.optional(v.number()),
      location_coordinates: v.optional(v.object({
        lat: v.number(),
        lng: v.number(),
      })),
      last_seen_at: v.optional(v.number()),
      has_completed_onboarding: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("id"), args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      ...args.updates,
      updated_at: Date.now(),
    });
  },
});

// Get user role
export const getUserRole = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("id"), args.userId))
      .first();
    return user?.role || null;
  },
});

// Get user phone
export const getUserPhone = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("id"), args.userId))
      .first();
    return user?.phone || null;
  },
});

// Get user location
export const getUserLocation = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("id"), args.userId))
      .first();
    
    if (!user) return null;
    
    return {
      lat: user.location_coordinates?.lat || 0,
      lng: user.location_coordinates?.lng || 0,
      province: user.province || "",
    };
  },
});

// Delete user
export const deleteUser = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("id"), args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Delete the user record
    await ctx.db.delete(user._id);
  },
});

