/**
 * Utility functions for working with file storage
 * NOTE: This file needs to be updated to use your new storage solution
 * (e.g., Convex File Storage, AWS S3, Cloudinary, etc.)
 */

/**
 * Converts a file path to a public URL
 * TODO: Update this to use your new storage solution
 *
 * @param filePath - The file path from the database (e.g., "documents/user-id/filename.png")
 * @returns The full public URL for the file
 */
export function getStorageUrl(filePath: string): string {
  if (!filePath) return "";

  // If it's already a full URL, return as is
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  // TODO: Replace with your storage solution URL
  // Example for Convex File Storage:
  // return `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${filePath}`;

  // For now, return the path as-is (will need to be updated)
  return filePath;
}

/**
 * Gets the public URL for a file
 * TODO: Update this to use your new storage solution
 *
 * @param filePath - The file path from the database (e.g., "documents/user-id/filename.png")
 * @returns The public URL for the file
 */
export function getPublicUrl(filePath: string): string {
  if (!filePath) return "";

  // If it's already a full URL, return as is
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  // TODO: Replace with your storage solution URL
  // Example for Convex File Storage:
  // return `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${filePath}`;

  // For now, return the path as-is (will need to be updated)
  return filePath;
}

// Legacy function names for backward compatibility (will be removed)
export function getSupabaseStorageUrl(filePath: string): string {
  return getStorageUrl(filePath);
}

export function getSupabasePublicUrl(filePath: string): string {
  return getPublicUrl(filePath);
}

/**
 * Extracts the bucket name from a file path
 * @param filePath - The file path (e.g., "documents/user-id/filename.png")
 * @returns The bucket name (e.g., "documents")
 */
export function getBucketFromPath(filePath: string): string {
  if (!filePath) return "";
  const parts = filePath.split("/");
  return parts[0] || "";
}

/**
 * Extracts the file name from a file path
 * @param filePath - The file path (e.g., "documents/user-id/filename.png")
 * @returns The file name (e.g., "filename.png")
 */
export function getFileNameFromPath(filePath: string): string {
  if (!filePath) return "";
  const parts = filePath.split("/");
  return parts[parts.length - 1] || "";
}
