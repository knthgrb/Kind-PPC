-- Test script to debug location_preference field
-- Run this in your Supabase SQL editor

-- 1. Check if the column exists and its properties
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'helper_profiles' 
AND column_name = 'location_preference';

-- 2. Check if there are any constraints on the column
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint 
WHERE conrelid = 'helper_profiles'::regclass
AND conname LIKE '%location%';

-- 3. Test updating location_preference directly
-- Replace 'YOUR_USER_ID_HERE' with an actual user ID from your table
UPDATE helper_profiles 
SET location_preference = ARRAY['Test Location 1', 'Test Location 2']
WHERE user_id = 'YOUR_USER_ID_HERE'
RETURNING id, user_id, location_preference;

-- 4. Check the result
SELECT id, user_id, location_preference, updated_at
FROM helper_profiles 
WHERE user_id = 'YOUR_USER_ID_HERE';
