# Rewards

> **Route:** `/rewards`  
> **Module:** Rewards & Growth  
> **Generated:** 2026-06-27

## Overview

The Rewards page is the gamification center of MusicVerse AI, designed to increase user engagement through daily check-ins, achievements, leaderboards, challenges, and credit rewards. Users can track their progress, earn credits through various activities, compete with other creators, and maintain engagement streaks.

**Primary Use Cases:**

- Daily check-in to collect bonus credits
- Track achievements and unlock badges
- Compete on leaderboards with other creators
- Complete daily missions and weekly challenges
- Monitor credit balance and transaction history
- Maintain activity streaks for multiplier bonuses

## Layout

### Desktop Layout (Tabbed Interface)

```
┌────────────────────────────────────────────────────────────────────┐
│  HEADER: "Rewards & Achievements" + Credits Balance Display        │
├────────────────────────────────────────────────────────────────────┤
│  TABS: [Overview] [Achievements] [Leaderboard] [History]          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─ OVERVIEW TAB ───────────────────────────────────────────────┐  │
│  │ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐        │  │
│  │ │ Daily Checkin │ │ User Level    │ │ Quick Stats   │        │  │
│  │ │ (Calendar)    │ │ (XP Progress) │ │ (Credits/Gen) │        │  │
│  │ └───────────────┘ └───────────────┘ └───────────────┘        │  │
│  │                                                                │  │
│  │ ┌───────────────┐ ┌───────────────┐                          │  │
│  │ │ Daily Missions │ │Weekly Challenges│                          │  │
│  │ │ (3 missions)  │ │ (1 challenge) │                          │  │
│  │ └───────────────┘ └───────────────┘                          │  │
│  │                                                                │  │
│  │ ┌────────────────────────────────────────────┐              │  │
│  │ │ Streak Calendar (30 days)                  │              │  │
│  │ │ ○ ● ● ○ ● ● ● ○ ○ ● ● ● ● ● ○ ○ ○ ● ● ●     │              │  │
│  │ └────────────────────────────────────────────┘              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─ ACHIEVEMENTS TAB ──────────────────────────────────────────┐  │
│  │ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐        │  │
│  │ │ 🏆 First Track │ │ 🎯 10 Tracks  │ │ ⭐ Creator    │        │  │
│  │ │ ✓ Completed   │ │ ⬜ Unlock      │ │ ⬜ Unlock      │        │  │
│  │ └───────────────┘ └───────────────┘ └───────────────┘        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─ LEADERBOARD TAB ────────────────────────────────────────────┐  │
│  │ 🥇 1. @creator_pro     1,234 XP  156 tracks                  │  │
│  │ 🥈 2. @music_master     987 XP   142 tracks                  │  │
│  │ 🥉 3. @beat_maker       876 XP   128 tracks                  │  │
│  │ ...                                                          │  │
│  └────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (Single Column Scroll)

```
┌──────────────────────────┐
│ HEADER: Rewards           │
│ Credits: 125              │
├──────────────────────────┤
│ Quick Stats              │
│ ┌────────┐ ┌────────┐    │
│ │ 15 Gen │ │ 7 Day  │    │
│ │ 3 Day  │ │ Streak  │    │
│ └────────┘ └────────┘    │
├──────────────────────────┤
│ Daily Checkin            │
│ [Collect 5 Credits]      │
├──────────────────────────┤
│ Daily Missions           │
│ ⬜ Generate 1 track (+2)  │
│ ✓ Like 5 tracks (+1)     │
│ ⬜ Share 1 track (+3)     │
├──────────────────────────┤
│ User Level               │
│ ████████░░ 80% to Level 5│
├──────────────────────────┤
│ Streak Calendar          │
│ ● ● ○ ● ● ● ● ●          │
├──────────────────────────┤
│ [View Achievements]      │
│ [View Leaderboard]       │
└──────────────────────────┘
```

## Fields

### Quick Stats Section

| Metric             | Type              | Format          | Notes                     |
| ------------------ | ----------------- | --------------- | ------------------------- |
| Credits Balance    | Number            | "125"           | Current available credits |
| Total Generations  | Number            | "15"            | Lifetime track count      |
| Weekly Generations | Number            | "3"             | Tracks this week          |
| Current Streak     | Number            | "7 days"        | Consecutive days active   |
| User Level         | Number + Progress | "Level 4 (80%)" | XP-based level system     |
| XP to Next Level   | Number            | "200 XP"        | Remaining XP needed       |

### Daily Checkin Section

| Field          | Type        | Behavior                | Notes                                     |
| -------------- | ----------- | ----------------------- | ----------------------------------------- |
| Calendar       | 30-day grid | Shows checkin history   | Filled circles = completed                |
| Collect Button | Button      | Awards daily credits    | 5 credits base, 10 bonus for 7-day streak |
| Streak Bonus   | Badge       | Multiplies rewards      | 7-day streak: 2×, 30-day: 3×              |
| Last Checkin   | Timestamp   | "Last: Today, 10:30 AM" | Shows last collection time                |

### Daily Missions Section

| Mission             | Type    | Reward     | Status | Notes                          |
| ------------------- | ------- | ---------- | ------ | ------------------------------ |
| Generate 1 Track    | Counter | +2 credits | ⬜ 0/1 | Completes on generation finish |
| Like 5 Tracks       | Counter | +1 credit  | ✓ 5/5  | Accumulates across sessions    |
| Share 1 Track       | Binary  | +3 credits | ⬜ 0/1 | Share via Telegram             |
| Comment on 2 Tracks | Counter | +2 credits | ⬜ 0/2 | Post comments on public tracks |
| Remix 1 Track       | Binary  | +4 credits | ⬜ 0/1 | Use remix feature              |

### Weekly Challenges Section

| Challenge        | Type          | Reward      | Duration | Notes                       |
| ---------------- | ------------- | ----------- | -------- | --------------------------- |
| Genre Explorer   | Multi-step    | +15 credits | 7 days   | Generate 5 different genres |
| Quality Master   | Quality-based | +20 credits | 7 days   | Get 100 likes on tracks     |
| Social Butterfly | Social        | +10 credits | 7 days   | Follow 10 creators          |

### User Level Section

| Field          | Type         | Calculation                          | Notes                 |
| -------------- | ------------ | ------------------------------------ | --------------------- |
| Current Level  | Number       | Based on total XP                    | Levels 1-100          |
| XP Progress    | Progress bar | (current_xp / level_threshold) × 100 | Visual percentage     |
| XP to Next     | Number       | level_threshold - current_xp         | Remaining XP          |
| Level Benefits | List         | Unlocks at level                     | New features, bonuses |

### Achievements Section

| Achievement  | Icon | Criteria               | Reward | Status     |
| ------------ | ---- | ---------------------- | ------ | ---------- |
| First Track  | 🏆   | Generate 1st track     | +5 XP  | ✓ Complete |
| 10 Tracks    | 🎯   | Generate 10 tracks     | +10 XP | ⬜ 7/10    |
| 100 Likes    | ⭐   | Get 100 total likes    | +20 XP | ⬜ 34/100  |
| Week Streak  | 🔥   | 7-day checkin streak   | +15 XP | ✓ Complete |
| Genre Master | 🎸   | Generate all 10 genres | +50 XP | ⬜ 4/10    |
| Social Star  | 👥   | 50 followers           | +25 XP | ⬜ 12/50   |

### Leaderboard Section

| Rank   | Field           | Format            | Notes                     |
| ------ | --------------- | ----------------- | ------------------------- |
| #      | Rank Number     | 🥇🥈🥉 or numeric | Top 3 get special icons   |
| User   | Username        | Display name      | Clickable to view profile |
| XP     | Number          | "1,234 XP"        | Total experience points   |
| Tracks | Number          | "156"             | Total track count         |
| Level  | Number          | "Level 12"        | Current user level        |
| Change | Trend indicator | ↑↓ →              | Movement since yesterday  |

### Transaction History Section

| Date       | Action          | Amount | Type   | Notes               |
| ---------- | --------------- | ------ | ------ | ------------------- |
| 2026-06-27 | Daily Checkin   | +5     | Earned | Streak bonus ×2     |
| 2026-06-27 | Mission: Like 5 | +1     | Earned | Daily mission       |
| 2026-06-26 | Generate Track  | -5     | Spent  | Standard generation |
| 2026-06-26 | Achievement     | +10    | Earned | 10 tracks milestone |

---

## Interactions

### Page Load

**Behavior:**

1. Fetch user's reward data via `useRewards()`:
   - Current credits balance
   - XP and level progress
   - Achievement status
   - Checkin streak data
2. Fetch daily missions via `useDailyMissions()`:
   - Current progress
   - Completion status
   - Rewards available
3. Fetch leaderboard via `useLeaderboard()`:
   - Top 100 users by XP
   - User's current rank
   - Rank change from yesterday
4. Fetch transaction history via `useTransactionHistory()`:
   - Last 50 transactions
   - Paginated
5. Calculate streak bonus multiplier
6. Determine available challenges
7. Render appropriate sections

**API Calls:**

- `GET /api/rewards/summary` — Credits, XP, level, streak
- `GET /api/rewards/missions` — Daily missions and progress
- `GET /api/rewards/achievements` — Achievement status
- `GET /api/rewards/leaderboard?limit=100` — Top users
- `GET /api/rewards/transactions?limit=50` — Transaction history

### Daily Checkin

**Trigger:** Click "Collect Daily Reward" button

**Conditions:**

- User hasn't checked in today (UTC day)
- User is authenticated

**Behavior:**

1. Show checkin animation (confetti, sound)
2. Award base credits (5 credits)
3. Check for streak bonus:
   - 7-day streak: +10 bonus credits (2×)
   - 30-day streak: +25 bonus credits (5×)
4. Update streak counter
5. Mark today as checked in
6. Show "Earned X credits!" toast
7. Update UI immediately (optimistic update)
8. Call API to record checkin
9. Haptic feedback (notification pattern)

**API Calls:**

- `POST /api/rewards/checkin` — Record checkin, award credits

**Special Rules:**

- One checkin per calendar day (UTC)
- Streak resets if missed day
- Maximum streak bonus: 5× (30+ days)
- Checkin available at midnight UTC

### Complete Mission

**Trigger:** Complete mission action (generate track, like, etc.)

**Behavior:**

1. Update mission progress automatically
2. Check if mission now complete
3. If complete:
   - Show "Mission Complete!" animation
   - Award reward credits
   - Show toast: "+X credits"
   - Mark as complete in UI
4. Update other missions that share progress
5. Check for achievement unlocks

**Mission Tracking:**

- **Generate Track:** Auto-tracked via generation API
- **Like Track:** Auto-tracked via like API
- **Share Track:** Tracked via Telegram share callback
- **Comment:** Tracked via comment API
- **Remix:** Tracked via remix API

**API Calls:**

- `POST /api/rewards/missions/{id}/complete` — Mark mission complete
- `GET /api/rewards/missions` — Refresh all missions

### Achievement Unlock

**Trigger:** Meet achievement criteria

**Behavior:**

1. Detect achievement completion (server-side check)
2. Show achievement unlock modal:
   - Large achievement icon
   - Achievement name
   - Reward amount
   - "Congratulations!" animation
3. Award XP (and credits if applicable)
4. Add to user's achievement collection
5. Show in achievements list with checkmark
6. Enable share to Telegram (optional)
7. Update user level if XP threshold crossed

**API Calls:**

- `POST /api/rewards/achievements/{id}/unlock` — Unlock achievement
- `GET /api/rewards/summary` — Refresh XP and level

**Notification:**

- Push notification via Telegram (if enabled)
- In-app celebration animation
- Sound effect (achievement unlock jingle)

### Leaderboard Navigation

**Trigger:** Click leaderboard tabs or rows

**Options:**

- **Global Leaderboard:** All users (default)
- **Weekly Leaderboard:** This week's top performers
- **Friends Leaderboard:** Friends only (if following enabled)

**Behavior:**

1. Switch to selected leaderboard view
2. Fetch relevant rankings
3. Highlight user's current row
4. Show user's rank change (↑↓→)
5. Enable pull-to-refresh for updates

**Refresh Frequency:**

- Auto-refresh every 60 seconds
- Manual pull-to-refresh
- Real-time updates via WebSocket (if available)

### Transaction History

**Trigger:** Click "History" tab

**Behavior:**

1. Fetch last 50 transactions
2. Group by date
3. Color-code:
   - Green: Earned credits
   - Red: Spent credits
   - Blue: Transfers/purchases
4. Show running balance
5. Infinite scroll for older transactions
6. Filter by type (earned/spent/all)

**Transaction Types:**

- Daily checkin
- Mission completion
- Achievement unlock
- Track generation
- Credit purchase
- Subscription purchase
- Referral bonus
- Admin adjustment

### XP and Level Progress

**XP Sources:**

| Action             | XP        | Notes                                  |
| ------------------ | --------- | -------------------------------------- |
| Generate Track     | +10 XP    | Per track                              |
| Complete Mission   | +5 XP     | Per mission                            |
| Unlock Achievement | +20-50 XP | Based on rarity                        |
| 7-Day Streak       | +15 XP    | Weekly                                 |
| Get Like on Track  | +1 XP     | Per like (max 100/day)                 |
| Referral           | +100 XP   | When referred user generates 1st track |

**Level Thresholds:**

- Level 1-10: 100 XP per level
- Level 11-30: 200 XP per level
- Level 31-60: 300 XP per level
- Level 61-100: 500 XP per level

**Level Benefits:**

| Level | Benefit               | Description             |
| ----- | --------------------- | ----------------------- |
| 5     | Unlock custom genres  | Access to genre presets |
| 10    | +10% generation speed | Faster music creation   |
| 20    | Priority support      | Skip queue              |
| 30    | Custom voice cloning  | 5 free voice clones     |
| 50    | PRO features unlocked | Advanced tools          |
| 100   | Verified badge        | Creator verification    |

### Streak Calendar

**Display:**

- 30-day grid (4 rows × 7 days + 2 extras)
- Current day highlighted
- Completed days: filled circle
- Missed days: empty circle
- Current streak: animated line

**Interactions:**

- Tap day to see checkin time
- Long-press for transaction details
- Streak counter with multiplier

**Streak Bonuses:**

- 3 days: 1.5× multiplier
- 7 days: 2× multiplier
- 14 days: 2.5× multiplier
- 30 days: 3× multiplier
- 60 days: 4× multiplier
- 100 days: 5× multiplier

### Share Achievement

**Trigger:** Click "Share" on achievement or leaderboard rank

**Behavior:**

1. Generate share card image
2. Open Telegram share dialog
3. Pre-fill message: "🏆 Just unlocked [Achievement] in MusicVerse AI!"
4. Include app deep link
5. Track share event for analytics

**Share Formats:**

- Achievement card with icon
- Leaderboard position
- Level-up celebration
- Milestone reached

## API Dependencies

| API                     | Method | Path                                  | Trigger            | Notes                         |
| ----------------------- | ------ | ------------------------------------- | ------------------ | ----------------------------- |
| Get Rewards Summary     | GET    | /api/rewards/summary                  | Page load          | Credits, XP, level, streak    |
| Get Daily Missions      | GET    | /api/rewards/missions                 | Page load, refresh | Current missions and progress |
| Get Achievements        | GET    | /api/rewards/achievements             | Page load          | All achievements and status   |
| Get Leaderboard         | GET    | /api/rewards/leaderboard              | Tab switch         | Top 100 users                 |
| Get Transaction History | GET    | /api/rewards/transactions             | History tab        | Last 50 transactions          |
| Checkin                 | POST   | /api/rewards/checkin                  | Checkin button     | Record daily checkin          |
| Complete Mission        | POST   | /api/rewards/missions/{id}/complete   | Mission complete   | Award mission reward          |
| Unlock Achievement      | POST   | /api/rewards/achievements/{id}/unlock | Achievement met    | Unlock and reward             |
| Share Achievement       | POST   | /api/rewards/share                    | Share button       | Track share event             |

## Page Relationships

**From:**

- `/` (Home) → Click "Rewards" in nav or gamification bar
- Deep link → `t.me/AIMusicVerseBot/app?startapp=rewards` opens rewards
- Push notification → "Daily reward ready!" click

**To:**

- `/profile` → Click username on leaderboard
- `/buy-credits` → Click "Get Credits" in insufficient balance warning
- `/referral` → Click "Invite Friends" in streak bonus section
- `/library` → Click "View Tracks" in stats

**Data Coupling:**

- Credits balance: Updates globally (home, library, generate form)
- Achievement unlocks: Can trigger notifications on any page
- Daily missions: Progress updated across app (likes, generations)
- Leaderboard rank: Updates in real-time, affects profile display

## Business Rules

1. **Daily Checkin System:**
   - One checkin per calendar day (UTC timezone)
   - Base reward: 5 credits
   - Streak bonus multiplier applies
   - Streak resets if day missed
   - Checkin time recorded for fraud prevention

2. **Mission Rewards:**
   - Daily missions reset at midnight UTC
   - Maximum 5 missions per day
   - Missions cannot be repeated
   - Progress accumulates across sessions
   - Unclaimed rewards expire after 7 days

3. **Achievement System:**
   - Server-side validation (prevent client-side spoofing)
   - One-time unlock per achievement
   - XP awarded immediately on unlock
   - Achievement visible on profile once unlocked
   - Notification sent for major achievements (100+ XP)

4. **Leaderboard Rules:**
   - Updated every 60 seconds
   - Top 100 displayed on Global tab
   - User's rank always visible (highlighted row)
   - Tie-breaker: Earlier achievement ranks higher
   - Fake users excluded (spam detection)

5. **Streak System:**
   - Consecutive days only (no skips)
   - Grace period: None (strict)
   - Timezone: UTC (universal)
   - Maximum streak bonus: 5× (60+ days)
   - Streak count visible on profile

6. **XP and Leveling:**
   - XP never decreases (no level loss)
   - Level benefits activate immediately
   - XP sources tracked for analytics
   - Maximum level: 100 (endgame content)
   - Level progress visible in profile header

7. **Credit Rewards:**
   - Checkin: 5-30 credits (with multiplier)
   - Missions: 1-5 credits each
   - Achievements: 5-50 credits
   - Referrals: 50 credits per active user
   - Weekly challenges: 10-25 credits

8. **Anti-Abuse Measures:**
   - Rate limiting on checkin (max 1 per day)
   - Mission completion validated server-side
   - Fake achievement detection (statistical analysis)
   - Leaderboard scrubbing (remove cheaters)
   - Streak validation (check timezone consistency)

9. **Notifications:**
   - Daily reminder: 8 PM local time (if not checked in)
   - Achievement unlock: Immediate push
   - Streak milestone: At 7, 30, 60, 100 days
   - Weekly challenge end: Sunday reminder
   - Leaderboard position change: If enter top 10

10. **Mobile Optimizations:**
    - Swipe to refresh leaderboard
    - Pull-to-refresh for all data
    - Haptic feedback on rewards
    - Confetti animation (canvas-confetti)
    - Sound effects (toggleable)
    - Optimistic UI updates

11. **Analytics Tracking:**
    - Mission completion rates
    - Checkin consistency
    - Achievement popularity
    - Leaderboard engagement
    - Streak distribution
    - Credit earning vs. spending ratio

12. **Special Events:**
    - Double XP weekends (occasional)
    - Special challenges (holidays, product launches)
    - Leaderboard tournaments (prize pools)
    - Community achievements (collective goals)
    - Referral events (bonus rewards)

---

**Next:** [Referral Page](./32-referral.md) → User referral program
