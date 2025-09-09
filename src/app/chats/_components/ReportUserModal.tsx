"use client";

import { useState } from "react";
import Image from "next/image";
import Dropdown from "@/components/dropdown/Dropdown";

interface ReportUserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reportData: ReportData) => void;
  userName: string;
  isLoading?: boolean;
}

export interface ReportData {
  reportType: string;
  description: string;
  evidenceUrls: string[];
}

const REPORT_TYPES = [
  "Harassment",
  "Spam",
  "Inappropriate Content",
  "Fraud",
  "Threats",
  "Other",
];

export default function ReportUserModal({
  open,
  onClose,
  onSubmit,
  userName,
  isLoading = false,
}: ReportUserModalProps) {
  const [form, setForm] = useState<ReportData>({
    reportType: "",
    description: "",
    evidenceUrls: [],
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (field: keyof ReportData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Upload files to Supabase storage
  const uploadFilesToStorage = async (files: File[]): Promise<string[]> => {
    const { createClient } = await import("@/utils/supabase/client");
    const supabase = createClient();

    // Get current user ID for folder structure
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const uploadPromises = files.map(async (file, index) => {
      // Use original file name with timestamp prefix to avoid conflicts
      const fileExt = file.name.split(".").pop();
      const baseName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      const fileName = `${Date.now()}-${index}-${baseName}.${fileExt}`;
      // Use user ID in the path for RLS compliance
      const filePath = `${user.id}/evidence/${fileName}`;

      const { error } = await supabase.storage
        .from("evidence")
        .upload(filePath, file);

      if (error) {
        throw new Error(`Failed to upload ${file.name}: ${error.message}`);
      }

      // Return the path format for database storage
      return `/${user.id}/evidence/${fileName}`;
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reportType.trim() || !form.description.trim()) {
      return;
    }

    setIsUploading(true);
    try {
      let uploadedUrls: string[] = [];

      // Upload files if any are selected
      if (selectedFiles.length > 0) {
        uploadedUrls = await uploadFilesToStorage(selectedFiles);
      }

      // Update form with uploaded URLs
      const formData = {
        ...form,
        evidenceUrls: uploadedUrls,
      };

      onSubmit(formData);
    } catch (error) {
      console.error("Error uploading files:", error);
      // Still submit the report without evidence
      onSubmit(form);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setForm({
      reportType: "",
      description: "",
      evidenceUrls: [],
    });
    setSelectedFiles([]);
    setIsUploading(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-[#DFDFDF] shadow-sm p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/alert.png"
              alt="Report icon"
              width={32}
              height={32}
              priority
            />
            <h1 className="postJobH1">Report User</h1>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* User being reported */}
          <div className="mb-5">
            <label className="block mb-2 postJobLabel">Reporting</label>
            <div className="jobField text-sm">{userName}</div>
          </div>

          {/* Report Type */}
          <div className="mb-5">
            <label className="block mb-2 postJobLabel">Report Type</label>
            <Dropdown
              value={form.reportType}
              options={REPORT_TYPES}
              onChange={(val) => handleChange("reportType", val)}
              placeholder="Select report type..."
              className="border border-[#DFDFDF] rounded-md"
            />
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="block mb-2 postJobLabel">Description</label>
            <p className="text-xs text-gray-500 my-2">
              Be specific about what happened and when
            </p>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Please provide details about the issue..."
              className="postJobInputPlaceholder w-full min-h-[160px] rounded-md border border-[#DFDFDF] px-4 py-3 outline-none resize-y text-sm"
              required
            />
          </div>

          {/* Evidence */}
          <div className="mb-8">
            <label className="block mb-2 postJobLabel">
              Evidence (Optional)
            </label>
            <p className="text-xs text-gray-500 my-2">
              Upload screenshots or files that support your report
            </p>

            {/* Two column layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Left column - File upload */}
              <div>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setSelectedFiles(files);
                    // Don't set evidenceUrls here - they'll be set after upload
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {selectedFiles.length === 0
                    ? "No file chosen"
                    : `${selectedFiles.length} file(s) selected`}
                </p>
              </div>

              {/* Right column - Selected files list */}
              <div>
                {selectedFiles.length > 0 && (
                  <>
                    <p className="text-xs text-gray-600 mb-1">
                      Selected Files:
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="text-xs text-gray-500 truncate"
                        >
                          {file.name}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 h-12 rounded-md bg-white text-[#CB0000] border border-[#CB0000] hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isLoading ||
                isUploading ||
                !form.reportType.trim() ||
                !form.description.trim()
              }
              className="flex-1 h-12 rounded-md bg-[#CB0000] text-white hover:bg-[#a30000] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isUploading ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
