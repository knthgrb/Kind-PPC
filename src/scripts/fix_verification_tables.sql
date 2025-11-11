-- Fix verification_documents table column name
-- verification_requests already has user_id, so we only need to fix verification_documents

-- ============================================
-- Fix verification_documents table
-- ============================================

-- Drop the old foreign key constraint
ALTER TABLE public.verification_documents
DROP CONSTRAINT IF EXISTS kindtao_verification_documents_kindbossing_user_id_fkey;

-- Rename the column from kindbossing_user_id to user_id
ALTER TABLE public.verification_documents
RENAME COLUMN kindbossing_user_id TO user_id;

-- Add the new foreign key constraint with correct name
ALTER TABLE public.verification_documents
DROP CONSTRAINT IF EXISTS verification_documents_user_id_fkey;

ALTER TABLE public.verification_documents
ADD CONSTRAINT verification_documents_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- ============================================
-- Update indexes
-- ============================================

-- Drop old index if it exists
DROP INDEX IF EXISTS public.idx_verification_documents_user_id;

-- Create new index with correct name
CREATE INDEX IF NOT EXISTS idx_verification_documents_user_id ON public.verification_documents(user_id);
