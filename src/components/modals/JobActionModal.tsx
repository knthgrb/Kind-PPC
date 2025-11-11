"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaExclamationTriangle } from "react-icons/fa";
import PrimaryButton from "../buttons/PrimaryButton";
import SecondaryButton from "../buttons/SecondaryButton";

type JobActionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: "pause" | "activate" | "close" | "reopen" | "delete";
  jobTitle: string;
  isLoading?: boolean;
};

const actionConfig = {
  pause: {
    title: "Pause Job Posting",
    description:
      "This will temporarily stop accepting new applications for this job. Existing applications will remain visible.",
    confirmText: "Pause Job",
    icon: "⏸️",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  activate: {
    title: "Activate Job Posting",
    description: "This will resume accepting new applications for this job.",
    confirmText: "Activate Job",
    icon: "▶️",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  close: {
    title: "Close Job Posting",
    description:
      "This will permanently stop accepting new applications. The job will be marked as closed and won't appear in job searches.",
    confirmText: "Close Job",
    icon: "🔒",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  reopen: {
    title: "Reopen Job Posting",
    description:
      "This will reopen the job and start accepting new applications again.",
    confirmText: "Reopen Job",
    icon: "🔓",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  delete: {
    title: "Delete Job Posting",
    description:
      "This action cannot be undone. All applications and data related to this job will be permanently removed.",
    confirmText: "Delete Job",
    icon: "🗑️",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
};

export default function JobActionModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  jobTitle,
  isLoading = false,
}: JobActionModalProps) {
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const config = actionConfig[action];

  const handleConfirm = () => {
    if (action === "delete") {
      if (!password.trim()) {
        setPasswordError("Password is required to delete a job");
        return;
      }
      // In a real implementation, you'd verify the password here
      // For now, we'll just check if it's not empty
      if (password !== "DELETE") {
        setPasswordError("Incorrect password");
        return;
      }
    }
    onConfirm();
  };

  const handleClose = () => {
    setPassword("");
    setPasswordError("");
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{config.icon}</span>
              <h2 className="text-xl font-bold text-gray-900">
                {config.title}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Job Title */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Job Title:</p>
              <p className="font-medium text-gray-900">{jobTitle}</p>
            </div>

            {/* Description */}
            <div
              className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor} mb-6`}
            >
              <p className={`text-sm ${config.color}`}>{config.description}</p>
            </div>

            {/* Password field for delete action */}
            {action === "delete" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your password to confirm deletion
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                  placeholder="Enter password"
                  className={`w-full h-12 rounded-xl border px-4 outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    passwordError ? "border-red-300" : "border-gray-300"
                  }`}
                />
                {passwordError && (
                  <p className="text-red-600 text-sm mt-1">{passwordError}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Type "DELETE" to confirm deletion
                </p>
              </div>
            )}

            {/* Warning for delete action */}
            {action === "delete" && (
              <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                <FaExclamationTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Warning</p>
                  <p className="text-sm text-red-700 mt-1">
                    This action is irreversible. All job data, applications, and
                    conversations will be permanently deleted.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
            <SecondaryButton onClick={handleClose} disabled={isLoading}>
              Cancel
            </SecondaryButton>
            <PrimaryButton
              onClick={handleConfirm}
              disabled={isLoading}
              className={`${
                action === "delete"
                  ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  : ""
              }`}
            >
              {isLoading ? "Processing..." : config.confirmText}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
