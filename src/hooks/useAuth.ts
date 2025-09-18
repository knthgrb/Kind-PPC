"use client";

import { useState, useEffect } from "react";
import { UserService } from "@/services/client/UserService";
import { User } from "@/types/user";

export interface UseAuthReturn {
  user: User | null;
  userMetadata: any | null;
  loading: boolean;
  error: Error | null;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [userMetadata, setUserMetadata] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: userData, error: userError } =
          await UserService.getCurrentUser();

        if (userError) {
          setError(userError);
          return;
        }

        if (userData) {
          setUser(userData);
          setUserMetadata(userData.user_metadata);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return {
    user,
    userMetadata,
    loading,
    error,
  };
}
