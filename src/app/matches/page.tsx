import ChatUIClient from "./_components/ChatUIClient";
import MobileChats from "./_components/MobileChats";

export default function MatchesPage() {
  return (
    <>
      {/* Desktop/Tablet */}
      <div className="hidden lg:block">
        <ChatUIClient />
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <MobileChats />
      </div>
    </>
  );
}
