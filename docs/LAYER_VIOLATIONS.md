# Layer Violations — Sprint 039

**Создано:** 2026-06-30  
**Аудит:** `grep -rn "supabase\.(from|rpc|auth\.|storage\.)" src/components/ src/pages/ src/stores/`  
**Всего нарушений:** 109 в 54 файлах

> Нарушение = вызов Supabase напрямую за пределами `src/api/` директории.  
> Правило: все операции с БД и Storage должны проходить через `src/api/*.api.ts`.

---

## Статус по категориям

| Категория | Файлов | Строк | Статус |
|-----------|--------|-------|--------|
| Storage upload/download | 15 | ~30 | 🔴 TODO |
| Auth (getUser/getSession) | 12 | ~12 | 🔴 TODO |
| Data reads (select) | 14 | ~25 | 🔴 TODO |
| Data writes (insert/update/delete) | 12 | ~20 | 🔴 TODO |
| RPC calls | 5 | ~8 | 🔴 TODO |
| Realtime subscriptions | 1 | ~3 | 🔴 TODO |
| **Итого** | **54** | **109** | |

---

## Категория 1: Storage (30 нарушений, 15 файлов)

> API готов: `src/api/storage.api.ts` — `uploadFile`, `deleteFile`, `listFiles`, `getPublicUrl`

| Файл | Строки | Bucket | Операции | Фикс |
|------|--------|--------|----------|------|
| `components/settings/AvatarUpload.tsx` | 50,60,89,93 | avatars | upload, getPublicUrl, list, remove | → `uploadFile`, `getPublicUrl`, `listFiles`, `deleteFile` |
| `components/profile/setup/ProfileSetupStep1Basic.tsx` | 39,45 | avatars | upload, getPublicUrl | → `uploadFile` |
| `components/profile/setup/ProfileSetupStep4Banner.tsx` | 39,45 | avatars | upload, getPublicUrl | → `uploadFile` |
| `components/profile/ImageGeneratorDialog.tsx` | 135,144 | avatars | upload, getPublicUrl | → `uploadFile` |
| `components/onboarding/ProfileSetupOnboarding.tsx` | 156,162 | avatars | upload, getPublicUrl | → `uploadFile` |
| `components/project/ProjectCoverEditor.tsx` | 66,76 | project-assets | upload, getPublicUrl | → `uploadFile` |
| `components/project/ProjectBannerEditor.tsx` | 255,264 | project-banners | upload, getPublicUrl | → `uploadFile` |
| `components/artist/ArtistAvatarUpload.tsx` | 54 | project-assets | getPublicUrl | → `getPublicUrl` |
| `components/generate-form/AudioActionDialog.tsx` | 252 | project-assets | getPublicUrl | → `getPublicUrl` |
| `components/cloud/UploadDialog.tsx` | 40,46,81,87 | reference-audio | upload x2, getPublicUrl x2 | → `uploadFile` x2 |
| `components/studio/unified/RecordTrackDrawer.tsx` | 297,304 | reference-audio | upload, getPublicUrl | → `uploadFile` |
| `components/studio/unified/ImportAudioDialog.tsx` | 172,186 | project-assets | upload, getPublicUrl | → `uploadFile` |
| `components/audio-record/AudioRecordDialog.tsx` | 239 | audio | getPublicUrl | → `getPublicUrl` |
| `components/lyrics-workspace/AudioReferenceRecorder.tsx` | 257 | audio-references | getPublicUrl | → `getPublicUrl` |
| `components/admin/AdminBotImagesPanel.tsx` | 181,184,191,225 | bot-assets | remove, upload, getPublicUrl, remove | → `deleteFile`, `uploadFile`, `getPublicUrl` |
| `components/admin/BroadcastPanel.tsx` | 42 | broadcast | getPublicUrl | → `getPublicUrl` |

---

## Категория 2: Auth (12 нарушений, 12 файлов)

> Фикс в компонентах: `const { user } = useAuth()` вместо `await supabase.auth.getUser()`  
> Фикс в сторах: передавать `userId` параметром из компонента

| Файл | Строки | Операция | Фикс |
|------|--------|----------|------|
| `components/generate-form/AudioActionDialog.tsx` | 235 | `auth.getUser()` | → `useAuth()` |
| `components/admin/AdminBotImagesPanel.tsx` | 128,163,214 | `auth.getUser()` x3 | → `useAuth()` |
| `components/project/ProjectBannerEditor.tsx` | 250 | `auth.getUser()` | → `useAuth()` |
| `components/studio/unified/ImportAudioDialog.tsx` | 162 | `auth.getUser()` | → `useAuth()` |
| `components/studio/unified/StudioArrangementDialog.tsx` | 80 | `auth.getSession()` | → `useAuth()` |
| `components/studio/hooks/useEnhancedStudioLogger.ts` | 133 | `auth.getUser()` | → `useAuth()` |
| `components/comments/ReportCommentDialog.tsx` | 49 | `auth.getUser()` | → `useAuth()` |
| `components/onboarding/ProfileSetupOnboarding.tsx` | 452 | `auth.getUser()` | → `useAuth()` |
| `components/stem-studio/ExtendDialog.tsx` | 44 | `auth.getUser()` | → `useAuth()` |
| `components/stem-studio/TrimDialog.tsx` | 157 | `auth.getUser()` | → `useAuth()` |
| `components/stem-studio/RemixDialog.tsx` | 60 | `auth.getUser()` | → `useAuth()` |
| `pages/Pricing.tsx` | 120 | `auth.getSession()` | → `useAuth()` |
| `components/popups/SubscriptionUpgradePopup.tsx` | 96 | `auth.getSession()` | → `useAuth()` |
| `stores/studio/useProjectStore.ts` | 65 | `auth.getUser()` | → передавать userId параметром |

---

## Категория 3: Data Reads (25 нарушений, 14 файлов)

| Файл | Строки | Таблица | Существующий API | Нужен новый? |
|------|--------|---------|-----------------|--------------|
| `components/track-actions/UnifiedTrackSheet.tsx` | 92 | stem_transcriptions (select) | — | ✅ `studio.api.fetchStemTranscriptions` (добавлено) |
| `components/project/TrackVersionsPanel.tsx` | 70 | track_stems (select) | `studio.api.fetchTrackStems` ✅ | — |
| `components/project/TrackVersionsPanel.tsx` | 82 | stem_transcriptions (select) | — | ✅ `studio.api.fetchStemTranscriptions` (добавлено) |
| `components/project/TrackVersionsPanel.tsx` | 94 | guitar_recordings (select) | `studio.api.fetchGuitarAnalysis` ✅ | — |
| `components/studio/unified/StudioNotationPanel.tsx` | 173,174 | stem_transcriptions (select) | — | ✅ `studio.api.fetchStemTranscriptions` (добавлено) |
| `components/studio/unified/StudioTranscriptionPanel.tsx` | 114 | track_stems (select) | `studio.api.fetchTrackStems` ✅ | — |
| `components/gamification/WeeklyChallenges.tsx` | 56 | tracks (select) | `tracks.api.fetchTracks` ✅ | — |
| `components/gamification/SpecialChallenges.tsx` | 41 | tracks (select) | `tracks.api.fetchTracks` ✅ | — |
| `components/gamification/SpecialChallenges.tsx` | 55 | user_credits (select) | `credits.api.fetchUserCredits` ✅ | — |
| `components/home/AddToPlaylistSheet.tsx` | 48 | playlist_tracks (select) | — | ✅ `playlists.api.fetchPlaylistsContainingTrack` (добавлено) |
| `components/artist/ArtistDetailsPanel.tsx` | 43,74 | profiles, tracks (select) | `tracks.api.fetchTracks` ✅ | ✅ `profiles.api.fetchPublicProfile` (создан) |
| `components/track-detail/TrackVersionsTab.tsx` | 66 | tracks (select) | `tracks.api.fetchTrackById` ✅ | — |
| `pages/PublicProfilePage.tsx` | 127,128 | user_credits, tracks (select) | `credits.api.fetchUserCredits` ✅, `tracks.api.fetchTracks` ✅ | — |
| `pages/ReferenceAudioDetail.tsx` | 129 | reference_audio (select) | — | ✅ `recordings.api.fetchReferenceAudioById` (добавлено) |
| `pages/admin/Feedback.tsx` | 106 | user_feedback (select) | — | ✅ `admin.api.fetchUserFeedback` (добавлено) |
| `components/admin/analytics/ComparisonPanel.tsx` | 46,55 | profiles, generation_tasks (select) | `generation.api.fetchGenerationLogs` ✅ | ✅ `profiles.api.fetchProfileCount` (добавлено) |
| `components/admin/analytics/ConversionFunnelPanel.tsx` | 37,40,43 | profiles, tracks (select) | `tracks.api.fetchTracks` ✅ | ✅ `profiles.api` |
| `components/admin/analytics/RealTimeMetrics.tsx` | 45,54,57 | generation_tasks, tracks, profiles (select) | частично ✅ | ✅ `profiles.api` |
| `components/admin/analytics/RevenueAnalyticsPanel.tsx` | 68 | profiles (select) | — | ✅ `profiles.api` |
| `components/admin/StarsPaymentsPanel.tsx` | 64 | stars_transactions (select) | `payments.api.getStarsTransactions` ✅ | — |
| `stores/studio/useProjectStore.ts` | 143 | studio_projects (select) | — | ✅ `studio.api.fetchStudioProject` (добавлено) |

---

## Категория 4: Data Writes (20 нарушений, 13 файлов)

| Файл | Строки | Таблица | Операция | API |
|------|--------|---------|----------|-----|
| `components/track-actions/EditableTrackTitle.tsx` | 69 | tracks | update title | `tracks.api.updateTrack` ✅ |
| `components/track-detail/sections/TrackRemixToggle.tsx` | 31 | tracks | update allow_remix | `tracks.api.updateTrack` ✅ |
| `components/GlobalGenerationIndicator.tsx` | 28,33,52 | generation_tasks, tracks | delete, delete, update | ✅ `generation.api.deleteGenerationTask` (добавлено), `tracks.api.deleteTrack` ✅, `generation.api.dismissGenerationTask` (добавлено) |
| `components/project/ProjectCoverEditor.tsx` | 132 | music_projects | update cover_url=null | `projects.api.updateProject` ✅ |
| `components/project/ProjectSettingsSheet.tsx` | 78 | music_projects | update | `projects.api.updateProject` ✅ |
| `components/onboarding/ProfileSetupOnboarding.tsx` | 118,167 | user_notification_settings, profiles | upsert, update | `notifications.api.upsertNotificationSettings` ✅, ✅ `profiles.api.updateUserProfile` (создан) |
| `components/prompt-dj/PromptDJMixer.tsx` | 230 | reference_audio | insert | ✅ `recordings.api.insertReferenceAudio` (добавлено) |
| `components/comments/ReportCommentDialog.tsx` | 55 | moderation_reports | insert | ✅ `admin.api.reportContent` (добавлено) |
| `components/player/QueueSheet.tsx` | 166 | playlist_tracks | insert | `playlists.api.addTrackToPlaylist` ✅ |
| `components/admin/QuickActionsPanel.tsx` | 81 | credit_transactions | insert | `payments.api.insertCreditTransaction` ✅ |
| `components/admin/AdminUserSubscriptionDialog.tsx` | 90 | credit_transactions | insert | `payments.api.insertCreditTransaction` ✅ |
| `components/admin/AdminUserCreditsDialog.tsx` | 54,74 | user_credits, credit_transactions | insert | `payments.api.upsertUserCredits` ✅, `payments.api.insertCreditTransaction` ✅ |
| `components/studio/hooks/useEnhancedStudioLogger.ts` | 148 | track_change_log | insert | `studio.api.logTrackActivity` ✅ |
| `pages/Templates.tsx` | 71 | prompt_templates | delete | ✅ `presets.api.deletePromptTemplate` (добавлено) |
| `pages/ReferenceAudioDetail.tsx` | 141 | reference_audio | delete | ✅ `recordings.api.deleteReferenceAudio` (добавлено) |
| `pages/admin/Feedback.tsx` | 187 | user_feedback | update status | ✅ `admin.api.closeFeedbackItem` (добавлено) |
| `stores/studio/useProjectStore.ts` | 101,177,263 | studio_projects | insert, update, delete | ✅ `studio.api.createStudioProject`, `updateStudioProject`, `deleteStudioProject` (добавлено) |

---

## Категория 5: RPC (8 нарушений, 5 файлов)

| Файл | Строки | RPC | API |
|------|--------|-----|-----|
| `components/artist/ArtistDetailsPanel.tsx` | 42 | `has_role` | `admin.api.checkAdminRole` ✅ |
| `components/project/ProjectCreationWizard.tsx` | 106 | `is_premium_or_admin` | `projects.api.checkPremiumStatus` ✅ |
| `components/admin/StarsPaymentsPanel.tsx` | 43 | `get_stars_payment_stats` | `payments.api.getStarsPaymentStats` ✅ |
| `components/studio/unified/SaveVersionDialog.tsx` | 84,133 | `ensure_track_version` | ✅ `studio.api.ensureTrackVersion` (добавлено) |
| `pages/admin/Feedback.tsx` | 92 | `has_role` | `admin.api.checkAdminRole` ✅ |

---

## Новые API-функции (добавлены в рамках 039-02)

| Функция | Файл | Статус |
|---------|------|--------|
| `deleteGenerationTask(taskId)` | `generation.api.ts` | ✅ Добавлено |
| `dismissGenerationTask(taskId)` | `generation.api.ts` | ✅ Добавлено |
| `fetchStemTranscriptions(filter)` | `studio.api.ts` | ✅ Добавлено |
| `ensureTrackVersion(params)` | `studio.api.ts` | ✅ Добавлено |
| `fetchStudioProject(id)` | `studio.api.ts` | ✅ Добавлено |
| `createStudioProject(params)` | `studio.api.ts` | ✅ Добавлено |
| `updateStudioProject(id, updates)` | `studio.api.ts` | ✅ Добавлено |
| `deleteStudioProject(id)` | `studio.api.ts` | ✅ Добавлено |
| `fetchPlaylistsContainingTrack(trackId)` | `playlists.api.ts` | ✅ Добавлено |
| `fetchUserFeedback(options)` | `admin.api.ts` | ✅ Добавлено |
| `closeFeedbackItem(id)` | `admin.api.ts` | ✅ Добавлено |
| `reportContent(params)` | `admin.api.ts` | ✅ Добавлено |
| `fetchPublicProfile(userId)` | `profiles.api.ts` | ✅ Создан файл |
| `updateUserProfile(userId, updates)` | `profiles.api.ts` | ✅ Создан файл |
| `fetchProfileCount(filter)` | `profiles.api.ts` | ✅ Создан файл |
| `insertReferenceAudio(data)` | `recordings.api.ts` | ✅ Добавлено |
| `fetchReferenceAudioById(id)` | `recordings.api.ts` | ✅ Добавлено |
| `deleteReferenceAudio(id)` | `recordings.api.ts` | ✅ Добавлено |
| `deletePromptTemplate(id)` | `presets.api.ts` | ✅ Добавлено |

---

## Прогресс исправлений

| Категория | Всего | Исправлено | Осталось |
|-----------|-------|------------|---------|
| Storage | 30 | 30 | 0 |
| Auth | 12 | 12 | 0 |
| Data reads | 25 | 25 | 0 |
| Data writes | 20 | 20 | 0 |
| RPC | 8 | 8 | 0 |
| Realtime | 3 | 3 | 0 |
| **Итого** | **109** | **109** | **0** |

_Обновляется по мере исправления каждой группы_
