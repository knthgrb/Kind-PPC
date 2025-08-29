# Login System with Role-Based Redirects

This document explains how the login system works in the Kind Platform, including the role-based redirects and onboarding flow.

## Overview

The login system automatically redirects users based on their role and onboarding completion status:

- **KindTao users** (helpers) who haven't completed onboarding → redirected to `/kindtao/onboarding`
- **KindTao users** who completed onboarding → redirected to `/kindtao/dashboard`
- **KindBossing users** (families) → redirected to `/kindbossing/dashboard`

## How It Works

### 1. Login Flow

1. User submits login form with email/password
2. `AuthService.login()` authenticates with Supabase
3. System fetches user metadata to determine role
4. For KindTao users, checks if `helper_profiles` table has a record
5. Redirects based on role and onboarding status

### 2. Onboarding Detection

The system determines if a KindTao user has completed onboarding by checking if they have a record in the `helper_profiles` table:

```sql
-- This query determines onboarding completion
SELECT id FROM helper_profiles WHERE user_id = 'user-uuid'
```

- **No record found** → User needs to complete onboarding
- **Record exists** → User has completed onboarding

### 3. Database Schema

The system relies on these key tables:

- `users` - Core user information and role
- `helper_profiles` - Helper-specific profile (indicates onboarding completion)
- `family_profiles` - Family-specific profile

## Files Modified

### AuthService (`src/services/AuthService.ts`)
- Added `createClient()` method for external access
- Added `checkOnboardingStatus()` method to check onboarding completion

### Login Action (`src/app/_actions/auth/login.ts`)
- Enhanced to check user role and onboarding status
- Implements role-based redirects

### Login Page (`src/app/(auth)/login/page.tsx`)
- Updated to use form action
- Added proper form handling

### New Pages Created
- `/kindtao/onboarding` - For incomplete KindTao profiles
- `/kindtao/dashboard` - For complete KindTao profiles  
- `/kindbossing/dashboard` - For KindBossing users
- `/error` - Enhanced error handling

## Usage

### For Developers

1. **Adding new onboarding steps**: Update the `checkOnboardingStatus()` method to check additional tables/fields
2. **Modifying redirects**: Update the login action in `src/app/_actions/auth/login.ts`
3. **Adding new roles**: Extend the role checking logic in the login action

### For Users

1. **KindTao users**: Must complete onboarding before accessing dashboard
2. **KindBossing users**: Go directly to dashboard after login
3. **Admin users**: Can be added to the system with additional role handling

## Security Considerations

- All redirects happen server-side after authentication
- User role is verified against database records
- Onboarding status is checked against actual data, not user claims
- Row Level Security (RLS) policies protect user data

## Testing

To test the system:

1. Create a KindTao user account
2. Login - should redirect to onboarding
3. Complete onboarding (add helper_profile record)
4. Login again - should redirect to dashboard
5. Create a KindBossing user account
6. Login - should redirect directly to dashboard

## Future Enhancements

- Add progress tracking for onboarding steps
- Implement partial onboarding completion states
- Add email verification requirements
- Support for additional user roles (admin, moderator, etc.)
