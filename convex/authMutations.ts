import { action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent, createAuth } from "./auth";
import { logger } from "../src/utils/logger";
import { api } from "./_generated/api";

type BetterAuthResponse<T = unknown> = {
  data: T | null;
  error: { message?: string } | null;
};

function ensureBetterAuthResponse<T>(response: any): BetterAuthResponse<T> {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    "error" in response
  ) {
    return response as BetterAuthResponse<T>;
  }
  return {
    data: response as T,
    error: null,
  };
}

const appBaseUrl =
  process.env.SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

// Sign up with email and password
export const signUpEmail = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    role: v.union(v.literal("kindbossing"), v.literal("kindtao")),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

    // Sign up with Better Auth
    const result = ensureBetterAuthResponse(
      await auth.api.signUpEmail({
        body: {
          email: args.email,
          password: args.password,
          name: args.name,
        },
        headers,
      })
    );

    if (result.error) {
      throw new Error(result.error.message || "Signup failed");
    }

    const betterAuthUser: any =
      (result.data as any)?.user ?? (result.data as any)?.session?.user ?? null;

    const betterAuthUserId: string | null =
      betterAuthUser?.id ??
      betterAuthUser?.userId ??
      (result.data as any)?.userId ??
      (result.data as any)?.session?.userId ??
      null;

    if (!betterAuthUserId) {
      logger.info("Better Auth signup pending user id, storing pending role", {
        email: args.email,
        role: args.role,
      });
      await ctx.runMutation(api.pendingUserRoles.upsertPendingUser, {
        email: args.email,
        role: args.role,
        first_name: args.first_name,
        last_name: args.last_name,
      });
      return result.data;
    }

    const existingUser = await ctx.runQuery(api.users.getUserById, {
      userId: betterAuthUserId,
    });

    const resolvedName = betterAuthUser?.name ?? args.name ?? "";
    const [derivedFirstName, ...derivedLastParts] = resolvedName
      .trim()
      .split(" ");
    const derivedLastName = derivedLastParts.join(" ").trim();

    const firstName = args.first_name ?? derivedFirstName ?? "";
    const lastName = args.last_name ?? derivedLastName ?? "";
    const email = betterAuthUser?.email ?? args.email;

    if (!existingUser) {
      await ctx.runMutation(api.users.createUser, {
        id: betterAuthUserId,
        email,
        role: args.role,
        first_name: firstName,
        last_name: lastName,
        profile_image_url: betterAuthUser?.image ?? null,
        swipe_credits: 10,
        boost_credits: 5,
        has_completed_onboarding: false,
      });

      await ctx.runMutation(api.userSettings.ensureDefaultSettings, {
        user_id: betterAuthUserId,
        defaultSettings: {},
      });

      await ctx.runMutation(api.pendingUserRoles.deleteByEmail, {
        email,
      });
    } else {
      if (existingUser.role !== args.role) {
        await ctx.runMutation(api.users.updateUser, {
          userId: betterAuthUserId,
          updates: {
            role: args.role,
          },
        });
      }
      await ctx.runMutation(api.pendingUserRoles.deleteByEmail, {
        email,
      });
    }

    return result.data;
  },
});

// Send or resend verification email
export const sendVerificationEmail = action({
  args: {
    email: v.string(),
    callbackPath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

    const callbackURL = args.callbackPath
      ? `${appBaseUrl}${args.callbackPath}`
      : `${appBaseUrl}/email-confirmation-callback`;

    const result = ensureBetterAuthResponse(
      await auth.api.sendVerificationEmail({
        body: {
          email: args.email,
          callbackURL,
        },
        headers,
      })
    );

    if (result.error) {
      throw new Error(
        result.error.message || "Failed to send verification email"
      );
    }

    return { success: true };
  },
});

// Sign in with email and password
export const signInEmail = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

    const result = ensureBetterAuthResponse(
      await auth.api.signInEmail({
        body: {
          email: args.email,
          password: args.password,
        },
        headers,
      })
    );

    if (result.error) {
      throw new Error(result.error.message || "Sign in failed");
    }

    return result.data;
  },
});

// Sign out
export const signOut = mutation({
  args: {},
  handler: async (ctx) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

    const result = ensureBetterAuthResponse(
      await auth.api.signOut({
        headers,
      })
    );

    if (result.error) {
      throw new Error(result.error.message || "Sign out failed");
    }

    return result.data;
  },
});

// Reset password
export const forgetPassword = mutation({
  args: {
    email: v.string(),
    redirectTo: v.string(),
  },
  handler: async (ctx, args) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

    const result = ensureBetterAuthResponse(
      await auth.api.forgetPassword({
        body: {
          email: args.email,
          redirectTo: args.redirectTo,
        },
        headers,
      })
    );

    if (result.error) {
      throw new Error(result.error.message || "Password reset failed");
    }

    return result.data;
  },
});
