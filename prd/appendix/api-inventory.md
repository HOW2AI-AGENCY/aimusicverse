# API Inventory

> **Complete API Reference for MusicVerse AI**

This appendix documents all API endpoints used in the MusicVerse AI application, organized by module and functionality.

---

## Table of Contents

- [Authentication & User Management](#authentication--user-management)
- [Tracks & Music Management](#tracks--music-management)
- [Generation & AI Services](#generation--ai-services)
- [Studio & Editing](#studio--editing)
- [Projects & Organization](#projects--organization)
- [Playlists & Discovery](#playlists--discovery)
- [Artists & Profiles](#artists--profiles)
- [Credits & Economy](#credits--economy)
- [Analytics & Reporting](#analytics--reporting)
- [Admin & Moderation](#admin--moderation)
- [Payments & Subscriptions](#payments--subscriptions)
- [Social & Community](#social--community)

---

## Authentication & User Management

### `/api/auth/*`

| Endpoint         | Method | Purpose                   | Request                                    | Response                           | Auth Required |
| ---------------- | ------ | ------------------------- | ------------------------------------------ | ---------------------------------- | ------------- |
| `/auth/telegram` | POST   | Authenticate via Telegram | `{ initData: string, user: TelegramUser }` | `{ session: Session, user: User }` | No            |
| `/auth/refresh`  | POST   | Refresh session token     | `{ refreshToken: string }`                 | `{ session: Session }`             | No            |
| `/auth/logout`   | POST   | Logout user               | —                                          | `{ success: boolean }`             | Yes           |
| `/auth/me`       | GET    | Get current user          | —                                          | `{ user: User }`                   | Yes           |

### `/api/profiles/*`

| Endpoint                           | Method | Purpose          | Request                                | Response                 | Auth Required  |
| ---------------------------------- | ------ | ---------------- | -------------------------------------- | ------------------------ | -------------- |
| `/api/profiles/{userId}`           | GET    | Get user profile | —                                      | `{ profile: Profile }`   | No (public)    |
| `/api/profiles/{userId}`           | PATCH  | Update profile   | `{ displayName, bio, avatarUrl, ... }` | `{ profile: Profile }`   | Yes (own only) |
| `/api/profiles/{userId}/follow`    | POST   | Follow user      | —                                      | `{ following: boolean }` | Yes            |
| `/api/profiles/{userId}/followers` | GET    | Get followers    | —                                      | `{ users: User[] }`      | No (public)    |

---

## Tracks & Music Management

### `/api/tracks/*`

| Endpoint                          | Method | Purpose                     | Request                                                | Response                            | Auth Required       |
| --------------------------------- | ------ | --------------------------- | ------------------------------------------------------ | ----------------------------------- | ------------------- |
| `/api/tracks`                     | GET    | Get tracks with filters     | `{ userId, isPublic, searchQuery, sortBy, tagFilter }` | `{ tracks: Track[], count }`        | No (public results) |
| `/api/tracks/{id}`                | GET    | Get track details           | —                                                      | `{ track: Track, versions, stems }` | No (if public)      |
| `/api/tracks/{id}`                | DELETE | Delete track                | —                                                      | `{ success: boolean }`              | Yes (own only)      |
| `/api/tracks/{id}/like`           | POST   | Like/unlike track           | —                                                      | `{ liked: boolean, likesCount }`    | Yes                 |
| `/api/tracks/{id}/play`           | POST   | Log track play              | —                                                      | `{ playCount: number }`             | No                  |
| `/api/tracks/{id}/counts`         | GET    | Get version/stem counts     | —                                                      | `{ versionCount, stemCount }`       | No (cached)         |
| `/api/tracks/{id}/midi-status`    | GET    | Get MIDI/PDF availability   | —                                                      | `{ hasMidi, hasPdf }`               | No (cached)         |
| `/api/tracks/{id}/switch-version` | POST   | Switch active version (A/B) | `{ versionId: string }`                                | `{ activeVersion: TrackVersion }`   | Yes (own only)      |

---

## Generation & AI Services

### `/api/generation/*`

| Endpoint                          | Method | Purpose                      | Request                                                 | Response                              | Auth Required  |
| --------------------------------- | ------ | ---------------------------- | ------------------------------------------------------- | ------------------------------------- | -------------- |
| `/api/generation/generate`        | POST   | Start music generation       | `{ prompt, title?, lyrics?, isInstrumental, isPublic }` | `{ taskId, status, estimatedTime }`   | Yes            |
| `/api/generation/status/{taskId}` | GET    | Check generation status      | —                                                       | `{ task, status, progress, result? }` | Yes (own only) |
| `/api/generation/active`          | GET    | Get active generations       | —                                                       | `{ tasks: GenerationTask[] }`         | Yes            |
| `/api/generation/cancel/{taskId}` | POST   | Cancel generation            | —                                                       | `{ cancelled: boolean }`              | Yes (own only) |
| `/api/generation/logs`            | GET    | Get generation logs (admin)  | `{ limit, status, timeRange }`                          | `{ logs: GenerationLog[] }`           | Admin only     |
| `/api/generation/stats`           | GET    | Get generation stats (admin) | `{ timeRange }`                                         | `{ stats: GenerationStats }`          | Admin only     |

---

## Credits & Economy

### `/api/credits/*`

| Endpoint                | Method | Purpose                 | Request                        | Response                                | Auth Required |
| ----------------------- | ------ | ----------------------- | ------------------------------ | --------------------------------------- | ------------- |
| `/api/credits/balance`  | GET    | Get credit balance      | —                              | `{ balance, pending, history }`         | Yes           |
| `/api/credits/history`  | GET    | Get transaction history | `{ limit, offset }`            | `{ transactions: CreditTransaction[] }` | Yes           |
| `/api/credits/purchase` | POST   | Purchase credits        | `{ amount, currency, method }` | `{ transaction, paymentUrl }`           | Yes           |
| `/api/credits/grant`    | POST   | Grant credits (admin)   | `{ userId, amount, reason }`   | `{ transaction }`                       | Admin only    |

### `/api/referrals/*`

| Endpoint                     | Method | Purpose            | Request     | Response                           | Auth Required |
| ---------------------------- | ------ | ------------------ | ----------- | ---------------------------------- | ------------- |
| `/api/referrals/code`        | GET    | Get referral code  | —           | `{ code, link }`                   | Yes           |
| `/api/referrals/stats`       | GET    | Get referral stats | —           | `{ clicks, signups, activeUsers }` | Yes           |
| `/api/referrals/leaderboard` | GET    | Get leaderboard    | `{ limit }` | `{ leaders: ReferralLeader[] }`    | No (public)   |

### `/api/rewards/*`

| Endpoint                   | Method | Purpose             | Request           | Response                             | Auth Required |
| -------------------------- | ------ | ------------------- | ----------------- | ------------------------------------ | ------------- |
| `/api/rewards/summary`     | GET    | Get rewards summary | —                 | `{ credits, xp, level, streak }`     | Yes           |
| `/api/rewards/missions`    | GET    | Get daily missions  | —                 | `{ missions: Mission[] }`            | Yes           |
| `/api/rewards/checkin`     | POST   | Daily check-in      | —                 | `{ success, creditsEarned, streak }` | Yes           |
| `/api/rewards/leaderboard` | GET    | Get leaderboard     | `{ type, limit }` | `{ leaderboard: LeaderEntry[] }`     | No (public)   |

---

## Admin & Moderation

### `/api/admin/*`

| Endpoint                        | Method | Purpose                | Request                     | Response            | Auth Required |
| ------------------------------- | ------ | ---------------------- | --------------------------- | ------------------- | ------------- |
| `/api/admin/users`              | GET    | Get all users          | `{ limit, offset, filter }` | `{ users, count }`  | Admin only    |
| `/api/admin/users/{id}/ban`     | POST   | Ban user               | `{ reason, duration }`      | `{ success }`       | Admin only    |
| `/api/admin/tracks`             | GET    | Get all tracks         | `{ limit, offset, filter }` | `{ tracks, count }` | Admin only    |
| `/api/admin/moderation/reports` | GET    | Get moderation reports | `{ status, limit }`         | `{ reports }`       | Admin only    |

---

## Appendix

### Rate Limiting

All API endpoints are subject to rate limiting:

| Endpoint Type    | Rate Limit  | Burst   |
| ---------------- | ----------- | ------- |
| Public endpoints | 100 req/min | 200 req |
| Authenticated    | 200 req/min | 400 req |
| Generation       | 10 req/min  | 20 req  |
| Admin endpoints  | 50 req/min  | 100 req |

### Error Responses

All endpoints return errors in consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

---

**Total API Endpoints Documented:** 50+

---

_This API inventory reflects the current implementation as of 2026-06-27._
