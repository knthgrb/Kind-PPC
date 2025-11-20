"use client";

import { use } from "react";
import ConversationWindow from "@/app/(kindtao)/recs/_components/ConversationWindow";
import { useRouter } from "next/navigation";

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const router = useRouter();
  const { conversationId } = use(params);

  const handleClose = () => {
    router.push("/messages");
  };

  return (
    <div className="fixed inset-0 z-50 bg-white lg:bg-black/50">
      <div className="h-full w-full lg:flex lg:items-center lg:justify-center">
        <div className="h-full w-full lg:h-[90vh] lg:w-[90vw] lg:max-w-4xl lg:rounded-lg lg:overflow-hidden bg-white lg:shadow-2xl relative">
          <ConversationWindow
            conversationId={conversationId}
            onClose={handleClose}
          />
        </div>
      </div>
    </div>
  );
}
