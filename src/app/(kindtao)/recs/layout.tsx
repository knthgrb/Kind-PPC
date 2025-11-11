import "@/styles/globals.css";
import KindTaoHeader from "../_components/KindTaoHeader";
import KindTaoBottomTabs from "../_components/KindTaoBottomTabs";
import FindWorkChatSidebarServer from "./_components/FindWorkChatSidebarServer";

export default function FindWorkLayout({
  children,
  conversation,
}: {
  children: React.ReactNode;
  conversation: React.ReactNode;
}) {
  return (
    <div className="relative h-screen bg-gray-50">
      <KindTaoHeader />

      {/* Main content */}
      <div className="h-[calc(100vh-8vh)] relative">
        {/* Mobile: show ONLY swipe UI (no sidebar, no conversation panel) */}
        <div className="md:hidden h-full">{children}</div>

        {/* Desktop: left sidebar + content; no slide animation */}
        <div className="hidden md:flex h-full">
          <FindWorkChatSidebarServer />
          <div className="flex-1 min-w-0 relative h-full">
            <div className={`${conversation ? "hidden" : "block"} h-full`}>
              {children}
            </div>
            <div className={`${conversation ? "block" : "hidden"} h-full`}>
              {conversation}
            </div>
          </div>
        </div>
      </div>

      <KindTaoBottomTabs />
    </div>
  );
}
