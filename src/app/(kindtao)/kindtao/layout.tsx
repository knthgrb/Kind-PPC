"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import KindTaoHeader from "@/app/(kindtao)/_components/KindTaoHeader";
import KindTaoBottomTabs from "@/app/(kindtao)/_components/KindTaoBottomTabs";

export default function KindTaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSettingsPage = pathname?.startsWith("/kindtao/settings");

  if (isSettingsPage) {
    return (
      <>
        <KindTaoHeader />
        {children}
        <KindTaoBottomTabs />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header always visible - do not hide on mobile when conversation is open */}
      <KindTaoHeader />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden pb-16 lg:pb-0">
        {children}
      </main>
      {/* Bottom tabs always visible - do not hide on mobile when conversation is open */}
      <KindTaoBottomTabs />
    </div>
  );
}
