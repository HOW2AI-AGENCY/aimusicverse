# Аудит MusicVerse AI — генерация, пользовательский путь, интерфейс

> Дата: 2026-07-23
> Анализ: 4 parallel agents (страницы, генерация, API/state, UI компоненты)

---

## 1. Pipeline генерации

```
FAB → GenerateSheet → форма (Simple | Custom)
  → Zod-валидация
  → pre-flight: credits, voice, double-click guard
  → 4 ветви submit:
      upload-extend  → suno-file-upload → suno-music-extend
      extend-by-url   → suno-music-extend
      cover-by-url    → suno-upload-cover
      full-generate   → suno-music-generate
  → useAutomaticRetry (max 2, exponential backoff)
  → GenerationLoadingState (4 стадии)
  → realtime poll generation_tasks (5s)
  → GenerationResultSheet
```

### Ключевые файлы

| Файл                                                      | Роль                                        |
| --------------------------------------------------------- | ------------------------------------------- |
| `src/hooks/generation/useGenerateFormSubmit.ts`           | Submit pipeline, 4 routing branches         |
| `src/hooks/generation/useGenerateForm.ts`                 | Composer hook                               |
| `src/hooks/generation/useGenerateSheetController.ts`      | Sheet orchestrator                          |
| `src/hooks/generation/useGenerationResult.ts`             | Realtime track INSERT detection             |
| `src/hooks/generation/useActiveGenerations.ts`            | Poll generation_tasks каждые 5s             |
| `src/hooks/generation/useGenerateDraft.ts`                | localStorage draft, 30-min TTL, 2s debounce |
| `src/hooks/generation/useAutomaticRetry.ts`               | Max 2 retry, exponential backoff            |
| `src/api/studio/studio-generation.api.ts`                 | 25+ edge function invocations               |
| `src/api/voice-clone.api.ts`                              | Voice clone API (9 методов)                 |
| `src/components/generate-form/GenerationLoadingState.tsx` | 4-stage loading UI                          |
| `src/constants/sunoTemplates.ts`                          | 6 жанровых шаблонов                         |
| `src/lib/suno-error-mapper.ts`                            | Suno error → user-friendly message          |

### Edge functions

25+ в `supabase/functions/`: `suno-music-generate`, `suno-music-extend`, `suno-upload-cover`, `suno-mashup`, `suno-persona`, `suno-remix`, `suno-replace-section`, `suno-add-vocals`, `suno-add-instrumental`, `generate-sfx`, `merge-stems`, `suno-file-upload`, `suno-credits`, `analyze-track-context` + voice endpoints.

Все через **edge-bridge pattern** — клиент никогда не вызывает внешние API напрямую.

### Хорошо

- ✅ Double-click guard на submit
- ✅ Zod-валидация формы
- ✅ Credit validation + voice availability pre-flight
- ✅ Auto-retry с exponential backoff
- ✅ Realtime результат через polling
- ✅ Draft persistence (localStorage, 30 мин TTL)
- ✅ 6 жанровых шаблонов

---

## 2. Пользовательские сценарии

### Маршруты (40+)

```
Public:     /, /auth, /privacy, /terms
Auth guard: ProtectedRoute → ProfileSetupGuard → MainLayout
MainLayout: Sidebar (≥1280) | icons-only (1024-1279) | BottomNav (<1024)
```

### Сценарии

**Login/Auth** — Telegram auto-auth (`TelegramProvider` → Supabase session), dev mode bypass, guest mode

**Generate Track** — FAB → `GenerateSheet` → форма → валидация → submit → 4 стадии прогресса → `GenerationResultSheet`

**Listen/Play** — `ResizablePlayer` (desktop dock) ↔ `MobileFullscreenPlayer` (3-page pager: Cover/Lyrics/Details, swipe-down close)

**Library/Browse** — `VirtualizedTrackList` (react-virtuoso), `LibraryGrid`, фильтры, поиск, категории

**Share** — `telegram-share.ts` + deep links `?startapp=<track|playlist|studio|profile|generate>`

**Onboarding** — `OnboardingFlow` + `OnboardingStateMachine` (только первое посещение)

### Навигация

| Breakpoint  | Компонент          | Детали                                             |
| ----------- | ------------------ | -------------------------------------------------- |
| ≥1280px     | Sidebar            | 4 секции: Main/Content/Studio/Account, collapsible |
| 1024-1279px | Sidebar icons-only | Без текста                                         |
| <1024px     | BottomNavigation   | 5 вкладок + FAB → GenerateSheet                    |

### Хорошо

- ✅ Все роуты lazy-loaded (`React.lazy()`)
- ✅ Native Telegram Mini App (не web app с TG login)
- ✅ Deep links через startapp
- ✅ 3-tier guard (ProtectedRoute → ProfileSetupGuard → MainLayout)
- ✅ Mobile-first breakpoints
- ✅ PageTransition (CSS fade 150ms)

---

## 3. Состояния UI (Loading / Empty / Error)

### generate-form/

| Компонент                    | Loading         | Empty | Error | Проблемы                                                                            |
| ---------------------------- | --------------- | ----- | ----- | ----------------------------------------------------------------------------------- |
| `GenerationLoadingState.tsx` | ✅              | N/A   | ⚠️    | `"failed"` stage не отличается от `"processing"` — нет error card, retry, сообщения |
| `GenerationResultSheet.tsx`  | ✅              | ❌    | ❌    | Ошибка версии глотается (isLoading кончается — UI нет)                              |
| `LyricsChatAssistant.tsx`    | ✅              | ✅    | ⚠️    | Ошибки только toast, нет inline. Input активен во время загрузки                    |
| `GenerateFormSimple.tsx`     | ⚠️ только boost | ❌    | ❌    | Нет loading на submit, нет empty для prompts                                        |
| `GenerateFormCustom.tsx`     | ❌              | ❌    | ❌    | Всё делегировано детям                                                              |
| `FormStepper.tsx`            | ❌              | ✅    | ❌    | IntersectionObserver молча деградирует                                              |

### player/

| Компонент                     | Loading     | Empty | Error | Проблемы                                   |
| ----------------------------- | ----------- | ----- | ----- | ------------------------------------------ |
| `CompactPlayer.tsx`           | ✅          | ❌    | ✅    | Нет retry при ошибке — только dismiss      |
| `MobileFullscreenPlayer.tsx`  | ⚠️ Suspense | ❌    | ❌    | Нет LEE, предполагает что трек всегда есть |
| `DesktopFullscreenPlayer.tsx` | ❌          | ❌    | ❌    | Audio context recovery не UI               |
| `UnifiedPlayerControls.tsx`   | ❌          | ❌    | ❌    | Pure props — норма                         |

### library/

| Компонент                     | Loading | Empty | Error       | Проблемы                                    |
| ----------------------------- | ------- | ----- | ----------- | ------------------------------------------- |
| `VirtualizedTrackList.tsx`    | ✅      | ❌    | ⚠️ per-item | Нет list-level error (только item boundary) |
| `EmptyLibraryState.tsx`       | N/A     | ✅    | N/A         | Отлично: 2 варианта, CTA, чипсы, анимация   |
| `DesktopLibrarySidebar.tsx`   | ✅      | ❌    | ❌          | Dialog crash — нет границы                  |
| `GeneratingTrackSkeleton.tsx` | N/A     | N/A   | N/A         | Специализированный skeleton                 |

### studio/

| Компонент                   | Loading | Empty | Error | Проблемы                                             |
| --------------------------- | ------- | ----- | ----- | ---------------------------------------------------- |
| `AudioErrorBoundary.tsx`    | ❌      | ❌    | ✅    | 5 категорий ошибок с recovery. Отлично               |
| `AddTrackDrawer.tsx`        | ✅      | ⚠️    | ⚠️    | Прогресс фризится на ошибке генерации, нет сообщения |
| `AddVocalsDrawer.tsx`       | ✅      | ❌    | ✅    | Прогресс + retry. Отлично                            |
| `AddInstrumentalDrawer.tsx` | ✅      | ❌    | ⚠️    | Только toast, ошибка исчезает                        |
| `OptimizedTrackRow.tsx`     | ✅      | ❌    | ⚠️    | Badge без сообщения                                  |

### track-actions/

| Компонент                    | Loading | Empty | Error | Проблемы                            |
| ---------------------------- | ------- | ----- | ----- | ----------------------------------- |
| `UnifiedTrackSheet.tsx`      | ⚠️      | ❌    | ❌    | Ошибка транскрипции молча глотается |
| `MobileTrackActionSheet.tsx` | ❌      | ❌    | ❌    | Синхронные — норма                  |

---

## 4. API и State Management

### Структура

- **26 API модулей** в `src/api/` — typed supabase client
- **154 edge functions** в `supabase/functions/`
- **14+ сервисов** в `src/services/`
- **100+ hooks** — TanStack Query (staleTime: 30s, gcTime: 10min)
- **16 Zustand stores** — slice pattern + standalone + 6 studio sub-stores
- **10 context providers** (Auth, Telegram, Theme, Notification, GuestMode, etc.)
- **Supabase realtime** в 3 API файлах
- **8 Storage buckets** (tracks, stems, avatars, covers, projects, recordings, midi, temp)

### Проблемы

| #   | Проблема                                       | Локация                           | Серьёзность                           |
| --- | ---------------------------------------------- | --------------------------------- | ------------------------------------- |
| 1   | Нет центрального Error Boundary                | App.tsx                           | **HIGH** — роуты падают в белый экран |
| 2   | `VoiceApiError` — единственный кастомный класс | из 23+ файлов                     | MEDIUM                                |
| 3   | 4 файла с `@ts-nocheck`                        | batch, lyrics, presets, shortcuts | MEDIUM — schema drift                 |
| 4   | 192 `throw new Error()` — нет иерархии         | 23 файла                          | LOW                                   |

### Хорошо

- ✅ Layered data flow: API → Service → Hooks → Components
- ✅ Zustand для глобального UI, TanStack Query для серверных данных
- ✅ RLS на всех таблицах с пользовательскими данными
- ✅ Edge-bridge: клиент не знает внешних API
- ✅ Все импорты через `@/` alias
- ✅ Optimistic updates для likes/plays/version switches

---

## 5. Аудио система

```
GlobalAudioProvider (<1 audio элемент>)
  ├── useGlobalAudioPlayer() — доступ к плееру
  ├── usePlayerStore() — Zustand store
  └── usePreviewAudio() — UI превью (audioElementPool + coordinator)

Audio Element Pool (iOS Safari >10 краш)
Waveform: audioCache.ts + waveformGenerator.ts
Tone.js 14.9 + Wavesurfer.js 7.8
```

### Хорошо

- ✅ Single source pattern — 1 audio элемент
- ✅ Audio Element Pool для iOS Safari
- ✅ AudioErrorBoundary с 5 категориями и recovery

---

## 6. Системные проблемы (cross-cutting)

1. **Нет общих LEE-примитивов** — каждый компонент сам изобретает loading/empty/error. Нет `<ErrorState>`, `<EmptyState>`, `<LoadingState>`.

2. **Error Boundary только 2** — `AudioErrorBoundary` (studio) и `TrackItemErrorBoundary` (library). Нет общего boundary на уровне App.

3. **Empty states** — только библиотека имеет `EmptyLibraryState`. Генерация и track-actions пустые состояния не обрабатывают.

4. **Ошибки генерации** — в 3 местах прогресс фризится на ошибке без сообщения. Retry есть только в AddVocalsDrawer.

5. **Schema drift** — 4 файла с `@ts-nocheck` из-за расхождения TS типов и реальной Supabase схемы.

---

## 7. Рекомендации

### P0 — Баги (поведение пользователя)

| #   | Что                                              | Где                          | Почему                                    |
| --- | ------------------------------------------------ | ---------------------------- | ----------------------------------------- |
| 1   | `"failed"` stage не отличается от `"processing"` | `GenerationLoadingState.tsx` | Пользователь не видит что пошло не так    |
| 2   | Прогресс фризится на ошибке, нет сообщения       | `AddTrackDrawer.tsx`         | Пользователь ждёт бесконечно              |
| 3   | Ошибка только в toast, исчезает                  | `AddInstrumentalDrawer.tsx`  | Пользователь пропускает ошибку            |
| 4   | Ошибка транскрипции молча глотается              | `UnifiedTrackSheet.tsx`      | Транскрипция не работает — никто не знает |

### P1 — UX дыры

| #   | Что                                          | Где                            |
| --- | -------------------------------------------- | ------------------------------ |
| 5   | Нет общих ErrorState/EmptyState/LoadingState | Весь проект                    |
| 6   | Нет empty state в генерации и track-actions  | generate-form/, track-actions/ |
| 7   | Нет loading на submit формы                  | `GenerateFormSimple.tsx`       |
| 8   | Нет retry при ошибке плеера                  | `CompactPlayer.tsx`            |
| 9   | Mobile Player нет LEE                        | `MobileFullscreenPlayer.tsx`   |

### P2 — Архитектурные

| #   | Что                                    | Где                               |
| --- | -------------------------------------- | --------------------------------- |
| 10  | Нет центрального Error Boundary        | `App.tsx`                         |
| 11  | 4 файла с `@ts-nocheck` — schema drift | batch, lyrics, presets, shortcuts |
| 12  | Нет иерархии ошибок                    | VoiceApiError — единственный      |
