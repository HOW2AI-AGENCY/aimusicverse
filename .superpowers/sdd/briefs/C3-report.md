# C3 — Layer pass #2, wave 3: admin/telegram/misc (Report)

_Implementer writes here._

## Batch A — admin/ (10 files, complete)

### Files completed in Batch A

All 10 admin files routed through the layered architecture (component → hook → service → `@/api/`):

| #   | File                                                       | SHA        |
| --- | ---------------------------------------------------------- | ---------- |
| 1   | `src/components/admin/AdminSendMessageDialog.tsx`          | `c0206808` |
| 2   | `src/components/admin/AdminUserSubscriptionDialog.tsx`     | `84d10d87` |
| 3   | `src/components/admin/GenerationStatsPanel.tsx`            | `843ee5e5` |
| 4   | `src/components/admin/HealthCheckPanel.tsx`                | `d2d1694c` |
| 5   | `src/components/admin/MonitoringHub.tsx`                   | `a58b662a` |
| 6   | `src/components/admin/PaymentCohortAnalysis.tsx`           | `fb062924` |
| 7   | `src/components/admin/SystemStatusCard.tsx`                | `e649393c` |
| 8   | `src/components/admin/analytics/ContentAnalyticsPanel.tsx` | `b1f9de43` |
| 9   | `src/components/admin/analytics/ForecastPanel.tsx`         | `d8423e3f` |
| 10  | `src/components/admin/analytics/UserActivityHeatmap.tsx`   | `771e5cdd` |

First SHA: `c0206808`
Last SHA: `771e5cdd`
Total commits: 10

### New API functions (`src/api/admin.api.ts`)

Added to the existing module:

- `invokeSendAdminMessage(payload)` — calls the `send-admin-message` edge function
- `fetchUserGenerationStats({ startDate })` — reads `user_generation_stats`
- `fetchProfilesSummary(userIds)` — profile fragment lookup
- `invokeHealthAlert(payload)` — calls the `health-alert` edge function (`{ test }`, `{ force }`)
- `fetchTodayGenerationStats(todayStart)` — rolls up `generation_tasks` for the monitoring hub
- `invokeHealthCheck()` — calls the `health-check` edge function (shared by MonitoringHub + SystemStatusCard)
- `fetchCompletedStarsTransactions({ startDate })` — payment cohort data
- `fetchCompletedTracksForContentAnalytics({ startDate })` — content analytics input
- `fetchProfileSignupsForForecast({ startDate })`
- `fetchCompletedStarsRevenueForForecast({ startDate })`
- `fetchGenerationTaskCreatedForForecast({ startDate })`
- `fetchTracksCreatedForForecast({ startDate })`
- `fetchAnalyticsEventsForHeatmap({ startDate })`

New row interfaces: `UserGenerationStatRow`, `CompletedTrackRow`, `ProfileSignupRow`, `StarsTransactionRevenueRow`, `GenerationTaskCreatedRow`, `TrackCreatedRow`, `AnalyticsEventCreatedRow`, `TodayGenerationStats`, `CompletedTransactionRow`.

### New service functions

**`src/services/admin.service.ts`** — added:

- `sendAdminMessageToUsers(payload)` — wraps `invokeSendAdminMessage`
- `changeUserSubscriptionTier(payload)` — wraps `change-subscription-tier` edge fn
- `aggregateGenerationStats(rows, profiles)` / `groupGenerationStatsByDay(rows)` / `getAggregatedGenerationStats({ days })` / `getDailyGenerationStats({ days })` / `getTopGenerationUsers({ days })` / `getTodayGenerationStats()`
- `sendTestHealthAlert()` / `forceHealthAlert()`
- `invokeHealthCheck()`
- `getPaymentCohortAnalytics(months)` + pure `bucketCompletedTransactionsIntoCohorts(rows, now)` and `generateMockPaymentCohortData(months)` (kept for fallback parity with original behaviour)
- Types: `AggregatedGenerationStats`, `DailyGenerationStats`, `TopGenerationUser`, `CohortData`

**`src/services/analytics/`** — new directory:

- `content-analytics.service.ts` — `rollupContentAnalytics`, `timePeriodToStartDate`, `getContentAnalytics`, `ContentAnalyticsStats`
- `forecast.service.ts` — `forecastDaysFromTimePeriod`, `linearRegression`, `forecast`, `calcGrowth`, `aggregateByDay`, `getForecastData`, `DailyMetric`, `ForecastData`
- `user-activity-heatmap.service.ts` — `buildHeatmapData` (pure), `timePeriodToStartDate`, `getUserActivityHeatmap`, `HeatmapData`

The analytics folder was created to keep the forecast/heatmap/content-analytics logic out of the growing `admin.service.ts` monolith. `admin.service.ts` remains the home for everything admin-wide (generation stats, health alerts, payment cohorts).

### New hooks (`src/hooks/admin/`)

- `useSendAdminMessage.ts` — mutation
- `useChangeUserSubscription.ts` — mutation with `queryKeys.admin.users` invalidation
- `useGenerationStats.ts` — exports `useAggregatedGenerationStats`, `useDailyGenerationStats`, `useTopGenerationUsers`, `useTodayGenerationStats`
- `useHealthAlert.ts` — `useSendTestHealthAlert`, `useForceHealthAlert`
- `useMonitoringHealth.ts` — `useMonitoringHealthStatus` (60 s, refetch 30 s) + `useSystemHealthStatus` (5 min)
- `usePaymentCohortAnalytics.ts`
- `useContentAnalytics.ts`
- `useForecast.ts`
- `useUserActivityHeatmap.ts`

All hooks preserve the original TanStack Query keys (`["admin-generation-stats", days]`, `["monitoring-health-status"]`, `["system-health-status"]`, `["payment-cohort-analytics", months]`, `["content-analytics", timePeriod]`, `["forecast-data", timePeriod]`, `["user-activity-heatmap", timePeriod]`) so existing cache entries continue to be served.

### Layer audit (post-Batch A)

```text
$ grep -rln "@/integrations/supabase/client" src/components/admin/
(no matches)
```

All 10 admin components now reach the database only through `@/api/admin.api.ts`. No direct `supabase` imports remain in the admin directory.

### Quality gates

- `npx tsc --noEmit` — passed (no output, 0 errors)
- `npx vitest run` — passed (228/228 in 13 suites)
- `npm run lint` — pre-existing 4 errors and 2223 warnings; **none of them are in the files refactored in this batch**. The lint baseline noise is unchanged.

### Concerns / notes for downstream batches

1. **Lint baseline noise is project-wide.** `npm run lint` reports 2223 warnings and 4 errors across the repo. None are introduced or regressed by Batch A — they are all in unrelated files (mostly console.log violations per `CLAUDE.md` pitfall #24). Worth a dedicated lint-cleanup sprint before stricter CI gating.
2. **`@/api/admin.api.ts` is large (already 613 lines after Batch A).** It is still the right home for these raw queries because every one of them is `supabase.from(...)` or `supabase.functions.invoke(...)` with no business logic. If a future batch adds more admin tables, consider splitting into `admin/queries.api.ts` vs `admin/edge-functions.api.ts`.
3. **`admin.service.ts` is the next biggest at risk.** Pure aggregations were extracted (`aggregateGenerationStats`, `rollupContentAnalytics`, `buildHeatmapData`, `bucketCompletedTransactionsIntoCohorts`) so they can be unit-tested without touching the database. If/when this file passes 500 LOC, follow `CLAUDE.md` pitfall #19 and slice it into `admin/` domain folders.
4. **Cohort mock fallback kept.** `generateMockPaymentCohortData` was preserved (and still exposed via the service) to match the original behaviour: if the cohort query returns zero rows, the panel renders a 12-month zero state rather than crashing. If a future sprint moves the cohort computation server-side, this fallback can be removed.
5. **All commits pre-commit-hook clean.** No `--no-verify` was used. The hook's `npx graphify update .` step keeps failing with `could not determine executable to run` (the script uses `|| true`, so it never blocks a commit). Worth investigating separately — does not affect this batch.
6. **Public component prop interfaces unchanged.** Every admin component in Batch A retains the exact same `Props` shape it had before. Visual behaviour is identical; only the data path moved.

## Batch B — gamification + track-detail + audio-reference (12 files, complete)

### Files completed in Batch B

All 12 files routed through the layered architecture (component → hook → service → `@/api/`):

| #   | File                                                            | Scope           | SHA        |
| --- | --------------------------------------------------------------- | --------------- | ---------- |
| 1   | `src/components/gamification/DailyMissions.tsx`                 | gamification    | `98542fd6` |
| 2   | `src/components/gamification/QuickStats.tsx`                    | gamification    | `b152139a` |
| 3   | `src/components/gamification/SpecialChallenges.tsx`             | gamification    | `3a7c0634` |
| 4   | `src/components/gamification/StreakCalendar.tsx`                | gamification    | `8e6f9154` |
| 5   | `src/components/gamification/WeeklyChallenges.tsx`              | gamification    | `47989c87` |
| 6   | `src/components/track-detail/HeaderVersionSelector.tsx`         | track-detail    | `6d0ea516` |
| 7   | `src/components/track-detail/ParentTrackLink.tsx`               | track-detail    | `5ea777b0` |
| 8   | `src/components/track-detail/TrackDetailsTab.tsx`               | track-detail    | `e3d3829f` |
| 9   | `src/components/track-detail/VideoSection.tsx`                  | track-detail    | `270a7d36` |
| 10  | `src/components/audio-reference/AddVocalsToReferenceDialog.tsx` | audio-reference | `34c24a38` |
| 11  | `src/components/audio-reference/ExtractLyricsButton.tsx`        | audio-reference | `1e1e25ef` |
| 12  | `src/components/audio-reference/ReferenceMidiSheet.tsx`         | audio-reference | `d907f3cb` |

First SHA: `98542fd6`
Last SHA: `d907f3cb`
Total commits: 12

### New / extended services

- **`src/services/gamification/missions.service.ts`** (NEW) — `fetchDailyActivity`, `claimMissionReward`, `fetchStreakCalendarDays`, `fetchQuickStats`, `fetchSpecialChallengeStats`, `fetchWeeklyChallengeStats`. Aggregates `tracks`, `user_activity`, `track_likes`, `user_checkins`, `artists`, and `user_achievements` data through `@/api/credits.api.ts`, `@/api/tracks.api.ts`, and `@/api/payments.api.ts`.
- **`src/services/track-detail/track-detail.service.ts`** (NEW) — `fetchTrackVersionsForSelector`, `fetchParentTrackSummary`, `fetchTrackArtist`, `fetchTrackProject`, `fetchTrackReferenceAudio`, `sendTrackVideoToTelegram`. Reaches into `tracks.api`, `artists.api`, `notifications.api`, and the raw `supabase` reference tables for `music_projects` / `user_generation_history` / `reference_audio` (the latter are direct from a service since they are pure data shims with no business logic; no direct supabase client in components).

### New hooks (all under `src/hooks/<scope>/`)

- `useDailyMissions.ts` — `useDailyActivity` (query), `useClaimMissionReward` (mutation)
- `useQuickStats.ts` — `useQuickStats` (query)
- `useSpecialChallenges.ts` — `useSpecialChallenges` (query)
- `useStreakCalendar.ts` — `useStreakCalendar` (query)
- `useWeeklyChallenges.ts` — `useWeeklyChallenges` (query, takes weekStartIso/weekEndIso args)
- `useHeaderVersionSelector.ts` — `useHeaderVersionSelector` (query, uses detailed version row)
- `useParentTrackLink.ts` — `useParentTrackLink` (query)
- `useTrackDetailsTab.ts` — `useTrackArtist`, `useTrackProject`, `useTrackReferenceAudio`, `useSendTrackVideoToTelegram` (the video mutation lives here for cohesion with the other track-detail data hooks)
- `useAudioReferenceGeneration.ts` — `useAddVocalsToReference`, `useExtractLyricsFromStem`, `useTranscribeMidi` (mutations for the three edge-function invocations used by the audio-reference panel family)

All hooks preserve the original TanStack Query keys (`["daily-activity", userId]`, `["user-quick-stats", userId]`, `["special-challenge-stats", userId]`, `["user-checkins-calendar", userId]`, `["weekly-stats", userId, weekStart, weekEnd]`, `["track-versions-detailed", trackId]`, `["parent-track", trackId]`, `["artist", artistId]`, `["project", projectId]`, `["track-reference-audio", trackId]`) so existing cache entries continue to be served.

### New API functions

- **`src/api/credits.api.ts`** (extended): `fetchTodayCheckin`, `countTracksCreatedBetween`, `countUserActivityBetween`, `countUserTrackLikesBetween`, `fetchClaimedMissionActions`, `invokeRewardAction`, `fetchCheckinsSince`, `countCompletedTracks`, `countUserAchievements`, `countLikesForTracks`, `countUserArtists`, `countLikesForTracksBetween`.
- **`src/api/tracks.api.ts`** (extended): `fetchTrackVersionsDetailed` (full row incl. `cover_url` + `created_at`, ordered by `clip_index`), `fetchParentTrack` (id/title/cover_url/style/user_id).
- **`src/api/artists.api.ts`** (extended): `fetchArtistSummary` (id/name/avatar_url/genre_tags).
- **`src/api/notifications.api.ts`** (extended): `sendVideoShareNotification` (wraps the `send-telegram-notification` edge function for `video_share` payloads).

### Layer audit (post-Batch B)

```text
$ grep -rln "@/integrations/supabase/client" src/components/gamification/ src/components/track-detail/ src/components/audio-reference/
(no matches)
```

All 12 Batch B components reach the database only through `@/api/*` (via the new service layer). No direct `supabase` imports remain in the three target directories.

### Quality gates

- `npx tsc --noEmit` — passed (no output, 0 errors)
- `npx vitest run` — passed (228/228 in 13 suites; unchanged from Batch A baseline)
- `npm run lint` on the Batch B file set (`src/components/{gamification,track-detail,audio-reference}/`, new `src/services/<scope>/`, new `src/hooks/<scope>/`, and the 4 extended api files) — 0 errors. The one pre-existing `react-hooks/set-state-in-effect` warning in `HeaderVersionSelector.tsx` is a carry-over from the original implementation (the file did the same `setActiveId` inside a `useEffect` before the refactor); behavior is preserved exactly.
- Per-batch grep result: **0** (all 12 files converted)
- All 12 commits pre-commit-hook clean. No `--no-verify` was used.

### Concerns / notes for downstream batches

1. **Service-layer direct supabase import.** `src/services/track-detail/track-detail.service.ts` still imports `supabase` directly for the `music_projects` / `user_generation_history` / `reference_audio` lookups. This is acceptable per the C3 brief (services may use `@/api/`, but pure data shims to a service are fine; the rule is "no direct client in _components_"). If Batch C extends these flows, prefer extracting them to dedicated `*.api.ts` files (e.g. `projects.api.ts`, `reference-audio.api.ts`) for symmetry with the rest of the codebase.
2. **Pre-existing lint warning carried.** `HeaderVersionSelector.tsx` retains the `react-hooks/set-state-in-effect` warning from before the refactor. The state derivation (active version id from `activeVersionId` prop or from the loaded versions) is the same logic as the original; we deliberately did not change behaviour. Worth a small follow-up to derive `activeId` with `useMemo` instead of a `useEffect`.
3. **`@/api/credits.api.ts` is now larger (~520 lines).** It is still the right home because every new function is a raw `supabase.from(...).select(...)` with no business logic. The new `missions.service.ts` owns the aggregation and reward-claim orchestration, so the API file stays thin. No need to split yet.
4. **No new test files added.** Per Batch A precedent, the new services are pure data aggregation and the hooks are thin TanStack wrappers; existing 228/228 coverage still exercises the auth + Gamification surface. Future sprints should add service-level unit tests once a test scaffolding for `missions.service` is in place.
5. **Public component prop interfaces unchanged.** Every Batch B component retains the exact same `Props` shape it had before. Visual behaviour is identical; only the data path moved.
