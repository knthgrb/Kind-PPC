"use client";

import { useState, useEffect } from "react";
import { IoIosCloseCircle } from "react-icons/io";
import { FileUploadService } from "@/services/client/FileUploadService";

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

  const FileIcon = FileUploadService.getFileIcon(mimeType);
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
          setIsLoadingSize(false);
        });
    }
  }, [fileSize, fullFileUrl]);

  const handleFileClick = () => {
    if (fileCategory === "image") {
      setShowPreview(true);
    } else if (fileCategory === "video" || fileCategory === "audio") {
      // Video and audio players are embedded, no need to download on click
      return;
    } else {
      handleDownload();
    }
  };

  const handleDownload = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

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
    } catch (error) {
      try {
        const link = document.createElement("a");
        link.href = fullFileUrl;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackError) {}
    }
  };

  if (fileCategory === "image") {
    return (
      <>
        <div
          className="cursor-pointer transition-all duration-200 hover:opacity-90 bg-gray-100 rounded-lg w-80"
          onClick={handleFileClick}
        >
          <img
            src={fullFileUrl}
            alt={fileName}
            className="w-full max-h-64 object-cover rounded-lg"
            onError={() => setImageError(true)}
          />
          {imageError && (
            <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
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

  if (fileCategory === "video") {
    return (
      <div className="bg-gray-900 rounded-lg overflow-hidden w-80">
        <video
          controls
          className="w-full max-h-64 object-cover"
          preload="metadata"
        >
          <source src={fullFileUrl} type={mimeType} />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (fileCategory === "audio") {
    return (
      <div className="rounded-lg py-4 w-80">
        <audio controls className="w-full" preload="metadata">
          <source src={fullFileUrl} type={mimeType} />
          Your browser does not support the audio tag.
        </audio>
      </div>
    );
  }

  return (
    <div
      className="bg-[#f1f3f4] hover:bg-gray-200 p-4 rounded-lg max-w-xs cursor-pointer transition-colors"
      onClick={handleFileClick}
    >
      <div className="flex items-center space-x-3">
        <span className="text-2xl shrink-0 text-gray-600">
          <FileIcon />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-gray-900">
            {fileName}
          </p>
          <p className="text-xs mt-1 text-gray-500">
            {isLoadingSize ? "Loading..." : formattedSize}
          </p>
          <p className="text-xs mt-1 text-gray-600">Click to download</p>
        </div>
      </div>
    </div>
  );
}
