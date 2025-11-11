import KindBossingChatSidebarServer from "./_components/KindBossingChatSidebarServer";

export default function KindBossingMessagesPage() {
  return (
    <div className="h-full w-full bg-gray-50">
      {/* Mobile: matches/messages list */}
      <div className="md:hidden h-full">
        <KindBossingChatSidebarServer variant="mobile" />
      </div>

      {/* Desktop: empty state */}
      <div className="hidden md:flex h-full items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-gray-400">💬</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select a conversation
          </h3>
          <p className="text-gray-500">
            Choose a conversation from the sidebar to start chatting
          </p>
        </div>
      </div>
    </div>
  );
}
