"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import StepperFooter from "@/components/StepperFooter";

interface UploadedDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadProgress: number;
  status: 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

const DOCUMENT_TYPES = [
  { value: 'profile_photo', label: 'Profile Photo', description: 'Clear photo of your face' },
  { value: 'id_document', label: 'ID Document', description: 'Government-issued ID or passport' },
  { value: 'certificate', label: 'Professional Certificate', description: 'Training or certification documents' },
  { value: 'background_check', label: 'Background Check', description: 'Police clearance or background verification' },
  { value: 'medical_certificate', label: 'Medical Certificate', description: 'Health clearance certificate' }
];

export default function DocumentUploadClient() {
  const router = useRouter();
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check authentication status and load existing documents on component load
  useEffect(() => {
    const checkAuthAndLoadDocuments = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.email) {
        console.log('User authenticated:', user.id, user.email);
        setUser({ id: user.id, email: user.email });
        
        // Load existing documents
        try {
          const { data: existingDocs } = await supabase
            .from('user_documents')
            .select('*')
            .eq('user_id', user.id);

          if (existingDocs && existingDocs.length > 0) {
            const docs = existingDocs.map(doc => ({
              id: doc.id,
              documentType: doc.document_type,
              fileName: doc.file_name,
              fileSize: doc.file_size,
              mimeType: doc.mime_type,
              uploadProgress: 100,
              status: 'success' as const
            }));
            setUploadedDocuments(docs);
          }
        } catch (error) {
          console.error('Error loading existing documents:', error);
        }
      } else {
        console.log('No user found');
        setSaveError("User not authenticated. Please log in again.");
      }
      
      setIsLoading(false);
      setIsLoadingDocuments(false);
    };

    checkAuthAndLoadDocuments();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaveError("User not authenticated");
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Create unique document entry
      const documentId = crypto.randomUUID();
      const newDocument: UploadedDocument = {
        id: documentId,
        documentType: 'other', // Will be updated when user selects type
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadProgress: 0,
        status: 'uploading'
      };

      setUploadedDocuments(prev => [...prev, newDocument]);

      try {
        // Create storage path
        const fileExt = file.name.split('.').pop();
        const fileName = `${documentId}.${fileExt}`;
        const filePath = `documents/${user.id}/${fileName}`;

        // Upload to Supabase Storage
        const { error } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          throw error;
        }

        // Update document with success status
        setUploadedDocuments(prev => 
          prev.map(doc => 
            doc.id === documentId 
              ? { ...doc, status: 'success', uploadProgress: 100 }
              : doc
          )
        );

        // Save document metadata to database
        const { error: dbError } = await supabase
          .from('user_documents')
          .insert({
            user_id: user.id,
            document_type: newDocument.documentType,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type
          });

        if (dbError) {
          console.error('Database insert error:', dbError);
          console.error('User ID being used:', user.id);
          console.error('User ID type:', typeof user.id);
          console.error('Auth UID from Supabase:', await supabase.auth.getUser());
          
          // Update document status to error
          setUploadedDocuments(prev => 
            prev.map(doc => 
              doc.id === documentId 
                ? { 
                    ...doc, 
                    status: 'error', 
                    errorMessage: `Database error: ${dbError.message}`
                  }
                : doc
            )
          );
        } else {
          console.log('Document metadata saved to database successfully');
        }

      } catch (error) {
        console.error('Upload error:', error);
        setUploadedDocuments(prev => 
          prev.map(doc => 
            doc.id === documentId 
              ? { 
                  ...doc, 
                  status: 'error', 
                  errorMessage: error instanceof Error ? error.message : 'Upload failed'
                }
              : doc
          )
        );
      }
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateDocumentType = async (documentId: string, documentType: string) => {
    setUploadedDocuments(prev => 
      prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, documentType }
          : doc
      )
    );

    // Update in database
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('user_documents')
        .update({ document_type: documentType })
        .eq('user_id', user.id)
        .eq('file_name', uploadedDocuments.find(d => d.id === documentId)?.fileName);
    }
  };

  const removeDocument = async (documentId: string) => {
    const document = uploadedDocuments.find(d => d.id === documentId);
    if (!document) return;

    const supabase = createClient();
    
    try {
      // Delete from storage
      await supabase.storage
        .from('documents')
        .remove([document.fileName]);

      // Delete from database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_documents')
          .delete()
          .eq('user_id', user.id)
          .eq('file_name', document.fileName);
      }

      // Remove from state
      setUploadedDocuments(prev => prev.filter(d => d.id !== documentId));
    } catch (error) {
      console.error('Error removing document:', error);
    }
  };

  const handleNext = async () => {
    if (uploadedDocuments.length === 0) {
      setSaveError("Please upload at least one document");
      return;
    }

    if (uploadedDocuments.some(doc => doc.status === 'uploading')) {
      setSaveError("Please wait for all uploads to complete");
      return;
    }

    if (uploadedDocuments.some(doc => doc.status === 'error')) {
      setSaveError("Please fix any upload errors before continuing");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // All documents are uploaded successfully
      // Redirect to profile page
      router.push("/profile");
    } catch {
      setSaveError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Loading State */}
      {(isLoading || isLoadingDocuments) && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-6">
          <p className="text-blue-600 text-sm">
            {isLoading ? 'Checking authentication...' : 'Loading your documents...'}
          </p>
        </div>
      )}

      {/* Document Upload Section */}
      <div className="mb-6">
        <label className="block mb-2 stepsLabel">Upload Documents</label>
        <p className="text-sm text-gray-600 mb-4">
          Please upload the required documents to complete your profile verification.
        </p>

        {/* File Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
            disabled={!user || isLoading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!user || isLoading}
            className={`px-4 py-2 rounded-md transition-colors ${
              !user || isLoading 
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {!user ? 'Please log in first' : isLoading ? 'Loading...' : 'Choose Files'}
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Supported formats: JPG, PNG, PDF, DOC, DOCX (Max 10MB per file)
          </p>
        </div>
      </div>

      {/* Uploaded Documents List */}
      {uploadedDocuments.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Uploaded Documents</h3>
          <div className="space-y-3">
            {uploadedDocuments.map((document) => (
              <div
                key={document.id}
                className={`p-4 border rounded-lg ${
                  document.status === 'success' ? 'border-green-200 bg-green-50' :
                  document.status === 'error' ? 'border-red-200 bg-red-50' :
                  'border-gray-200 bg-gray-50'
                }`}
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
                        onChange={(e) => updateDocumentType(document.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">Select document type</option>
                        {DOCUMENT_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status and Progress */}
                    <div className="mt-2">
                      {document.status === 'uploading' && (
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${document.uploadProgress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-blue-600">Uploading...</span>
                        </div>
                      )}
                      
                      {document.status === 'success' && (
                        <span className="text-sm text-green-600">✓ Uploaded successfully</span>
                      )}
                      
                      {document.status === 'error' && (
                        <span className="text-sm text-red-600">
                          ✗ {document.errorMessage || 'Upload failed'}
                        </span>
                      )}
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-6">
          <p className="text-red-600 text-sm">{saveError}</p>
        </div>
      )}

      {/* Loading State */}
      {isSaving && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-6">
          <p className="text-blue-600 text-sm">Processing documents...</p>
        </div>
      )}

      <StepperFooter
        onBack={() => router.push("/onboarding/work-history")}
        onNext={isSaving ? undefined : handleNext}
        nextLabel={isSaving ? "Processing..." : "Complete Profile"}
      />
    </>
  );
}
