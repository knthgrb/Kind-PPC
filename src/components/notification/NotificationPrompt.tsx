"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { HiOutlineBell, HiX } from "react-icons/hi";
import { NotificationService } from "@/services/NotificationService";
import { useAuthStore } from "@/stores/useAuthStore";

interface NotificationPromptProps {
  onPermissionChange?: (granted: boolean) => void;
}

export default function NotificationPrompt({
  onPermissionChange,
}: NotificationPromptProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, loading: authLoading } = useAuthStore();

  // Public routes that don't require authentication
  const PUBLIC_ROUTES = [
    "/",
    "/login",
    "/signup",
    "/error",
    "/about",
    "/pricing",
    "/contact-us",
    "/find-help",
    "/email-confirmation-callback",
    "/oauth/google/callback",
    "/select-role",
    "/oauth/google/auth-code-error",
    "/email-confirmation",
    "/email-not-confirmed",
    "/forbidden",
  ];

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    // Don't show prompt if user is not authenticated or on public routes
    if (!isAuthenticated || isPublicRoute || authLoading) {
      setShowPrompt(false);
      return;
    }

    // Check if notifications are supported
    const supported = typeof window !== "undefined" && "Notification" in window;
    setIsSupported(supported);

    if (supported) {
      const currentPermission = NotificationService.getPermissionStatus();
      setPermission(currentPermission);
      // Show prompt only if permission is default (not asked yet) or denied
      // and user is authenticated and not on public routes
      setShowPrompt(
        (currentPermission === "default" || currentPermission === "denied") &&
          isAuthenticated &&
          !isPublicRoute
      );
    }
  }, [isAuthenticated, isPublicRoute, authLoading]);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const newPermission = await NotificationService.requestPermission();
      setPermission(newPermission);
      setShowPrompt(false);
      onPermissionChange?.(newPermission === "granted");

      // No separate initialization needed - NotificationService handles everything
    } catch (error) {
      console.error("Error enabling notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  const handleTestNotification = async () => {
    if (permission === "granted") {
      await NotificationService.testNotification();
    }
  };

  // Don't show anything if not supported
  if (!isSupported) {
    return null;
  }

  // Don't show if user is not authenticated, on public routes, or auth is loading
  if (!isAuthenticated || isPublicRoute || authLoading) {
    return null;
  }

  // Don't show if already granted or prompt is not set to show
  if (permission === "granted" || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-100 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="shrink-0">
            <div className="w-8 h-8 bg-[#cc0000] rounded-full flex items-center justify-center">
              <HiOutlineBell className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900">
              Enable Notifications
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Get notified when you receive new chat messages and updates
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className="inline-flex cursor-pointer items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-xl text-white bg-[#cc0000] hover:bg-[#aa0000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#cc0000] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Enabling..." : "Enable"}
              </button>
              <button
                onClick={handleDismiss}
                className="inline-flex cursor-pointer items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#cc0000]"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 cursor-pointer text-gray-400 hover:text-gray-600"
          >
            <HiX className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Notification status component for showing current state
export function NotificationStatus() {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = typeof window !== "undefined" && "Notification" in window;
    setIsSupported(supported);

    if (supported) {
      const currentPermission = NotificationService.getPermissionStatus();
      setPermission(currentPermission);
    }
  }, []);

  if (!isSupported) {
    return (
      <div className="text-sm text-gray-500">Notifications not supported</div>
    );
  }

  const handleTest = async () => {
    if (permission === "granted") {
      await NotificationService.testNotification();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`w-2 h-2 rounded-full ${
          permission === "granted"
            ? "bg-green-500"
            : permission === "denied"
            ? "bg-red-500"
            : "bg-yellow-500"
        }`}
      />
      <span className="text-sm text-gray-600">
        {permission === "granted"
          ? "Notifications enabled"
          : permission === "denied"
          ? "Notifications blocked"
          : "Notifications not set"}
      </span>
      {permission === "granted" && (
        <button
          onClick={handleTest}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Test
        </button>
      )}
    </div>
  );
}
