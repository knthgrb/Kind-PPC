"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/utils/convex/client";
import { getUserInfo } from "@/actions/info/get-user-info";
import { useToastActions } from "@/stores/useToastStore";
import { logger } from "@/utils/logger";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendar,
  FaMapMarkerAlt,
  FaBuilding,
  FaStar,
  FaEdit,
} from "react-icons/fa";
import { format } from "date-fns";
import InfoSkeleton from "./_components/InfoSkeleton";
import { useOptionalCurrentUser } from "@/hooks/useOptionalCurrentUser";
import dynamic from "next/dynamic";
const EditKindBossingProfileModal = dynamic(
  () => import("@/components/modals/EditKindBossingProfileModal"),
  {
    ssr: false,
  }
);
export default function InfoPage() {
  const { showError, showSuccess } = useToastActions();
  const [userData, setUserData] = useState<any>(null);
  const [kindbossingData, setKindbossingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Get current user
  const { currentUser } = useOptionalCurrentUser();

  // Fetch user info when user is available
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!currentUser) return;

      setLoading(true);
      try {
        const result = await getUserInfo();
        if (result.success && result.user) {
          setUserData(result.user);
          setKindbossingData(result.kindbossing);
        } else {
          logger.error("Failed to fetch user info:", result.error);
          showError("Failed to load account information");
        }
      } catch (error) {
        logger.error("Failed to fetch user info:", error);
        showError("Failed to load account information");
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [currentUser, showError]);

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "Not provided";
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  const formatTimestamp = (timestamp: number | undefined | null) => {
    if (!timestamp) return "Not available";
    try {
      return format(new Date(timestamp), "MMMM d, yyyy");
    } catch {
      return "Not available";
    }
  };

  const getFullName = () => {
    if (userData?.first_name && userData?.last_name) {
      return `${userData.first_name} ${userData.last_name}`;
    }
    if (userData?.first_name) return userData.first_name;
    if (userData?.last_name) return userData.last_name;
    return "Not provided";
  };

  const getFullAddress = () => {
    const parts = [];
    if (userData?.barangay) parts.push(userData.barangay);
    if (userData?.municipality) parts.push(userData.municipality);
    if (userData?.province) parts.push(userData.province);
    if (userData?.zip_code) parts.push(userData.zip_code.toString());
    return parts.length > 0 ? parts.join(", ") : "Not provided";
  };

  const handleProfileUpdated = async () => {
    // Refresh user info
    const result = await getUserInfo();
    if (result.success && result.user) {
      setUserData(result.user);
      setKindbossingData(result.kindbossing);
      showSuccess("Profile updated successfully");
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="h-9 bg-gray-200 rounded animate-pulse w-32 mb-2" />
              <div className="h-5 bg-gray-200 rounded animate-pulse w-64" />
            </div>
            <div className="h-10 bg-gray-200 rounded-xl animate-pulse w-32" />
          </header>
          <InfoSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              My Info
            </h1>
            <p className="text-gray-600">
              View and manage your account information.
            </p>
          </div>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <FaEdit className="w-4 h-4" />
            Edit Profile
          </button>
        </header>

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">
                Personal Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <FaUser className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Full Name</p>
                    <p className="text-sm font-medium text-gray-900">
                      {getFullName()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FaEnvelope className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="text-sm font-medium text-gray-900">
                      {userData?.email || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FaPhone className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                    <p className="text-sm font-medium text-gray-900">
                      {userData?.phone || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FaCalendar className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date of Birth</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(userData?.date_of_birth)}
                    </p>
                  </div>
                </div>

                {userData?.gender && (
                  <div className="flex items-start gap-3">
                    <FaUser className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Gender</p>
                      <p className="text-sm font-medium text-gray-900">
                        {userData.gender}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Business Information */}
          {kindbossingData && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  Business Information
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {kindbossingData?.business_name && (
                    <div className="flex items-start gap-3">
                      <FaBuilding className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Business Name
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {kindbossingData.business_name}
                        </p>
                      </div>
                    </div>
                  )}

                  {kindbossingData?.rating !== undefined && (
                    <div className="flex items-start gap-3">
                      <FaStar className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Rating</p>
                        <p className="text-sm font-medium text-gray-900">
                          {kindbossingData.rating?.toFixed(1) || "N/A"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Location Information */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">
                Location Information
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Address</p>
                  <p className="text-sm font-medium text-gray-900">
                    {getFullAddress()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">
                Account Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Account Status</p>
                  <p className="text-sm font-medium text-gray-900">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        userData?.status === "active"
                          ? "bg-green-100 text-green-800"
                          : userData?.status === "suspended"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {userData?.status || "Unknown"}
                    </span>
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Member Since</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatTimestamp(userData?.created_at)}
                  </p>
                </div>

                {userData?.swipe_credits !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Swipe Credits</p>
                    <p className="text-sm font-medium text-gray-900">
                      {userData.swipe_credits || 0}
                    </p>
                  </div>
                )}

                {userData?.boost_credits !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Boost Credits</p>
                    <p className="text-sm font-medium text-gray-900">
                      {userData.boost_credits || 0}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditKindBossingProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onProfileUpdated={handleProfileUpdated}
        userData={userData}
        kindbossingData={kindbossingData}
      />
    </div>
  );
}
