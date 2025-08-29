-- Database trigger to automatically create public.users record when auth.users is created
-- This file should be run in your Supabase SQL editor

-- First, create the function that will handle the trigger
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users table with data from auth.users metadata
  INSERT INTO public.users (
    id,
    role,
    email,
    phone,
    first_name,
    last_name,
    date_of_birth,
    gender,
    profile_image_url,
    address,
    city,
    province,
    postal_code,
    is_verified,
    verification_status,
    subscription_tier,
    swipe_credits,
    boost_credits,
    last_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'kindtao')::user_role, -- Default to kindtao if not specified
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NULL, -- date_of_birth
    NULL, -- gender
    NULL, -- profile_image_url
    NULL, -- address
    NULL, -- city
    NULL, -- province
    NULL, -- postal_code
    FALSE, -- is_verified
    'pending', -- verification_status
    'free', -- subscription_tier
    10, -- swipe_credits
    0, -- boost_credits
    NOW(), -- last_active
    NOW(), -- created_at
    NOW()  -- updated_at
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error (you can check Supabase logs)
    RAISE LOG 'Error in handle_new_auth_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger that fires when a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_auth_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_auth_user() TO service_role;

-- Also create a function to manually sync existing users (run this if you have existing users)
CREATE OR REPLACE FUNCTION sync_existing_users()
RETURNS void AS $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN 
    SELECT id, email, raw_user_meta_data 
    FROM auth.users 
    WHERE id NOT IN (SELECT id FROM public.users)
  LOOP
    BEGIN
      INSERT INTO public.users (
        id,
        role,
        email,
        phone,
        first_name,
        last_name,
        date_of_birth,
        gender,
        profile_image_url,
        address,
        city,
        province,
        postal_code,
        is_verified,
        verification_status,
        subscription_tier,
        swipe_credits,
        boost_credits,
        last_active,
        created_at,
        updated_at
      ) VALUES (
        auth_user.id,
        COALESCE(auth_user.raw_user_meta_data->>'role', 'kindtao')::user_role,
        auth_user.email,
        COALESCE(auth_user.raw_user_meta_data->>'phone', NULL),
        COALESCE(auth_user.raw_user_meta_data->>'first_name', ''),
        COALESCE(auth_user.raw_user_meta_data->>'last_name', ''),
        NULL, NULL, NULL, NULL, NULL, NULL, NULL,
        FALSE, 'pending', 'free', 10, 0, NOW(), NOW(), NOW()
      );
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error syncing user %: %', auth_user.id, SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for sync function
GRANT EXECUTE ON FUNCTION sync_existing_users() TO service_role;

-- Note: You may need to run this as a superuser or with appropriate permissions
-- If you get permission errors, you might need to run this in the Supabase dashboard SQL editor
