/**
 * Utility functions for working with Supabase Storage
 */

/**
 * Converts a Supabase Storage file path to a public URL
 * Based on the working signed URL structure: .../sign/documents/documents/user-id/filename.png
 * The filePath from database (e.g., "documents/user-id/filename.png") should result in:
 * .../public/documents/documents/user-id/filename.png
 * 
 * @param filePath - The file path from the database (e.g., "documents/user-id/filename.png")
 * @returns The full public URL for the file
 */
export function getSupabaseStorageUrl(filePath: string): string {
  if (!filePath) return '';
  
  // If it's already a full URL, return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('NEXT_PUBLIC_SUPABASE_URL is not defined');
    return filePath;
  }
  
  // Remove leading slash if present
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  
  // Use the correct public URL format for Supabase Storage
  // Format: https://[project_id].supabase.co/storage/v1/render/image/public/[bucket-name]/[file-path]
  const bucketName = 'documents';
  
  // The filePath from database is: "documents/user-id/filename.png"
  // But the actual storage structure is: bucket/documents/documents/user-id/filename.png
  // So we need to add an extra "documents/" prefix to match the actual storage structure
  
  // Construct the public URL using the render/image endpoint
  return `${supabaseUrl}/storage/v1/render/image/public/documents/${cleanPath}`;
}

/**
 * Uses the correct Supabase Storage public URL format
 * Based on the documentation: https://[project_id].supabase.co/storage/v1/object/public/[bucket-name]/[file-path]
 * @param filePath - The file path from the database (e.g., "documents/user-id/filename.png" or "profile-pictures/user-id/filename.png")
 * @returns The public URL for the file
 */
export function getSupabasePublicUrl(filePath: string): string {
  if (!filePath) return '';
  
  // If it's already a full URL, return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('NEXT_PUBLIC_SUPABASE_URL is not defined');
    return filePath;
  }
  
  // Remove leading slash if present
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  
  // Determine bucket name from file path
  const bucketName = getBucketFromPath(cleanPath);
  
  if (bucketName === 'profile-pictures') {
    // For profile pictures: "profile-pictures/user-id/filename.png" -> direct path
    const filePathWithoutBucket = cleanPath.replace('profile-pictures/', '');
    return `${supabaseUrl}/storage/v1/object/public/profile-pictures/${filePathWithoutBucket}`;
  } else {
    // For documents: "documents/user-id/filename.png" -> add extra "documents/" prefix
    // The filePath from database is: "documents/user-id/filename.png"
    // But the actual storage structure is: bucket/documents/documents/user-id/filename.png
    // So we need to add an extra "documents/" prefix to match the actual storage structure
    return `${supabaseUrl}/storage/v1/object/public/documents/${cleanPath}`;
  }
}

/**
 * Extracts the bucket name from a file path
 * @param filePath - The file path (e.g., "documents/user-id/filename.png")
 * @returns The bucket name (e.g., "documents")
 */
export function getBucketFromPath(filePath: string): string {
  if (!filePath) return '';
  const parts = filePath.split('/');
  return parts[0] || '';
}

/**
 * Extracts the file name from a file path
 * @param filePath - The file path (e.g., "documents/user-id/filename.png")
 * @returns The file name (e.g., "filename.png")
 */
export function getFileNameFromPath(filePath: string): string {
  if (!filePath) return '';
  const parts = filePath.split('/');
  return parts[parts.length - 1] || '';
}
