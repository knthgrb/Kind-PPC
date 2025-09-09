"use client";

import React, { useState } from "react";
import EmployeeCard from "./EmployeeCard";
import UserDetailsPopup from "./UserDetailsPopup";
import { UserWithDocuments } from "@/services/ProfileVerificationService";

interface ProfileVerificationClientProps {
  users: UserWithDocuments[];
  onApprove: (documentId: string) => void;
  onReject: (documentId: string) => void;
}

export default function ProfileVerificationClient({ 
  users, 
  onApprove, 
  onReject 
}: ProfileVerificationClientProps) {
  const [selectedUser, setSelectedUser] = useState<UserWithDocuments | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleViewDetails = (user: UserWithDocuments) => {
    setSelectedUser(user);
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setSelectedUser(null);
  };

  return (
    <>
      <div className="px-6 pt-10 pb-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Profile Verification</h1>
            <p className="text-gray-600">Review and verify user documents</p>
          </div>
          
          <div className="border border-[#D9E0E8] rounded-lg px-8 py-6 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {users.map((user) => (
                <EmployeeCard
                  key={user.id}
                  user={user}
                  onApprove={onApprove}
                  onReject={onReject}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <UserDetailsPopup
        user={selectedUser}
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        onApprove={onApprove}
        onReject={onReject}
      />
    </>
  );
}
