"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import KindBossingHeader from "./_components/KindBossingHeader";
import KindBossingSidebar from "./_components/KindBossingSidebar";
import KindBossingBottomNav from "./_components/KindBossingBottomNav";
import { useSidebarStore } from "@/stores/useSidebarStore";

export default function KindBossingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isCollapsed, setCollapsed } = useSidebarStore();
  const isMatchesPage = pathname?.startsWith("/kindbossing/matches");
  const isMessagesPage = pathname?.startsWith("/kindbossing/messages");
  const isConversationView =
    typeof pathname === "string" &&
    /^\/kindbossing\/messages\/[^/]+/.test(pathname);
  const autoCollapsePrevState = useRef<boolean | null>(null);
  const hasAutoCollapsedRef = useRef(false);
  const wasOnMatchesMessagesRef = useRef(false);

  const shouldAutoCollapse = isMatchesPage || isMessagesPage;

  useEffect(() => {
    if (shouldAutoCollapse) {
      // First time entering matches/messages - save state and auto-collapse if needed
      if (!wasOnMatchesMessagesRef.current) {
        autoCollapsePrevState.current = isCollapsed;
        wasOnMatchesMessagesRef.current = true;
        if (!isCollapsed) {
          setCollapsed(true);
        }
        // Mark as handled regardless of whether we collapsed or not
        hasAutoCollapsedRef.current = true;
      }
      // After initial handling, allow user to manually toggle
    } else {
      // Leaving matches/messages - restore previous state
      if (wasOnMatchesMessagesRef.current) {
        wasOnMatchesMessagesRef.current = false;
        if (autoCollapsePrevState.current !== null) {
          const previous = autoCollapsePrevState.current;
          autoCollapsePrevState.current = null;
          hasAutoCollapsedRef.current = false;
          // Use the current collapsed state to restore
          const currentCollapsed = isCollapsed;
          if (currentCollapsed !== previous) {
            setCollapsed(previous);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, shouldAutoCollapse, setCollapsed]);

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className={isConversationView ? "hidden lg:block" : ""}>
      <KindBossingHeader />
      </div>
      <div className="flex flex-1 min-h-0">
        <div className={isConversationView ? "hidden lg:flex" : ""}>
        <KindBossingSidebar />
        </div>
        <main
          className={
            isConversationView
              ? "flex-1 overflow-hidden"
              : "flex-1 overflow-y-auto pb-16 lg:pb-0"
          }
        >
          {children}
        </main>
      </div>
      {!isConversationView && <KindBossingBottomNav />}
    </div>
  );
}
