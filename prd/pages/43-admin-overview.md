# Admin Overview

> **Route:** `/admin/overview`  
> **Module:** Admin & Moderation  
> **Generated:** 2026-06-27  
> **Access:** Admin only (`<AdminRoute>`)

## Overview

The Admin Overview page serves as the central command dashboard for MusicVerse AI platform administrators. It provides real-time statistics, quick access to key administrative functions, system health monitoring, and recent activity feeds.

**Primary Use Cases:**
- Monitor platform-wide statistics and metrics
- Track system health and performance
- Access quick administrative actions
- Review recent activity and alerts

## Layout

### Desktop Layout (Dashboard Grid)

```
┌────────────────────────────────────────────────────────────────────┐
│  HEADER: "Admin Dashboard" + User Menu + Notifications           │
├────────────────────────────────────────────────────────────────────┤
│  ┌─ KEY METRICS ────────────────────────────────────────────────┐  │
│  │ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │  │
│  │ │ Total     │ │ Active    │ │ Today's   │ │ System    │   │  │
│  │ │ Users     │ │ Generations│ Generations│ Health     │   │  │
│  │ │ 12,458    │ │ 156       │ │ 1,234     │ │ 98.5%     │   │  │
│  │ └───────────┘ └───────────┘ └───────────┘ └───────────┘   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│  ┌─ QUICK ACTIONS ─────────────────────────────────────────────┐  │
│  │ [👥 Users] [🎵 Tracks] [⚙️ Economy] [📊 Analytics]        │  │
│  └─────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

## Fields

### Key Metrics Section

| Metric | Type | Format | Notes |
|--------|------|--------|-------|
| Total Users | Number | "12,458" | Lifetime registered users |
| Active Users | Number | "1,234" | Active in last 24 hours |
| Today's Generations | Number | "1,234" | Tracks generated today |
| System Health | Percentage | "98.5%" | Uptime/performance score |

### Quick Actions Section

| Action | Route | Purpose |
|--------|-------|---------|
| Users | `/admin/users` | User management and moderation |
| Tracks | `/admin/tracks` | Content moderation and management |
| Economy | `/admin/economy` | Credit system and transaction monitoring |
| Analytics | `/admin/analytics` | Detailed analytics and reports |

---

## Interactions

### Page Load

**Behavior:**
1. Verify admin role via `useAuth()`
2. Fetch platform statistics via `useAdminStats()`
3. Fetch recent activity via `useAdminActivity()`
4. Fetch active alerts via `useAdminAlerts()`
5. Render dashboard with all sections

**API Calls:**
- `GET /api/admin/stats/overview` — Platform statistics
- `GET /api/admin/activity/recent` — Recent activity feed
- `GET /api/admin/alerts/active` — Active system alerts

### Metric Cards

**Hover Interaction:**
- **Trigger:** Hover over metric card
- **Behavior:** Show tooltip with additional details

**Click Interaction:**
- **Trigger:** Click metric card
- **Behavior:** Navigate to detailed analytics page

---

## API Dependencies

| API | Method | Path | Trigger | Notes |
|-----|--------|------|---------|-------|
| Get Overview Stats | GET | /api/admin/stats/overview | Page load | Platform metrics |
| Get Recent Activity | GET | /api/admin/activity/recent | Page load | Last 50 events |
| Resolve Alert | POST | /api/admin/alerts/{id}/resolve | Resolve button | Mark as resolved |

---

## Business Rules

1. **Access Control:** Only accessible to users with `role = 'admin'`
2. **Data Freshness:** Metrics cached for 60 seconds
3. **Alert Thresholds:** Error rate > 5% triggers warning alert

---

**Next:** [Admin Users Page](./48-admin-users.md) → User management