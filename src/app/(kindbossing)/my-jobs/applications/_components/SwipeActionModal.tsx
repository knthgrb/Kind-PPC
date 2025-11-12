"use client";

import { useState } from "react";
import { Application } from "@/types/application";
import { UserProfile } from "@/types/userProfile";
import { JobPost } from "@/types/jobPosts";
import { FaTimes, FaEnvelope, FaClock } from "react-icons/fa";

interface SwipeActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  kindtaoProfile: UserProfile;
  jobDetails: JobPost | null;
  onMessage: () => void;
  onSaveForLater: () => void;
  applicantName?: string;
}

export default function SwipeActionModal({
  isOpen,
  onClose,
  application,
  kindtaoProfile,
  jobDetails,
  onMessage,
  onSaveForLater,
  applicantName,
}: SwipeActionModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (action: () => void) => {
    if (!action || typeof action !== "function") {
      console.error("Invalid action function");
      return;
    }
    setIsProcessing(true);
    try {
      await action();
      onClose();
    } catch (error) {
      console.error("Error processing action:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !application || !kindtaoProfile) return null;

  const inferredName = [kindtaoProfile.first_name, kindtaoProfile.last_name]
    .filter(Boolean)
    .join(" ");
  const displayName =
    applicantName?.trim() ||
    inferredName ||
    application.applicant_name ||
    "Applicant";

  const profileImage =
    kindtaoProfile?.profile_image_url || "/people/user-profile.png";

  const getInitials = (first?: string | null, last?: string | null) => {
    const f = (first || "").trim().charAt(0).toUpperCase();
    const l = (last || "").trim().charAt(0).toUpperCase();
    const both = `${f}${l}`;
    return both || "U";
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Great Match!</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <p className="text-gray-600 mt-1">
            You've matched with an applicant! What would you like to do?
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Candidate Preview (polished) */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-4">
              {/* Avatar with initials fallback */}
              {kindtaoProfile?.profile_image_url ? (
                <img
                  src={profileImage}
                  alt={displayName}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-red-600 to-red-800 text-white flex items-center justify-center font-semibold">
                  {getInitials(
                    kindtaoProfile?.first_name,
                    kindtaoProfile?.last_name
                  )}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {displayName}
                  </h3>
                  {kindtaoProfile?.kindtao_profile?.is_verified && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {jobDetails?.job_title || "Candidate"}
                </p>
              </div>
            </div>

            {/* Quick facts row */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="text-xs text-gray-600">
                <span className="block text-gray-500">Applied</span>
                <span className="font-medium">
                  {new Date(application.applied_at).toLocaleDateString()}
                </span>
              </div>
              <div className="text-xs text-gray-600">
                <span className="block text-gray-500">Expected salary</span>
                <span className="font-medium">
                  {kindtaoProfile?.kindtao_profile?.expected_salary_range ||
                    "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleAction(onMessage)}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-3 p-3.5 bg-[#CC0000] text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              <FaEnvelope className="w-5 h-5" />
              <span className="font-semibold">Start messaging</span>
            </button>

            <button
              onClick={() => handleAction(onSaveForLater)}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-3 p-3.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 border border-gray-200 shadow-sm"
            >
              <FaClock className="w-5 h-5" />
              <span className="font-semibold">Save for later</span>
            </button>
          </div>

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#CC0000]"></div>
                <span className="text-gray-600">Processing...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
