"use client";

import KindTaoOnboardingHeader from "./_components/KindTaoOnboardingHeader";
import { useAuthSync } from "@/stores/useAuthStore";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Sync auth state with Better Auth session
  useAuthSync();

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <KindTaoOnboardingHeader />
      <div className="flex-1 overflow-auto">
        <div className="min-h-full flex items-center justify-center px-4 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
