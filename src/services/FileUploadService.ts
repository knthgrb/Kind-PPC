/**
 * Unified FileUploadService
 * Note: This service uses Convex File Storage
 */
import type { ConvexHttpClient } from "convex/browser";
import type { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import React from "react";
import { extractStorageIdFromResponse } from "@/utils/convex/storage";
import {
  IoImageOutline,
  IoDocumentOutline,
  IoDocumentTextOutline,
  IoVideocamOutline,
  IoMusicalNotesOutline,
  IoAttachOutline,
} from "react-icons/io5";

type ConvexClient = ConvexHttpClient | ConvexReactClient;

export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
  url?: string;
}

export interface FileMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
}

export class FileUploadService {
  private static readonly MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  private static readonly ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  private static readonly ALLOWED_DOCUMENT_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];
  private static readonly ALLOWED_VIDEO_TYPES = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ];
  private static readonly ALLOWED_AUDIO_TYPES = [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
  ];

  static getAllowedFileTypes() {
    return {
      images: this.ALLOWED_IMAGE_TYPES,
      documents: this.ALLOWED_DOCUMENT_TYPES,
      videos: this.ALLOWED_VIDEO_TYPES,
      audio: this.ALLOWED_AUDIO_TYPES,
      all: [
        ...this.ALLOWED_IMAGE_TYPES,
        ...this.ALLOWED_DOCUMENT_TYPES,
        ...this.ALLOWED_VIDEO_TYPES,
        ...this.ALLOWED_AUDIO_TYPES,
      ],
    };
  }

  static validateFile(file: File): { isValid: boolean; error?: string } {
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size must be less than ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      };
    }

    const allowedTypes = this.getAllowedFileTypes().all;
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error:
          "File type not supported. Please upload images, documents, videos, or audio files.",
      };
    }

    return { isValid: true };
  }

  static getFileTypeCategory(
    mimeType: string
  ): "image" | "document" | "video" | "audio" | "unknown" {
    if (this.ALLOWED_IMAGE_TYPES.includes(mimeType)) return "image";
    if (this.ALLOWED_DOCUMENT_TYPES.includes(mimeType)) return "document";
    if (this.ALLOWED_VIDEO_TYPES.includes(mimeType)) return "video";
    if (this.ALLOWED_AUDIO_TYPES.includes(mimeType)) return "audio";
    return "unknown";
  }

  private static async generateImageThumbnail(
    file: File
  ): Promise<string | null> {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        const maxSize = 200;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);
        const thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.8);
        resolve(thumbnailDataUrl);
      };

      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Upload file to Convex File Storage
   */
  static async uploadFile(
    convex: ConvexClient,
    file: File,
    conversationId: string,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileMetadata> {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const fileId = crypto.randomUUID();
    const fileExt = file.name.split(".").pop();
    const fileName = `${fileId}.${fileExt}`;

    const progress: FileUploadProgress = {
      fileId,
      fileName: file.name,
      progress: 0,
      status: "uploading",
    };

    onProgress?.(progress);

    try {
      // Generate upload URL from Convex
      const uploadUrl = await convex.mutation(api.storage.generateUploadUrl);

      // Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.statusText}`);
      }

      const storageId = await extractStorageIdFromResponse(result);

      // Get the file URL
      const fileUrl = await convex.query(api.storage.getFileUrl, {
        storageId: storageId as any,
      });

      // Store storageId for reference
      const shortenedUrl = storageId;

      let thumbnailUrl: string | null = null;
      if (this.getFileTypeCategory(file.type) === "image") {
        thumbnailUrl = await this.generateImageThumbnail(file);
      }

      progress.progress = 100;
      progress.status = "success";
      progress.url = fileUrl || "";
      onProgress?.(progress);

      const metadata = {
        id: fileId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        url: shortenedUrl, // Store storageId
        thumbnailUrl: thumbnailUrl || undefined,
        uploadedAt: new Date().toISOString(),
      };

      return metadata;
    } catch (error) {
      progress.status = "error";
      progress.error = error instanceof Error ? error.message : "Upload failed";
      onProgress?.(progress);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadMultipleFiles(
    convex: ConvexClient,
    files: File[],
    conversationId: string,
    onProgress?: (progress: FileUploadProgress[]) => void
  ): Promise<FileMetadata[]> {
    const results: FileMetadata[] = [];
    const progressArray: FileUploadProgress[] = files.map((file) => ({
      fileId: crypto.randomUUID(),
      fileName: file.name,
      progress: 0,
      status: "uploading",
    }));

    onProgress?.(progressArray);

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.uploadFile(
          convex,
          files[i],
          conversationId,
          (progress) => {
            progressArray[i] = progress;
            onProgress?.(progressArray);
          }
        );
        results.push(result);
      } catch (error) {
        progressArray[i].status = "error";
        progressArray[i].error =
          error instanceof Error ? error.message : "Upload failed";
        onProgress?.(progressArray);
      }
    }

    return results;
  }

  /**
   * Delete file from Convex storage
   */
  static async deleteFile(
    convex: ConvexClient,
    storageId: string
  ): Promise<void> {
    try {
      await convex.mutation(api.storage.deleteFile, {
        storageId: storageId as any,
      });
    } catch (error) {
      throw new Error(
        `Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Get full file URL from storage ID
   */
  static async getFullUrl(
    convex: ConvexClient,
    storageIdOrUrl: string
  ): Promise<string> {
    if (
      storageIdOrUrl.startsWith("http://") ||
      storageIdOrUrl.startsWith("https://")
    ) {
      return storageIdOrUrl;
    }

    try {
      const fileUrl = await convex.query(api.storage.getFileUrl, {
        storageId: storageIdOrUrl as any,
      });
      return fileUrl || storageIdOrUrl;
    } catch (error) {
      return storageIdOrUrl;
    }
  }

  static getFileIcon(mimeType: string): React.ComponentType<any> {
    switch (mimeType) {
      case "image/jpeg":
      case "image/jpg":
      case "image/png":
      case "image/gif":
      case "image/webp":
        return IoImageOutline;
      case "application/pdf":
      case "text/plain":
        return IoDocumentOutline;
      case "application/msword":
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return IoDocumentTextOutline;
      case "video/mp4":
      case "video/webm":
      case "video/quicktime":
        return IoVideocamOutline;
      case "audio/mpeg":
      case "audio/wav":
      case "audio/ogg":
        return IoMusicalNotesOutline;
      default:
        return IoAttachOutline;
    }
  }
}
