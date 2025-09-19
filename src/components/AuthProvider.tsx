"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { onAuthStateChange } = useAuthStore();

  useEffect(() => {
    onAuthStateChange();
  }, [onAuthStateChange]);

  return <>{children}</>;
}
