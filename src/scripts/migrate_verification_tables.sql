-- Migration script to rename verification tables and columns
-- This script renames:
-- 1. kindtao_verification_requests → verification_requests
-- 2. kindtao_user_id → user_id
-- 3. kindtao_verification_documents → verification_documents
-- 4. kindbossing_user_id → user_id in verification_documents

-- First, create the new verification_requests table with the correct structure
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  user_id uuid not null,
  status public.verification_statuses not null default 'pending'::verification_statuses,
  updated_at timestamp with time zone null default (now() AT TIME ZONE 'utc'::text),
  notes text null,
  constraint verification_requests_pkey primary key (id),
  constraint verification_requests_user_id_fkey foreign KEY (user_id) references auth.users (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

-- Create verification_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.verification_documents (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  user_id uuid not null,
  title character varying not null,
  file_url character varying not null,
  size bigint not null,
  content_type character varying not null,
  document_type character varying null,
  constraint verification_documents_pkey primary key (id),
  constraint verification_documents_user_id_fkey foreign KEY (user_id) references auth.users (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_documents_user_id ON public.verification_documents(user_id);

-- Enable RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for verification_requests
DROP POLICY IF EXISTS "Users can view their own verification requests" ON public.verification_requests;
CREATE POLICY "Users can view their own verification requests" ON public.verification_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own verification requests" ON public.verification_requests;
CREATE POLICY "Users can insert their own verification requests" ON public.verification_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own verification requests" ON public.verification_requests;
CREATE POLICY "Users can update their own verification requests" ON public.verification_requests
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all verification requests" ON public.verification_requests;
CREATE POLICY "Admins can view all verification requests" ON public.verification_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update all verification requests" ON public.verification_requests;
CREATE POLICY "Admins can update all verification requests" ON public.verification_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS policies for verification_documents
DROP POLICY IF EXISTS "Users can view their own verification documents" ON public.verification_documents;
CREATE POLICY "Users can view their own verification documents" ON public.verification_documents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own verification documents" ON public.verification_documents;
CREATE POLICY "Users can insert their own verification documents" ON public.verification_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own verification documents" ON public.verification_documents;
CREATE POLICY "Users can update their own verification documents" ON public.verification_documents
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own verification documents" ON public.verification_documents;
CREATE POLICY "Users can delete their own verification documents" ON public.verification_documents
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all verification documents" ON public.verification_documents;
CREATE POLICY "Admins can view all verification documents" ON public.verification_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Migrate data from old tables to new tables (if they exist)
-- Note: Only run these if you want to migrate existing data. Otherwise, skip these INSERT statements.

-- Migrate verification requests
INSERT INTO public.verification_requests (id, created_at, user_id, status, updated_at, notes)
SELECT id, created_at, kindtao_user_id, status, updated_at, notes
FROM public.kindtao_verification_requests
WHERE NOT EXISTS (SELECT 1 FROM public.verification_requests WHERE verification_requests.id = kindtao_verification_requests.id)
ON CONFLICT (id) DO NOTHING;

-- Migrate verification documents
-- Note: This assumes kindtao_verification_documents has columns: id, created_at, kindbossing_user_id, title, file_url, size, content_type, document_type
-- If the table doesn't exist yet, the migration will skip this step
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kindtao_verification_documents') THEN
    INSERT INTO public.verification_documents (id, created_at, user_id, title, file_url, size, content_type, document_type)
    SELECT id, created_at, kindbossing_user_id, title, file_url, size, content_type, document_type
    FROM public.kindtao_verification_documents
    WHERE NOT EXISTS (SELECT 1 FROM public.verification_documents WHERE verification_documents.id = kindtao_verification_documents.id)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

