"use client";

import { User } from "@/types/user";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { logger } from "@/utils/logger";
import { authClient, useSession } from "@/lib/auth-client";
import { useEffect } from "react";
import { useConvex } from "convex/react";
import { api } from "@/utils/convex/client";

interface State {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  initialized: boolean;

  initializeAuth: () => void;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create(
  persist<State>(
    (set, get) => ({
      user: null,
      loading: true,
      isAuthenticated: false,
      initialized: false,

      initializeAuth: async () => {
        const state = get();
        if (state.initialized) return;

        set({ loading: true });

        try {
          // Get session from Better Auth
          const session = await authClient.getSession();

          if (session?.data?.session?.userId) {
            // Session exists - useAuthSync will fetch full user data from Convex
            // Just mark as authenticated for now
            set({
              isAuthenticated: true,
              loading: false,
              initialized: true,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              loading: false,
              initialized: true,
            });
          }
        } catch (error) {
          logger.error("Error initializing auth:", error);
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            initialized: true,
          });
        }
      },

      setUser: (user: User | null) => set({ user, isAuthenticated: !!user }),
      setIsAuthenticated: (isAuthenticated: boolean) =>
        set({ isAuthenticated }),
      setLoading: (loading: boolean) => set({ loading }),

      signOut: async () => {
        try {
          await authClient.signOut();
          set({
            user: null,
            isAuthenticated: false,
          });
        } catch (error) {
          logger.error("Error signing out:", error);
        }
      },
    }),

    {
      name: "auth-storage",
      // @ts-ignore - Zustand persist partialize should accept Partial<State> but types are strict
      partialize: (state: State) => {
        return {
          user: state.user
            ? {
                id: state.user.id,
                email: state.user.email,
                name: state.user.name,
                role: state.user.role,
                first_name: state.user.first_name,
                last_name: state.user.last_name,
                phone: state.user.phone,
                profile_image_url: state.user.profile_image_url,
                emailVerified: state.user.emailVerified,
                image: state.user.image,
                createdAt: state.user.createdAt,
                updatedAt: state.user.updatedAt,
                swipe_credits: state.user.swipe_credits,
                boost_credits: state.user.boost_credits,
                has_completed_onboarding: state.user.has_completed_onboarding,
              }
            : null,
          isAuthenticated: state.isAuthenticated,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.loading = false;
        }
      },
    }
  )
);

// Hook to sync Better Auth session with Zustand store
// Note: Full user data from Convex should be fetched by components that need it
// using useQuery from Convex React, which handles authentication and errors gracefully
export function useAuthSync() {
  const { data: session, isPending } = useSession();
  const { setUser, setIsAuthenticated, setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(isPending);

    // Don't sync if session is still loading
    if (isPending) {
      return;
    }

    if (session?.user) {
      // Helper to convert date to timestamp
      const getTimestamp = (date: any): number => {
        if (!date) return Date.now();
        if (typeof date === "number") return date;
        if (date instanceof Date) return date.getTime();
        if (typeof date === "string") {
          const parsed = new Date(date).getTime();
          return isNaN(parsed) ? Date.now() : parsed;
        }
        return Date.now();
      };

      // Set user from Better Auth session
      const user: User = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        emailVerified: session.user.emailVerified,
        image: session.user.image,
        createdAt: getTimestamp(session.user.createdAt),
        updatedAt: getTimestamp(session.user.updatedAt),
      };
      setUser(user);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [session, isPending, setUser, setIsAuthenticated, setLoading]);
}
