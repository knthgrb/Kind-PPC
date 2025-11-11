"use client";

import Image from "next/image";
import { Application } from "@/types/application";

interface ApplicationCardMobileProps {
  application: Application;
  isProcessing?: boolean;
  onApprove?: (application: Application) => void;
  onReject?: (application: Application) => void;
}

export default function ApplicationCardMobile({
  application,
  isProcessing = false,
  onApprove,
  onReject,
}: ApplicationCardMobileProps) {
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {application.applicant_name}
            </h2>
            <p className="text-gray-600">{application.applicant_phone}</p>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-500">
              Applied {new Date(application.applied_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Candidate Profile */}
      <div className="p-6">
        <div className="flex items-start space-x-4">
          <div className="shrink-0">
            <Image
              src="/people/user-profile.png"
              alt={application.applicant_name || "Candidate"}
              width={80}
              height={80}
              className="object-cover rounded-xl"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Candidate Profile
            </h3>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Name:</strong> {application.applicant_name}
              </p>
              <p>
                <strong>Phone:</strong> {application.applicant_phone}
              </p>
              <p>
                <strong>Applied:</strong>{" "}
                {new Date(application.applied_at).toLocaleDateString()}
              </p>
              {application.cover_message && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Cover Message:
                  </h4>
                  <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                    {application.cover_message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Only show if not processing */}
      {!isProcessing && (
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-center space-x-8">
            {/* Reject Button */}
            <button
              onClick={() => onReject?.(application)}
              className="flex items-center justify-center w-16 h-16 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              title="Reject this candidate"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Approve Button */}
            <button
              onClick={() => onApprove?.(application)}
              className="flex items-center justify-center w-16 h-16 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
              title="Approve this candidate"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
          </div>

          {/* Swipe Instructions */}
          <div className="mt-6 flex items-center justify-center space-x-8">
            <div className="flex items-center space-x-2 text-gray-500">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="text-sm">Swipe left to reject</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-500">
              <span className="text-sm">Swipe right to approve</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mb-3"></div>
            <p className="text-lg font-semibold text-gray-800">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
}
