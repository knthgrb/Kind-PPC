"use client";

import React, { useState, useEffect } from "react";
import ToggleButton from "./_components/toggleButton";
import { NotificationService } from "@/services/notifications/NotificationService";
import { useToastStore } from "@/stores/useToastStore";

export default function Notifications() {
  const [pushToggled, setPushToggled] = useState(false);
  const [emailToggled, setEmailToggled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError, showWarning, showInfo } = useToastStore();

  // Check browser notification permission on mount
  useEffect(() => {
    const updateToggleState = () => {
      const isEnabled = NotificationService.isEnabled();
      setPushToggled(isEnabled);
    };

    updateToggleState();

    // Listen for permission changes
    const handlePermissionChange = () => {
      updateToggleState();
    };

    // Check if browser supports notifications
    if (typeof window !== "undefined" && "Notification" in window) {
      // Listen for permission changes (some browsers support this)
      window.addEventListener("focus", handlePermissionChange);

      return () => {
        window.removeEventListener("focus", handlePermissionChange);
      };
    }
  }, []);

  const handlePushToggle = async (newValue: boolean) => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      if (newValue) {
        // User wants to enable notifications
        const permission = await NotificationService.requestPermission();

        if (permission === "granted") {
          setPushToggled(true);
          showSuccess(
            "Notifications Enabled",
            "You'll now receive notifications for new messages and updates.",
            { duration: 5000 }
          );
        } else if (permission === "denied") {
          setPushToggled(false);
          showWarning(
            "Notifications Blocked",
            "Notifications are blocked by your browser. Please enable them in your browser settings to receive notifications.",
            {
              persistent: true,
              duration: 10000,
              action: {
                label: "Learn More",
                onClick: () => {
                  window.open(
                    "https://support.google.com/chrome/answer/3220216",
                    "_blank"
                  );
                },
              },
            }
          );
        } else {
          // Permission was dismissed
          setPushToggled(false);
          showInfo(
            "Permission Required",
            "Please allow notifications when prompted to enable push notifications.",
            { duration: 5000 }
          );
        }
      } else {
        // User wants to disable notifications
        setPushToggled(false);
        showInfo(
          "Notifications Disabled",
          "You won't receive push notifications anymore. You can re-enable them anytime.",
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
      setPushToggled(NotificationService.isEnabled());
      showError(
        "Error",
        "Failed to update notification settings. Please try again.",
        { duration: 5000 }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 pt-6 sm:pt-10 pb-12 sm:pb-16">
      <div className="mx-auto max-w-7xl border border-[#D9E0E8] rounded-2xl sm:rounded-3xl p-4 sm:p-8 bg-white">
        <h3 className="mb-4 text-xl sm:text-[1.578rem] font-medium text-black">
          Notifications
        </h3>
        <div className="max-w-5xl grid grid-cols-1 sm:gap-20 sm:grid-cols-2">
          <div className="flex justify-between items-center py-4 sm:py-10">
            <div className="flex flex-col">
              <p className="text-sm sm:text-[0.934rem] text-[#12223B] font-medium">
                Push Notifications
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {pushToggled
                  ? "You'll receive notifications for new messages and updates"
                  : "Enable to receive notifications for new messages and updates"}
              </p>
            </div>
            <ToggleButton
              toggled={pushToggled}
              onToggle={handlePushToggle}
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-between items-center py-4 sm:py-10">
            <div className="flex flex-col">
              <p className="text-sm sm:text-[0.934rem] text-[#12223B] font-medium">
                Email Notifications
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {emailToggled
                  ? "You'll receive email notifications for important updates"
                  : "Enable to receive email notifications for important updates"}
              </p>
            </div>
            <ToggleButton toggled={emailToggled} onToggle={setEmailToggled} />
          </div>
        </div>

        {/* Test notification button */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-[#12223B]">
                Test Notifications
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Send a test notification to verify your settings
              </p>
            </div>
            <button
              onClick={() => NotificationService.testNotification()}
              disabled={!pushToggled || isLoading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pushToggled && !isLoading
                  ? "bg-[#cc0000] text-white hover:bg-red-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isLoading ? "Loading..." : "Test"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
