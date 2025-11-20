import { User } from "@/types/user";
import { logger } from "@/utils/logger";
import type { ConvexHttpClient } from "convex/browser";
import type { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";

// Type for convex client (can be either HttpClient or ReactClient)
type ConvexClient = ConvexHttpClient | ConvexReactClient;

// Auth helpers - will be provided by caller
interface AuthHelper {
  getCurrentUser: () => Promise<{ id: string } | null>;
}

export const UserService = {
  /**
   * Get current user
   * @param convex - Convex client instance (from client or server)
   * @param authHelper - Auth helper with getCurrentUser method
   */
  async getCurrentUser(
    convex: ConvexClient,
    authHelper: AuthHelper
  ): Promise<{ data: User | null; error: Error | null }> {
    try {
      const authUser = await authHelper.getCurrentUser();
      if (!authUser) {
        return { data: null, error: null };
      }

      const user = await convex.query(api.users.getUserById, {
        userId: authUser.id,
      });

      if (!user) {
        return { data: null, error: null };
      }

      // Convert Convex user to User type
      const userData: User = {
        id: user.id,
        email: user.email,
        name:
          user.first_name && user.last_name
            ? `${user.first_name} ${user.last_name}`
            : null,
        emailVerified: true, // Better Auth handles this
        image: user.profile_image_url || null,
        createdAt: user.created_at,
        updatedAt: user.updated_at || user.created_at,
        role: user.role,
        first_name: user.first_name || null,
        last_name: user.last_name || null,
        phone: user.phone || null,
        profile_image_url: user.profile_image_url || null,
        swipe_credits: user.swipe_credits || 0,
        boost_credits: user.boost_credits || 0,
        has_completed_onboarding: user.has_completed_onboarding || false,
      };

      return { data: userData, error: null };
    } catch (error) {
      logger.error("Error getting current user:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get current user role
   */
  async getCurrentUserRole(
    convex: ConvexClient,
    authHelper: AuthHelper
  ): Promise<{
    role: "kindtao" | "kindbossing" | "admin" | null;
  }> {
    try {
      const authUser = await authHelper.getCurrentUser();
      if (!authUser) {
        return { role: null };
      }

      const role = await convex.query(api.users.getUserRole, {
        userId: authUser.id,
      });

      return { role: role as "kindtao" | "kindbossing" | "admin" | null };
    } catch (error) {
      logger.error("Error getting current user role:", error);
      return { role: null };
    }
  },

  /**
   * Update user metadata
   */
  async updateUserMetadata(
    convex: ConvexClient,
    authHelper: AuthHelper,
    data: any
  ) {
    try {
      const authUser = await authHelper.getCurrentUser();
      if (!authUser) {
        return { data: null, error: new Error("Not authenticated") };
      }

      await convex.mutation(api.users.updateUser, {
        userId: authUser.id,
        updates: data,
      });

      // Fetch updated user
      const user = await convex.query(api.users.getUserById, {
        userId: authUser.id,
      });

      return { data: user as any, error: null };
    } catch (error) {
      logger.error("Error updating user metadata:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get user details by ID
   */
  async getUserDetailsById(
    convex: ConvexClient,
    userId: string
  ): Promise<{ data: User | null; error: Error | null }> {
    try {
      const user = await convex.query(api.users.getUserById, {
        userId,
      });

      if (!user) {
        logger.warn("User not found:", userId);
        return { data: null, error: new Error("User not found") };
      }

      const userDetails: User = {
        id: user.id,
        email: user.email,
        name:
          user.first_name && user.last_name
            ? `${user.first_name} ${user.last_name}`
            : null,
        emailVerified: true,
        image: user.profile_image_url || null,
        createdAt: user.created_at,
        updatedAt: user.updated_at || user.created_at,
        role: user.role,
        first_name: user.first_name || null,
        last_name: user.last_name || null,
        phone: user.phone || null,
        profile_image_url: user.profile_image_url || null,
        swipe_credits: user.swipe_credits || 0,
        boost_credits: user.boost_credits || 0,
        has_completed_onboarding: user.has_completed_onboarding || false,
      };

      return { data: userDetails, error: null };
    } catch (error) {
      logger.error("Error fetching user details by ID:", error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get user phone
   */
  async getUserPhone(convex: ConvexClient, userId: string) {
    try {
      return await convex.query(api.users.getUserPhone, {
        userId,
      });
    } catch (error) {
      logger.error("Error getting user phone:", error);
      return null;
    }
  },

  /**
   * Get user location
   */
  async getUserLocation(convex: ConvexClient, userId: string) {
    try {
      return await convex.query(api.users.getUserLocation, {
        userId,
      });
    } catch (error) {
      logger.error("Error getting user location:", error);
      return null;
    }
  },
};
