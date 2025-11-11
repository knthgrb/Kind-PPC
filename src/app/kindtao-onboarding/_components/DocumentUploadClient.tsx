"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import StepperFooter from "@/components/common/StepperFooter";
import {
  useKindTaoOnboardingStore,
  KindTaoDocument,
} from "@/stores/useKindTaoOnboardingStore";
import { UserService } from "@/services/client/UserService";
import { logger } from "@/utils/logger";
import { finalizeKindTaoOnboarding } from "@/actions/onboarding/finalize-kindtao-onboarding";

interface DocumentDisplay extends KindTaoDocument {
  uploadProgress: number;
  status: "pending" | "uploading" | "success" | "error";
  errorMessage?: string;
  filePath?: string; // storage path used
}

const DOCUMENT_TYPES = [
  {
    value: "profile_photo",
    label: "Profile Photo",
    description: "Clear photo of your face",
  },
  {
    value: "id_document",
    label: "ID Document",
    description: "Government-issued ID or passport",
  },
  {
    value: "certificate",
    label: "Professional Certificate",
    description: "Training or certification documents",
  },
  {
    value: "background_check",
    label: "Background Check",
    description: "Police clearance or background verification",
  },
  {
    value: "medical_certificate",
    label: "Medical Certificate",
    description: "Health clearance certificate",
  },
];

type DocumentUploadProps = {
  onBack?: () => void;
};

export default function DocumentUploadClient({ onBack }: DocumentUploadProps) {
  const router = useRouter();
  const {
    personalInfo,
    skillsAvailability,
    jobPreferences,
    workHistory,
    documents,
    addDocument,
    updateDocument,
    removeDocument: removeFromStore,
  } = useKindTaoOnboardingStore();
  const [documentDisplays, setDocumentDisplays] = useState<DocumentDisplay[]>(
    []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if all documents have document types selected
  const allDocumentsHaveTypes =
    documentDisplays.length === 0 ||
    documentDisplays.every(
      (doc) => doc.documentType && doc.documentType !== ""
    );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Create unique document entry
      const documentId = crypto.randomUUID();
      const newDocument: KindTaoDocument = {
        id: documentId,
        file: file,
        documentType: "", // Will be updated when user selects type
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      };

      // Add to store
      addDocument(newDocument);

      // Add to display state
      const displayDoc: DocumentDisplay = {
        ...newDocument,
        uploadProgress: 0,
        status: "pending",
      };
      setDocumentDisplays((prev) => [...prev, displayDoc]);
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateDocumentType = (documentId: string, documentType: string) => {
    // Update in store
    updateDocument(documentId, { documentType });

    // Update display state
    setDocumentDisplays((prev) =>
      prev.map((doc) =>
        doc.id === documentId ? { ...doc, documentType } : doc
      )
    );
  };

  const uploadDocumentsToStorage = async () => {
    if (documents.length === 0) return [];

    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      throw new Error("User not authenticated");
    }

    const uploadPromises = documents.map(async (doc) => {
      try {
        // Create storage path
        const fileExt = doc.fileName.split(".").pop();
        const fileName = `${doc.id}.${fileExt}`;
        const filePath = `${authUser.id}/${fileName}`;

        // Upload to Supabase Storage
        const { error } = await supabase.storage
          .from("documents")
          .upload(filePath, doc.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          throw error;
        }

        // Get public URL
        const { data: publicUrl } = supabase.storage
          .from("documents")
          .getPublicUrl(filePath);

        return {
          id: doc.id,
          title: doc.documentType,
          file_url: publicUrl?.publicUrl || "",
          size: doc.fileSize,
          content_type: doc.mimeType,
          filePath,
        };
      } catch (error) {
        console.error(`Upload error for ${doc.fileName}:`, error);
        throw error;
      }
    });

    const results = await Promise.allSettled(uploadPromises);
    const successfulUploads = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => (result as PromiseFulfilledResult<any>).value);

    if (successfulUploads.length === 0) {
      throw new Error("No documents were uploaded successfully");
    }

    return successfulUploads;
  };

  const removeDocument = (documentId: string) => {
    // Remove from store
    removeFromStore(documentId);

    // Remove from display state
    setDocumentDisplays((prev) => prev.filter((d) => d.id !== documentId));
  };

  const handleNext = async () => {
    // Clear any previous errors
    setSaveError(null);

    // Check if there are any documents without document type selected
    const documentsWithoutType = documentDisplays.filter(
      (doc) => !doc.documentType || doc.documentType === ""
    );

    if (documentsWithoutType.length > 0) {
      setSaveError("Please select a document type for all uploaded documents");
      return;
    }

    // Additional validation: Check if any document has invalid document type
    const invalidDocuments = documentDisplays.filter(
      (doc) =>
        doc.documentType &&
        !DOCUMENT_TYPES.some((type) => type.value === doc.documentType)
    );

    if (invalidDocuments.length > 0) {
      setSaveError("Please select a valid document type for all documents");
      return;
    }

    setIsSaving(true);

    try {
      const { data: user, error: userError } =
        await UserService.getCurrentUser();

      if (userError || !user) {
        setSaveError("User not authenticated");
        return;
      }

      // Persist accumulated onboarding data (personal info + skills/availability)
      if (!personalInfo || !skillsAvailability) {
        setSaveError(
          "Incomplete onboarding data. Please complete all required steps."
        );
        return;
      }

      // Upload all documents to storage
      let uploadedDocuments = [];
      if (documents.length > 0) {
        try {
          uploadedDocuments = await uploadDocumentsToStorage();
          logger.info(
            `Successfully uploaded ${uploadedDocuments.length} documents`
          );
        } catch (uploadError) {
          logger.error("Error uploading documents:", uploadError);
          setSaveError("Failed to upload documents. Please try again.");
          return;
        }
      }

      // Save document metadata to database
      if (uploadedDocuments.length > 0) {
        const supabase = createClient();
        const documentRecords = uploadedDocuments.map((doc) => ({
          user_id: user.id,
          title: doc.title,
          file_url: doc.file_url,
          size: doc.size,
          content_type: doc.content_type,
          document_type: doc.title, // Will use the title as document_type for now
        }));

        const { error: dbError } = await supabase
          .from("verification_documents")
          .insert(documentRecords);

        if (dbError) {
          logger.error("Error saving document metadata:", dbError);
          setSaveError(
            "Failed to save document information. Please try again."
          );
          return;
        }
      }

      // Finalize onboarding
      const result = await finalizeKindTaoOnboarding({
        personalInfo,
        skillsAvailability,
        jobPreferences: jobPreferences || {
          desiredJobs: [],
          desiredLocations: [],
          desiredJobTypes: [],
          salaryRange: { min: 0, max: 0, salaryType: "daily" },
          preferredLanguages: [],
          preferredWorkRadiusKm: 20,
        },
        workHistory,
      });

      if (!result.success) {
        setSaveError(result.error || "Failed to save onboarding data");
        return;
      }

      logger.info("Onboarding completed successfully");

      // Clear onboarding store
      if (typeof window !== "undefined") {
        localStorage.removeItem("kindtao-onboarding-storage");
      }

      // Redirect to profile page
      router.push("/recs");
    } catch (error) {
      logger.error("Error completing onboarding:", error);
      setSaveError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Document Upload
        </h1>
        <p className="text-gray-600 text-lg">
          Upload your documents to complete your profile verification. This
          helps employers verify your identity and qualifications.
        </p>
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-gray-600 text-sm">
            <strong>Optional:</strong> You can upload documents now or after
            completing your profile. Documents help with verification and job
            matching.
          </p>
        </div>
      </div>

      {/* Document Upload Section */}
      <div className="mb-6">
        <label className="block mb-2 stepsLabel">Upload Documents</label>
        <p className="text-sm text-gray-600 mb-4">
          Upload the required documents to complete your profile verification.
        </p>
      </div>

      {/* File Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 rounded-xl cursor-pointer transition-colors bg-blue-600 text-white hover:bg-blue-700"
        >
          Choose Files
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Supported formats: JPG, PNG, PDF, DOC, DOCX (Max 10MB per file)
        </p>
      </div>

      {/* Uploaded Documents List */}
      {documentDisplays.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Uploaded Documents</h3>
          <div className="space-y-3">
            {documentDisplays.map((document) => (
              <div
                key={document.id}
                className="p-4 border border-gray-200 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{document.fileName}</span>
                      <span className="text-sm text-gray-500">
                        ({formatFileSize(document.fileSize)})
                      </span>
                    </div>

                    {/* Document Type Selection */}
                    <div className="mt-2">
                      <select
                        value={document.documentType}
                        onChange={(e) =>
                          updateDocumentType(document.id, e.target.value)
                        }
                        className={`text-sm border rounded px-2 py-1 ${
                          !document.documentType || document.documentType === ""
                            ? "border-red-300 bg-red-50"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="">
                          Select document type (required)
                        </option>
                        {DOCUMENT_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeDocument(document.id)}
                    className="ml-3 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
          <p className="text-red-600 text-sm">{saveError}</p>
        </div>
      )}

      <StepperFooter
        onBack={
          onBack
            ? onBack
            : () => router.push("/kindtao-onboarding/work-history")
        }
        onNext={isSaving || !allDocumentsHaveTypes ? undefined : handleNext}
        nextLabel={isSaving ? "Loading..." : "Finish"}
      />
    </div>
  );
}
