import { User } from "@/types/user";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { logger } from "@/utils/logger";
import { createClient } from "@/utils/supabase/client";

interface State {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;

  onAuthStateChange: () => void;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (loading: boolean) => void;

  signOut: () => void;
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      loading: true, // Start with loading true
      isAuthenticated: false,

      onAuthStateChange: () => {
        const supabase = createClient();

        // Set up the auth state listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            // User is signed in
            set({
              user: session.user as User,
              isAuthenticated: true,
              loading: false,
            });
          } else {
            // User is signed out
            set({
              user: null,
              isAuthenticated: false,
              loading: false,
            });
          }
        });

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            set({
              user: session.user as User,
              isAuthenticated: true,
              loading: false,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              loading: false,
            });
          }
        });

        // Return cleanup function
        return () => {
          subscription.unsubscribe();
        };
      },

      setUser: (user: User | null) => set({ user }),
      setIsAuthenticated: (isAuthenticated: boolean) =>
        set({ isAuthenticated }),
      setLoading: (loading: boolean) => set({ loading }),

      signOut: async () => {
        const supabase = createClient();
        const { error } = await supabase.auth.signOut();
        if (error) {
          logger.error("Error signing out:", error);
          return;
        }
      },
    }),

    {
      name: "auth-storage",
      partialize: (state: State) => ({
        user: state.user
          ? {
              id: state.user.id,
              role: state.user.role,
              aud: state.user.aud,
              created_at: state.user.created_at,
              updated_at: state.user.updated_at,
              is_anonymous: state.user.is_anonymous,

              // ! Only include non-sensitive metadata
              user_metadata: state.user.user_metadata
                ? {
                    role: state.user.user_metadata.role,
                    subscription_tier:
                      state.user.user_metadata.subscription_tier,
                    verification_status:
                      state.user.user_metadata.verification_status,
                    boost_credits: state.user.user_metadata.boost_credits,
                    swipe_credits: state.user.user_metadata.swipe_credits,
                    version: state.user.user_metadata.version,
                  }
                : undefined,
              app_metadata: state.user.app_metadata
                ? {
                    provider: state.user.app_metadata.provider,
                    providers: state.user.app_metadata.providers,
                  }
                : undefined,
            }
          : null,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
