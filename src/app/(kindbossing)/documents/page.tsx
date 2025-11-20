"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/utils/convex/client";
import { getDocuments } from "@/actions/documents/get-documents";
import { useToastActions } from "@/stores/useToastStore";
import { logger } from "@/utils/logger";
import dynamic from "next/dynamic";
const AddDocumentModal = dynamic(
  () => import("@/components/modals/AddDocumentModal"),
  {
    ssr: false,
  }
);
import {
  FaPlus,
  FaFile,
  FaImage,
  FaFilePdf,
  FaVideo,
  FaDownload,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import { format } from "date-fns";
import { deleteDocument } from "@/actions/documents/delete-document";

function getFileIcon(mimeType: string | null | undefined) {
  if (!mimeType) return <FaFile className="w-5 h-5 text-gray-400" />;

  if (
    mimeType.includes("pdf") ||
    mimeType.includes("document") ||
    mimeType.includes("word") ||
    mimeType.includes("excel")
  ) {
    return <FaFilePdf className="w-5 h-5 text-red-600" />;
  }
  if (mimeType.startsWith("image/")) {
    return <FaImage className="w-5 h-5 text-blue-600" />;
  }
  if (mimeType.startsWith("video/")) {
    return <FaVideo className="w-5 h-5 text-purple-600" />;
  }
  return <FaFile className="w-5 h-5 text-gray-400" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function DocumentsPage() {
  const { showSuccess, showError } = useToastActions();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "pdf" | "docs" | "excel" | "ppt" | "image" | "video"
  >("all");

  const FILTERS: {
    id: typeof activeFilter;
    label: string;
  }[] = [
    { id: "all", label: "All" },
    { id: "pdf", label: "PDF" },
    { id: "docs", label: "Docs" },
    { id: "excel", label: "Excel" },
    { id: "ppt", label: "PPT" },
    { id: "image", label: "Images" },
    { id: "video", label: "Videos" },
  ];

  const matchesFilter = (doc: any) => {
    if (activeFilter === "all") return true;
    const mime = (doc.content_type || "").toLowerCase();

    switch (activeFilter) {
      case "pdf":
        return mime.includes("pdf");
      case "docs":
        return (
          mime.includes("word") ||
          mime.includes("document") ||
          mime.includes("msword") ||
          mime.includes("text/rtf")
        );
      case "excel":
        return (
          mime.includes("excel") ||
          mime.includes("spreadsheet") ||
          mime.includes("sheet") ||
          mime.includes("csv")
        );
      case "ppt":
        return (
          mime.includes("presentation") ||
          mime.includes("powerpoint") ||
          mime.includes("ppt")
        );
      case "image":
        return mime.startsWith("image/");
      case "video":
        return mime.startsWith("video/");
      default:
        return true;
    }
  };

  const filteredDocuments = documents.filter(matchesFilter);

  // Get current user
  const currentUser = useQuery(api.auth.getCurrentUser);

  // Fetch documents when user is available
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!currentUser) return;

      setLoading(true);
      try {
        const result = await getDocuments();
        if (result.success && result.documents) {
          setDocuments(result.documents);
        } else {
          logger.error("Failed to fetch documents:", result.error);
          showError("Failed to load documents");
        }
      } catch (error) {
        logger.error("Failed to fetch documents:", error);
        showError("Failed to load documents");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [currentUser, showError]);

  const handleDocumentAdded = async () => {
    // Refresh documents
    const result = await getDocuments();
    if (result.success && result.documents) {
      setDocuments(result.documents);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    setIsDeleting(documentId);
    try {
      const result = await deleteDocument(documentId);
      if (result.success) {
        showSuccess("Document deleted successfully");
        // Refresh documents
        const fetchedDocuments = await getDocuments();
        if (fetchedDocuments.success && fetchedDocuments.documents) {
          setDocuments(fetchedDocuments.documents);
        }
      } else {
        showError(result.error || "Failed to delete document");
      }
    } catch (error) {
      logger.error("Failed to delete document:", error);
      showError("Failed to delete document");
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (timestamp: number) => {
    try {
      return format(new Date(timestamp), "MMM d, yyyy");
    } catch {
      return "Unknown";
    }
  };

  return (
    <div className="px-4 py-4">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-500">
              File Management
            </p>
            <h1 className="text-3xl font-semibold text-gray-900">Documents</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your business documents and files.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="hidden sm:inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#CB0000] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a10000] transition-colors"
            >
              <FaPlus className="w-4 h-4" />
              Add Document
            </button>
          </div>
        </header>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`doc-skeleton-${index}`}
                className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="relative mb-4 aspect-video overflow-hidden rounded-xl bg-gray-200" />
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 rounded bg-gray-200" />
                      <div className="h-3 w-24 rounded bg-gray-100" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="h-3 w-20 rounded bg-gray-100" />
                    <div className="flex gap-2">
                      <div className="h-8 w-16 rounded-lg bg-gray-100" />
                      <div className="h-8 w-16 rounded-lg bg-gray-100" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="text-xl font-semibold text-gray-900">
              No documents yet
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Upload your first document to get started.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 rounded-2xl border border-gray-200 bg-white/60 p-3">
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    activeFilter === filter.id
                      ? "bg-[#CB0000] text-white shadow-sm"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {filteredDocuments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <p className="text-xl font-semibold text-gray-900">
                  No{" "}
                  {FILTERS.find(
                    (f) => f.id === activeFilter
                  )?.label.toLowerCase()}{" "}
                  files
                </p>
                <p className="mt-3 text-sm text-gray-600">
                  Try selecting a different filter or upload a new document.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredDocuments.map((doc) => {
                  const isImage = doc.content_type?.startsWith("image/");
                  const isVideo = doc.content_type?.startsWith("video/");

                  return (
                    <div
                      key={doc._id || doc.id}
                      onClick={() => setPreviewDoc(doc)}
                      className="group relative flex cursor-pointer flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="relative mb-4 aspect-video overflow-hidden rounded-xl bg-gray-50">
                        {isImage ? (
                          <img
                            src={doc.file_url}
                            alt={doc.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        ) : isVideo ? (
                          <video
                            src={doc.file_url}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-gray-500">
                            {getFileIcon(doc.content_type)}
                            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              {doc.content_type || "Unknown"}
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-x-4 top-4 flex items-center justify-between rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-gray-600 backdrop-blur">
                          <span>{formatFileSize(doc.size)}</span>
                          <span className="text-gray-400">•</span>
                          <span>{formatDate(doc.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col">
                        <div className="mb-2 flex items-start gap-3">
                          <div className="hidden rounded-lg bg-gray-100 p-2 text-gray-500 sm:block">
                            {getFileIcon(doc.content_type)}
                          </div>
                          <div className="flex-1">
                            <p className="text-base font-semibold text-gray-900 line-clamp-2">
                              {doc.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {doc.content_type || "Unknown"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between pt-4">
                          <div className="text-xs uppercase tracking-wide text-gray-400">
                            Tap to preview
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
                            >
                              <FaDownload className="h-3 w-3" />
                              Download
                            </a>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(doc._id || doc.id);
                              }}
                              disabled={isDeleting === (doc._id || doc.id)}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-transparent px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                            >
                              <FaTrash className="h-3 w-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Document Modal */}
      <AddDocumentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onDocumentAdded={handleDocumentAdded}
      />

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-100">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setPreviewDoc(null)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Document preview
                  </p>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    {previewDoc.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(previewDoc.size)} •{" "}
                    {previewDoc.content_type || "Unknown"} •{" "}
                    {formatDate(previewDoc.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-full cursor-pointer p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Close preview"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 max-h-[70vh] overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                {previewDoc.content_type?.startsWith("image/") ? (
                  <img
                    src={previewDoc.file_url}
                    alt={previewDoc.title}
                    className="mx-auto max-h-[70vh] w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : previewDoc.content_type?.startsWith("video/") ? (
                  <video
                    src={previewDoc.file_url}
                    controls
                    className="h-full w-full rounded-2xl bg-black"
                  />
                ) : (
                  <iframe
                    src={previewDoc.file_url}
                    className="h-[70vh] w-full rounded-2xl bg-white"
                    title={previewDoc.title}
                  />
                )}
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-xl cursor-pointer border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Close
                </button>
                <a
                  href={previewDoc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#CB0000] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#a10000]"
                >
                  <FaDownload className="h-4 w-4" />
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed cursor-pointer bottom-20 right-6 z-90 flex h-14 w-14 items-center justify-center rounded-full bg-[#CB0000] text-white shadow-lg transition hover:bg-[#a10000] sm:hidden"
        aria-label="Add document"
      >
        <FaPlus className="h-5 w-5" />
      </button>
    </div>
  );
}
