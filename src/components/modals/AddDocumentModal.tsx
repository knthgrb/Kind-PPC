"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useToastActions } from "@/stores/useToastStore";
import {
  FaTimes,
  FaUpload,
  FaFile,
  FaImage,
  FaFilePdf,
  FaVideo,
} from "react-icons/fa";
import PrimaryButton from "../buttons/PrimaryButton";
import SecondaryButton from "../buttons/SecondaryButton";
import { logger } from "@/utils/logger";
import { addDocument } from "@/actions/documents/add-document";
import { api } from "@/utils/convex/client";
import { useConvex } from "convex/react";
import { extractStorageIdFromResponse } from "@/utils/convex/storage";

type AddDocumentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onDocumentAdded?: () => void;
};

// File size limits
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for documents
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB for videos
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB for images

// Allowed file types
const ALLOWED_TYPES = {
  documents: [
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.ms-excel", // .xls
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  ],
  images: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  videos: [
    "video/mp4",
    "video/webm",
    "video/quicktime", // .mov
  ],
};

const ALL_ALLOWED_TYPES = [
  ...ALLOWED_TYPES.documents,
  ...ALLOWED_TYPES.images,
  ...ALLOWED_TYPES.videos,
];

function getFileIcon(mimeType: string) {
  if (ALLOWED_TYPES.documents.includes(mimeType)) {
    return <FaFilePdf className="w-5 h-5 text-red-600" />;
  }
  if (ALLOWED_TYPES.images.includes(mimeType)) {
    return <FaImage className="w-5 h-5 text-blue-600" />;
  }
  if (ALLOWED_TYPES.videos.includes(mimeType)) {
    return <FaVideo className="w-5 h-5 text-purple-600" />;
  }
  return <FaFile className="w-5 h-5 text-gray-600" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function validateFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  if (!ALL_ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error:
        "File type not supported. Please upload PDF, DOC/DOCX, images, or videos.",
    };
  }

  // Check file size based on type
  let maxSize = MAX_FILE_SIZE;
  if (ALLOWED_TYPES.videos.includes(file.type)) {
    maxSize = MAX_VIDEO_SIZE;
  } else if (ALLOWED_TYPES.images.includes(file.type)) {
    maxSize = MAX_IMAGE_SIZE;
  }

  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  return { isValid: true };
}

export default function AddDocumentModal({
  isOpen,
  onClose,
  onDocumentAdded,
}: AddDocumentModalProps) {
  const { showSuccess, showError } = useToastActions();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const convex = useConvex();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.isValid) {
      showError(validation.error || "Invalid file");
      return;
    }

    setSelectedFile(file);
    if (!title.trim()) {
      // Auto-fill title with filename (without extension)
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExt);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showError("Please select a file");
      return;
    }

    if (!title.trim()) {
      showError("Please enter a document title");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Generate upload URL from Convex
      const uploadUrl = await convex.mutation(api.storage.generateUploadUrl);

      // Upload file to Convex storage
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!uploadResult.ok) {
        throw new Error(`Upload failed: ${uploadResult.statusText}`);
      }

      // Get storage ID (Convex returns it as text)
      const storageId = await extractStorageIdFromResponse(uploadResult);

      // Get file URL from storage ID
      const fileUrl = await convex.query(api.storage.getFileUrl, {
        storageId: storageId as any,
      });

      if (!fileUrl) {
        throw new Error("Failed to get file URL");
      }

      setUploadProgress(100);

      // Save document metadata
      const result = await addDocument({
        file_url: fileUrl,
        title: title.trim(),
        size: selectedFile.size,
        content_type: selectedFile.type,
      });

      if (result.success) {
        showSuccess("Document uploaded successfully");
        handleClose();
        onDocumentAdded?.();
      } else {
        showError(result.error || "Failed to save document");
      }
    } catch (error) {
      logger.error("Failed to upload document:", error);
      showError(
        error instanceof Error ? error.message : "Failed to upload document"
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setTitle("");
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-100" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#DFDFDF] shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Add Document</h2>
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="p-2 cursor-pointer hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <FaTimes className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* File Upload */}
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-red-500 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALL_ALLOWED_TYPES.join(",")}
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <FaUpload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 mb-1">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-gray-500">
                    PDF, DOC, DOCX, Images (max 10MB), Videos (max 100MB)
                  </span>
                </label>
              </div>

              {selectedFile && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                  {getFileIcon(selectedFile.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="mb-8">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
                disabled={isUploading}
                className="w-full px-4 py-2 border border-[#DFDFDF] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3">
              <SecondaryButton onClick={handleClose} disabled={isUploading}>
                Cancel
              </SecondaryButton>
              <PrimaryButton
                onClick={handleUpload}
                disabled={isUploading || !selectedFile}
              >
                {isUploading ? "Uploading..." : "Upload Document"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
