"use client";

import { useState, useEffect } from "react";
import { useToastActions } from "@/stores/useToastStore";
import { VerificationRequestService } from "@/services/VerificationRequestService";
import { convex } from "@/utils/convex/client";
import {
  IoDocumentOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoShieldCheckmarkOutline,
  IoAddOutline,
} from "react-icons/io5";
import { KindTaoVerificationRequest } from "@/types/workExperience";
import dynamic from "next/dynamic";
const UploadDocumentModal = dynamic(
  () => import("@/components/modals/UploadDocumentModal"),
  {
    ssr: false,
  }
);
interface VerificationTabProps {
  userRole: string;
}

// Required document types for KindBossing verification
const REQUIRED_DOCUMENTS = [
  { type: "valid_id", label: "Valid ID", required: true },
  { type: "barangay_clearance", label: "Barangay Clearance", required: true },
];

export default function VerificationTab({ userRole }: VerificationTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRequestingVerification, setIsRequestingVerification] =
    useState(false);
  const [verificationRequest, setVerificationRequest] =
    useState<KindTaoVerificationRequest | null>(null);
  const [currentVerificationStatus, setCurrentVerificationStatus] = useState<
    string | null
  >(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const { showSuccess, showError } = useToastActions();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const [verificationResult, documentsResult] = await Promise.all([
        VerificationRequestService.getVerificationRequest(convex),
        VerificationRequestService.hasRequiredDocuments(convex),
      ]);

      const { data: verificationData, error: verificationError } =
        verificationResult;

      if (!verificationData && !verificationError) {
        setVerificationRequest(null);
        setCurrentVerificationStatus(null);
      } else if (verificationError) {
        setVerificationRequest(null);
        setCurrentVerificationStatus(null);
      } else {
        // Convert service type to component type (handle optional -> null)
        const convertedData = verificationData
          ? {
              ...verificationData,
              updated_at: verificationData.updated_at ?? null,
              notes: verificationData.notes ?? null,
            }
          : null;
        setVerificationRequest(convertedData);
        setCurrentVerificationStatus(verificationData?.status || null);
      }

      setUploadedDocuments(documentsResult.documents || []);
    } catch (error) {
      console.error("Error loading verification data:", error);
      setVerificationRequest(null);
      setCurrentVerificationStatus(null);
      setUploadedDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasRequiredDocuments = () => {
    const requiredTypes = REQUIRED_DOCUMENTS.filter((doc) => doc.required).map(
      (doc) => doc.type
    );
    const uploadedTypes = uploadedDocuments
      .map((doc) => doc.document_type)
      .filter(Boolean);

    return requiredTypes.every((type) => uploadedTypes.includes(type));
  };

  const getDocumentStatus = (documentType: string) => {
    const uploaded = uploadedDocuments.find(
      (doc) => doc.document_type === documentType
    );
    return uploaded ? "uploaded" : "missing";
  };

  const handleRequestVerification = async () => {
    if (!hasRequiredDocuments()) {
      showError(
        "Please upload all required documents before requesting verification"
      );
      return;
    }

    setIsRequestingVerification(true);
    try {
      const { data, error } =
        await VerificationRequestService.createOrUpdateVerificationRequest(
          convex,
          {}
        );

      if (error) throw error;

      showSuccess(
        "Your verification request has been submitted. Our team will review your documents and get back to you soon."
      );

      loadData();
    } catch (error) {
      console.error("Error creating/updating verification request:", error);
      showError("Failed to submit verification request");
    } finally {
      setIsRequestingVerification(false);
    }
  };

  const handleDocumentUploaded = () => {
    loadData();
  };

  const getVerificationStatusInfo = (status: string | null) => {
    switch (status) {
      case "pending":
        return {
          icon: IoShieldCheckmarkOutline,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          message: "Your verification request is pending review.",
        };
      case "approved":
        return {
          icon: IoCheckmarkCircleOutline,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          message: "Your account has been verified!",
        };
      case "rejected":
        return {
          icon: IoCloseCircleOutline,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          message:
            verificationRequest?.notes ||
            "Your verification request was rejected. Please review and resubmit.",
        };
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6 animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getVerificationStatusInfo(currentVerificationStatus);
  const canRequestVerification =
    hasRequiredDocuments() &&
    currentVerificationStatus !== "pending" &&
    currentVerificationStatus !== "approved";

  return (
    <div className="p-6">
      <h3 className="mb-4 text-xl sm:text-[1.578rem] font-medium text-black">
        Verification
      </h3>

      <div className="space-y-6">
        {/* Status Banner */}
        {statusInfo && (
          <div
            className={`border rounded-lg p-4 ${statusInfo.bgColor} ${statusInfo.borderColor}`}
          >
            <div className="flex items-start gap-3">
              <statusInfo.icon
                className={`w-6 h-6 ${statusInfo.color} shrink-0 mt-0.5`}
              />
              <div className="flex-1">
                <p className={`text-sm font-medium ${statusInfo.color}`}>
                  {statusInfo.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Documents Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              Required Documents
            </h4>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#CB0000] text-white text-sm font-medium hover:bg-[#a10000] transition-colors"
            >
              <IoAddOutline className="w-4 h-4" />
              Upload Document
            </button>
          </div>

          <div className="space-y-3">
            {REQUIRED_DOCUMENTS.map((doc) => {
              const status = getDocumentStatus(doc.type);
              const isUploaded = status === "uploaded";

              return (
                <div
                  key={doc.type}
                  className={`border rounded-lg p-4 ${
                    isUploaded
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IoDocumentOutline
                        className={`w-5 h-5 ${
                          isUploaded ? "text-green-600" : "text-gray-400"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {doc.label}
                          {doc.required && (
                            <span className="text-red-600 ml-1">*</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {isUploaded ? "Uploaded" : "Not uploaded"}
                        </p>
                      </div>
                    </div>
                    {isUploaded && (
                      <IoCheckmarkCircleOutline className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Request Verification Button */}
        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={handleRequestVerification}
            disabled={!canRequestVerification || isRequestingVerification}
            className={`w-full inline-flex cursor-pointer items-center justify-center gap-2 px-6 py-3 rounded-lg text-white text-sm font-semibold transition-colors ${
              canRequestVerification
                ? "bg-[#CB0000] hover:bg-[#a10000]"
                : "bg-gray-300 cursor-not-allowed"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <IoShieldCheckmarkOutline className="w-5 h-5" />
            {isRequestingVerification
              ? "Submitting Request..."
              : currentVerificationStatus === "approved"
                ? "Account Verified"
                : currentVerificationStatus === "pending"
                  ? "Verification Pending"
                  : "Request Verification"}
          </button>
          {!hasRequiredDocuments() && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Please upload all required documents (*) before requesting
              verification
            </p>
          )}
        </div>
      </div>

      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDocumentUploaded={handleDocumentUploaded}
      />
    </div>
  );
}
