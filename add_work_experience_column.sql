-- Add work_experience column to helper_profiles table
-- This will store work history as structured JSON data

ALTER TABLE public.helper_profiles 
ADD COLUMN work_experience JSONB NULL;

-- Add an index for better query performance on work_experience
CREATE INDEX IF NOT EXISTS idx_helper_profiles_work_experience 
ON public.helper_profiles USING GIN (work_experience);

-- Add a comment to document the column structure
COMMENT ON COLUMN public.helper_profiles.work_experience IS 
'Stores work experience as JSON array with structure: [
  {
    "jobTitle": "string",
    "company": "string", 
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD or null",
    "description": "string",
    "duration": "string"
  }
]';

-- Example of how the data will look:
-- [
--   {
--     "jobTitle": "Housekeeper",
--     "company": "Family Doe",
--     "startDate": "2020-01-01",
--     "endDate": "2023-12-31",
--     "description": "Managed household cleaning and organization",
--     "duration": "3 years"
--   }
-- ]
