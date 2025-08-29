# Complete Signup Testing Guide

## 🚨 IMPORTANT: Run These Steps in Order

### Step 1: Set Up Database Trigger
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database_triggers.sql`
4. **Run the script**
5. Verify the trigger was created by checking the **Functions** tab in your database

### Step 2: Sync Existing Users (if any)
If you already have users in `auth.users` but not in `public.users`:
1. In the SQL Editor, run the contents of `sync_existing_users.sql`
2. This will populate `public.users` with existing users

### Step 3: Test New Signup
1. Go to your signup page
2. Choose a role (kindTao or kindBossing)
3. Fill out the form with test data:
   - **Email**: `test@example.com`
   - **Password**: `testpassword123`
   - **First Name**: `Test`
   - **Last Name**: `User`
   - **Phone**: `9096862170` (will be formatted as +639096862170)
   - **Role**: Choose either option

### Step 4: Check Browser Console
Open browser DevTools → Console and look for:
```
Signup data being sent: {email: "test@example.com", ...}
AuthService.signup called with data: {email: "test@example.com", ...}
Auth signup successful, authData: {...}
```

### Step 5: Verify Database Tables

#### Check `auth.users` table:
```sql
SELECT 
  id, 
  email, 
  raw_user_meta_data,
  created_at
FROM auth.users 
WHERE email = 'test@example.com';
```

**Expected result**: Should show user with metadata containing:
```json
{
  "role": "kindtao",
  "first_name": "Test", 
  "last_name": "User",
  "phone": "+639096862170"
}
```

#### Check `public.users` table:
```sql
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
WHERE email = 'test@example.com';
```

**Expected result**: Should show user with all fields populated

### Step 6: Test Login Redirect
1. Go to login page
2. Login with the test account
3. Should redirect to `/kindtao/onboarding` (if kindTao) or `/kindbossing/dashboard` (if kindBossing)

## 🔍 Troubleshooting

### Problem: `public.users` table is empty
**Solution**: 
- Check if the trigger was created successfully
- Look for errors in Supabase logs
- Verify the trigger function has proper permissions

### Problem: Metadata is missing in `auth.users`
**Solution**:
- Check browser console for the debug logs
- Verify the signup form is sending all required fields
- Check that `AuthService.signup()` is being called

### Problem: Role mapping not working
**Solution**:
- Check that "bossing" is being mapped to "kindbossing"
- Verify the role enum in your database includes both values

### Problem: Phone number format incorrect
**Solution**:
- Check that the phone is being formatted with +63 prefix
- Verify the phone validation in the form

## 📊 Expected Database State

### After successful signup, you should see:

#### `auth.users`:
- Basic auth info (email, password hash, etc.)
- `raw_user_meta_data` with all custom fields

#### `public.users`:
- `id`: UUID matching auth.users
- `role`: "kindtao" or "kindbossing"
- `email`: The email used
- `first_name`: "Test"
- `last_name`: "User"
- `phone`: "+639096862170"
- `verification_status`: "pending"
- `subscription_tier`: "free"
- `swipe_credits`: 10
- `boost_credits`: 0

## 🧪 Test Cases to Try

1. **kindTao signup** → Should create user with role "kindtao"
2. **kindBossing signup** → Should create user with role "kindbossing"
3. **Different phone numbers** → Should all be formatted with +63
4. **Business name** → Should only appear for kindBossing users
5. **Login redirects** → Should work based on role and onboarding status

## 📝 Debug Commands

### Check if trigger exists:
```sql
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

### Check trigger function:
```sql
SELECT 
  routine_name, 
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_auth_user';
```

### Check user roles:
```sql
SELECT unnest(enum_range(NULL::user_role)) as available_roles;
```

## 🆘 Still Having Issues?

1. **Check Supabase logs** for any database errors
2. **Verify table structure** matches the schema exactly
3. **Check permissions** on the trigger function
4. **Test with a simple user** first (minimal data)
5. **Compare with working examples** in the database
