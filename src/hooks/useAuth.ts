"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UserMetadata {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "kindtao" | "kindbossing" | "admin";
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Get initial user - set loading to false immediately after getting user
    const getInitialUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Error getting user:", error);
          setUser(null);
          setUserMetadata(null);
        } else {
          setUser(user);
          setLoading(false);
          setInitialized(true);

          // Get user metadata if user exists
          if (user) {
            console.log("User found, checking for metadata...");

            // First, try to get from user_metadata immediately
            const authMetadata = user.user_metadata;
            if (authMetadata?.first_name || authMetadata?.last_name) {
              const immediateMetadata = {
                id: user.id,
                first_name: authMetadata.first_name || "",
                last_name: authMetadata.last_name || "",
                email: user.email || "",
                role: authMetadata.role || "kindtao",
              };
              console.log(
                "Using user metadata immediately:",
                immediateMetadata
              );
              setUserMetadata(immediateMetadata);
            } else {
              // Fallback to database query
              console.log(
                "Fetching user metadata from database for user ID:",
                user.id
              );

              const { data: metadata, error: metadataError } = await supabase
                .from("users")
                .select("id, first_name, last_name, email, role")
                .eq("id", user.id)
                .single();

              if (metadataError) {
                console.error("Error getting user metadata:", metadataError);
                console.error("Metadata error details:", {
                  message: metadataError.message,
                  details: metadataError.details,
                  hint: metadataError.hint,
                  code: metadataError.code,
                });
              } else {
                console.log("User metadata loaded from database:", metadata);
                setUserMetadata(metadata);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error in getInitialUser:", error);
        setUser(null);
        setUserMetadata(null);
        setLoading(false);
        setInitialized(true);
      }
    };

    getInitialUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      setInitialized(true);

      if (session?.user) {
        // Get user metadata when user logs in
        try {
          console.log("Auth state change - user found:", session.user.id);

          // First, try to get from user_metadata immediately
          const authMetadata = session.user.user_metadata;
          if (authMetadata?.first_name || authMetadata?.last_name) {
            const immediateMetadata = {
              id: session.user.id,
              first_name: authMetadata.first_name || "",
              last_name: authMetadata.last_name || "",
              email: session.user.email || "",
              role: authMetadata.role || "kindtao",
            };
            console.log(
              "Auth change - using user metadata immediately:",
              immediateMetadata
            );
            setUserMetadata(immediateMetadata);
          } else {
            // Fallback to database query
            console.log(
              "Auth state change - fetching metadata from database for user ID:",
              session.user.id
            );
            const { data: metadata, error: metadataError } = await supabase
              .from("users")
              .select("id, first_name, last_name, email, role")
              .eq("id", session.user.id)
              .single();

            if (metadataError) {
              console.error(
                "Error getting user metadata on auth change:",
                metadataError
              );
              setUserMetadata(null);
            } else {
              console.log("User metadata loaded on auth change:", metadata);
              setUserMetadata(metadata);
            }
          }
        } catch (error) {
          console.error("Error getting user metadata on auth change:", error);
          setUserMetadata(null);
        }
      } else {
        setUserMetadata(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  return {
    user,
    userMetadata,
    loading: loading && !initialized,
    signOut,
    isAuthenticated: !!user,
    // Debug info
    debug: {
      user,
      userMetadata,
      loading,
      initialized,
    },
  };
}
