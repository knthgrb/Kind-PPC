"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import KindTaoHeader from "@/app/(kindtao)/_components/KindTaoHeader";
import KindTaoBottomTabs from "@/app/(kindtao)/_components/KindTaoBottomTabs";

export default function KindTaoLayout({
  children,
  conversation,
}: {
  children: React.ReactNode;
  conversation: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Hide header and bottom tabs on mobile for conversation pages
  // Check for conversation in URL path or query parameter
  const isMessagesPath = pathname?.startsWith("/kindtao/messages");
  const isRecsPath = pathname?.startsWith("/kindtao/recs");
  const isMatchesPath = pathname?.startsWith("/kindtao/matches");
  const hasConversationQuery = searchParams?.get("conversation");
  const isConversationPage =
    Boolean(isMessagesPath && pathname !== "/kindtao/messages") ||
    Boolean((isRecsPath || isMatchesPath) && hasConversationQuery);

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header always visible - do not hide on mobile when conversation is open */}
      <KindTaoHeader />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden pb-16 lg:pb-0">
        <div className="flex-1 flex flex-col bg-gray-50 relative overflow-hidden overflow-x-hidden min-h-0">
          {children}
          {conversation}
        </div>
      </main>
      {/* Bottom tabs always visible - do not hide on mobile when conversation is open */}
      <KindTaoBottomTabs />
    </div>
  );
}
