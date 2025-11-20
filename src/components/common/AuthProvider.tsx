"use client";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { initializeAuth } = useAuthStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only initialize once, even in React Strict Mode
    if (!hasInitialized.current) {
      hasInitialized.current = true;
    initializeAuth();
    }
  }, [initializeAuth]);

  return <>{children}</>;
}
