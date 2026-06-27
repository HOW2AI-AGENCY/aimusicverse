# Admin Users

> **Route:** `/admin/users`  
> **Module:** Admin & Moderation  
> **Generated:** 2026-06-27  
> **Access:** Admin only (`<AdminRoute>`)

## Overview

The Admin Users page provides comprehensive user management capabilities for platform administrators. It enables searching, filtering, viewing detailed user information, managing user roles, and performing moderation actions such as banning/unbanning users.

**Primary Use Cases:**
- Search and filter user base
- View detailed user profiles and activity
- Manage user roles and permissions
- Perform moderation actions (ban, unban)
- Monitor user registration trends

## Layout

### Desktop Layout (Master-Detail)

```
┌────────────────────────────────────────────────────────────────────┐
│  HEADER: Search + Filters + "Add User" Button                      │
├────────────────────────────────────────────────────────────────────┤
│  ┌─ USER LIST (12/12) ─────────────┬─ USER DETAIL PANEL ──────────┤
│  │ ┌─────────────────────────────┐ │ ┌───────────────────────────┐ │
│  │ │ 🔍 Search users...          │ │ │ User Profile              │ │
│  │ ├─────────────────────────────┤ │ │ ┌─────────────────────┐   │ │
│  │ │ Filters: [All] [Active]     │ │ │ │ @johndoe             │   │ │
│  │ │ [Banned] [Admin] [Pro]     │ │ │ │ John Doe             │   │ │
│  │ ├─────────────────────────────┤ │ │ │ 📧 john@example.com  │   │ │
│  │ │ User List (virtualized)     │ │ │ └─────────────────────┘   │ │
│  │ │ ┌─────────────────────────┐ │ │ │ Statistics                │ │
│  │ │ │ @johndoe • 15 tracks     │ │ │ │ • Tracks: 15             │ │
│  │ │ │ Active • Pro • Admin    │ │ │ │ • Credits: 125           │ │
│  │ │ ├─────────────────────────┤ │ │ • Joined: Jan 15, 2025    │ │
│  │ │ │ @janedoe • 8 tracks      │ │ │ │ • Last active: 2h ago     │ │
│  │ │ │ Active • Free           │ │ │ │ Roles                     │ │
│  │ │ ├─────────────────────────┤ │ │ │ ☑ Admin ☑ Pro ☑ Verified│ │
│  │ │ │ @spammer • 0 tracks      │ │ │ │ Actions                   │ │
│  │ │ │ Banned • Free           │ │ │ │ [Edit] [Ban] [Delete]    │ │
│  │ │ │ [Reason: Spam]          │ │ │ │ Activity Log              │ │
│  │ │ └─────────────────────────┘ │ │ │ • Generated track         │ │
│  │ └─────────────────────────────┘ │ │ • Purchased credits       │ │
│  └─────────────────────────────────┘ │ └───────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

## Fields

### Search & Filter Section

| Field | Type | Options | Default | Notes |
|-------|------|---------|---------|-------|
| Search Query | Text input | — | "" | Searches username, email, display name |
| Role Filter | Select | All, Admin, Pro, Free | All | Filter by subscription tier |
| Status Filter | Select | All, Active, Banned | All | Filter by account status |
| Registration Date | Date range | — | All-time | Filter by signup date |
| Sort By | Select | Recent, Oldest, Most Active, Alphabetical | Recent | Sort order |

### User List (Table View)

| Column | Format | Sortable | Filterable | Notes |
|--------|--------|----------|-----------|-------|
| Username | Text (link) | Yes | Yes | Links to detail panel |
| Display Name | Text | Yes | No | Full name |
| Email | Text | Yes | Yes | Contact email |
| Tracks Count | Number | Yes | No | Total tracks generated |
| Role | Badge | No | Yes | Admin/Pro/Free badge |
| Status | Badge | No | Yes | Active/Banned indicator |
| Joined Date | Date | Yes | No | Registration timestamp |
| Last Active | Relative time | Yes | No | "2 hours ago" format |
| Actions | Dropdown | No | No | Edit, Ban, Delete options |

### User Detail Panel

| Section | Fields | Notes |
|---------|--------|-------|
| Header | Username, Display Name, Email, Avatar | User identity info |
| Statistics | Tracks count, Credits balance, Joined date, Last active | Key metrics |
| Roles | Admin checkbox, Pro checkbox, Verified checkbox | Role management |
| Actions | Edit profile, Ban/Unban, Delete user, Reset password | Moderation actions |
| Activity Log | Recent actions with timestamps | Audit trail |

---

## Interactions

### Page Load

**Behavior:**
1. Verify admin role via `useAuth()`
2. Fetch users list via `useAdminUsers()`:
   - Default: First 50 users, sorted by recent
   - Apply filters if present in URL
3. Setup search and filter state
4. Setup pagination (infinite scroll)
5. Render user list and detail panel

**API Calls:**
- `GET /api/admin/users?limit=50&offset=0` — User list
- `GET /api/admin/users/count` — Total user count (for pagination)

### Search Users

**Trigger:** Type in search input

**Behavior:**
1. Update `searchQuery` state (immediate)
2. Debounce query (300ms delay)
3. Call `useAdminUsers()` with search parameter
4. Filter results by username OR email OR display name
5. Reset to first page
6. Update user list

**Special Rules:**
- Case-insensitive search
- Minimum 2 characters to trigger
- Shows "No users found" if empty results

### Filter Users

**Trigger:** Change filter dropdown (Role, Status, Date)

**Behavior:**
1. Update filter state
2. Call API with filter parameters
3. Update user list
4. Show count badge for each filter option

**Filter Combinations:**
- Role + Status: "Pro users who are banned"
- Date + Role: "New users (last 7 days) who are Free"

### View User Details

**Trigger:** Click user row in list

**Behavior:**
1. Set `selectedUserId` state
2. Open detail panel on right side
3. Fetch full user details:
   - Profile information
   - Statistics (tracks, credits, activity)
   - Role assignments
   - Recent activity log
4. Enable actions (ban, delete, edit)

### Ban User

**Trigger:** Click "Ban" button in detail panel

**Behavior:**
1. Show confirmation dialog:
   - Reason input (required)
   - Duration selector (Permanent, 7 days, 30 days)
   - Warning message
2. User confirms
3. Call API: `POST /api/admin/users/{id}/ban`
4. Update user list (optimistic update)
5. Show "User banned" toast
6. Log admin action

**API Request:**
```json
{
  "reason": "Spam and abuse",
  "duration": "permanent",
  "adminId": "admin_user_id"
}
```

### Unban User

**Trigger:** Click "Unban" button (for banned users)

**Behavior:**
1. Show confirmation dialog
2. User confirms
3. Call API: `POST /api/admin/users/{id}/unban`
4. Update user list
5. Show "User unbanned" toast

### Delete User

**Trigger:** Click "Delete" button

**Behavior:**
1. Show warning dialog: "This will permanently delete user and all data. Continue?"
2. User confirms
3. Call API: `DELETE /api/admin/users/{id}`
4. Remove from list (optimistic update)
5. Show "User deleted" toast
6. Log admin action

**Special Rules:**
- Confirmation required (double confirmation)
- Cannot delete admins (except self)
- Cannot delete users with >100 tracks (preserve content)

### Edit User Roles

**Trigger:** Toggle role checkboxes (Admin, Pro, Verified)

**Behavior:**
1. Update role state immediately (optimistic)
2. Call API: `PATCH /api/admin/users/{id}/roles`
3. On error: Revert optimistic update
4. Update role badge in user list
5. Log role change

**API Request:**
```json
{
  "isAdmin": true,
  "isPro": false,
  "isVerified": true
}
```

### Infinite Scroll

**Trigger:** Scroll to bottom of user list

**Behavior:**
1. Check `hasMore` flag
2. If true: Call `fetchNextPage()`
3. Show loading spinner
4. Append new users
5. Update virtualized list

---

## API Dependencies

| API | Method | Path | Trigger | Notes |
|-----|--------|------|---------|-------|
| Get Users | GET | /api/admin/users | Page load, filter | Paginated (50/page) |
| Get User Count | GET | /api/admin/users/count | Page load | Total count |
| Get User Details | GET | /api/admin/users/{id} | Select user | Full profile |
| Ban User | POST | /api/admin/users/{id}/ban | Ban button | Permanent or temporary |
| Unban User | POST | /api/admin/users/{id}/unban | Unban button | Restore access |
| Delete User | DELETE | /api/admin/users/{id} | Delete button | Permanent deletion |
| Update Roles | PATCH | /api/admin/users/{id}/roles | Role toggle | Admin/Pro/Verified |
| Search Users | GET | /api/admin/users/search | Search (debounced) | Server-side search |

---

## Page Relationships

**From:**
- `/admin/overview` → Click "Users" quick action
- `/admin/*` → Navigate via admin sidebar

**To:**
- `/profile/{userId}` → Click "View Public Profile" in detail panel
- `/library` → Click "View Tracks" in detail panel

**Data Coupling:**
- User status updates affect profile pages globally
- Role changes immediately affect permissions
- Ban/unban affects authentication across app

---

## Business Rules

1. **Access Control:**
   - Only admin role can access
   - All actions logged for audit trail
   - Cannot ban other admins (except superadmin)

2. **Ban Policies:**
   - Permanent ban: Requires "Spam/Abuse" reason
   - Temporary ban: 7-30 days maximum
   - Banned users cannot authenticate
   - Banned users' content hidden from public

3. **Deletion Policy:**
   - Soft delete: User marked deleted, data retained 30 days
   - Hard delete: Permanent removal (admin-only)
   - Content preservation: Tracks kept unless explicitly deleted

4. **Role Management:**
   - Admin role: Full platform access
   - Pro role: Subscription tier (managed via economy)
   - Verified role: Manual verification (creator badge)

5. **Search Behavior:**
   - Minimum 2 characters required
   - Searches username, email, display name
   - Debounced (300ms) to prevent excessive API calls

---

**Next:** [Admin Tracks Page](./50-admin-tracks.md) → Content moderation