"use client";

import React, { useState, useEffect } from "react";
import { useToastStore } from "@/stores/useToastStore";
import { KindTaoVerificationRequest } from "@/types/workExperience";
import { VerificationRequestService } from "@/services/client/VerificationRequestService";
import UploadDocumentModal from "./UploadDocumentModal";
import {
  IoDocumentOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoShieldCheckmarkOutline,
  IoAddOutline,
} from "react-icons/io5";

interface VerificationTabProps {
  userRole: string;
}

export default function VerificationTab({ userRole }: VerificationTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRequestingVerification, setIsRequestingVerification] =
    useState(false);
  const [kindtaoVerificationRequest, setKindtaoVerificationRequest] =
    useState<KindTaoVerificationRequest | null>(null);
  const [currentVerificationStatus, setCurrentVerificationStatus] = useState<
    string | null
  >(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const { showSuccess, showError } = useToastStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Loading verification data in parallel...");

      const [verificationResult, documentsResult] = await Promise.all([
        VerificationRequestService.getVerificationRequest(),
        VerificationRequestService.hasRequiredDocuments(),
      ]);

      // Handle verification request
      const { data: verificationData, error: verificationError } =
        verificationResult;
      console.log("📊 KindTao verification request result:", {
        data: verificationData,
        error: verificationError,
        hasData: !!verificationData,
        dataStatus: verificationData?.status,
        documentsCount: verificationData?.documents?.length || 0,
      });

      // Handle the case where no verification request exists (normal for new users)
      if (!verificationData && !verificationError) {
        console.log(
          "📝 No verification request found - this is normal for new users"
        );
        setKindtaoVerificationRequest(null);
        setCurrentVerificationStatus(null);
      } else if (verificationError) {
        console.error(
          "❌ Error loading KindTao verification request:",
          verificationError
        );
        setKindtaoVerificationRequest(null);
        setCurrentVerificationStatus(null);
      } else {
        // Set the verification request (or null if none exists)
        console.log("✅ Setting verification request:", verificationData);
        if (verificationData?.documents) {
          console.log(
            "📄 Documents found:",
            verificationData.documents.map((doc: any) => ({
              id: doc.id,
              title: doc.title,
              document_type: doc.document_type,
              created_at: doc.created_at,
            }))
          );
        }
        setKindtaoVerificationRequest(verificationData);
        setCurrentVerificationStatus(verificationData?.status || null);
      }

      // Handle uploaded documents
      console.log("📄 Uploaded documents result:", documentsResult);
      setUploadedDocuments(documentsResult.documents || []);
    } catch (error) {
      console.error("💥 Exception loading verification data:", error);
      setKindtaoVerificationRequest(null);
      setCurrentVerificationStatus(null);
      setUploadedDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions to check document types from uploaded documents
  const hasValidId = () => {
    return (
      uploadedDocuments?.some((doc) => doc.document_type === "id_card") || false
    );
  };

  const hasBarangayClearance = () => {
    return (
      uploadedDocuments?.some(
        (doc) => doc.document_type === "barangay_clearance"
      ) || false
    );
  };

  const hasRequiredDocuments = () => {
    // For kindbossing, only valid ID is required
    // For kindtao, both valid ID and barangay clearance are required
    if (userRole === "kindbossing") {
      return hasValidId();
    }
    return hasValidId() && hasBarangayClearance();
  };

  const getDocumentTypeLabel = (documentType: string | null) => {
    if (!documentType) return "Unknown Document";

    switch (documentType) {
      case "id_card":
        return "Valid ID";
      case "barangay_clearance":
        return "Barangay Clearance";
      case "clinic_certificate":
        return "Medical Certificate";
      case "nbi_clearance":
        return "NBI Clearance";
      case "police_clearance":
        return "Police Clearance";
      default:
        return "Other Document";
    }
  };

  const getDocumentTypeColor = (documentType: string | null) => {
    if (!documentType) return "bg-gray-100 text-gray-800";

    switch (documentType) {
      case "id_card":
        return "bg-blue-100 text-blue-800";
      case "barangay_clearance":
        return "bg-green-100 text-green-800";
      case "clinic_certificate":
        return "bg-purple-100 text-purple-800";
      case "nbi_clearance":
        return "bg-orange-100 text-orange-800";
      case "police_clearance":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleRequestVerification = async () => {
    setIsRequestingVerification(true);
    try {
      console.log("🚀 Starting verification request process...");
      console.log("Current verification request:", kindtaoVerificationRequest);
      console.log("Has required documents:", hasRequiredDocuments);

      // Use the new createOrUpdateVerificationRequest method
      const { data, error } =
        await VerificationRequestService.createOrUpdateVerificationRequest({});

      if (error) throw error;

      showSuccess(
        "Verification Requested",
        "Your verification request has been submitted. Our team will review your documents and get back to you soon."
      );

      loadData();
    } catch (error) {
      console.error("💥 Error creating/updating verification request:", error);
      console.error("Error details:", {
        message: (error as any)?.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
      });
      showError("Error", "Failed to submit verification request");
    } finally {
      setIsRequestingVerification(false);
    }
  };

  const handleDocumentUploaded = () => {
    loadData();
  };

  const getVerificationStatusInfo = (status: string | null) => {
    switch (status) {
      case "approved":
        return {
          label: "Verified",
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <IoCheckmarkCircleOutline className="w-5 h-5 text-green-500" />,
          description: "Your account has been verified",
        };
      case "rejected":
        return {
          label: "Rejected",
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <IoCloseCircleOutline className="w-5 h-5 text-red-500" />,
          description: "Your verification request was rejected",
        };
      case "pending":
        return {
          label: "Pending Review",
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <IoDocumentOutline className="w-5 h-5 text-yellow-500" />,
          description: "Your verification request is under review",
        };
      default:
        return {
          label: "Not Verified",
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <IoDocumentOutline className="w-5 h-5 text-gray-500" />,
          description: "You haven't submitted a verification request yet",
        };
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full overflow-x-hidden">
      <div className="mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          Document Verification
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Upload your documents for verification. This helps build trust with
          employers.
        </p>
      </div>

      {/* Verification Status Display */}
      <div className="mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            {getVerificationStatusInfo(currentVerificationStatus).icon}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900">
                Verification Status
              </h3>
              <p className="text-sm text-gray-600 truncate">
                {
                  getVerificationStatusInfo(currentVerificationStatus)
                    .description
                }
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium border whitespace-nowrap ${
                getVerificationStatusInfo(currentVerificationStatus).color
              }`}
            >
              {getVerificationStatusInfo(currentVerificationStatus).label}
            </span>
            {currentVerificationStatus === "rejected" &&
              kindtaoVerificationRequest && (
                <button
                  onClick={() => {
                    // Scroll to verification request section
                    document
                      .getElementById("verification-request-section")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-sm text-red-600 hover:text-red-700 font-medium whitespace-nowrap"
                >
                  View Details →
                </button>
              )}
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">
            Uploaded Documents
          </h3>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex cursor-pointer items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
          >
            <IoAddOutline className="w-4 h-4" />
            <span>Add Document</span>
          </button>
        </div>

        {/* Documents List Container */}
        <div>
          {uploadedDocuments && uploadedDocuments.length > 0 ? (
            <div className="grid gap-4">
              {uploadedDocuments.map((document) => (
                <div
                  key={document.id}
                  className="border border-gray-200 rounded-lg p-3 sm:p-4 overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row gap-3">
                    <IoDocumentOutline className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 w-full overflow-hidden">
                      <div className="flex flex-col gap-2 mb-2">
                        <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                          {document.title}
                        </h4>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium w-fit ${getDocumentTypeColor(
                            document.document_type
                          )}`}
                        >
                          {getDocumentTypeLabel(document.document_type)}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        {(document.size / 1024 / 1024).toFixed(2)} MB •{" "}
                        {document.content_type}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Uploaded:{" "}
                        {new Date(document.created_at).toLocaleDateString()}
                      </p>
                      <a
                        href={document.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Document →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <IoDocumentOutline className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">No documents uploaded yet</p>
              <p className="text-sm text-gray-500">
                Upload your verification documents to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Verification Request Section - Only show if not pending or approved */}
      {currentVerificationStatus !== "pending" &&
        currentVerificationStatus !== "approved" && (
          <div
            id="verification-request-section"
            className="bg-blue-50 rounded-lg p-6 mb-8"
          >
            <div className="flex items-start gap-3 mb-4">
              <IoShieldCheckmarkOutline className="w-6 h-6 text-blue-600 mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Request Verification
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  To get verified, you need to upload the following required
                  documents:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        hasValidId() ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></div>
                    <span
                      className={`text-sm ${
                        hasValidId() ? "text-green-700" : "text-gray-700"
                      }`}
                    >
                      Valid ID (Government-issued)
                    </span>
                    {hasValidId() && (
                      <IoCheckmarkCircleOutline className="w-4 h-4 text-green-500 shrink-0" />
                    )}
                  </div>
                  {userRole === "kindtao" && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          hasBarangayClearance()
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      ></div>
                      <span
                        className={`text-sm ${
                          hasBarangayClearance()
                            ? "text-green-700"
                            : "text-gray-700"
                        }`}
                      >
                        Barangay Clearance
                      </span>
                      {hasBarangayClearance() && (
                        <IoCheckmarkCircleOutline className="w-4 h-4 text-green-500 shrink-0" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Show rejection reasons if rejected */}
            {currentVerificationStatus === "rejected" &&
              kindtaoVerificationRequest?.notes && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Verification Rejected - Reasons:
                  </h4>
                  <p className="text-sm text-red-700">
                    {kindtaoVerificationRequest.notes}
                  </p>
                </div>
              )}

            <button
              onClick={handleRequestVerification}
              disabled={!hasRequiredDocuments() || isRequestingVerification}
              className={`w-full cursor-pointer px-4 py-2 rounded-lg font-medium transition-colors ${
                hasRequiredDocuments() && !isRequestingVerification
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isRequestingVerification
                ? "Submitting Request..."
                : currentVerificationStatus === "rejected"
                ? "Request New Verification"
                : hasRequiredDocuments()
                ? "Request Verification"
                : "Upload Required Documents First"}
            </button>
          </div>
        )}

      {/* KindTao Verification Request */}
      {kindtaoVerificationRequest && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Your Verification Request
          </h3>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <IoShieldCheckmarkOutline className="w-5 h-5 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-medium text-gray-900">
                    Verification Request
                  </h4>
                  <p className="text-sm text-gray-600">
                    Submitted:{" "}
                    {new Date(
                      kindtaoVerificationRequest.created_at
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  kindtaoVerificationRequest.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : kindtaoVerificationRequest.status === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {kindtaoVerificationRequest.status.toUpperCase()}
              </span>
            </div>
            {kindtaoVerificationRequest.notes && (
              <p className="text-sm text-gray-600 mt-2">
                {kindtaoVerificationRequest.notes}
              </p>
            )}
            {kindtaoVerificationRequest.status === "rejected" && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium mb-2">
                  This verification request was rejected.
                </p>
                {kindtaoVerificationRequest.notes && (
                  <div>
                    <p className="text-sm text-red-600 font-medium mb-1">
                      Rejection reasons:
                    </p>
                    <p className="text-sm text-red-700">
                      {kindtaoVerificationRequest.notes}
                    </p>
                  </div>
                )}
                <p className="text-sm text-red-600 mt-2">
                  Please review the requirements and submit a new request.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDocumentUploaded={handleDocumentUploaded}
      />
    </div>
  );
}
