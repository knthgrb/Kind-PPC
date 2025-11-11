import "@/styles/globals.css";
import KindTaoHeader from "@/app/(kindtao)/_components/KindTaoHeader";
import KindTaoBottomTabs from "@/app/(kindtao)/_components/KindTaoBottomTabs";
import FindWorkChatSidebarServer from "@/app/(kindtao)/recs/_components/FindWorkChatSidebarServer";
import FindWorkChatWindow from "@/app/(kindtao)/recs/_components/FindWorkChatWindow";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return (
    <div className="relative h-screen bg-gray-50">
      <KindTaoHeader />

      {/* Main content */}
      <div className="h-[calc(100vh-8vh)] relative">
        {/* Mobile: show conversation full screen */}
        <div className="md:hidden h-full">
          <FindWorkChatWindow conversationId={conversationId} />
        </div>

        {/* Desktop: left sidebar + conversation */}
        <div className="hidden md:flex h-full">
          <FindWorkChatSidebarServer initialActiveTab="messages" />
          <div className="flex-1 min-w-0 relative h-full">
            <div className="hidden h-full" />
            <div className="block h-full">
              <FindWorkChatWindow conversationId={conversationId} />
            </div>
          </div>
        </div>
      </div>

      <KindTaoBottomTabs />
    </div>
  );
}
