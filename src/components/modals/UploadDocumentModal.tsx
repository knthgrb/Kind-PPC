"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import ContinueModal from "@/components/modals/ContinueModal";
import Dropdown from "@/components/dropdown/Dropdown";
import { FaTimes, FaCloudUploadAlt } from "react-icons/fa";
import PrimaryButton from "../buttons/PrimaryButton";
import SecondaryButton from "../buttons/SecondaryButton";
import { uploadDocument } from "@/actions/documents/upload-document";

// We pass FormData directly to the server action

type UploadDocumentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onDocumentUploaded?: () => void;
};

export default function UploadDocumentModal({
  isOpen,
  onClose,
  onDocumentUploaded,
}: UploadDocumentModalProps) {
  const [form, setForm] = useState({
    name: "",
    type: "",
    description: "",
    file: null as File | null,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProps, setModalProps] = useState<{
    title: string;
    description: string;
    buttonLabel: string;
    icon?: string | null;
    onAction: () => void;
  } | null>(null);

  const typeOptions = ["Contracts", "PDF", "Word", "PowerPoint"];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, file });
    }
  };

  const handleUpload = async () => {
    if (!form.name.trim() || !form.type.trim() || !form.file) {
      setModalProps({
        title: "Missing Required Fields",
        description:
          "Please provide document name, type, and select a file to upload.",
        buttonLabel: "OK",
        icon: null,
        onAction: () => setModalOpen(false),
      });
      setModalOpen(true);
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", form.name);
      formData.append("type", form.type);
      if (form.description) {
        formData.append("description", form.description);
      }
      formData.append("file", form.file);

      const result = await uploadDocument(formData);

      if (!result.success) {
        setModalProps({
          title: "Upload Error",
          description:
            result.error ||
            "Something went wrong while uploading the document.",
          buttonLabel: "OK",
          icon: null,
          onAction: () => setModalOpen(false),
        });
        setModalOpen(true);
        return;
      }

      setModalProps({
        title: "Document Uploaded",
        description: `${form.name} has been uploaded successfully`,
        buttonLabel: "Continue",
        icon: "/icons/checkCircleOTP.png",
        onAction: () => {
          setModalOpen(false);
          onClose();
          onDocumentUploaded?.();
        },
      });
      setModalOpen(true);
    } catch (err) {
      console.error("Failed to upload document:", err);
      setModalProps({
        title: "Upload Error",
        description: "Something went wrong while uploading the document.",
        buttonLabel: "OK",
        icon: null,
        onAction: () => setModalOpen(false),
      });
      setModalOpen(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setForm({
      name: "",
      type: "",
      description: "",
      file: null,
    });
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#DFDFDF] shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
            <h2 className="text-2xl font-bold text-gray-900">
              Upload Document
            </h2>
            <button
              onClick={handleClose}
              className="p-2 cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="p-6 pr-4 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400">
            <form className="space-y-6">
              {/* Document Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Name
                </label>
                <input
                  type="text"
                  placeholder="Enter document name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-12 border border-[#DFDFDF] rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                />
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <Dropdown
                  className="border border-[#DFDFDF] rounded-xl"
                  value={form.type}
                  options={typeOptions}
                  placeholder="Select Document Type"
                  onChange={(val) => setForm({ ...form, type: val })}
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#CC0000] transition-colors">
                    <FaCloudUploadAlt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-2">
                      {form.file
                        ? form.file.name
                        : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Word, PPT & PDF only (Max 10MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Enter document description..."
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full min-h-[100px] border border-[#DFDFDF] rounded-xl px-4 py-3 text-sm outline-none resize-y focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                />
              </div>
            </form>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-8">
              <SecondaryButton onClick={handleClose} disabled={isUploading}>
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleUpload} disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload Document"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Modal */}
      {modalProps && (
        <ContinueModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onAction={modalProps.onAction}
          title={modalProps.title}
          description={modalProps.description}
          buttonLabel={modalProps.buttonLabel}
          icon={modalProps.icon}
        />
      )}
    </>,
    document.body
  );
}
