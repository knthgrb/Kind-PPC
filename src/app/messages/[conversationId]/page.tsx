"use client";

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/utils/convex/client";
import KindTaoConversationWindow from "@/app/(kindtao)/_components/KindTaoConversationWindow";
import KindBossingConversationWindow from "@/app/(kindbossing)/_components/KindBossingConversationWindow";

const getUserId = (user: unknown): string | null => {
  if (!user) return null;
  return (
    (user as { userId?: string | null })?.userId ??
    (user as { id?: string | null })?.id ??
    (user as { _id?: string | null })?._id ??
    null
  );
};

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const router = useRouter();
  const { conversationId } = use(params);

  // Determine user role to use correct ConversationWindow
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(
    api.auth.getCurrentUser,
    isAuthenticated ? undefined : "skip"
  );
  const userId = getUserId(currentUser);
  const userRecord = useQuery(
    api.users.getUserById,
    userId ? { userId } : "skip"
  );
  const currentUserRole = useMemo(() => {
    return (userRecord as any)?.role || (currentUser as any)?.role || "kindtao";
  }, [userRecord, currentUser]);

  const handleClose = () => {
    router.push("/messages");
  };

  return (
    <div className="fixed inset-0 z-50 bg-white lg:bg-black/50">
      <div className="h-full w-full lg:flex lg:items-center lg:justify-center">
        <div className="h-full w-full lg:h-[90vh] lg:w-[90vw] lg:max-w-4xl lg:rounded-lg lg:overflow-hidden bg-white lg:shadow-2xl relative">
          {currentUserRole === "kindtao" ? (
            <KindTaoConversationWindow
              conversationId={conversationId}
              onClose={handleClose}
            />
          ) : (
            <KindBossingConversationWindow
            conversationId={conversationId}
            onClose={handleClose}
          />
          )}
        </div>
      </div>
    </div>
  );
}
