"use client";

import { FiMessageSquare, FiClock } from "react-icons/fi";
import {
  PendingApplication,
  getApplicantDisplayName,
} from "./applicationTypes";

type ApproveOptionsModalProps = {
  application: PendingApplication | null;
  isOpen: boolean;
  isProcessing: boolean;
  onStartMessaging: () => void;
  onLater: () => void;
  onClose: () => void;
};

export default function ApproveOptionsModal({
  application,
  isOpen,
  isProcessing,
  onStartMessaging,
  onLater,
  onClose,
}: ApproveOptionsModalProps) {
  if (!isOpen || !application) {
    return null;
  }

  const applicantName = getApplicantDisplayName(application);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500">
            Approve Applicant
          </p>
          <h2 className="text-2xl font-semibold text-gray-900">
            Message {applicantName}?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Let {applicantName.split(" ")[0] || "them"} know they&apos;re a
            great fit. Start a chat now or do it later from your matches tab.
          </p>
        </div>

        <div className="space-y-3">
          <button
            disabled={isProcessing}
            onClick={onStartMessaging}
            className="w-full cursor-pointer flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                <FiMessageSquare className="w-5 h-5" />
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">
                  Start messaging now
                </p>
                <p className="text-xs text-gray-500">
                  Opens chat composer so you can send the first message.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-red-600">Go</span>
          </button>

          <button
            disabled={isProcessing}
            onClick={onLater}
            className="w-full cursor-pointer flex items-center justify-between rounded-xl border border-dashed border-gray-300 px-4 py-3 hover:border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                <FiClock className="w-5 h-5" />
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">
                  I&apos;ll message later
                </p>
                <p className="text-xs text-gray-500">
                  Keep them in matches so you can chat when ready.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-gray-500">Later</span>
          </button>
        </div>
      </div>
    </div>
  );
}
