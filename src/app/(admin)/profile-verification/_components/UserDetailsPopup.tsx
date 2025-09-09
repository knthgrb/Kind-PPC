"use client";

import React, { useState } from "react";
import { formatMMDDYYYY } from "@/utils/dateFormatter";
import SupabaseImage from "@/components/SupabaseImage";
import { UserWithDocuments } from "@/services/ProfileVerificationService";
import { createClient } from "@/utils/supabase/client";

interface UserDetailsPopupProps {
  user: UserWithDocuments | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (documentId: string) => void;
  onReject: (documentId: string) => void;
}

export default function UserDetailsPopup({ user, isOpen, onClose, onApprove, onReject }: UserDetailsPopupProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const fullName = `${user.first_name} ${user.last_name}`;
  const profileImageUrl = user.profile_image_url || "/profile.jpg";
  const pendingDocuments = user.user_documents?.filter(doc => doc.verification_status === 'pending') || [];
  const approvedDocuments = user.user_documents?.filter(doc => doc.verification_status === 'approved') || [];
  const rejectedDocuments = user.user_documents?.filter(doc => doc.verification_status === 'rejected') || [];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const isImageFile = (mimeType: string) => {
    return mimeType.startsWith('image/');
  };

  const getImageUrl = (filePath: string) => {
    if (!filePath) return '';
    
    // If it's already a full URL, return as is
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    // Use the environment variable directly to construct the URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('NEXT_PUBLIC_SUPABASE_URL is not defined');
      return '';
    }
    
    // Remove leading slash if present
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    
    // Construct the public URL manually
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/documents/${cleanPath}`;
    
    console.log('Generated image URL:', publicUrl, 'from filePath:', filePath);
    return publicUrl;
  };

  const handleApprove = (documentId: string) => {
    onApprove(documentId);
  };

  const handleReject = (documentId: string) => {
    onReject(documentId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* User Basic Info */}
          <div className="flex items-start space-x-6 mb-8">
            <div className="w-24 aspect-square relative">
              <SupabaseImage
                filePath={profileImageUrl}
                alt={`${fullName} avatar`}
                width={96}
                height={96}
                className="object-cover rounded-lg"
                fallbackSrc="/profile/profile_placeholder.png"
                clickable={true}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{fullName}</h3>
              <div className="space-y-2">
                <p className="text-gray-600">
                  <span className="font-semibold">Email:</span> {user.email}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">Phone:</span> {user.phone || 'Not provided'}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">Role:</span> 
                  <span className="ml-2 capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    {user.role}
                  </span>
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">Joined:</span> {formatMMDDYYYY(user.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Documents Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-400 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-yellow-800">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900">{pendingDocuments.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-green-800">Approved</p>
                  <p className="text-2xl font-bold text-green-900">{approvedDocuments.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-400 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-red-800">Rejected</p>
                  <p className="text-2xl font-bold text-red-900">{rejectedDocuments.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents List */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Documents</h4>
            {user.user_documents && user.user_documents.length > 0 ? (
              <div className="space-y-4">
                {user.user_documents.map((document) => (
                  <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      {/* Document Image Preview */}
                      <div className="flex-shrink-0">
                        {isImageFile(document.mime_type) ? (
                          <div 
                            className="w-40 h-32 relative cursor-pointer hover:opacity-80 transition-opacity overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                            onClick={() => setSelectedImage(document.file_path)}
                          >
                            <img
                              src={getImageUrl(document.file_path)}
                              alt={document.document_type}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                console.error('Failed to load image:', document.file_path);
                                e.currentTarget.src = '/documents/document.png';
                              }}
                              onLoad={() => {
                                console.log('Successfully loaded image:', document.file_path);
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-40 h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Document Details */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h5 className="font-medium text-gray-900 capitalize">
                            {document.document_type.replace('_', ' ')}
                          </h5>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.verification_status)}`}>
                            {document.verification_status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><span className="font-medium">File:</span> {document.file_name}</p>
                            <p><span className="font-medium">Size:</span> {formatFileSize(document.file_size)}</p>
                            <p><span className="font-medium">Type:</span> {document.mime_type}</p>
                          </div>
                          <div>
                            <p><span className="font-medium">Uploaded:</span> {formatMMDDYYYY(document.uploaded_at || document.created_at || new Date())}</p>
                            {document.verified_at && (
                              <p><span className="font-medium">Verified:</span> {formatMMDDYYYY(document.verified_at)}</p>
                            )}
                          </div>
                        </div>
                        {document.verification_notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm">
                              <span className="font-medium">Notes:</span> {document.verification_notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex-shrink-0 flex flex-col space-y-2">
                        {document.verification_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(document.id)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(document.id)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </button>
                          </>
                        )}
                        <a
                          href={document.file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No documents uploaded</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="max-w-full max-h-full">
              <img
                src={getImageUrl(selectedImage)}
                alt="Document preview"
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={(e) => {
                  console.error('Failed to load full image:', selectedImage);
                  e.currentTarget.src = '/documents/document.png';
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}   