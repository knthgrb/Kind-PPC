-- Job Preferences functionality is already supported by the existing preferred_job_types field
-- The field is already defined as job_type[] in the helper_profiles table

-- Let's check if there are any constraints or indexes we need
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'helper_profiles' 
AND column_name = 'preferred_job_types';

-- Check if there are any constraints on the job_type enum
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint 
WHERE conrelid = 'helper_profiles'::regclass
AND conname LIKE '%job%';

-- Check the job_type enum values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
  SELECT oid 
  FROM pg_type 
  WHERE typname = 'job_type'
);

-- If you want to add more job types, you can do:
-- ALTER TYPE job_type ADD VALUE 'new_job_type';
