# Referral

> **Route:** `/referral`  
> **Module:** Rewards & Growth  
> **Generated:** 2026-06-27

## Overview

The Referral page enables users to invite friends to MusicVerse AI and earn rewards. Users get a unique referral link and QR code, track their referral statistics, view the referral leaderboard, and share through multiple channels. The program incentivizes user growth by rewarding both referrers and new users with credits.

**Primary Use Cases:**

- Get unique referral link and QR code
- Share referral link via Telegram, social media, or direct copy
- Track referral statistics (clicks, signups, active users)
- Compete on referral leaderboard
- Earn credits for successful referrals
- Monitor reward earnings from referral program

## Layout

### Desktop Layout (Two-Column Split)

```
┌────────────────────────────────────────────────────────────────────┐
│  HEADER: "Invite Friends, Earn Credits"                             │
├──────────────────────────────────┬───────────────────────────────────┤
│ Share Section (Left Column)      │ Leaderboard Section (Right Column)│
│ ┌────────────────────────────┐  │ ┌─────────────────────────────┐  │
│ │ Referral Stats             │  │ │ 🏆 Referral Leaderboard     │  │
│ │ ┌────────┐ ┌────────┐      │  │ │                            │  │
│ │ │ 15 Clicks│ │ 3 Signups│   │  │ │ 🥇 1. @inviter_pro         │  │
│ │ └────────┘ └────────┘      │  │ │    25 referrals, 500 cr   │  │
│ └────────────────────────────┘  │ │ 🥈 2. @social_butterfly     │  │
│ ┌────────────────────────────┐  │ │    18 referrals, 360 cr   │  │
│ │ QR Code (200×200px)        │  │ │ 🥉 3. @community_star      │  │
│ │ [QR Image]                 │  │ │    12 referrals, 240 cr   │  │
│ └────────────────────────────┘  │ │ ...                        │  │
│ ┌────────────────────────────┐  │ └─────────────────────────────┘  │
│ │ Referral Link              │  │                                  │
│ │ t.me/...?startapp=ref_XXX  │  │                                  │
│ │ [Copy] [Share] [Telegram]  │  │                                  │
│ └────────────────────────────┘  │                                  │
│ ┌────────────────────────────┐  │                                  │
│ │ Reward Info                │  │                                  │
│ │ • 50 credits per signup    │  │                                  │
│ │ • +25 when they generate   │  │                                  │
│ │ • Friend gets 25 credits   │  │                                  │
│ └────────────────────────────┘  │                                  │
└──────────────────────────────────┴───────────────────────────────────┘
```

### Mobile Layout (Single Column)

```
┌──────────────────────────┐
│ HEADER: Invite Friends   │
├──────────────────────────┤
│ Referral Stats           │
│ ┌────────┐ ┌────────┐    │
│ │ 15 Clicks│ │ 3 Signups│   │
│ └────────┘ └────────┘    │
├──────────────────────────┤
│ QR Code                  │
│ ┌──────────────────────┐ │
│ │   [  QR Image  ]     │ │
│ │    200×200px         │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│ Referral Link            │
│ t.me/...?startapp=ref_123│
│ ┌──┬──┬──┐              │
│ │Copy│Share│TG │        │
│ └──┴──┴──┘              │
├──────────────────────────┤
│ Reward Info              │
│ • 50 credits per signup  │
│ • +25 when they generate │
│ • Friend gets 25 credits │
├──────────────────────────┤
│ 🏆 Referral Leaderboard  │
│ 🥇 @inviter_pro (25)     │
│ 🥈 @social_star (18)     │
│ 🥉 @community_guru (12)  │
│ ...                      │
└──────────────────────────┘
```

## Fields

### Referral Stats Section

| Metric          | Type       | Format | Notes                        |
| --------------- | ---------- | ------ | ---------------------------- |
| Total Clicks    | Number     | "15"   | Total link clicks            |
| Unique Clicks   | Number     | "12"   | Deduplicated clicks          |
| Signups         | Number     | "3"    | Users who registered         |
| Active Users    | Number     | "2"    | Users who generated ≥1 track |
| Conversion Rate | Percentage | "20%"  | Signups / clicks             |
| Credits Earned  | Number     | "175"  | Total from referrals         |
| Pending Credits | Number     | "25"   | Awaiting activation          |

### QR Code Section

| Field           | Type    | Size      | Notes                              |
| --------------- | ------- | --------- | ---------------------------------- |
| QR Image        | QR code | 200×200px | Auto-generated from referral link  |
| Value           | String  | URL       | Unique referral link encoded       |
| Scan Button     | Button  | —         | Opens camera to scan (for testing) |
| Download Button | Button  | —         | Save QR code image                 |

### Referral Link Section

| Field             | Type   | Format            | Notes                                       |
| ----------------- | ------ | ----------------- | ------------------------------------------- |
| Link Display      | Text   | Truncated URL     | `t.me/AIMusicVerseBot/app?startapp=ref_XXX` |
| Copy Button       | Button | Icon + "Copy"     | Copies link to clipboard                    |
| Share Button      | Button | Icon + "Share"    | Native Telegram share dialog                |
| Telegram Button   | Button | Icon + "Telegram" | Share via Telegram message                  |
| Regenerate Button | Button | Icon + "New Link" | Create new referral code                    |

### Reward Info Section

| Reward            | Amount       | Condition                         | Notes                |
| ----------------- | ------------ | --------------------------------- | -------------------- |
| Signup Reward     | 50 credits   | Referred user registers           | Credited immediately |
| Activation Reward | +25 credits  | Referred user generates 1st track | Bonus milestone      |
| Friend Bonus      | 25 credits   | New user signup                   | Credited to new user |
| Milestone Bonus   | +100 credits | 10 successful referrals           | One-time achievement |

### Leaderboard Section

| Rank           | Field        | Format            | Notes                       |
| -------------- | ------------ | ----------------- | --------------------------- |
| #              | Rank Number  | 🥇🥈🥉 or numeric | Top 3 special icons         |
| Username       | Display Name | "@username"       | Clickable to view profile   |
| Referrals      | Number       | "25"              | Total successful referrals  |
| Credits Earned | Number       | "500"             | Total from referral program |
| Join Date      | Date         | "Joined Jan 2025" | When user started referring |

---

## Interactions

### Page Load

**Behavior:**

1. Generate or fetch user's referral code via `useReferralLink()`:
   - Check existing referral code
   - Generate new code if none exists
   - Build full referral URL
2. Fetch referral statistics via `useReferralStats()`:
   - Click count (unique)
   - Signup count
   - Active user count
   - Credits earned
3. Fetch referral leaderboard via `useReferralLeaderboard()`:
   - Top 20 referrers
   - User's current rank
4. Generate QR code from referral URL
5. Render all sections
6. Setup Telegram back button

**API Calls:**

- `GET /api/referrals/code` — Get or create referral code
- `GET /api/referrals/stats` — User's referral statistics
- `GET /api/referrals/leaderboard?limit=20` — Top referrers

### Copy Referral Link

**Trigger:** Click "Copy" button

**Behavior:**

1. Copy referral link to clipboard
2. Show "Link copied!" toast
3. Haptic feedback (light impact)
4. Track copy event for analytics

**Implementation:**

- Uses `navigator.clipboard.writeText()`
- Fallback for older browsers
- Toast notification via sonner

### Share via Telegram

**Trigger:** Click "Share" or "Telegram" button

**Behavior:**

1. Open Telegram share dialog via WebApp SDK
2. Pre-fill message with app description and referral link
3. User selects chat(s) to send
4. Track share event
5. On send: Record share analytics

**Message Template:**

```
🎵 Create music with AI!

Join MusicVerse and generate your own tracks using AI.
Get 25 free credits when you sign up!

🔗 {referral_link}
```

### Regenerate Referral Code

**Trigger:** Click "New Link" button

**Behavior:**

1. Show confirmation dialog: "Generate new referral code? Old link will stop working."
2. User confirms
3. Call API to create new code
4. Update UI with new link and QR code
5. Show "New link generated!" toast

**API Calls:**

- `POST /api/referrals/regenerate` — Create new referral code

**Special Rules:**

- Old codes remain valid for existing clicks (grace period)
- Cannot regenerate more than once per day (rate limit)
- New code immediately active

### Leaderboard Interactions

**View User Profile:**

- **Trigger:** Click username on leaderboard
- **Behavior:** Navigate to user's public profile

**Refresh Leaderboard:**

- **Trigger:** Pull-to-refresh or click refresh button
- **Behavior:** Fetch latest rankings, update display

## API Dependencies

| API                    | Method | Path                       | Trigger             | Notes                        |
| ---------------------- | ------ | -------------------------- | ------------------- | ---------------------------- |
| Get Referral Code      | GET    | /api/referrals/code        | Page load           | Returns existing or new code |
| Generate Referral Code | POST   | /api/referrals/code        | First visit         | Creates new referral code    |
| Get Referral Stats     | GET    | /api/referrals/stats       | Page load           | Clicks, signups, credits     |
| Get Leaderboard        | GET    | /api/referrals/leaderboard | Page load           | Top 20 referrers             |
| Regenerate Code        | POST   | /api/referrals/regenerate  | "New Link" button   | Creates new code             |
| Track Click            | POST   | /api/referrals/click       | External link click | Records click event          |
| Validate Referral      | POST   | /api/referrals/validate    | During signup       | Checks code validity         |

## Page Relationships

**From:**

- `/` (Home) → Click "Refer Friends" button
- `/rewards` → Click "Invite Friends" in streak bonus section
- Deep link → Direct navigation to referral page

**To:**

- `/profile/{userId}` → Click username on leaderboard
- `/buy-credits` → Click "Get Credits" if want to purchase instead

**Data Coupling:**

- Credits balance: Updates referral earnings in real-time (visible globally)
- User notifications: Referral signup/activation events trigger notifications

## Business Rules

1. **Referral Code System:**
   - Format: 6-character alphanumeric string (e.g., "ABC123")
   - Case-insensitive (normalized to uppercase)
   - Unique per user (one active code at a time)
   - No expiry (active indefinitely)

2. **Credit Rewards:**
   - Signup reward: 50 credits to referrer (immediate)
   - Friend bonus: 25 credits to new user (on signup)
   - Activation bonus: +25 credits to referrer (on first track generation)
   - Total per active referral: 75 credits to referrer + 25 to friend

3. **Tracking and Validation:**
   - Click tracking: Deduplicated by IP/user agent (24-hour window)
   - Signup attribution: Last-click attribution model
   - Self-referral: Not allowed (same IP/device detection)

4. **Leaderboard Rules:**
   - Ranked by successful referrals count (not clicks)
   - Updated hourly (not real-time)
   - Top 20 displayed

5. **Privacy and Consent:**
   - Referrer username visible to referred user
   - Opt-out: Users can disable referral program in settings

---

**Next:** [Buy Credits Page](./33-buy-credits.md) → Credit purchase system
