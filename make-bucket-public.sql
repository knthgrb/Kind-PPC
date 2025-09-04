-- SQL script to make the documents bucket public
-- Run this in your Supabase SQL Editor

-- Update the bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'documents';

-- Create a policy to allow public read access
CREATE POLICY "Public read access for documents" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');

-- Grant necessary permissions
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT ON storage.objects TO authenticated;
