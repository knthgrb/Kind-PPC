import React from "react";
import ProfileVerificationClient from "./_components/ProfileVerificationClient";
import { ProfileVerificationService } from "@/services/ProfileVerificationService";
import { approveDocument, rejectDocument } from "./_actions/verificationActions";
import { testUserQuery } from "./test-query";

export default async function ProfileVerification() {
  // Run test query first
  console.log("=== RUNNING TEST QUERY ===");
  await testUserQuery();
  
  const { data: users, error } = await ProfileVerificationService.getAllUsersWithDocuments();

  // Debug logging
  console.log("Profile Verification Debug:");
  console.log("Users found:", users?.length || 0);
  console.log("Error:", error);
  if (users && users.length > 0) {
    console.log("First user:", {
      id: users[0].id,
      email: users[0].email,
      role: users[0].role,
      documentsCount: users[0].user_documents?.length || 0
    });
  }

  if (error) {
    console.error("Error fetching users:", error);
    return (
      <div className="px-6 pt-10 pb-16">
        <div className="mx-auto max-w-7xl border border-[#D9E0E8] rounded-lg px-8 py-6 bg-white">
          <div className="text-center text-red-600">
            Error loading user data. Please try again later.
            <br />
            <small>Error: {error.message}</small>
          </div>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="px-6 pt-10 pb-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Profile Verification</h1>
            <p className="text-gray-600">Review and verify user documents</p>
          </div>
          <div className="border border-[#D9E0E8] rounded-lg px-8 py-6 bg-white">
            <div className="text-center text-gray-600">
              No users with uploaded documents found. Users need to upload documents to appear here.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProfileVerificationClient
      users={users}
      onApprove={approveDocument}
      onReject={rejectDocument}
    />
  );
}
