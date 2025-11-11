"use client";

import "@/styles/globals.css";
import { useAuthStore } from "@/stores/useAuthStore";
import AdminHeader from "@/app/(admin)/_components/AdminHeader";
import KindBossingHeader from "@/app/(kindbossing)/_components/KindBossingHeader";
import KindBossingSidebar from "@/app/(kindbossing)/_components/KindBossingSidebar";
import KindBossingBottomTabs from "@/app/(kindbossing)/_components/KindBossingBottomTabs";
import KindTaoHeader from "@/app/(kindtao)/_components/KindTaoHeader";
import KindTaoSidebar from "@/app/(kindtao)/_components/KindTaoSidebar";
import KindTaoBottomTabs from "@/app/(kindtao)/_components/KindTaoBottomTabs";
import ChatSkeleton from "@/components/common/ChatSkeleton";

export default function ChatsLayout({
  children,
  conversation,
}: {
  children: React.ReactNode;
  conversation?: React.ReactNode;
}) {
  const { user, loading } = useAuthStore();
  const userMetadata = user?.user_metadata;
  const role = (userMetadata as any)?.role as string | undefined;

  const showOverlay = Boolean(conversation);

  // Show skeleton while fetching user data
  if (loading) {
    const showSwipe = role === "kindtao"; // Kindbossing should not show swipe skeleton
    return (
      <ChatSkeleton
        hasSelectedConversation={showOverlay}
        showSwipeSkeletonWhenEmpty={showSwipe}
      />
    );
  }

  return (
    <div className="relative flex h-screen bg-gray-50">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      {role === "kindbossing" && <KindBossingSidebar />}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        {role === "admin" && <AdminHeader />}
        {role === "kindtao" && <KindTaoHeader />}
        {role === "kindbossing" && <KindBossingHeader />}

        {/* Main content */}
        <main className="flex-1 overflow-hidden pb-16 lg:pb-0">{children}</main>
      </div>

      {/* Bottom tabs for mobile */}
      {role === "kindtao" && <KindTaoBottomTabs />}
      {role === "kindbossing" && <KindBossingBottomTabs />}

      {showOverlay && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute right-0 top-0 h-full w-full md:w-[880px] bg-white shadow-xl">
            {conversation}
          </div>
        </div>
      )}
    </div>
  );
}
