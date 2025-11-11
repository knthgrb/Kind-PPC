"use client";

import { useState, useEffect } from "react";
import { LuFilter, LuSearch, LuUploadCloud } from "react-icons/lu";
import { FaFileAlt } from "react-icons/fa";
import UploadDocumentModal from "@/components/modals/UploadDocumentModal";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import { getDocuments } from "@/actions/documents/get-documents";
import { deleteDocument } from "@/actions/documents/delete-document";
import { createClient } from "@/utils/supabase/client";

interface Document {
  id: string;
  created_at: string;
  kindbossing_user_id: string;
  file_url: string;
  title: string;
  size: number;
  content_type: string | null;
}

export default function Documents() {
  const [filter, setFilter] = useState<"all" | "Contracts" | "PDF">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadDocumentModalOpen, setIsUploadDocumentModalOpen] =
    useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getDocuments();
      if (result.success && result.data) {
        setDocuments(result.data);
      } else {
        setError(result.error || "Failed to load documents");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const result = await deleteDocument(documentId);
      if (result.success) {
        await loadDocuments();
      } else {
        alert(result.error || "Failed to delete document");
      }
    } catch (err) {
      alert("An unexpected error occurred");
      console.error(err);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const supabase = createClient();
      // Extract file path from URL
      const urlParts = doc.file_url.split("/");
      const filePath = urlParts
        .slice(urlParts.indexOf("kindbossing-documents") + 1)
        .join("/");

      // Download file from storage
      const { data: fileData, error } = await supabase.storage
        .from("kindbossing-documents")
        .download(filePath);

      if (error) {
        alert("Failed to download document");
        return;
      }

      // Create blob URL and trigger download
      const url = URL.createObjectURL(fileData);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download document");
      console.error(err);
    }
  };

  const handleView = (doc: Document) => {
    window.open(doc.file_url, "_blank");
  };

  // Get document type from content_type
  const getDocumentType = (contentType: string | null) => {
    if (!contentType) return "PDF";
    if (contentType.includes("pdf")) return "PDF";
    if (contentType.includes("word") || contentType.includes("document"))
      return "Word";
    if (
      contentType.includes("presentation") ||
      contentType.includes("powerpoint")
    )
      return "PowerPoint";
    if (contentType.includes("contract") || contentType.includes("contract"))
      return "Contracts";
    return "PDF";
  };

  const filteredDocuments = documents.filter((document) => {
    const docType = getDocumentType(document.content_type);
    const matchesFilter = filter === "all" || docType === filter;
    const matchesSearch =
      document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      docType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getDocumentCounts = () => {
    const allCount = documents.length;
    const contractsCount = documents.filter(
      (d) => getDocumentType(d.content_type) === "Contracts"
    ).length;
    const pdfCount = documents.filter(
      (d) => getDocumentType(d.content_type) === "PDF"
    ).length;
    return { allCount, contractsCount, pdfCount };
  };

  const counts = getDocumentCounts();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents</h1>
            <p className="text-gray-600">Manage your documents and files</p>
          </div>
          <PrimaryButton
            onClick={() => setIsUploadDocumentModalOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <LuUploadCloud className="w-4 h-4" />
            <span className="text-sm font-medium">Upload Document</span>
          </PrimaryButton>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { key: "all", label: "All Documents", count: counts.allCount },
            {
              key: "Contracts",
              label: "Contracts",
              count: counts.contractsCount,
            },
            {
              key: "PDF",
              label: "PDF",
              count: counts.pdfCount,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === tab.key
                  ? "bg-white text-[#CC0000] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
        <button
          type="button"
          className="inline-flex cursor-pointer bg-white items-center justify-center gap-2 rounded-lg border border-gray-400 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 w-full md:w-auto"
        >
          <LuFilter className="text-base" />
          <span>Filter</span>
        </button>

        <label className="relative w-full md:w-52">
          <LuSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
          />
        </label>
      </div>

      {/* Documents Content */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000]"></div>
          </div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaFileAlt className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <PrimaryButton onClick={loadDocuments}>Retry</PrimaryButton>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaFileAlt className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === "all" ? "No documents yet" : `No ${filter} documents`}
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === "all"
              ? "You don't have any documents uploaded yet."
              : `You don't have any ${filter} documents at the moment.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocuments.map((doc) => {
            const docType = getDocumentType(doc.content_type);
            const formatDate = (dateString: string) => {
              const date = new Date(dateString);
              return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
            };

            return (
              <div
                key={doc.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative">
                  <img
                    src="/documents/document.png"
                    alt="Document Preview"
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60"></div>
                  <img
                    src="/icons/pdf.png"
                    alt="PDF Icon"
                    className="absolute top-4 left-4 w-6 h-6"
                  />
                  <span className="absolute top-4 right-4 bg-white/90 text-xs px-2 py-1 rounded-full text-gray-700">
                    {docType}
                  </span>
                </div>

                <div className="p-4">
                  <p className="text-xs text-gray-500 mb-2">
                    {formatDate(doc.created_at)}
                  </p>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-gray-600 mb-4">
                    {(doc.size / 1024).toFixed(2)} KB
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex-1 bg-[#CC0000] text-white text-xs py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleView(doc)}
                      className="flex-1 bg-[#CC0000] text-white text-xs py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={isUploadDocumentModalOpen}
        onClose={() => setIsUploadDocumentModalOpen(false)}
        onDocumentUploaded={() => {
          loadDocuments();
        }}
      />
    </div>
  );
}
