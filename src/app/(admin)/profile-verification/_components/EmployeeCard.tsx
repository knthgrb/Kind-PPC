"use client";

import Image from "next/image";
import { formatMMDDYYYY } from "@/utils/dateFormatter";
import SupabaseImage from "@/components/common/SupabaseImage";
import { UserWithDocuments } from "@/services/server/ProfileVerificationService";
import { useState } from "react";

type ApprovalCardProps = {
  user: UserWithDocuments;
  onApprove?: (documentId: string) => void;
  onReject?: (documentId: string) => void;
  onViewDetails: (user: UserWithDocuments) => void;
};

export default function EmployeeCard({
  user,
  onApprove,
  onReject,
  onViewDetails,
}: ApprovalCardProps) {
  const fullName = `${user.first_name} ${user.last_name}`;
  const pendingDocuments =
    user.user_documents?.filter(
      (doc) => doc.verification_status === "pending"
    ) || [];
  const allDocuments = user.user_documents || [];
  const profileImageUrl = user.profile_image_url || "/profile.jpg";

  const handleViewDetails = () => {
    onViewDetails(user);
  };

  return (
    <div className="border border-[#E0E6F7] rounded-lg p-4 bg-white w-full hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-12 aspect-square relative">
          <SupabaseImage
            filePath={profileImageUrl}
            alt={`${fullName} avatar`}
            width={48}
            height={48}
            className="object-cover rounded-xl"
            fallbackSrc="/profile/profile_placeholder.png"
            clickable={true}
            onError={(e) => {
              console.error(
                "Profile image failed to load:",
                e.currentTarget.src
              );
            }}
            onLoad={() => {
              console.log("Profile image loaded successfully");
            }}
          />
        </div>
        <div className="flex-1">
          <h3 className="text-[0.95rem] text-[#05264E] font-semibold leading-5">
            {fullName}
          </h3>
          <p className="text-[0.66rem] text-[#A0ABB8]">{user.email}</p>
          <p className="text-[0.66rem] text-[#A0ABB8]">
            {user.phone || "No phone"}
          </p>
        </div>
      </div>

      <div className="text-sm space-y-1 mb-4">
        <p>
          <span className="!font-bold text-[0.66rem] text-[#05264E]">
            Role:
          </span>{" "}
          <span className="text-[0.66rem] text-[#05264E] capitalize">
            {user.role}
          </span>
        </p>

        <p>
          <span className="!font-bold text-[0.66rem] text-[#05264E]">
            Joined:
          </span>{" "}
          <span className="text-[0.66rem] text-[#05264E]">
            {formatMMDDYYYY(user.created_at)}
          </span>
        </p>

        <p>
          <span className="!font-bold text-[0.66rem] text-[#05264E]">
            Documents:
          </span>{" "}
          <span className="text-[0.66rem] text-[#05264E]">
            {allDocuments.length} total, {pendingDocuments.length} pending
          </span>
        </p>
      </div>

      <button
        onClick={handleViewDetails}
        className="w-full bg-red-600 text-white text-[0.718rem] rounded-xl py-2 hover:bg-red-700 cursor-pointer transition-colors"
      >
        View Details
      </button>
    </div>
  );
}
