-- Run this script to manually sync existing users from auth.users to public.users
-- This is useful if you have existing users before setting up the trigger

-- First, check if there are any existing users that need syncing
SELECT 
  'Users in auth.users but not in public.users:' as message,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- If there are users to sync, run this function
SELECT sync_existing_users();

-- Verify the sync worked
SELECT 
  'Total users in public.users after sync:' as message,
  COUNT(*) as count
FROM public.users;

-- Check a specific user to see the data
SELECT 
  id,
  email,
  role,
  first_name,
  last_name,
  phone,
  verification_status,
  subscription_tier,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;
