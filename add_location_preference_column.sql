-- Add location_preference column to helper_profiles table
ALTER TABLE public.helper_profiles 
ADD COLUMN location_preference text[] NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_helper_profiles_location_preference 
ON public.helper_profiles USING gin (location_preference);
