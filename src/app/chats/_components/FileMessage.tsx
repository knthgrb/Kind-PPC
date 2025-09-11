"use client";

import { useState, useEffect } from "react";
import { IoIosCloseCircle } from "react-icons/io";
import { FileUploadService } from "@/services/chat/fileUploadService";

interface FileMessageProps {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  thumbnailUrl?: string;
  isSent: boolean;
}

export default function FileMessage({
  fileUrl,
  fileName,
  fileSize,
  mimeType,
  thumbnailUrl,
  isSent,
}: FileMessageProps) {
  const [imageError, setImageError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [actualFileSize, setActualFileSize] = useState(fileSize);
  const [isLoadingSize, setIsLoadingSize] = useState(fileSize === 0);

  const fileIcon = FileUploadService.getFileIcon(mimeType);
  const fileCategory = FileUploadService.getFileTypeCategory(mimeType);
  const formattedSize = FileUploadService.formatFileSize(actualFileSize);

  const fullFileUrl = FileUploadService.getFullUrl(fileUrl);

  useEffect(() => {
    if (fileSize === 0 && fullFileUrl) {
      fetch(fullFileUrl, { method: "HEAD" })
        .then((response) => {
          const contentLength = response.headers.get("content-length");
          if (contentLength) {
            setActualFileSize(parseInt(contentLength));
          }
          setIsLoadingSize(false);
        })
        .catch((error) => {
          console.log("Could not fetch file size:", error);
          setIsLoadingSize(false);
        });
    }
  }, [fileSize, fullFileUrl]);

  const handleFileClick = () => {
    if (fileCategory === "image") {
      setShowPreview(true);
    } else {
      handleDownload();
    }
  };

  const handleDownload = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    console.log("Download clicked for file:", fileName, "URL:", fullFileUrl);

    try {
      const response = await fetch(fullFileUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("Download initiated successfully");
    } catch (error) {
      console.log("Download failed, trying direct link:", error);
      try {
        const link = document.createElement("a");
        link.href = fullFileUrl;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackError) {
        console.log("All download methods failed:", fallbackError);
      }
    }
  };

  if (fileCategory === "image") {
    return (
      <>
        <div
          className="cursor-pointer transition-all duration-200 hover:opacity-90 bg-gray-100 rounded-lg"
          onClick={handleFileClick}
        >
          <img
            src={fullFileUrl}
            alt={fileName}
            className="max-w-xs max-h-64 object-cover rounded-lg"
            onError={() => setImageError(true)}
          />
          {imageError && (
            <div className="max-w-xs h-32 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 text-sm">
                Image preview unavailable
              </span>
            </div>
          )}
        </div>

        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <button
                onClick={() => setShowPreview(false)}
                className="absolute top-4 right-4 text-red-500 hover:text-red-600 z-10"
              >
                <IoIosCloseCircle size={40} />
              </button>
              <div className="absolute top-4 left-4 text-white bg-black/50 rounded-lg p-3 z-10">
                <p className="text-sm font-medium">{fileName}</p>
                <p className="text-xs text-gray-300">{formattedSize}</p>
              </div>
              <img
                src={fullFileUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className="bg-gray-600 text-white p-4 rounded-lg max-w-xs cursor-pointer hover:bg-gray-700 transition-all duration-200 hover:shadow-lg"
      onClick={handleFileClick}
    >
      <div className="flex items-center space-x-3">
        <span className="text-2xl flex-shrink-0">{fileIcon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-white">{fileName}</p>
          <p className="text-xs mt-1 text-gray-300">
            {isLoadingSize ? "Loading..." : formattedSize}
          </p>
          <p className="text-xs mt-1 text-gray-400">Click to download</p>
        </div>
        <div className="text-white text-lg">⬇️</div>
      </div>
    </div>
  );
}
