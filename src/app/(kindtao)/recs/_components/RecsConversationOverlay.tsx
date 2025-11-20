"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ConversationWindow from "./ConversationWindow";

interface RecsConversationOverlayProps {
  conversationId: string;
  closeRedirect?: string;
  onClose?: () => void;
}

export default function RecsConversationOverlay({
  conversationId,
  closeRedirect = "/kindbossing/matches",
  onClose,
}: RecsConversationOverlayProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const closeConversation = () => {
    setIsVisible(false);
    // Update URL immediately to close the conversation
    // The parallel route will unmount when URL changes
    setTimeout(() => {
      if (onClose) {
        onClose();
      } else {
        router.replace(closeRedirect, { scroll: false });
      }
    }, 200);
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-130 flex justify-end lg:relative lg:flex-1 lg:justify-end">
      <div
        className="absolute inset-0 bg-black/40 transition-opacity duration-200 ease-out lg:hidden"
        style={{ opacity: isVisible ? 1 : 0 }}
        onClick={closeConversation}
      />
      <div
        className={`pointer-events-auto relative ml-auto flex h-full w-full max-w-full bg-white shadow-2xl transition-transform duration-300 ease-out lg:shadow-none lg:border-l lg:border-gray-200 lg:w-[calc(100%-20rem)] ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <ConversationWindow
          conversationId={conversationId}
          onClose={closeConversation}
        />
      </div>
    </div>
  );
}
