"use client";

import { useEffect } from "react";
import { NotificationService } from "@/services/NotificationService";
import { useAuthStore } from "@/stores/useAuthStore";
import { logger } from "@/utils/logger";

export default function NotificationInitializer() {
  const { user, isAuthenticated } = useAuthStore();

  // Push notifications are now handled by NotificationService
  // No separate initialization needed

  // Initialize notification service when user is authenticated
  useEffect(() => {
    const initializeNotifications = async () => {
      if (isAuthenticated && user?.id) {
        try {
          await NotificationService.initialize(user.id);
        } catch (error) {
          logger.error("Failed to initialize notification service:", error);
        }
      }
    };

    initializeNotifications();

    // Cleanup on unmount or user change
    return () => {
      NotificationService.cleanup();
    };
  }, [isAuthenticated, user?.id]);

  return null;
}
