/**
 * Unified AuthService
 * Note: Client-side methods use authClient directly (browser-based)
 * Server-side methods use Convex mutations
 */
import type { ConvexHttpClient } from "convex/browser";
import { authClient } from "@/lib/auth-client";
import { api } from "../../convex/_generated/api";
import { logger } from "@/utils/logger";

const setConvexAuth = (convex: ConvexHttpClient, token?: string | null) => {
  if (token) {
    convex.setAuth(token);
  }
};

export type SignupData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "kindbossing" | "kindtao";
  businessName?: string;
};

export const AuthService = {
  /**
   * Sign out (client-side)
   */
  async signOut() {
    try {
      const result = await authClient.signOut();
      return { error: result.error || null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  /**
   * Sign in with Google (client-side)
   */
  async signInWithGoogle(redirectTo: string) {
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: redirectTo,
      });
      return { error: result.error || null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  /**
   * Sign up (server-side)
   */
  async signup(
    convex: ConvexHttpClient,
    token: string | null,
    data: SignupData
  ) {
    try {
      setConvexAuth(convex, token);
      const result = await convex.action(api.authMutations.signUpEmail as any, {
        email: data.email,
        password: data.password,
        name: `${data.firstName} ${data.lastName}`.trim(),
        role: data.role,
        first_name: data.firstName,
        last_name: data.lastName,
      });

      logger.debug("Auth signup successful", { result });
      return { data: result, error: null };
    } catch (error: any) {
      logger.error("Error signing up:", error);

      if (
        error.message?.includes("already exists") ||
        error.message?.includes("duplicate")
      ) {
        return {
          data: null,
          error: {
            message:
              "An account with this email already exists. Please use a different email or try signing in instead.",
            code: "EMAIL_EXISTS",
          },
        };
      }

      return { data: null, error: error as Error };
    }
  },

  /**
   * Sign in with email and password (server-side)
   */
  async signIn(
    convex: ConvexHttpClient,
    token: string | null,
    email: string,
    password: string
  ) {
    try {
      setConvexAuth(convex, token);
      const result = await convex.mutation(
        api.authMutations.signInEmail as any,
        {
          email,
          password,
        }
      );

      logger.debug("Sign in successful:", result);
      return { data: result, error: null };
    } catch (error: any) {
      logger.error("Sign in error:", error);
      return {
        data: null,
        error: {
          message: error.message || "Sign in failed",
          code: "SIGN_IN_ERROR",
        } as any,
      };
    }
  },

  /**
   * Reset password (server-side)
   */
  async resetPassword(
    convex: ConvexHttpClient,
    token: string | null,
    email: string
  ) {
    try {
      setConvexAuth(convex, token);
      await convex.mutation(api.authMutations.forgetPassword as any, {
        email,
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      });

      logger.debug("Password reset email sent successfully");
      return { data: null, error: null };
    } catch (error) {
      logger.error("Error resetting password:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Trigger email verification (server-side)
   */
  async sendVerificationEmail(
    convex: ConvexHttpClient,
    token: string | null,
    email: string,
    callbackPath?: string
  ) {
    try {
      setConvexAuth(convex, token);
      await convex.action(api.authMutations.sendVerificationEmail as any, {
        email,
        callbackPath,
      });
      return { error: null };
    } catch (error) {
      logger.error("Error sending verification email:", error);
      return { error: error as Error };
    }
  },
};
