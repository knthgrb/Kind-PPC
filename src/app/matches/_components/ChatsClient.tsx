"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserConversations } from "@/hooks/chats/useUserConversations";
import { ChatService } from "@/services/client/ChatService";
import { MatchService } from "@/services/client/MatchService";
import StartConversationModal from "@/components/modals/StartConversationModal";
import { UserService } from "@/services/client/UserService";

export default function ChatsClient() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { conversations, isLoading } = useUserConversations({});
  const [matches, setMatches] = useState<any[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [userRole, setUserRole] = useState<"kindbossing" | "kindtao" | null>(
    null
  );
  const [recipientName, setRecipientName] = useState<string>("");

  // Load user role and matches from database
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;

      try {
        setMatchesLoading(true);

        // Get user role
        const { role } = await UserService.getCurrentUserRole();
        setUserRole(role === "admin" ? null : role);

        // Get user matches
        const allMatches = await MatchService.getUserMatches(user.id);

        // Filter out matches that already have conversations
        const matchesWithoutConversations = allMatches.filter((match) => {
          return !conversations.some(
            (conv) =>
              conv.matches &&
              ((conv.matches.kindbossing_user_id ===
                match.kindbossing_user_id &&
                conv.matches.kindtao_user_id === match.kindtao_user_id) ||
                (conv.matches.kindbossing_user_id === match.kindtao_user_id &&
                  conv.matches.kindbossing_user_id ===
                    match.kindbossing_user_id))
          );
        });

        setMatches(matchesWithoutConversations);
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setMatchesLoading(false);
      }
    };

    loadUserData();
  }, [user?.id, conversations]);

  // Group matches by job title
  const groupedMatches = matches.reduce(
    (acc: Record<string, any[]>, match: any) => {
      const jobTitle = match.job_title || "Unknown Job";
      if (!acc[jobTitle]) {
        acc[jobTitle] = [];
      }
      acc[jobTitle].push(match);
      return acc;
    },
    {}
  );

  // Handle send message click - show modal
  const handleSendMessage = async (match: any) => {
    setSelectedMatch(match);
    setIsModalOpen(true);

    // Fetch recipient name
    const name = await getRecipientName(match);
    setRecipientName(name);
  };

  // Get recipient name based on user role
  const getRecipientName = async (match: any) => {
    if (!userRole) return "Unknown User";

    try {
      // Import the server action
      const { getMultipleUsers } = await import(
        "@/actions/user/get-multiple-users"
      );

      // Determine which user ID to fetch based on current user's role
      const recipientId =
        userRole === "kindtao"
          ? match.kindbossing_user_id
          : match.kindtao_user_id;

      // Fetch user details
      const { data: userResults, error } = await getMultipleUsers([
        recipientId,
      ]);

      if (error || !userResults || userResults.length === 0) {
        return userRole === "kindtao" ? "KindBossing User" : "KindTao User";
      }

      const user = userResults[0].user;
      if (!user) {
        return userRole === "kindtao" ? "KindBossing User" : "KindTao User";
      }

      const firstName = user.user_metadata?.first_name || "";
      const lastName = user.user_metadata?.last_name || "";
      const fullName = `${firstName} ${lastName}`.trim();

      return (
        fullName ||
        (userRole === "kindtao" ? "KindBossing User" : "KindTao User")
      );
    } catch (error) {
      console.error("Error fetching recipient name:", error);
      return userRole === "kindtao" ? "KindBossing User" : "KindTao User";
    }
  };

  // Handle sending first message and creating conversation
  const handleSendFirstMessage = async (message: string) => {
    if (!user?.id || !selectedMatch) return;

    setIsCreatingConversation(true);
    try {
      // Check if conversation already exists for this match
      const existingConversation = conversations.find(
        (conv) =>
          conv.matches &&
          ((conv.matches.kindbossing_user_id ===
            selectedMatch.kindbossing_user_id &&
            conv.matches.kindtao_user_id === selectedMatch.kindtao_user_id) ||
            (conv.matches.kindbossing_user_id ===
              selectedMatch.kindtao_user_id &&
              conv.matches.kindtao_user_id ===
                selectedMatch.kindbossing_user_id))
      );

      if (existingConversation) {
        // Navigate to existing conversation
        router.push(`/messages/${existingConversation.id}`);
        return;
      }

      // Create new conversation using the match ID
      const conversation = await ChatService.createConversation(
        selectedMatch.id
      );

      if (conversation) {
        // Send the first message
        await ChatService.sendMessage(
          conversation.id,
          user.id,
          message,
          "text"
        );

        // Navigate to new conversation
        router.push(`/messages/${conversation.id}`);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      alert("Failed to start conversation. Please try again.");
    } finally {
      setIsCreatingConversation(false);
      setIsModalOpen(false);
      setSelectedMatch(null);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMatch(null);
    setRecipientName("");
  };

  if (matchesLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CC0000] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-gray-600">
          Chat with your matches and manage conversations
        </p>
      </div>

      {/* Matches Section - Hierarchical by Job Title */}
      {matches.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your New Matches
          </h2>
          <div className="space-y-4">
            {Object.entries(groupedMatches).map(([jobTitle, jobMatches]) => (
              <div
                key={jobTitle}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Job Title Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{jobTitle}</h3>
                    <span className="bg-red-600 text-white text-xs rounded-full h-6 min-w-[24px] px-2.5 flex items-center justify-center font-semibold">
                      {(jobMatches as any[]).length}
                    </span>
                  </div>
                </div>

                {/* Matches under this job */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(jobMatches as any[]).map((match: any) => (
                    <div
                      key={match.id}
                      className="bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="p-4">
                        <p className="text-sm text-gray-500 mb-2">
                          Matched{" "}
                          {new Date(match.matched_at).toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => handleSendMessage(match)}
                          className="w-full cursor-pointer bg-[#CC0000] text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          Send Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Conversations */}
      {conversations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Active Conversations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Conversation #{conversation.id.slice(-8)}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {conversation.last_message_at
                      ? `Last message: ${new Date(
                          conversation.last_message_at
                        ).toLocaleDateString()}`
                      : "No messages yet"}
                  </p>
                  <button
                    onClick={() => router.push(`/messages/${conversation.id}`)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Open Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No matches or conversations message */}
      {matches.length === 0 && conversations.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No matches yet
            </h3>
            <p className="text-gray-600 mb-4">
              Get matched with someone by applying to jobs or posting a job.
            </p>
          </div>
        </div>
      )}

      {/* Start Conversation Modal */}
      <StartConversationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSendMessage={handleSendFirstMessage}
        recipientName={recipientName}
        isLoading={isCreatingConversation}
      />
    </div>
  );
}
