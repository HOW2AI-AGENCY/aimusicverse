# 🔒 Critical System Files - DO NOT MODIFY

This document lists files that are **CRITICAL** to the application's security and functionality. Modifications to these files must be made with **EXTREME CAUTION** and thorough testing.

## ⚠️ Authentication System Files

### **HIGHEST PRIORITY - Security Critical**

#### `supabase/functions/telegram-auth/index.ts`
**Status:** 🔴 **LOCKED** - Modifying this file can break user authentication entirely

**Why it's critical:**
- Handles Telegram Mini App authentication flow
- Validates user data integrity with cryptographic signatures
- Creates and manages user sessions
- Manages user profile creation in the database

**Before modifying:**
1. ✅ Thoroughly test authentication flow in development
2. ✅ Verify Telegram WebApp data validation logic
3. ✅ Ensure database triggers for profile creation still work
4. ✅ Test both new user signup and existing user login flows
5. ✅ Verify session management and JWT token generation

**Common mistakes to avoid:**
- ❌ Removing or modifying data validation checks
- ❌ Changing the authentication flow without testing
- ❌ Hardcoding credentials or using client-side auth checks
- ❌ Breaking the connection with profile creation triggers

#### `src/hooks/useAuth.tsx`
**Status:** 🟡 **PROTECTED** - Client-side authentication state management

**Why it's critical:**
- Manages authentication state across the entire application
- Handles login/logout flows
- Provides authentication context to all components
- Manages Telegram WebApp integration on client side

**Before modifying:**
1. ✅ Understand the full authentication flow
2. ✅ Test with both authenticated and unauthenticated states
3. ✅ Verify protected routes still work correctly
4. ✅ Test Telegram Mini App integration

### Database Tables (via Supabase Migrations)

#### `profiles` table
- Stores user profile information from Telegram
- Linked to `auth.users` via trigger
- **DO NOT** add roles or sensitive permissions here

#### `user_roles` table
- Manages user roles (admin, moderator, user)
- Uses `app_role` enum type
- **CRITICAL:** All role checks must be server-side
- Uses security definer functions to prevent RLS recursion

## 🛡️ Security Best Practices

### Role-Based Access Control
1. **Never** store roles in localStorage or client-side storage
2. **Always** use server-side validation (RLS policies + security definer functions)
3. **Never** hardcode admin credentials
4. Use the `has_role()` function in RLS policies

### Authentication Flow
1. Client validates with Telegram WebApp SDK
2. Edge function (`telegram-auth`) validates cryptographic signature
3. User profile created/updated via database trigger
4. Session token returned to client
5. All subsequent requests authenticated via Supabase client

## 📋 Change Request Protocol

If you need to modify authentication:

1. **Document** why the change is needed
2. **Review** this entire file first
3. **Test** in development environment extensively
4. **Backup** critical data before deployment
5. **Monitor** for authentication failures after deployment

## 🚨 Emergency Rollback

If authentication breaks:
1. Check Supabase logs: Cloud → Edge Functions → telegram-auth
2. Verify environment variables are set correctly
3. Test Telegram WebApp data validation
4. Rollback to previous working migration if needed

---

**Last Updated:** 2025-11-29
**Maintained By:** Development Team
**Emergency Contact:** Check project documentation
