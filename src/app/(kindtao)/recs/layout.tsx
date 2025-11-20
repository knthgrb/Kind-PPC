"use client";

import React from "react";
import { usePathname } from "next/navigation";
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
  // Hide header and bottom tabs on mobile for conversation pages
  const isMessagesPath = pathname?.startsWith("/kindtao/messages");
  const isConversationPage =
    Boolean(isMessagesPath) && pathname !== "/kindtao/messages";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Hide header on mobile for conversation pages */}
      <div className={isConversationPage ? "hidden lg:block" : ""}>
        <KindTaoHeader />
      </div>
      <main
        className={`flex-1 flex flex-col ${
          isConversationPage ? "lg:pb-0" : "pb-16 lg:pb-0"
        }`}
      >
        <div className="flex-1 flex flex-col bg-gray-50 relative overflow-hidden">
          {children}
          {conversation}
        </div>
      </main>
      {/* Hide bottom tabs on mobile for conversation pages */}
      <div className={isConversationPage ? "hidden lg:block" : ""}>
        <KindTaoBottomTabs />
      </div>
    </div>
  );
}
