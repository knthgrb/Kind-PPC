"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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

interface RecsConversationOverlayProps {
  conversationId: string;
  closeRedirect?: string;
  onClose?: () => void;
  fullScreen?: boolean;
}

/**
 * Tinder-like conversation overlay with smooth slide animations
 * Uses Framer Motion for buttery-smooth transitions
 */
export default function RecsConversationOverlay({
  conversationId,
  closeRedirect = "/kindtao/recs",
  fullScreen = true,
  onClose,
}: RecsConversationOverlayProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

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

  // Determine which component to use based on role or closeRedirect
  const isKindTao = useMemo(() => {
    if (closeRedirect?.includes("/kindtao/")) return true;
    if (closeRedirect?.includes("/kindbossing/")) return false;
    return currentUserRole === "kindtao";
  }, [closeRedirect, currentUserRole]);

  // Trigger entrance animation when conversationId changes
  useEffect(() => {
    setIsClosing(false);
    setIsVisible(false);
    // Use double requestAnimationFrame to ensure layout is stable before animating
    // This prevents layout shifts that cause shaking
    let raf1: number;
    let raf2: number;
    
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    });
    
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [conversationId]);

  const closeConversation = () => {
    // Start closing animation
    setIsVisible(false);

    // Wait for animation to complete before removing from DOM and updating URL
    // This ensures the overlay stays visible during the entire exit animation
    setTimeout(() => {
      setIsClosing(true);
      // onClose will be called after component is removed from DOM
    setTimeout(() => {
      if (onClose) {
        onClose();
      } else {
        router.replace(closeRedirect, { scroll: false });
      }
      }, 50);
    }, 350); // Match animation duration (300ms) + small buffer
  };

  // Animation variants for smooth Tinder-like slide
  // Using easeOut for smooth, non-bouncy animation
  const overlayVariants = {
    hidden: {
      x: "100%",
      transition: {
        type: "tween",
        ease: [0.4, 0, 0.2, 1], // easeOut cubic bezier
        duration: 0.3,
      },
    },
    visible: {
      x: 0,
      transition: {
        type: "tween",
        ease: [0.4, 0, 0.2, 1], // easeOut cubic bezier
        duration: 0.3,
      },
    },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <div
      className={
        fullScreen
          ? "pointer-events-none fixed inset-0 z-[130] flex justify-end overflow-x-hidden"
          : "pointer-events-none fixed inset-0 lg:absolute z-[150] flex justify-end lg:justify-start overflow-hidden lg:left-80 lg:top-0 lg:bottom-0 lg:right-0 lg:w-[calc(100%-20rem)]"
      }
      style={{
        contain: "layout style paint", // Prevent layout shifts from affecting parent
      }}
    >
      <AnimatePresence mode="wait">
        {!isClosing && (
          <>
            {/* Backdrop - Mobile only */}
            {/* Keep backdrop visible during closing animation to cover sidebar */}
            <motion.div
              key="backdrop"
              className="absolute inset-0 bg-black/40 lg:hidden"
              variants={backdropVariants}
              initial="hidden"
              animate={isVisible ? "visible" : "hidden"}
              exit="hidden"
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={closeConversation}
            />

            {/* Conversation Window */}
            <motion.div
              key="conversation"
              className={`pointer-events-auto relative flex h-full w-full bg-white shadow-2xl overflow-hidden ${
                fullScreen
                  ? "ml-auto lg:shadow-none lg:border-l lg:border-gray-200 lg:w-[calc(100%-20rem)]"
                  : "lg:border-l lg:border-gray-200 lg:min-w-0"
              }`}
              variants={overlayVariants}
              initial="hidden"
              animate={isVisible ? "visible" : "hidden"}
              exit="hidden"
              style={{
                willChange: "transform",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              {isKindTao ? (
                <KindTaoConversationWindow
                  conversationId={conversationId}
                  onClose={closeConversation}
                />
              ) : (
                <KindBossingConversationWindow
                  conversationId={conversationId}
                  onClose={closeConversation}
                />
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
