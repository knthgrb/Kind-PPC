"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    const cleanup = initializeAuth();

    return cleanup;
  }, []);

  return <>{children}</>;
}
