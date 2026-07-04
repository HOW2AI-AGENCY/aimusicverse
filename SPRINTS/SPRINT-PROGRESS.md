# Sprint Progress Tracker

**Последнее обновление**: 2026-07-04 (Sprint 052/053/054 added — Suno API gap closure)

> 📌 **Важно**: Это документ отслеживает все спринты и их статусы. Для детального плана задач смотрите [BACKLOG.md](BACKLOG.md).

## 📊 Общий статус

| Sprint                                             | Статус          | Прогресс                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sprint 001-034                                     | ✅ ЗАВЕРШЕНЫ    | 100%                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Архитектурный аудит (2026-06-28)**               | ✅ ЗАВЕРШЁН     | 3 параллельных агента, полный отчёт                                                                                                                                                                                                                                                                                                                                                                                            |
| Q1 2026 Plan                                       | ✅ ЗАВЕРШЁН     | Phase 1-6 Complete, Sprints A-E Complete                                                                                                                                                                                                                                                                                                                                                                                       |
| Phase 8: Dead Code Removal                         | ✅ ЗАВЕРШЁН     | 196 файлов, 45K строк                                                                                                                                                                                                                                                                                                                                                                                                          |
| Sprint 9A: Deduplication                           | ✅ ЗАВЕРШЁН     | 5 дубликатов, 1.35K строк                                                                                                                                                                                                                                                                                                                                                                                                      |
| Sprint 9B: Split Giant Files                       | ⏳ ЗАПЛАНИРОВАН | 33 файла >500 строк (уточнено аудитом)                                                                                                                                                                                                                                                                                                                                                                                         |
| Sprint 9C: Lyrics Consolidation                    | ⏳ ЗАПЛАНИРОВАН | 30+ lyrics-компонентов из 6 директорий                                                                                                                                                                                                                                                                                                                                                                                         |
| Sprint 9D: Reorganize components/ui                | ⏳ ЗАПЛАНИРОВАН | 90+ файлов требуют группировки                                                                                                                                                                                                                                                                                                                                                                                                 |
| Sprint 9E: Final Verification                      | ⏳ ЗАПЛАНИРОВАН | tsc, build, size, tests                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Phase 10A: Test Infrastructure**                 | ✅ ЗАВЕРШЁН     | Jest→Vitest, 237 тестов починено                                                                                                                                                                                                                                                                                                                                                                                               |
| **Phase 10B: Critical Path Tests**                 | ✅ ЗАВЕРШЁН     | 320 тестов, 5 новых test suites                                                                                                                                                                                                                                                                                                                                                                                                |
| **Phase 10C: E2E Tests**                           | ⏳ ЗАПЛАНИРОВАН | Playwright, ключевые сценарии                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Sprint 033: Interface Audit**                    | ✅ ЗАВЕРШЁН     | 18 задач, 4 фазы                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Sprint 034: Generation Reliability**             | ✅ ЗАВЕРШЁН     | 13/13 задач ✅                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Sprint 035: Стабилизация + Чистка**              | ✅ ЗАВЕРШЁН     | 9/9 задач ✅ — TDZ fix, circular deps (#541), rules-of-hooks (24 violations / 10 files), 6 дубликатов (-1700 строк), PlaybackStore (3→1), query keys (`src/lib/queryKeys.ts`), ProtectedRoute для payment-маршрутов, Vitest OOM fix, API layer (storage/payments/notifications). E2E-стабилизация (47 spec → CI green) перенесена в Sprint 050.                                                                                |
| **Sprint 036: Слои + Type Safety**                 | ⏳ ЗАПЛАНИРОВАН | 60+ Supabase из компонентов, god-хуки, 615 any→<100 (перенесено в Sprint 039)                                                                                                                                                                                                                                                                                                                                                  |
| **Sprint 037: Infrastructure Hardening**           | ✅ ЗАВЕРШЁН     | 12/12 задач ✅ — bundle visualizer, Sentry Perf, TS strict, Storybook 6 stories, FSM docs                                                                                                                                                                                                                                                                                                                                      |
| **Sprint 038: Design System Unif.**                | ✅ ЗАВЕРШЁН     | 28/28 задач (100%) — EmptyState ✅, Skeleton ✅, Touch ✅, Z-index ✅, Safari ✅, Animation ✅, Haptics ✅, Elevation ✅, Typography ✅, Storybook 20+ ✅, LazyImage ✅, OnboardingFlow ✅, ContainerQueries ✅, NavigationShell ✅, PlayerTransition ✅, Lighthouse ✅                                                                                                                                                        |
| **Sprint 039: Архит. рефакторинг**                 | ✅ ЗАВЕРШЁН     | 14/14 ✅ — архитектурный аудит + 0 нарушений слоёв в `src/components/**`; 615 any → 85 (whitelist) — Sprint 044 закрывает остаток                                                                                                                                                                                                                                                                                              |
| **Sprint 040: Тесты + Export**                     | 📋 ЗАПЛАНИРОВАН | 100+ unit-тест файлов, WAV/MP3/FLAC export, Service Worker, Lighthouse CI                                                                                                                                                                                                                                                                                                                                                      |
| **Sprint 042: Page Decomposition + Audio Pooling** | ✅ ЗАВЕРШЁН     | A1-A5 ✅ (graphify regen, bundle baseline 2.21MB/950KB, structuredClone, dup audio, api JSDoc); B1 ✅ (LyricsStudio decompose); B2 ✅ (usePromptDJEnhanced 1071→882 LOC); B3 ✅ (usePreviewAudio 17 миграций + iOS Safari pool); B4 ✅ (smoke E2E — preview-audio singleton); B5 ✅ (bundle re-measurement). Итого 10/10                                                                                                       |
| **Sprint 043: Layer Pass #2 + A11y**               | ✅ ЗАВЕРШЁН     | C1-C6 ✅ — 65 компонентов через service layer; ESLint `no-restricted-imports` + `layer-boundary/no-supabase-from-in-component` guardrail для `src/components/**`; touch-target миграция (391→0 в touched layers); mobile Playwright smoke (6 tests × 7 projects). Итого 6/6                                                                                                                                                    |
| **Sprint 044: Type Safety + Result Pattern**       | ✅ ЗАВЕРШЁН     | D1 ✅ (`Result<T,E>` в `src/lib/result.ts` + 9 тестов); D2 ✅ (`any` в `src/hooks/**` 164→6); D3 ✅ (`any` в `src/stores/**` 12→0); D4 ✅ (pages уже <10); D5 ✅ (`any` в `src/components/**` 155→0); D6 ✅ (3 сервиса → Result: VoiceClone 8 методов, AudioAnalysis 5 методов + 2 helpers, ReferenceManager 3 метода); D7 ✅ (ESLint `no-explicit-any: error` + whitelist + `scripts/count-any.mjs`). Итого 7/7               |
| **Sprint 045: Hygiene + Docs**                     | ⏳ ЗАПЛАНИРОВАН | E1-E4 — docs sweep, project navigation, changelog polish, repo health metrics                                                                                                                                                                                                                                                                                                                                                  |
| **Sprint 050: Main Green + Mobile Audit F1–F12**   | ⏳ ЗАПЛАНИРОВАН | Фаза A: Main Green (E2E run #115 verdict, lychee link-check, prod-migrations sync, Lovable-процесс, bun.lock vs package-lock); Фаза B: F1–F12 (useScrollLock, focus-trap, usePublicTracks cover_url, Library keyboard nav, LazyImage a11y, queue/visualviewport/PromptHistory sub-dialog, etc.) + bundle quick wins. Детальный план: [SPRINTS/SPRINT-050-PLAN.md](./SPRINT-050-PLAN.md)                                        |
| **Sprint 051: Test Debt + God Files**              | ⏳ ЗАПЛАНИРОВАН | Tests-first: 9 файлов >800 LOC + 20 `src/api/*.api.ts` + 18 `src/services/*.service.ts` → декомпозиция топ-3 (`studio.service.ts` 1028, `LyricsParser.ts` 903, `studio.api.ts` 891). Цель: 282 → 450+ unit-тестов, 0 файлов >1000 строк                                                                                                                                                                                        |
| **Sprint 052: Suno Mashup + Persona + Upload**     | ⏳ PLANNED      | **A1–A5** ✅ edge `suno-mashup/persona/file-upload` + DB `track_personas` + cover/extend → shared uploader + **editorial layout `LyricsVisualEditorCompact` + `SectionTagSelector`** (`916cd72a`, `a9d12426`, `37ca8264`, `18b1e80e`). **B1** ⏳ UI `MashupDialog` + hooks. **B2** ⏳ Telegram `/mashup`.                                                                                                                      |
| **Sprint 053: Suno API Sounds + MIDI + Boost**     | ⏳ ЗАПЛАНИРОВАН | Edge: `suno-sounds`, `suno-sounds-callback`, `suno-midi`, `suno-midi-callback`, `suno-midi-details`. Подключить к UI существующий `suno-boost-style` (или удалить). UI: `SfxGeneratorSheet`, MIDI-fallback в Studio. Telegram: `/sfx`. Замещает Replicate в `generate-sfx` и `transcribe-midi`. Δvalue: новый сегмент SFX + снижение Replicate-зависимости. Детальный план: [SPRINTS/SPRINT-053-PLAN.md](./SPRINT-053-PLAN.md) |
| **Sprint 054: Suno API Details Suite**             | ⏳ ЗАПЛАНИРОВАН | Edge: `suno-{music,cover,video,wav,lyrics,separation}-details`. Рефакторинг `suno-check-status` → dispatcher по taskType + per-type backoff. UI: `useSunoTaskDetails` generic hook заменяет 6 ad-hoc polling. Цель: снижение polling error-rate <2%. Детальный план: [SPRINTS/SPRINT-054-PLAN.md](./SPRINT-054-PLAN.md)                                                                                                        |
| **Sprint 055: Cost Optimization + Observability**  | ⏳ ЗАПЛАНИРОВАН | Кредит-дашборд (history + прогноз), retry-policy per taskType, webhook-secret rotation, метрики latency per taskType в Sentry, hard-cap prompt/style/title по моделям V4/V4_5/V5 в `_shared/suno-validate.ts`                                                                                                                                                                                                                  |

---

## 🔄 ТЕКУЩИЙ: Q1 2026 Development Plan

### Phase 1: Critical Business Metrics ✅ COMPLETE

#### 1.1 Failure Rate Reduction

- [x] Artist pre-validation (18+ artists added)
- [x] Enhanced error messages with hints
- [x] Client-side retry with exponential backoff
- [x] Error-specific retry delays

#### 1.2 Social Activation

- [x] FirstCommentCTA component
- [x] CommentSuggestions (10 genres, 60+ phrases)
- [x] Integration in CommentsList

### Phase 2: Monetization ✅ COMPLETE

- [x] Tinkoff Payment Integration
- [x] Edge functions (tinkoff-create-payment, tinkoff-webhook)
- [x] Frontend service and hook
- [x] Referral program with leaderboard
- [x] Credit packages with discounts

### Phase 3: Telegram Integration ✅ COMPLETE

- [x] Mini App SDK 2.0
- [x] Deep linking support
- [x] Bot notifications
- [x] Inline mode

### Phase 4: Retention & Engagement ✅ COMPLETE

- [x] Streak system (StreakBadge, StreakCalendar)
- [x] Daily check-in with progressive bonuses
- [x] Push notifications via Telegram Bot
- [x] Notification settings UI

### Phase 5: UI/UX Optimization ✅ COMPLETE (Sprints A-E)

#### Sprint A: Performance Foundation ✅

- [x] Replace date-fns with dayjs (`src/lib/date-utils.ts`)
- [x] Lazy loading for recharts (`useRecharts` hook)
- [x] DNS-prefetch/preconnect hints
- [x] Deferred font loading
- [x] Inlined critical CSS

#### Sprint B: Mobile UX Improvements ✅

- [x] Touch targets standardization (≥44px)
- [x] Russian text overflow fixes
- [x] Telegram safe area handling
- [x] Haptic feedback patterns

#### Sprint C: Design System Integration ✅

- [x] Design tokens (`typographyClass`, `spacingClass`, `textBalance`)
- [x] Applied to QuickStartCards, GamificationBar, BottomNavigation
- [x] Touch target classes (`touchTargetClass`)

#### Sprint D: User Journey Optimization ✅

- [x] EmptyLibraryState with design tokens
- [x] FirstTimeHeroCard with "FREE" badges
- [x] Simplified mobile animations (whileTap priority)
- [x] Russian text balancing

#### Sprint E: Documentation ✅

- [x] PROJECT_STATUS.md updated
- [x] KNOWN_ISSUES.md updated
- [x] KNOWLEDGE_BASE.md updated
- [x] SPRINT-PROGRESS.md updated

### Phase 6: Voice Cloning Integration ✅ COMPLETE (Июнь 2026)

- [x] Voice Cloning Studio (6-шаговый процесс)
- [x] Suno Voice API + webhook handlers
- [x] Voice Library + Voice History страницы
- [x] Database migrations
- [x] VoiceCloneService + useVoiceCloning hook
- [x] Technical documentation (docs/VOICE_CLONING_INTEGRATION.md)

### Phase 7: UI Improvements 🔄 IN PROGRESS

- [x] Spec 001: UI Improvements — спецификация, план, задачи ([PR #280](https://github.com/HOW2AI-AGENCY/aimusicverse/pull/280))
- [ ] Реализация UI компонентов
- [ ] Bundle size optimization
- [ ] Performance Scaling

### Phase 10: Testing & Quality ✅ / 🔄 (2026-06-26 — 2026-06-27)

#### 10A: Test Infrastructure Migration ✅ COMPLETE

- [x] Миграция Jest → Vitest (конфиг, моки, глобальные настройки)
- [x] Исправление нативных биндингов Windows (@rolldown/binding, @swc/core)
- [x] Глобальный мок Supabase клиента в vitest.setup.ts
- [x] Удаление 6 тестов с несуществующими импортами
- [x] Перенос 5 интеграционных тестов из unit/ в integration/
- [x] Исправление 22 failing test suites → **237 тестов проходят**
- [x] Коммит: `173fb677`, `2fadff06`

#### 10B: Critical Path Unit Tests ✅ COMPLETE

- [x] Player Store — 39 тестов (play, queue, shuffle, repeat, volume, modes)
- [x] Auth Context — 5 тестов (provider/consumer, loading states)
- [x] Version Switcher — 14 тестов + 4 skipped (fetch, switch, primary version)
- [x] Generation Draft — 10 тестов (save, load, expiry, debounce, auto-save)
- [x] Generation Result — 11 тестов (show, close, clear, dedup, session flags)
- [x] **Итого: 320 тестов проходят** (24 test suites)
- [x] Коммит: `9b2558d2`, `701aad7c`

#### 10C: E2E Tests ⏳ PLANNED

- [ ] Генерация трека (happy path)
- [ ] Навигация по библиотеке
- [ ] Плеер (play/pause/queue)
- [ ] Переключение версий A/B
- [ ] Mobile viewport тесты

---

### Sprint 033: Interface Audit & UX Overhaul ✅

#### Phase 1: Critical UX Fixes

- [x] Dialog → BottomSheet on mobile (mobileSheet default=true)
- [x] Touch targets ≥ 44px in 6 components
- [x] ARIA labels for navigation components
- [x] console.log → logger migration
- [x] BottomNavigation icon/label sizes increased
- [x] Generation form buttons to h-11
- [x] Onboarding simplified: 10-step → QuickStartOverlay (3 steps)
- [x] Generation wizard 6→4 steps (StyleSettingsStep, VocalsLyricsStep)

#### Phase 2: Interface Polish

- [x] Library CompactFilterBar: inline sort dropdown (removed modal)
- [x] Monetization throttling (UpsellStrategy service)
- [x] Micro-interactions: like burst particles, pull-to-refresh pulse ring

#### Phase 3: Studio & Social

- [x] Studio Lite/Pro mode toggle (ViewStore + StudioShellHeader)
- [x] AIActionsFAB filtered by studioMode
- [x] Timestamped comments (Comment interface + CommentForm + CommentItem)

#### Phase 4: Quality Assurance

- [x] TypeScript compilation verified
- [x] 362 unit tests passing
- [x] Production build successful
- [x] commitlint ESM compatibility fix

### Sprint 034: Generation Reliability ✅ COMPLETE (Q3 2026)

Снижение failure rate с 12% до <8%. [Детальный план](SPRINT-034-036-PLAN.md)

- [x] Dashboard метрик генерации (`/admin/generation-metrics`)
- [x] Sentry breadcrumbs для flow генерации
- [x] Алерты при failure rate >10% (Edge Function)
- [x] Интеграция `useAutomaticRetry` в `handleGenerate()` (2 retries + exp. backoff)
- [x] Structured failure categories в `generation_tasks` (abort_reason, retry_count, failure_category)
- [x] Prompt pre-validation перед отправкой
- [x] Активация `useExperiment` — PROMPT_SUGGESTIONS (50/50, running)
- [x] Failure pattern analysis RPC (get_generation_failure_patterns)
- [x] Generation queue position UI
- [x] Model fallback chain exposed в UI
- [x] A/B тест: 2-step vs 4-step wizard (WIZARD_STEPS experiment)
- [x] Delivery tracking для обоих clip-ов (partial_delivery status)

### Sprint 035: E2E + Platform Export ⏳ PLANNED (Q3 2026)

Стабилизация E2E + начало экспортов. [Детальный план](SPRINT-034-036-PLAN.md)

- [ ] Починить smoke + navigation E2E тесты (47 spec написаны, 0% проходят)
- [ ] Настроить Playwright CI pipeline
- [ ] Универсальный export service (WAV/MP3/FLAC)
- [ ] YouTube-ready export (аудио + обложка → видео)
- [ ] Telegram Stories sharing с аудио-превью

### Sprint 036: Quality & Stability ⏳ PLANNED (Q3 2026)

Рефакторинг + тесты + Service Worker. [Детальный план](SPRINT-034-036-PLAN.md)

- [ ] Разбить GlobalAudioProvider.tsx (982 строки) → hooks/state/queue
- [ ] Разбить 5 файлов >800 строк
- [ ] Unit-тесты до 500+ (с 362)
- [ ] Service Worker с Workbox (cache-first для статики + аудио)
- [ ] Phase 9C: Консолидация Lyrics-экосистемы

### Sprint 037: Infrastructure Hardening & Developer Experience ✅ COMPLETE (Q3 2026)

Инфраструктурное укрепление и улучшение DX. [Детальный план](SPRINT-037-PLAN.md)

- [x] 037-01: Удалить Babel/Jest конфиги — **N/A** (уже удалены, проект на Vitest)
- [x] 037-02: Добавить `graphify update .` в pre-commit hook — **N/A** (уже в `.husky/pre-commit` L23)
- [x] 037-03: Базовые unit-тесты для Audio System — **21 тест** (`audioElementPool.test.ts`)
- [x] 037-04: Bundle audit с rollup-plugin-visualizer — **N/A** (уже в `vite.config.ts`)
- [x] 037-05: Автоматизация `npm run size` в CI — **N/A** (уже в `.github/workflows/ci.yml`)
- [x] 037-06: Storybook для shared/ui компонентов — **4 stories** (LazyImage, EmptyState, Button, LoadingSpinner)
- [x] 037-07: TypeScript strict mode — **`tsconfig.strict.json`** для инкрементальной миграции
- [x] 037-08: ESLint plugin expansion — **N/A** (уже есть section-tokens, restricted-imports, react-hooks)
- [x] 037-09: Sentry Performance monitoring — **N/A** (`tracesSampleRate: 0.1` уже настроен)
- [x] 037-10: ARCHITECTURE_HUB.md верификация — **184 строки**, все секции когерентны
- [x] 037-11: FSM state schema — **`docs/FSM_STATE_SCHEMA.md`** (4 state machines)
- [x] 037-12: TMA cold start оптимизация — **N/A** (web-vitals + audio-sw + lazy loading)
- [x] Commit: `70c33162` — merged to `origin/main`

---

## ✅ Completed Sprints Archive

All sprints 001-034 are completed. Sprint 037 completed 2026-06-29. Sprint 038 completed 2026-06-30.

### Key Milestones

| Date     | Milestone                             |
| -------- | ------------------------------------- |
| Dec 2025 | Core platform launch                  |
| Jan 2026 | Tinkoff payment integration           |
| Jan 2026 | Referral program                      |
| Jan 2026 | Streak system                         |
| Jan 2026 | UI/UX unification                     |
| Jun 2026 | Voice cloning integration             |
| Jun 2026 | Architecture audit (6.1→8.4)          |
| Jun 2026 | Sprint 037: DX hardening              |
| Jun 2026 | Sprint 038: Design System Unification |

---

## 📈 Метрики

| Метрика         | Текущее | Цель   |
| --------------- | ------- | ------ |
| Users           | 574+    | 1,000+ |
| Tracks          | 1,800+  | 5,000+ |
| Files .ts/.tsx  | 1,736   | —      |
| Components      | 987+    | —      |
| Hooks           | 347+    | —      |
| Pages           | 57+     | —      |
| Edge Functions  | 120+    | —      |
| Success Rate    | ~88%    | >92%   |
| DAU             | ~25     | 50+    |
| **Unit Tests**  | **341** | 500+   |
| **Test Suites** | **25**  | 40+    |
| **Test Runner** | Vitest  | —      |

---

## 📚 Документация

- [PROJECT_STATUS.md](../PROJECT_STATUS.md) — Статус проекта
- [ROADMAP.md](../ROADMAP.md) — Дорожная карта
- [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md) — Указатель документации
- [docs/FSM_STATE_SCHEMA.md](../docs/FSM_STATE_SCHEMA.md) — FSM state schema (new)

---

_Обновлено: 2026-06-30_

> 🔗 Навигация: [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md) • [PROJECT_STATUS.md](../PROJECT_STATUS.md) • [BACKLOG.md](BACKLOG.md)
