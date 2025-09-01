# Testing the Signup Process

## Step 1: Set up the Database Trigger

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database_triggers.sql`
4. Run the SQL script

## Step 2: Test Signup

1. Go to your signup page
2. Fill out the form with:
   - Email: test@example.com
   - Password: testpassword123
   - First Name: Test
   - Last Name: User
   - Phone: +639123456789
   - Role: kindtao

## Step 3: Verify Data

After signup, check these tables:

### 1. Check `auth.users` (Supabase Auth table)
```sql
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'test@example.com';
```

**Expected result**: Should show the user with metadata containing role, first_name, last_name, phone

### 2. Check `public.users` (Your custom users table)
```sql
SELECT id, email, role, first_name, last_name, phone 
FROM public.users 
WHERE email = 'test@example.com';
```

**Expected result**: Should show the user with all the custom fields populated

## Step 4: Test Login Redirect

1. Go to login page
2. Login with the test account
3. Should redirect to `/kindtao/onboarding` (since no helper_profile exists yet)

## Troubleshooting

### If `public.users` is empty:
- Check if the trigger was created successfully
- Check Supabase logs for any errors
- Verify the trigger function has proper permissions

### If metadata is missing:
- Check that the signup form is sending all required fields
- Verify the AuthService.signup() method is being called
- Check browser network tab for the signup request

### If login redirects to wrong page:
- Check that `public.users` has the correct role
- Verify the `checkOnboardingStatus` method is working
- Check browser console for any errors

## Expected Database State After Signup

### auth.users table:
- Basic auth info (email, password hash, etc.)
- `raw_user_meta_data` should contain:
  ```json
  {
    "role": "kindtao",
    "first_name": "Test",
    "last_name": "User",
    "phone": "+639123456789"
  }
  ```

### public.users table:
- `id`: UUID matching auth.users
- `role`: "kindtao"
- `email`: "test@example.com"
- `first_name`: "Test"
- `last_name`: "User"
- `phone`: "+639123456789"
- `verification_status`: "pending"
- `subscription_tier`: "free"
- `swipe_credits`: 10
- `boost_credits`: 0
