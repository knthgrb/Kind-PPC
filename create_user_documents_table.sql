-- Create user_documents table for storing document metadata
-- This follows Supabase best practices for file management

CREATE TABLE IF NOT EXISTS public.user_documents (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  document_type document_type NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  is_verified boolean DEFAULT false,
  verification_status verification_status DEFAULT 'pending',
  verification_notes text,
  uploaded_at timestamp with time zone DEFAULT now(),
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT user_documents_pkey PRIMARY KEY (id),
  CONSTRAINT user_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT user_documents_document_type_check CHECK (document_type IN ('profile_photo', 'id_document', 'certificate', 'background_check', 'medical_certificate', 'other'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON public.user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_type ON public.user_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_user_documents_status ON public.user_documents(verification_status);

-- Add RLS policies
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own documents
CREATE POLICY "Users can view own documents" ON public.user_documents
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own documents
CREATE POLICY "Users can insert own documents" ON public.user_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own documents
CREATE POLICY "Users can update own documents" ON public.user_documents
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents" ON public.user_documents
    FOR DELETE USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE public.user_documents IS 'Stores metadata for user uploaded documents including profile photos, ID documents, certificates, etc.';
COMMENT ON COLUMN public.user_documents.file_path IS 'Full path in Supabase Storage (e.g., documents/user_id/filename.jpg)';
COMMENT ON COLUMN public.user_documents.document_type IS 'Type of document for categorization and verification';
COMMENT ON COLUMN public.user_documents.verification_status IS 'Status of document verification by admin/staff';
