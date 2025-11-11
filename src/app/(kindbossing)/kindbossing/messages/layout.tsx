import "@/styles/globals.css";
import KindBossingChatSidebarServer from "./_components/KindBossingChatSidebarServer";

export default function KindBossingMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full w-full">
      {/* Main content */}
      <div className="h-full relative">
        {/* Mobile: render whichever child route is active */}
        <div className="md:hidden h-full">
          {children}
        </div>

        {/* Desktop: left sidebar + content; no slide animation */}
        <div className="hidden md:flex h-full">
          <KindBossingChatSidebarServer />
          <div className="flex-1 min-w-0 relative h-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
