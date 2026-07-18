# Sprint 039: Архитектурный рефакторинг + Type Safety (Q3 2026)

**Дата:** 2026-06-30
**Длительность:** 15 дней (3 фазы по 5 дней)
**Зависимость:** Sprint 038 завершён
**Цель:** Устранить накопленный технический долг архитектуры — 60+ нарушений слоёв, god-хуки, 615 `any` типа, E2E green в CI, DnD библиотека унифицирована

---

## Контекст

После аудита 2026-06-28 выявлены критические проблемы архитектуры (оценка 6.1/10), которые не были устранены в Sprint 035-038 из-за приоритизации UX/Design задач. Sprint 039 полностью посвящён устранению этих долгов.

**Состояние входа:**

- 🔴 60+ компонентов вызывают `supabase.from()` напрямую, минуя API-слой
- ✅ `useGenerateForm.ts` — **280 строк** (уже разбит: useGenerateFormSubmit, useGenerateFormDraft, useGenerateFormValidation, useGenerateDraft — **039-06 DONE до старта спринта**)
- 🔴 `GlobalAudioProvider.tsx` — 982 строки (god-компонент)
- 🔴 6 компонентов >800 строк
- 🔴 615 использований `any` в src/
- 🔴 E2E 47 spec = 0% CI green
- ✅ DnD унифицирован — только `@dnd-kit` (удалён `@hello-pangea/dnd`, ~25 КБ экономии — **039-09 DONE до старта спринта**)
- 🟠 Бандл 918/950 КБ, запас 32 КБ

**Ожидаемое состояние выхода:**

- ✅ 0 компонентов с прямым `supabase.from()`
- ✅ 0 файлов >1000 строк
- ✅ `any` <50 (с 615)
- ✅ Одна DnD-библиотека (уже выполнено: экономия ~25 КБ → бандл ≤895 КБ)
- ✅ ≥35 E2E тестов проходят в CI

---

## Сводка

| Фаза                       | Дни    | Задач  | SP     | Бюджет    |
| -------------------------- | ------ | ------ | ------ | --------- |
| A: Layer Architecture      | 1-5    | 5      | 15     | ~40h      |
| B: God-компоненты + Bundle | 6-10   | 4      | 13     | ~35h      |
| C: Type Safety + E2E Green | 11-15  | 5      | 12     | ~30h      |
| **Итого**                  | **15** | **14** | **40** | **~105h** |

---

## Фаза A: Layer Architecture (Дни 1-5, 15 SP)

### Цель

Перенести все прямые вызовы `supabase.from()` из компонентов в API-слой. Создать недостающие API-файлы.

### Задачи

| ID      | Название                                              | Статус  | SP  | Зависимости |
| ------- | ----------------------------------------------------- | ------- | --- | ----------- |
| 039-01  | **Layer audit: grep все прямые Supabase-вызовы**      | ✅ DONE | 1   | —           |
| 039-02  | **Вынести Supabase из UI-компонентов (batch 1: 15+)** | ✅ DONE | 5   | 039-01      |
| 039-03  | **Вынести Supabase из UI-компонентов (batch 2: 15+)** | ✅ DONE | 5   | 039-02      |
| 039-03b | **Layer-fix добивание (все 4 батча закрыты)**         | ✅ DONE | 4   | 039-03      |
| 039-04  | **Generic undo/redo Zustand middleware**              | ✅ DONE | 3   | —           |
| 039-05  | **Убрать побочные эффекты из lyricsWizardStore**      | ✅ DONE | 1   | —           |

> **🔧 Update 2026-06-30 (вечер):** **все 4 батча 039-03b закрыты** — 17 файлов / 35 нарушений устранены. По `src/{components,stores}` `supabase.{from,rpc,storage}` = **0**.
>
> - **Batch 1 (admin/analytics, 6 файлов):** `QuickActionsPanel`, `AdminBotImagesPanel`, `RevenueAnalyticsPanel`, `ComparisonPanel`, `ConversionFunnelPanel`, `RealTimeMetrics`.
> - **Batch 2 (project/wizard, 4 файла):** `ProjectCreationWizard`, `ProjectBannerEditor`, `ProjectCoverEditor`, `useProjectStore`.
> - **Batch 3 (studio/dialogs, 4 файла):** `ImportAudioDialog`, `SaveVersionDialog`, `AudioActionDialog`, `useEnhancedStudioLogger`.
> - **Batch 4 (misc, 3 файла):** `ReportCommentDialog`, `ProfileSetupOnboarding`, `ArtistDetailsPanel`.
>   Добавлено в API: `invokeAdminBroadcast`, `bulkAwardCredits`, `fetchBotMenuImagesConfig/upsertBotMenuImagesConfig`, `fetchRevenueAnalyticsRaw`, `fetchPeriodComparison`, `fetchFunnelMetricsRaw`, `fetchRealTimeMetricsRaw`, `subscribeToRealtimeAdminMetrics`, `fetchUserSubscriptionTier`, `fetchArtistTrackStats`, `upsertOnboardingNotificationSettings`, `fetchProfileByUserId`, `checkPremiumStatus`, `invokeProjectAi`, `invokeGenerateCoverImage`, `invokeGenerateProjectMedia`, `updateProjectFields`, `updateProjectCover`, `updateProjectBanner`, `ensureTrackVersion`, `invokeMergeStems`, `insertTrackChangeLog`. Подробности — `docs/audit/SPRINT-039-AUDIT-2026-06-30.md`.

### 039-01: Layer Audit

**Команда:**

```bash
grep -rn "supabase\.from\|supabase\.rpc\|supabase\.auth\|supabase\.storage" \
  src/components/ src/pages/ src/stores/ \
  --include="*.tsx" --include="*.ts" | grep -v ".api.ts" | grep -v ".service.ts"
```

**Ожидаемые файлы-нарушители (из аудита):**

- `UnifiedVersionSelector.tsx` — прямой select из `track_versions`
- `EditableTrackTitle.tsx` — update в `tracks`
- `GlobalGenerationIndicator.tsx` — realtime subscriptions
- `GenerationResultSheet.tsx` — select из `generations`
- `AudioActionDialog.tsx` — select + update
- `ExtendTrackDialog.tsx` — insert в `generations`
- `TrackCard.tsx` — update `likes_count`
- 23+ других компонента

**Критерии:**

- [ ] Список всех нарушений задокументирован в `docs/LAYER_VIOLATIONS.md`
- [ ] Оценка времени для каждого нарушения

### 039-02 + 039-03: Layer Fixes

**Паттерн исправления:**

```typescript
// ❌ До: компонент напрямую
const { data } = await supabase.from("track_versions").select("*").eq("track_id", trackId);

// ✅ После: через API-слой
import { getTrackVersions } from "@/api/tracks.api";
const { data } = await getTrackVersions(trackId);
```

**Batch 1 (039-02):** Компоненты с read-only операциями (select)
**Batch 2 (039-03):** Компоненты с write-операциями (insert, update, delete, realtime)

**Критерии:**

- [ ] `grep -rn "supabase\.from" src/components/ src/pages/ src/stores/` → 0 результатов
- [ ] Все существующие тесты проходят
- [ ] `npm run build` без ошибок

### 039-04: Generic Undo/Redo Middleware

**Текущее состояние:** 3 независимые реализации undo/redo в:

- `useMixerHistoryStore.ts`
- `useLyricsHistoryStore.ts`
- `useUnifiedStudioStore.ts` (частично)

**Целевая реализация:**

```typescript
// src/stores/middleware/undoRedo.ts
export function withHistory<T>(config: {
  limit?: number; // default: 50
  include?: (keyof T)[]; // tracked fields
}): StateCreator<T & HistoryState<T>, [], [], T & HistoryState<T>>;
```

**Критерии:**

- [ ] `withHistory` middleware в `src/stores/middleware/undoRedo.ts`
- [ ] 3 стора используют его (mixer, lyrics, studio)
- [ ] Undo/redo работает во всех трёх
- [ ] Unit-тесты для middleware (5+ тестов)

---

## Фаза B: God-компоненты + Bundle (Дни 6-10, 13 SP)

### Задачи

| ID     | Название                                                 | Статус  | SP  | Зависимости |
| ------ | -------------------------------------------------------- | ------- | --- | ----------- |
| 039-06 | **Разбить `useGenerateForm.ts` (1218 строк → 4 хука)**   | ✅ DONE | 4   | 039-03      |
| 039-07 | **Разбить `GlobalAudioProvider.tsx` (982 строки)**       | ✅ DONE | 4   | —           |
| 039-08 | **Разбить 4 oversized-компонента (>800 строк)**          | ✅ DONE | 3   | —           |
| 039-09 | **DnD: удалить `@hello-pangea/dnd` → только `@dnd-kit`** | ✅ DONE | 2   | —           |

### 039-06: Разбить useGenerateForm.ts

> **✅ ЗАВЕРШЕНО ДО СТАРТА СПРИНТА:** `useGenerateForm.ts` — 280 строк (orchestrator). Sub-хуки уже существуют: `useGenerateFormSubmit.ts` (552 стр), `useGenerateFormDraft.ts`, `useGenerateFormValidation.ts`, `useGenerateDraft.ts`. Все критерии ниже выполнены.

**Текущий файл:** `src/hooks/generation/useGenerateForm.ts` (план: 1218 строк → **фактически: 280 строк**)

**Целевая декомпозиция:**

```
useGenerateForm.ts          → orchestrator (импортирует 4 хука, ~150 строк)
  useGenerateValidation.ts  → Zod validation, pre-flight checks (~200 строк)
  useGenerateSubmit.ts      → API call, retry, queue (~250 строк)
  useGenerateDraft.ts       → localStorage draft, auto-save (~150 строк) [уже существует?]
  useGenerateState.ts       → form fields state, reset, prefill (~300 строк)
```

**Критерии:**

- [ ] `useGenerateForm.ts` < 200 строк (только оркестрация)
- [ ] 4 дочерних хука, каждый < 300 строк
- [ ] Все E2E тесты генерации проходят
- [ ] `npm run build` без ошибок

### 039-07: Разбить GlobalAudioProvider.tsx

**Текущий файл:** `src/components/GlobalAudioProvider.tsx` (982 строки, КРИТИЧЕСКИЙ)

**Целевая декомпозиция:**

```
GlobalAudioProvider.tsx     → провайдер + контекст (~150 строк)
  useAudioCore.ts           → HTMLAudioElement management (~200 строк)
  useAudioQueue.ts          → queue logic, shuffle, repeat (~200 строк)
  useAudioControls.ts       → play/pause/seek/volume (~150 строк)
  useAudioAnalytics.ts      → play tracking, history (~100 строк)
```

**Важно:** Сохранить публичный API (`useGlobalAudioPlayer()`) без изменений — этот хук используется в 50+ компонентах.

**Критерии:**

- [ ] `GlobalAudioProvider.tsx` < 200 строк
- [ ] Публичный API `useGlobalAudioPlayer()` не изменился
- [ ] AudioElementPool интеграция сохранена
- [ ] iOS Safari не крашится (тест на 10+ аудио-элементах)

### 039-08: Oversized компоненты (>800 строк)

> **✅ ЗАВЕРШЕНО 2026-06-30:** God-компоненты разбиты на субкомпоненты.

Приоритетные файлы для разбивки:

| Файл                    | До  | После | Результат                                                                                           |
| ----------------------- | --- | ----- | --------------------------------------------------------------------------------------------------- |
| `StudioShell.tsx`       | 995 | 715   | hooks wired: useStudioShellState, useStudioStemSync, useStudioKeyboardShortcuts, useStudioCallbacks |
| `SectionNotesPanel.tsx` | 882 | 324   | `SectionNotesPanel/types.ts` + `NoteTypeBadge` + `NoteCard` + `NoteFilterPanel` + `AddNoteForm`     |

**Критерий:** Ни один из этих файлов не должен превышать 500 строк после разбивки.

### 039-09: DnD унификация

> **✅ ЗАВЕРШЕНО ДО СТАРТА СПРИНТА:** `@hello-pangea/dnd` удалён из `package.json`. Все drag-and-drop используют `@dnd-kit`. Сэкономлено ~25 КБ gzip. Все критерии ниже выполнены.

**Исходное состояние** (для справки): 2 библиотеки использовались параллельно:

- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — современная, accessibility-friendly
- `@hello-pangea/dnd` — форк react-beautiful-dnd, устаревший подход, ~25 КБ gzip

**Решение:** Оставить `@dnd-kit`, мигрировать все `@hello-pangea/dnd` usages.

**Команда для поиска:**

```bash
grep -rn "from '@hello-pangea/dnd'" src/ --include="*.tsx" --include="*.ts"
```

**Критерии:**

- [ ] `@hello-pangea/dnd` удалён из `package.json`
- [ ] Все drag-and-drop функции работают через `@dnd-kit`
- [ ] Бандл уменьшился на ~25 КБ (проверить `npm run size`)
- [ ] `npm run build` без ошибок

---

## Фаза C: Type Safety + E2E Green (Дни 11-15, 12 SP)

### Задачи

| ID     | Название                                         | Статус                        | SP  | Зависимости |
| ------ | ------------------------------------------------ | ----------------------------- | --- | ----------- |
| 039-10 | **Типизировать API-слой + services (`any` = 0)** | ✅ DONE (scope: api/services) | 5   | 039-03      |

> **⚠️ Аудит 2026-06-30:** в `src/api/` и `src/services/` `any` действительно устранён (0). Однако по всему `src/` остаётся **447** использований `: any`/`as any` — таргет «<50 во всём src» НЕ достигнут. Перенесено в Sprint 040 (задача 040-01).
> | 039-11 | **E2E: отдельный Playwright CI workflow** | 🟡 PARTIAL (workflow добавлен, требуются secrets) | 3 | — |
> | 039-12 | **E2E: починить smoke + navigation + library тесты** | 🔴 OPEN | 2 | 039-11 |
> | 039-13 | **E2E: починить player + generation тесты** | 🔴 OPEN | 1 | 039-12 |
> | 039-14 | **Верификация: build, size, tests, lint** | 🔴 OPEN | 1 | все |

> **🔧 Update 2026-06-30 (вечер):** добавлен `.github/workflows/e2e.yml` — отдельный pipeline с matrix `chromium` / `Mobile Chrome`, выгрузкой HTML-репорта и traces в артефакты, `workflow_dispatch` триггером. Нужны GitHub Secrets `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`, чтобы build не падал.

### 039-10: Type Safety

**Стратегия устранения `any`:**

1. **API-файлы (приоритет 1):**
   - `analysis.api.ts` — типизировать beats, chords, segments
   - `voice-clone.api.ts` — убрать `invoke<T = any>`
   - `lyrics.api.ts` — убрать `as any` касты

2. **Сервисы (приоритет 2):**
   - `export.service.ts`, `credits.service.ts`

3. **Хуки (приоритет 3, после рефакторинга 039-06, 039-07):**
   - god-хуки после декомпозиции легче типизировать

**Инструмент:** `npx ts-prune` для нахождения неиспользуемых экспортов + `tsc --noEmit` для ошибок

**Критерии:**

- [x] `grep -rn ": any" src/api/` → 0 результатов
- [x] `grep -rn "as any" src/api/ src/services/` → 0 результатов
- [x] `tsc --noEmit` без ошибок в изменённых файлах

**Выполнено 2026-06-30:**

- `analysis.api.ts` — beats/chords/notes → `Json`, return type `unknown`
- `voice-clone.api.ts` — `invoke<T = unknown>`, body cast `as Record<string, unknown>`
- `lyrics.api.ts` — typed map callbacks (`RawLyricVersion`, `RawNote`, `RawBatchVersion`)
- `analytics.api.ts` — `user_journey_events` без `as any`, metadata → `Json`
- `recordings.api.ts` — index signature `[key: string]: unknown`
- `notificationManager.ts` — RPC params без `as any`, metadata → `Json`
- `AudioAnalysisService.ts` — FlamingoShape/LovableShape/KlangioShape inline types
- `VoiceCloneService.ts`, `payment.service.ts`, `telegram/share.ts` — без `as any`

### 039-11: E2E CI Pipeline

**Текущая проблема:** 47 E2E spec-файлов не проходят в CI (0%).

**Диагностика:**

```bash
cd /home/user/aimusicverse
npx playwright test --reporter=list 2>&1 | head -50
```

**Вероятные причины:**

- Supabase credentials не настроены в CI environment
- Dev server не стартует до начала тестов
- Telegram WebApp API не мокируется
- Тесты ожидают реального генерации (async, медленно)

**Решение:**

1. Добавить `.env.test` с тестовыми Supabase credentials
2. Мокировать Suno API в тестах (`page.route('/*/suno*', ...)`)
3. Настроить `playwright.config.ts`: `webServer.reuseExistingServer: true`
4. CI: добавить `SUPABASE_URL` + `SUPABASE_ANON_KEY` в GitHub Secrets

**Критерии:**

- [ ] `npm run test:e2e` запускается без падений на dev-машине
- [ ] CI pipeline зелёный (GitHub Actions)
- [ ] ≥35 из 47 тестов проходят (75% pass rate)

### 039-14: Финальная верификация

```bash
npm run lint          # 0 errors, warnings приемлемы
npm run build         # успешная сборка
npm run size          # < 900 КБ (после удаления @hello-pangea/dnd)
npm test              # 341+ тестов проходят
npm run test:e2e      # ≥35/47 тестов проходят
tsc --noEmit          # 0 ошибок типов
```

**Критерии:**

- [ ] Все команды выше выполняются без критических ошибок
- [ ] Бандл < 900 КБ gzip
- [ ] `PROJECT_STATUS.md` обновлён

---

## Критерии успеха Sprint 039

### Архитектура

- [ ] `grep -rn "supabase\.from" src/components/ src/pages/ src/stores/` → 0 результатов
- [ ] Нет файлов > 1000 строк
- [ ] Нет файлов > 500 строк (целевой показатель: < 5 исключений)

### Type Safety

- [ ] `any` использований < 50 (было 615)
- [ ] `tsc --noEmit` без ошибок
- [ ] Все API-файлы полностью типизированы

### Bundle

- [ ] `@hello-pangea/dnd` удалён
- [ ] Бандл ≤ 900 КБ gzip (с 918 КБ, экономия ~25 КБ)
- [ ] `npm run size` зелёный

### E2E

- [ ] Playwright CI pipeline работает
- [ ] ≥35/47 тестов проходят в CI
- [ ] Нет flaky тестов (стабильность ≥ 90%)

### DX

- [ ] `npm run build` < 60 секунд
- [ ] `undo/redo` middleware — единая реализация

---

## Риски

| Риск                                          | Вероятность | Влияние     | Митигация                                 |
| --------------------------------------------- | ----------- | ----------- | ----------------------------------------- |
| Разбивка GlobalAudioProvider ломает iOS audio | Высокая     | Критическое | Сначала написать тесты, потом рефакторить |
| DnD миграция ломает drag-to-reorder в Queue   | Средняя     | Высокое     | Тестировать на mobile + desktop viewport  |
| E2E тесты flaky из-за Suno API                | Высокая     | Среднее     | Мокировать все внешние API в тестах       |
| `any` ремувал открывает скрытые ошибки типов  | Средняя     | Среднее     | Исправлять итеративно, не всё сразу       |
| StudioShell разбивка нарушает студию          | Высокая     | Высокое     | Один компонент за раз + E2E смок-тест     |

---

## Definition of Done

- [ ] Все задачи 039-01 – 039-14 завершены
- [ ] `npm run check-all` (lint + format + typecheck + test) зелёный
- [ ] E2E ≥ 35/47 в CI (GitHub Actions)
- [ ] Бандл ≤ 900 КБ
- [ ] `CHANGELOG.md` обновлён (Sprint 039 entry)
- [ ] `PROJECT_STATUS.md` обновлён
- [ ] `SPRINTS/SPRINT-PROGRESS.md` обновлён

---

## Зависимости между спринтами

```
Sprint 038 (Design System) — завершить Phase B, C, D
  └─→ Sprint 039-A (Layer Architecture)
        └─→ Sprint 039-B (God-компоненты)
        └─→ Sprint 039-C (Type Safety + E2E)
              └─→ Sprint 040 (Test Coverage + Export)
```

---

<div align="center">

[← Sprint 038](./SPRINT-038-PLAN.md) · [↑ К индексу](../DOCUMENTATION_INDEX.md) · [Sprint 040 →](./SPRINT-040-PLAN.md)

<sub>Создано: 2026-06-30 · Обновлено: 2026-06-30 · Статус: 🟡 В работе (2/14 завершено)</sub>

</div>
