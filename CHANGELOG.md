<div align="center">

# 📝 Журнал изменений

**Все значимые изменения в MusicVerse AI документируются в этом файле.**

Формат основан на [Keep a Changelog 1.1.0](https://keepachangelog.com/ru/1.1.0/) и проект следует [Семантическому версионированию](https://semver.org/lang/ru/).

<p>
  <img alt="Формат" src="https://img.shields.io/badge/Keep_a_Changelog-1.1-9333EA?style=for-the-badge"/>
  <img alt="SemVer" src="https://img.shields.io/badge/SemVer-2.0-26A5E4?style=for-the-badge"/>
</p>

<p>
  <a href="README.md">🏠 Главная</a> ·
  <a href="DOCUMENTATION_INDEX.md">📚 Документация</a> ·
  <a href="ROADMAP.md">🗺 Дорожная карта</a> ·
  <a href="PROJECT_STATUS.md">📊 Статус</a>
</p>

</div>

---

## [Unreleased]

### 🟢 Sprint 050-A1/A2/B6 — main-green фиксы после лендинга 055 + полный lychee-инвентарь (2026-07-04, ночь)

#### Performance

- **050-B6:** `canvas-confetti` (~20 КБ gzip) переведён на dynamic import через новый враппер [src/lib/confetti.ts](src/lib/confetti.ts) — 5 компонентов (reward notification, welcome bonus, subscription/payment success) больше не тянут его в свои чанки; `lamejs` и `qrcode` уже были динамическими. size-limit: все 10 бюджетов зелёные (Total 2.22 МБ / 2.3 МБ).

#### Fixed

- **`vite build` был сломан вне Lovable-песочницы** (включая CI build-джобу): `vite.config.ts` статически импортировал `@lovable.dev/mcp-js`, который резолвится только в приватный реестр Lovable (`europe-west1-npm.pkg.dev`). Переведён на существующий optional-dependency паттерн (try/await + `mcpPlugin?.()`).

- **5 ошибок `tsc` на `main`** из Sprint 055: `'feature_usage'` не входит в `EventType` (канонично `'feature_used'`) — `useSunoCancel`, `useOpenGenerateFromDeeplink`, `useCreditsLimits` + 2 теста. Unit 340/340.
- **Prettier-дрейф** в `.lovable/mcp/manifest.json` и `supabase/functions/mcp/index.ts` (прямые коммиты мимо хуков).
- **139 битых file-ссылок → 0** по всем сканируемым lychee .md (ранний диагноз «7 ссылок» был по усечённому CI-логу): созданы недостающие [docs/sprints/SPRINT-053-RETRO.md](docs/sprints/SPRINT-053-RETRO.md), [docs/sprints/SPRINT-054-RETRO.md](docs/sprints/SPRINT-054-RETRO.md), [SPRINTS/SPRINT-051-PLAN.md](SPRINTS/SPRINT-051-PLAN.md); исправлены relative-глубины в 055-планах, шаблонах, MANIFEST-053-054, ARCHIVE, PROGRESS, ru/-доках, ADR; `musicverse.ai` исключён из link-check (домен не отвечает); ссылки на выключенные GitHub Discussions заменены на Issues.

### 🔧 Sprint 057 — Audio Analysis Refactoring (2026-07-06)

> Commit `fd4917b8` — извлечение normalizers в отдельный модуль + исправление критичного бага.

#### Changed

- **`src/services/unified-analysis/AudioAnalysisService.ts`** — методы нормализации результатов извлечены в отдельный модуль `audioAnalysisNormalizers.ts` для улучшения тестируемости и переиспользования. Класс уменьшен с 804 до 579 LOC (-225 строк).

#### Added

- **`src/services/unified-analysis/audioAnalysisNormalizers.ts`** — новый модуль с функциями нормализации:
  - `getDefaultProvider()` — определение провайдера по умолчанию для типа анализа
  - `mapTypeToLovableAI()` — маппинг типов анализа в формат Lovable AI
  - `mapTypeToKlangioMode()` — маппинг типов анализа в режимы Klangio
  - `mergeResults()` — слияние результатов от нескольких провайдеров
  - `normalizeFlamingoResult()` — нормализация результатов Flamingo API
  - `normalizeLovableAIResult()` — нормализация результатов Lovable AI API
  - `normalizeKlangioResult()` — нормализация результатов Klangio API

#### Fixed

- **Критичный баг:** метод `saveToDatabase()` был случайно удален при рефакторинге, что приводило к ошибке компиляции. Метод восстановлен, все тесты (11/11) проходят.

#### Tests

- Unit тесты для `AudioAnalysisService`: 11 passing
- Общее покрытие: 925 passing (15 failing в других модулях)

### 🎯 Sprint 052-C — Storybook + i18n cleanup (2026-07-05)

> Commit `93beb2f1` — pure-Dumb декомпозиция, Storybook stories, i18n strings extraction. Sprint 052 теперь **100% complete**.

#### Added

- **`src/stories/mashup/MashupDialog.stories.tsx`** — 6 Storybook stories для `MashupDialog` (Empty/Filled/Loading/Success/Mobile/Desktop). Следует паттерну `MashupFormFields.stories.tsx`. Использует QueryClientProvider для моков хуков.
- **`MASHUP_STRINGS.generationResult.*`** — 4 новые строки: `fallbackTrackTitle`, `versionSwitchError`, `playButtonLabel`, `pauseButtonLabel`.
- **`MASHUP_STRINGS.persona.validation.*`** — 3 новые строки: `specifyName`, `nameTooLong`, `trainingFailed`.

#### Changed

- **`src/components/generate-form/GenerationResultSheet.tsx`** — извлечены все хардкодные RU-строки в `MASHUP_STRINGS`. 0 хардкодных строк осталось. Persona validation использует `personaStrings.validation.*`, version switch/generation result use `generationResultStrings.*`.
- **`src/lib/locale/mashupStrings.ts`** — расширена секция `persona` (добавлен `validation` submodule), добавлена секция `generationResult`.

#### Fixed

- **Sprint 050-A2:** 7 сломанных ссылок в `VOICE_CLONING_INTEGRATION.md` — исправлены относительные пути для `SUNO_API.md`, `TROUBLESHOOTING_GUIDE.md` и код-файлов.
- **Sprint 050-A5:** Конфликт `bun.lock` vs `package-lock.json` — добавлены `bun.lock*` в `.gitignore`, `bun.lock` удалён из git tracking. Decision: use `package-lock.json` as single source of truth.

### 🗄️ Sprint 050-A3 — сверка миграций + фиксы накатки с нуля (2026-07-04, ночь)

> Реальная накатка likes-цепочки на локальный PostgreSQL 16, каждая миграция в своей транзакции (как supabase-раннер). Отчёт: [docs/audit/MIGRATIONS-RECONCILIATION-2026-07-04.md](docs/audit/MIGRATIONS-RECONCILIATION-2026-07-04.md).

#### Fixed

- **`20260703130000_homepage_genre_index.sql`** — `CREATE INDEX CONCURRENTLY` внутри транзакции ломал накатку с нуля (воспроизведено: `cannot run inside a transaction block`); заменён на обычный `CREATE INDEX IF NOT EXISTS` (no-op там, где индекс уже создан копией из `20260704014859`).
- **Дубль версии миграции** — `20260708000000_sound_effects.sql` (Sprint 053) переименована в `20260708000001_sound_effects.sql`: два файла с одинаковым префиксом версии ломают `schema_migrations` (duplicate key).
- **Опечатка `timestamstz`** в `sound_effects.updated_at` — миграция Sprint 053 падала бы и на проде (`type "timestamstz" does not exist`).

#### Added

- **`20260709000000_restore_profile_like_stats.sql`** — восстанавливает поддержку `profiles.stats_likes_received`, молча потерянную хотфиксом `20260704015457`: `ADD COLUMN IF NOT EXISTS` (закрывает дрейф прод-схемы), backfill из живых лайков, триггер `update_track_likes_count()` снова обновляет счётчик профиля. Проверено на срезе, включая сценарий дрейфа.

#### Verified

- Перекрытие `20260703120000` (Sprint 049) и `20260704014859` (Lovable) **идемпотентно, конфликта нет** — повторная накатка чистая; функциональные тесты триггеров (резолв версии, деривация track_id, unique (user, version), inc/dec счётчиков, удаление orphan-лайков) — все зелёные.

### 🎯 Sprint 053 + 054 — Suno API completion: 24/28 → 28/28 (100%) ✅ (2026-07-04)

> Commits `c896baf1` … `6dc90af5` в `claude/sprint-053-054-suno-completion-pilot` (5 коммитов, merge в main ниже в этом релизе). **Suno API покрытие достигло 100%** — Sprint 053 закрыл Sounds + MIDI direct + Boost Style, Sprint 054 закрыл Details suite × 6 + cleanup dead code.

#### Added

- **Edge functions (Supabase) — 9 новых:**
  - `suno-sounds` + `suno-sounds-callback` + `suno-sounds-status` — `POST /api/v1/sound/generate` (SFX: prompt + model + tempo 60-200 + key + duration ≤60s). Callback пишет в `sound_effects`.
  - `suno-midi` + `suno-midi-callback` + `suno-midi-details` — `POST /api/v1/generate/midi` (прямая MIDI-транскрипция через Suno, 5 credits). Callback загружает `.mid` в Storage bucket `midi` (`tracks/{versionId}.mid`). Replicate fallback при FAILED (race-condition protection: `midi_generation_source` сбрасывается в NULL).
  - `suno-music-details` + `suno-cover-details` + `suno-video-details` + `suno-wav-details` + `suno-lyrics-details` + `suno-separation-details` — Details suite × 6: каждый 15-30 LOC thin-wrapper над shared `fetchSunoTaskDetails(taskType, taskId)` в `_shared/suno-details.ts`. Per-type backoff: lyrics 1500ms / cover+music 2000ms / wav+video 3000ms / separation 4000ms / midi 5000ms.
- **Shared helper** [supabase/functions/_shared/suno-details.ts](supabase/functions/_shared/suno-details.ts) — единая точка для всех 7 details-endpoints: `SunoTaskType` (7 типов), `fetchSunoTaskDetails()`, `BACKOFF_MS_BY_TYPE`, `isSunoTaskType()`.
- **DB миграции:**
  - **`sound_effects`** — новая таблица (`user_id`, `task_id`, `prompt`, `audio_url`, `image_url`, `duration`, `status`, `metadata`, timestamps). RLS: пользователи видят только свои SFX.
  - **`track_versions.midi_url` + `midi_generation_source`** — `text` + `text check (in ('suno','replicate'))`. Partial index на непустые sources. Поддержка Suno primary + Replicate fallback.
- **UI:**
  - **SfxGeneratorSheet** ([src/components/library/SfxGeneratorSheet.tsx](src/components/library/SfxGeneratorSheet.tsx)) — MobileBottomSheet (Vaul) с prompt + tempo slider 60-200 + key picker + duration slider ≤60s. Превью-аудио через `usePreviewAudio`.
  - **BoostStyleMenuItem wiring** — подтверждён 8 unit-тестами: `StyleSection → FormFieldActions.onAIAssist → useGenerateFormValidation.handleBoostStyle → supabase.functions.invoke('suno-boost-style')`. Edge — Lovable AI gateway proxy (НЕ Suno endpoint). Решение: CONNECT (а не deprecate).
- **Telegram bot:** `/sfx` команда — wizard prompt→tempo/key→генерация→отправка в чат.
- **Generic polling hook** [src/hooks/generation/useSunoTaskDetails.ts](src/hooks/generation/useSunoTaskDetails.ts) — единый entry point для Suno polling. Edge-bridge в [src/api/suno-task-details.api.ts](src/api/suno-task-details.api.ts): `EDGE_FUNCTION_BY_TYPE`, `POLL_INTERVAL_MS_BY_TYPE`, `isSunoTaskType()`. Per-type polling interval, stops on SUCCESS/FAILED, 7 unit-тестов.

#### Changed

- **i18n** + **edge-bridge pattern** — new convention: tables missing в generated Supabase types после миграции НЕ должны использоваться напрямую из клиента. Edge делает untyped `.select()` → returns typed JSON. Исключает ESLint `no-explicit-any: error` budget 0/50 в production.

#### Removed

<<<<<<< HEAD

- **`supabase/functions/suno-check-status/`** (449 LOC dead code) — graphify + grep подтвердили zero client callers. Callbacks уже нативно пишут в `tracks`/`track_versions`/`track_change_log`/`notifications`. Alias `[functions.suno-check-status]` удалён из `supabase/config.toml`. **054-A9 (миграция 5 hooks) — NOT APPLICABLE** (см. [SPRINT-054-RETRO.md](docs/sprints/SPRINT-054-RETRO.md)): 3 хука не существуют, 2 не используют `suno-check-status`. Hook `useSunoTaskDetails` готов для **будущих** Suno polling use-cases.
  \=======
- **`supabase/functions/suno-check-status/`** (449 LOC dead code) — graphify + grep подтвердили zero client callers. Callbacks уже нативно пишут в `tracks`/`track_versions`/`track_change_log`/`notifications`. Alias `[functions.suno-check-status]` удалён из `supabase/config.toml`. **054-A9 (миграция 5 hooks) — NOT APPLICABLE** per [SPRINT-054-RETRO.md](docs/sprints/SPRINT-054-RETRO.md): 3 хука не существуют, 2 не используют `suno-check-status`. Hook `useSunoTaskDetails` готов для **будущих** Suno polling use-cases.

> > > > > > > claude/sprint-closure-planning-m6skuk

#### Tests

- **+28 unit-тестов:** `useSunoSounds` (+6), `useSunoMidi` (+7), `useGenerateFormValidation` (+8), `useSunoTaskDetails` (+7). Итого **320/320 passing в 24 suites** (было 292/20).
- **E2E:** Storybook story для `SfxGeneratorSheet` (3 state — default / generating / success).

#### Docs

- [docs/sunO_API.md → История изменений → Sprint 053/054](docs/SUNO_API.md) — full diff: edge functions, shared helper, cleanup, generic hook, UI, Telegram bot, DB миграции, edge-bridge pattern, graceful degradation, Mermaid callback diagram, метрики.
- [PROJECT_STATUS.md → Suno API gap-анализ](PROJECT_STATUS.md) — таблица 28/28 ✅, секции Sprint 053 / 054, метрики.
- [docs/sprints/SPRINT-053-RETRO.md](docs/sprints/SPRINT-053-RETRO.md) + [docs/sprints/SPRINT-054-RETRO.md](docs/sprints/SPRINT-054-RETRO.md) — ретро (TTankup 052 lessons applied).

---

### 🔧 P0 hotfix: typecheck на main + план закрытия спринтов (2026-07-04, вечер)

> PR #576/#577 (влиты) + ветка `claude/sprint-closure-planning-m6skuk`. План: [SPRINTS/SPRINT-CLOSURE-PLAN-2026-07.md](SPRINTS/SPRINT-CLOSURE-PLAN-2026-07.md).

#### Fixed

- **8 ошибок `tsc` на `main`** из Sprint 052 (`fa45641`, PR #576): `MashupDialog.tsx` деструктурировал `data` из `useTracks()` (хук возвращает `tracks`) — это был и runtime-баг (пикеры треков Mashup всегда пустые); `SunoMashupParams`/`SunoPersonaParams` переведены с `interface` на `type` (implicit index signature для `invoke`-обёртки). Quality & Build на `main` снова зелёный; unit 292/292 (20 suites).
- **7 битых ссылок в `docs/VOICE_CLONING_INTEGRATION.md`** (роняли Docs workflow / lychee): устаревшие пути voice-cloning файлов (`useVoiceCloning.ts` → `src/hooks/voice/useVoiceCloneWizard.ts`, `VoiceCloningStudio.tsx` → `src/components/voice-clone/VoiceCloneWizard.tsx`), несуществующие `VOICE_CLONING_README.md`/`docs/SUPPORT.md`, `../../`-пути выше корня репозитория, 404 `docs.sunoapi.org/suno-voice`.

#### Added

- **Регрессионные тесты `MashupDialog`** (`11dadd1`, PR #577): 4 теста в `src/__tests__/components/MashupDialog.test.tsx`.
- **[SPRINTS/SPRINT-CLOSURE-PLAN-2026-07.md](SPRINTS/SPRINT-CLOSURE-PLAN-2026-07.md)** — операционный чеклист закрытия спринтов 050/051/052-C/053/054/055 с верифицированным состоянием CI и чеклистом обновления документации.

#### Changed

- Статус-документы синхронизированы с фактическим состоянием: `PROJECT_STATUS.md` (Sprint 050 в работе, блокеры, бейджи), `SPRINTS/SPRINT-PROGRESS.md` (метрики тестов 292/20 по фактическому прогону), `README.md` («Текущий фокус» → Sprint 050), `CLAUDE.md`.

### 🎛️ Sprint 052 — Suno Mashup + Persona + File Upload Proxy (2026-07-04)

> Commits `916cd72a` … `b778bf98`. Реализует категории #1, #2, #3 из аудита Suno API (см. `docs/SUNO_API.md` → История изменений → Sprint 052).

#### Added

- **Edge functions (Supabase):**
  - `suno-mashup` — проксирует `POST /api/v1/generate/mashup`; принимает `trackAId + trackBId` + Suno-параметры (`customMode`, `prompt`, `style`, `title`, `model`, `vocalGender`, `styleWeight`, `weirdnessConstraint`, `audioWeight`); валидация лимитов Suno (3000/5000 prompt, 200/1000 style, 80/100 title); callback через существующий `suno-music-callback`.
  - `suno-persona` — проксирует `POST /api/v1/generate/persona`; принимает `trackId` или `mashupTaskId` + `name` + `description`; стартует обучение голоса.
  - `suno-persona-callback` — обновляет `track_personas` (`status = 'ready'`, заполняет `suno_persona_id`) после того как Suno завершит обучение.
  - `suno-file-upload` — multi-action прокси для `POST /api/v1/files/base64` и `POST /api/v1/files/url`; лимит 50 МБ; возвращает `{ file_url, expires_in_days: 3 }`.
- **DB migration:** новая таблица `public.track_personas` (`id`, `user_id`, `suno_persona_id`, `name`, `description`, `audio_url`, `image_url`, `status` enum `pending|ready|failed`, `task_id`, `created_at`, `updated_at`) + колонка `track_versions.persona_id` (FK nullable). RLS: пользователь видит/редактирует только свои персоны.
- **UI hooks (TanStack Query mutations):** `useSunoMashup`, `useSunoPersona`, `useSunoFileUpload` (расположение: `src/hooks/studio/`).
- **`MashupDialog`** (`src/components/MashupDialog.tsx`) — мобильная + десктоп версии через `useIsMobile`; пикеры двух треков из библиотеки (`useTracks({ statusFilter: ["completed"] })`); фильтр trackB исключает trackA; model select V5/V4_5PLUS/V4_5/V4/V3_5; custom-mode toggle; валидация (80-char name, prompt по модели через `validatePromptForGeneration`).
- **Track actions integration:** добавлен `ActionId 'mashup'` в `trackActionsConfig.ts` (label: «Mashup с другим треком», icon `Disc`, priority 48, `requiresCompleted + requiresAudio`); `DialogStates.mashup` в `useTrackActionsState.ts`; кнопка в `CreateActions.tsx` (sheet + dropdown-menu variants).
- **GenerationResultSheet:** кнопка «Create Persona» в footer-grid (3 cols); Dialog с name (80-char limit) + description; вызывает `useSunoPersona`.
- **Telegram bot:** команда `/mashup` → deep-link `?startapp=mashup_<trackId>` через `web_app` кнопку; callback `mashup_<trackId>` → `handleMashup` (`telegram-bot/commands/mashup.ts`); добавлена кнопка «Mashup с другим треком» в keyboard `createTrackDetailsKeyboard`.
- **E2E:** `tests/e2e/suno-mashup.spec.ts` — два smoke-теста (deep-link не крашит mini app; MashupDialog рендерится из track actions menu; skips при пустой library).
- **Docs:** `docs/SUNO_API.md` — раздел «История изменений → Sprint 052» (DB schema, edge contracts, curl-примеры mashup/persona/upload); 3 новых curl-примера в секции «Примеры использования» (Пример 5/6/7).

#### Changed

- **`suno-upload-cover` и `suno-upload-extend`** — рефакторинг: убрана собственная multipart-логика (~80 строк дублирования); теперь вызывают общий `_shared/suno-file-uploader.ts → forwardBase64ToSuno`.

#### Deferred (Sprint 052-C)

- **Storybook stories** для `MashupDialog` (states: empty / loading / error / success).
- **i18n strings** (en/ru) для mashup/persona flows — добавлю в отдельном cleanup-спринте.

### 🧹 Sprint 052-C cleanup (2026-07-04)

> Завершение хвоста Sprint 052. План: [docs/sprints/SPRINT-052-RETRO.md](docs/sprints/SPRINT-052-RETRO.md).

#### Added

- **`MashupFormFields`** ([src/components/mashup/MashupFormFields.tsx](src/components/mashup/MashupFormFields.tsx)) — pure-Dumb под-компонент формы mashup'а, вынесенный из `MashupDialog`. Все значения через props, без React Query хуков. Используется в `MashupDialog` (`src/components/MashupDialog.tsx`).
- **Storybook stories для `MashupFormFields`** ([src/stories/mashup/MashupFormFields.stories.tsx](src/stories/mashup/MashupFormFields.stories.tsx)) — 5 stories: Empty / FilledA / Instrumental / Loading / Invalid. Не требуют мока TanStack Query (работают в текущей инфраструктуре SB 8.1).
- **`MASHUP_STRINGS`** ([src/lib/locale/mashupStrings.ts](src/lib/locale/mashupStrings.ts)) — единый источник UX-копи для MashupDialog + PersonaDialog + Telegram `/mashup`/`/persona` команд. Текущая модель: только RU (i18n-система отсутствует в проекте, см. PROJECT_STATUS); EN добавляется в Sprint 055 при вводе `react-i18next`.
- **Sprint 052 retro** ([docs/sprints/SPRINT-052-RETRO.md](docs/sprints/SPRINT-052-RETRO.md)) — разбор «почему 052 влился без зелёного typecheck»: корневые причины (MashupDialog data→tracks баг + interface→type для invoke), что сработало / не сработало, action items для Sprint 050-A4/051/053+.

#### Changed

- **`MashupDialog`** ([src/components/MashupDialog.tsx](src/components/MashupDialog.tsx)) — упрощён: вся inline-форма вынесена в `MashupFormFields`; user-facing строки и toast/validation messages извлечены в `MASHUP_STRINGS`.
- **`GenerationResultSheet`** ([src/components/generate-form/GenerationResultSheet.tsx](src/components/generate-form/GenerationResultSheet.tsx)) — PersonaDialog (inline-блок `Train Persona`) переведён на `MASHUP_STRINGS.persona`. Тексты заголовка/label/placeholder/кнопок/логов/тостов извлечены.

#### Notes

- Storybook stories для всего `MashupDialog` (со всеми React Query хуками) **требуют инфраструктурной настройки** (webpack alias для моков или `@storybook/test ≥ 8.2` с `parameters.mocks`). Это вне scope 052-C — отложено в Sprint 055 вместе с i18n.
- `MASHUP_STRINGS` — typed const, переход на `react-i18next` сводится к `i18n.t('form.trackALabel')` после добавления EN.

### 🎼 Editorial lyrics editor + tag picker for advanced generation (2026-07-04)

> Sprint 052-A5. Landed in commit `18b1e80e` as part of the broader Suno-file-upload refactor.

#### Changed

- **`LyricsVisualEditorCompact`** — replaced the flat list with an editorial-spread layout per section: numbered glyph marker (`font-display`, `text-[40-48px]`), mono overline header with ordinal counter, 9-button type strip (intro / verse / pre-chorus / chorus / hook / bridge / drop / breakdown / outro), hairline textarea, and a 5-button action tray (clear, duplicate, AI-fill, delete, move). Empty state now offers 3 template tiles (Pop · Рэп · EDM) + 9 single-section tiles + an AI pull-quote. The component publishes focus + DOM sync snapshots to `window.__lyricsEditorMetrics` so the dev-only `LyricsEditorMetricsOverlay` can render the round-trip behaviour live.
- **`SectionTagSelector`** — collapsed the four `Tabs` into a single vertical numbered category stack (`01 · Вокал (3 / 12)` … `04 · Эмоции (2 / 12)`) with inverted selected chips (foreground fill, background text), a selected tray (`выбрано · NN` + `clear · NN`), and a bottom-anchored custom-tag input. Compact mode keeps the same body inside a `Sheet`, so behaviour does not fork between inline and modal.
- All editorial tokens (`font-display`, `font-mono`, `text-overline`, `text-caption`, `text-body-sm`, `tracking-[0.18em]`, hairline `border-foreground/15`) follow the same spec already used by `GenerationResultSheet` so the form looks like one magazine spread.

#### Preserved

- Public API of both components is byte-stable: `<LyricsVisualEditorCompact value onChange onAIGenerate? disabled? />` and `<SectionTagSelector selectedTags onChange sectionName? compact? />`.
- Existing utilities (`parseLyrics`, `sectionsToLyrics`, `sectionsEqual`, `applyTemplateToSections`, `getSectionColor`) keep their semantics and signatures; `applyTemplateToSections` keeps per-type content pools.
- Test surface green: 12/12 unit tests pass (`LyricsVisualEditorCompact.test.tsx` + `LyricsVisualEditorCompact.templates.test.tsx`); `tsc` clean; `prettier` clean; only expected `react-refresh/only-export-components` warnings for the helper exports the tests rely on, plus one `no-restricted-syntax` warning on the intentional `text-[40px]` glyph marker.

### 🔧 Progress audit — E2E dependency fix + status-doc corrections (2026-07-04)

#### Fixed

- **Missing `@axe-core/playwright` dependency** — `tests/e2e/a11y.axe.spec.ts` imports `@axe-core/playwright`, but only the unrelated `axe-core` package was declared in `package.json`. This crashed Playwright's test collection for the **entire** E2E suite, not just the a11y spec. Added `@axe-core/playwright` to `devDependencies`.

#### Changed

- Corrected several stale claims in `PROJECT_STATUS.md`/`ROADMAP.md`: Sprint 045 marked as complete (header previously contradicted its own phase table); the ">800 LOC" file list updated from 6 to the actual 9 files (`ProjectDetail.tsx`/`usePromptDJEnhanced.ts`/`useUnifiedStudioStore.ts` had already been decomposed in Sprint 042 and no longer qualify); the documented E2E blocker (a syntax error at `tests/e2e/studio/mixer-optimization.spec.ts:158`, attributed to a commit that doesn't exist in history) replaced with the actual root cause above.

### ⚡ Bundle & Type Safety — eager-load fix, `any`-cleanup complete (2026-07-03)

#### Fixed

- **Eager-load bundle (#568, `64c9d1d`)** — what the homepage (and every other page) actually fetches on cold load dropped from **~1.19 MB gzip to ~508 KB gzip**. Root cause: `feature-admin-studio`, `vendor-charts`, `vendor-dnd`, `vendor-forms`, and `vendor-confetti` were unconditionally `<link rel="modulepreload">`'d into every page via a static import in `TrackDetailSheet.tsx` (now `React.lazy()`) and a barrel-import in `MainLayout.tsx`/`GlobalGenerationIndicator.tsx` that transitively pulled in `PromptHistory.tsx`. `build.modulePreload.resolveDependencies` added in `vite.config.ts` to stop the browser from speculatively preloading the remaining genuine hard dependencies. Full write-up: [docs/BUNDLE_ANALYSIS.md](docs/BUNDLE_ANALYSIS.md).
- **`getOptimizedImageUrl()`/`generateSrcSet()`** (`src/lib/imageOptimization.ts`) — were appending resize params to the Supabase **object** storage endpoint, which silently ignores them (no resize/optimization was ever happening). Rewritten to the **render** endpoint.

#### Changed

- **All remaining `no-explicit-any` ESLint errors eliminated (#567, `6e58dda`)** — 58 → 0, mostly in `src/hooks/**`. Repository now sits at **0 uses of `any`** in `src/` (down from 342 at the start of Sprint 044's type-safety push). `scripts/count-any.mjs` budget (≤50) now passes with large margin. Fixing the casts surfaced and fixed **2 real bugs** that had been hidden behind `any`.

### 🎨 Redesign — mobile track cards + homepage reconnect (2026-07-03)

#### Changed

- **Mobile track cards redesigned + homepage sections reconnected (#566/#562, `f94b3e1`/`6960e4f`)** — track card variants on the mobile homepage restyled; previously-disconnected homepage sections wired back into the page.
- **Scroll-reveal + micro-interactions on mobile home UI (#559, `2164b06`)** — scroll-triggered reveal animations and micro-interactions added to the mobile homepage.

### 🎛 Спринт 049 — Mobile UX: A/B версии, per-version лайки, плеер, главная (2026-07-03) — ЗАВЕРШЁН ✅

Аудит мобильных экранов по багрепорту: главная страница, переключение A/B версий, система лайков, полноэкранный плеер с лирикой. Ветка `claude/mobile-screens-layout-audit-um3hwx`, коммиты `7904ce9b` → `3d428a7c` → `304ee287`.

#### Fixed — главная страница (mobile)

- `src/hooks/usePullToRefresh.ts` — хук читал `scrollTop` у обёртки, которая сама не скроллится (реальный скролл живёт на `<main id="main-content">` в `MainLayout`), поэтому guard «только наверху страницы» никогда не срабатывал и `preventDefault()` на touchmove глушил нативный скролл на любом свайпе вниз — «залипание» скролла на Home и Library. Теперь резолвится реальный скроллящийся предок.
- `src/components/home/GenreTabsSection.tsx` — секции «По жанрам» исчезали: в табы прокидывался только page-level `isLoading` батч-запроса без fetch-состояния `useInfiniteGenreTracks` активного таба, и `TracksGridSection` делал `return null` на пустом массиве, пока первая страница ещё грузилась. Состояния загрузки объединены.

#### Fixed — A/B версии и плеер

- `src/hooks/useVersionSwitcher.ts` — переключение версии не обновляло карточку: per-version `tags`/`title`/`lyrics` хранятся в `track_versions.metadata` (пишутся `suno-music-callback` по клипам), но мутация копировала на `tracks` только `audio_url`/`cover_url`/`duration`. Теперь копируется всё — карточка отражает активную версию (обложка, теги, время, текст).
- `src/components/player/VersionSwitcher.tsx` — A/B-переключатель в полноэкранном плеере вообще не вызывал `setPrimaryVersion`: он подменял `id` играющего трека на id версии и звал `playTrack()`, рассинхронизируя всех потребителей по id (лайки, play/pause в «О треке», suno-ids лирики). Переведён на `useVersionSwitcher` + optimistic-подсветка активной версии + spinner.
- `src/components/player/FullscreenPager.tsx` — `dragConstraints={{left:0,right:0}}` при ленте страниц на `x = -index*width`: на страницах «Текст»/«О треке» любой горизонтальный свайп считался out-of-bounds overdrag и гасился до ~12% движения пальца («глючит переключение»). Constraints теперь покрывают весь диапазон ленты.

#### Fixed — лирика в плеере

- `src/hooks/lyrics/useParsedLyrics.ts` — Suno иногда токенизирует секционный тег по скобкам (`"["`, `"Verse"`, `"]"` отдельными словами), и фильтр целых токенов пропускал фрагменты в текст как строки. Добавлен стриппер `[...]`-спанов любой длины.
- `src/components/player/pages/LyricsPage.tsx` — слушатели паузы автоскролла (`touchstart`/`wheel`) вешались один раз с `[]`-deps и не подключались, если первый рендер был скелетоном загрузки — автоскролл боролся с пальцем пользователя; кнопка «Караоке» была absolute-потомком скролл-контейнера и уезжала вместе с текстом; двойной sync-loop (страница + караоке-оверлей) вызывал мерцание активной строки — цикл страницы теперь уступает караоке.

#### Added

- **Per-version лайки** — миграция `supabase/migrations/20260703120000_per_version_track_likes.sql`: `track_likes.track_version_id` (NOT NULL, backfill существующих лайков на активную версию, unique `(user_id, track_version_id)`), BEFORE INSERT триггер авто-резолвит версию для легаси call-sites (API-слой, Telegram-бот — работают без изменений); `track_versions.likes_count` + обновлённый counter-trigger. `useLikeTrack` стал version-aware (опциональный `versionId`, по умолчанию — активная версия). ⚠️ Миграция в репозитории, на прод БД пока не применена.
- `LyricsPage` — пилюля «К текущей строке»: появляется при ручном скролле (когда автоскролл на паузе), тап мгновенно возвращает к активной строке и возобновляет автоскролл.
- `DetailsPage` (плеер) — теги трека как wrapping-чипы с категорийными цветами (`getDisplayTags` + `tagColors`), синхронизированы с активной версией после A/B-переключений.
- `FullscreenPager` — локализованные aria-подписи точек-индикаторов + `aria-current`.

### 🎨 Спринт 048 — Creation-Flow Motion Pass + Mobile Perf Fixes (2026-07-03) — ЗАВЕРШЁН ✅

Анимации и полировка UX для четырёх ключевых сценариев (создание проекта, создание артиста, AI-чат ассистента, создание трека в проекте), затем три бага, найденные на реальном мобильном устройстве после первого прохода, устранены отдельным коммитом.

#### Added — motion pass

- `src/components/project/ProjectCreationWizard.tsx` — анимированный выбор карточки типа проекта (spring-check бейдж), staggered появление полей формы, bounce-in иконка завершения.
- `src/components/CreateArtistDialog.tsx` — staggered появление секций формы, spring-реveal аватара, анимированные жанр/mood чипы (`AnimatePresence`).
- `src/components/lyrics-workspace/LyricsAIChatAgent.tsx` — bouncing-dot индикатор набора текста, пульсация аватара ассистента во время ответа, spring-фидбек на кнопке отправки.
- `src/components/track-actions/IconGridButton.tsx`, `src/components/project/detail/MobileQuickActionsGrid.tsx` — staggered появление 2×2 грида быстрых действий, spring tap-фидбек, анимированный бейдж-счётчик.
- `src/components/generate-form/ArtistSelector.tsx`, `src/components/generate-form/ProjectTrackSelector.tsx` — staggered появление списков выбора артиста/проекта/трека, анимированное кольцо выбора.

#### Fixed — found in mobile QA после motion pass

- **Обрезка бейджей рядом с скруглёнными углами `Button`** — `.btn-enhanced` (`src/index.css`) ставил `overflow: hidden` на **каждую** кнопку в приложении ради shine-оверлея; в паре с `rounded-xl` это обрезало любой бейдж/кольцо у угла кнопки (классический пример — счётчик уведомлений в `NotificationBadge.tsx` на `-top-1 -right-1`). Исправлено на уровне корня: `overflow: hidden` убран, `::before`-оверлей получил `border-radius: inherit` и сам клипуется по скруглению — бейджи больше не обрезаются нигде в приложении, где они лежат внутри `<Button>`.
- **Лаги анимаций на мобильных** — убраны все continuous JS-driven анимации, добавленные в motion pass, которые давали заметную нагрузку на low-end Android: анимированный `blur()`-фильтр на аватаре AI-чата (заменён на `animate-pulse-glow`, чистый box-shadow), 3 параллельных framer-motion цикла в индикаторе набора текста (заменены на CSS `animate-bounce`), JS rotate+scale loop на иконке в шапке `ProjectCreationWizard` (заменён на CSS `animate-pulse`), JS scale+opacity loop на кольце генерации портрета (заменён на существующий CSS-класс `.pulse-ring`).
- **Глюки скролла на мобильных** — авто-скролл чата AI-ассистента (`LyricsAIChatAgent`) использовал `scrollTo({behavior:"smooth"})`, повторный вызов которого на каждое обновление сообщения конфликтовал с тач-скроллом пользователя; возвращено на мгновенный `scrollTop =`. Также убраны JS `whileHover`-жесты (Framer Motion pointer-listeners) с элементов списков внутри скролл-контейнеров (`IconGridButton`, `ArtistSelector`, `ProjectTrackSelector`, карточки типа проекта) — hover-фидбек на десктопе теперь чистый CSS (`hover:-translate-y-px` / `hover:translate-x-0.5`), без активных pointer-слушателей, которые могли конкурировать с нативным скроллом на тач-устройствах.

### 🎨 Спринт 047 — Mobile Audit + Z-Index/Spacing/Scroll-Lock + Player Z-Stack (2026-07-03) — ЗАВЕРШЁН ✅

Пять атомарных коммитов на mobile-first аудит: z-index consolidation, persona/project/generator sheets, player z-stack cascade, safe-area single-source.

#### Phase A — Tokens (коммит `5d97fa1f`)

- `tailwind.config.ts` L49–61 — добавлены `fontSize.overline` (0.625rem, tracking 0.08em, weight 600) и `fontSize.body-md` (0.8125rem). Дома для `text-[10px]`/`text-[13px]`.
- `src/lib/overlay-colors.ts` — добавлен `backdrop.sheet = "bg-background/70 backdrop-blur-sm dark:bg-black/70"`. Новый единый 70% + blur backdrop для всех bottom-sheets/dialogs.
- `src/constants/z-index.ts` и `src/lib/z-index.ts` — **удалены** (verify zero consumers → reconcile, два TS-файла конфликтовали с реальной tailwind-конфигурацией).
- `src/lib/toast-position.ts` — inline `Z_INDEX` shim сохранён для inline-style consumers (Sonner-toast/кнопки), но Tailwind классы (`z-toast`, `z-sheet-content` и т.д.) теперь single source.
- `src/components/dev/LyricsEditorMetricsOverlay.tsx` — `style.zIndex` → Tailwind class `z-max`.

#### Phase B — Community + Track Cards (коммит `dd8e734e`) — 6 файлов

- `src/components/home/CommunityTrending.tsx` — raw-white `from-white/25` → theme-aware `from-foreground/20`; `text-[17px]` / `text-[14.5px]` / `text-[12.5px]` → `text-base` / `text-sm` / `text-xs`; `w-[50px] h-[50px]` → `w-12 h-12` (44px touch baseline); `rounded-[14px]` → `rounded-xl min-h-touch`; `mt-0.5` → `mt-1`; добавлен `LazyImage` `coverSize="small"` + `Music2` fallback (cover-loading UX fix).
- `src/components/track/track-card-new/components/TrackCoverImage.tsx` — `<PlayingIndicator color="bg-white" />` → `color="bg-primary-foreground"`; `<Play text-white fill-white>` → `text-primary-foreground fill-primary-foreground`.
- `src/components/track/track-card-new/variants/GridVariant.tsx` — `text-[10px]` (stems badge) → `text-overline`; `line-clamp-2` → `line-clamp-2 xs:line-clamp-1` (single-word titles wrap cleanly on small phones).
- `src/components/track/track-card-new/variants/ListVariant.tsx` — `p-2.5 sm:p-3` → `p-3` (unify с GridVariant).
- `src/components/track/track-card-new/variants/CompactVariant.tsx` — `text-[14px]` → `text-sm`; `max-w-[140px]` → `max-w-36`; `text-[11px]` → `text-caption-sm`.
- `src/components/track/track-card-new/variants/EnhancedVariant.tsx` — `text-[10px]` (×2) → `text-overline`; `max-w-[80px]` → `max-w-32`; `text-[8px]` → `text-overline`; `compact ? text-[11px] : text-xs` → `compact ? text-xs : text-sm`.

#### Phase C — Persona + Project + Generator z-index + safe-area (коммит `c22f94c3`) — 6 файлов

- `src/components/ui/sheet.tsx` — `z-[150]` → `z-sheet-backdrop`; `z-[151]` → `z-sheet-content`; `backdrop.dark` → `backdrop.sheet`; `isFullscreen` regex extended `/\bh-\[\d+(?:\.\d+)?d?vh\]/` (project-settings `h-[90dvh]` теперь попадает в safe-area path).
- `src/components/mobile/MobileBottomSheet.tsx` — `z-[150]` / `z-[151]` → tokens; `backdrop.heavy + backdrop-blur-sm` → unified `backdrop.sheet`.
- `src/components/library/DesktopLibrarySidebar.tsx` — loading overlay `z-50` → `z-overlay`; raw `bg-background/90 backdrop-blur-sm` → `backdrop.sheet`; collapsed toggle `h-10 w-10` → `h-11 w-11 min-h-touch min-w-touch` (44px baseline).
- `src/components/project/ProjectSettingsSheet.tsx` — `h-[90vh]` → `h-[90dvh]` (iOS Safari bottom-bar collapse).
- `src/components/generate-form/PromptHistory.tsx` — nested "Add New Prompt" dialog `z-10` → `z-popover` (рендерится поверх sheet content).
- `src/components/generate-form/sections/LyricsSectionAdvanced.tsx` — dropdown `z-50` → `z-dropdown`.

#### Phase D — Player z-stack + safe-area (коммит `3b38092e`) — 3 файла (highest severity)

- `src/components/player/DesktopFullscreenPlayer.tsx` — `z-50` → `z-fullscreen` (**BUG**: было ниже compact `z-player=60`); safe-area single-source: drop `tg-content-safe-area-inset-top` double-add (один источник + единая `+1rem` для mobile/desktop паритета).
- `src/components/player/MobileFullscreenPlayer.tsx` — drag-to-close strip `z-20` → `z-sticky`; `h-10` → `h-12 min-h-touch` (44px touch target); inner wrapper `z-10` → `z-base`; `text-[11px]` → `text-caption-sm`; same safe-area single-source fix.
- `src/components/player/KaraokeView.tsx` — `z-[100]` → `z-system` (off-scale token → on-scale); inner close-btn `z-10` → `z-sticky`; `text-white` (×2) → `text-primary-foreground`; `text-white/50` → `text-primary-foreground/60`; safe-area single-source.

Все коммиты зелёные по `tsc --noEmit + eslint + prettier --check + commitlint (lowercase-subject) + size check`.

#### Функциональные флаги — НЕ правились в этом спринте, переданы build-агенту

| ID  | Описание                                                                                                                                                                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | `useScrollLock` экспортируется но не подключён ни в одном sheet/drawer/sheet-rendered-in-mobile-bottom-sheet. Body всё ещё скроллится под MobileBottomSheet, MobileNavDrawer, ProjectSettingsSheet, DesktopLibrarySidebar overlay. **Build agent** должен разово подключить. |
| F2  | `PromptHistory` nested dialog z-fix — tokenized to `z-popover` здесь, но корневая причина (sub-dialog внутри sheet) может потребовать Dialog primitive.                                                                                                                      |
| F3  | `usePublicTracks.ts:95` — `cover_url: activeVersion?.cover_url \|\| track.cover_url` может дать `""` → LazyImage fallback. Normalize to `undefined`.                                                                                                                         |
| F4  | `Library.tsx:122–172` keyboard arrow nav — нет `aria-selected` / scroll-into-view.                                                                                                                                                                                           |
| F5  | `QueueSheet` не auto-close на навигации.                                                                                                                                                                                                                                     |
| F6  | Mobile fullscreen нет focus-trap (Tab утекает за диалог).                                                                                                                                                                                                                    |
| F7  | Telegram BackButton race — registered в Mobile + Desktop fullscreen players, может double-fire при orientation flip.                                                                                                                                                         |
| F8  | FOWV risk on viewport-flip — `useMediaQuery` defaults to false on first paint. SSR-aware default + noscript fallback.                                                                                                                                                        |
| F9  | iOS Telegram WebView keyboard avoidance в `GenerateFormSimple` — нет `useVisualViewport`.                                                                                                                                                                                    |
| F10 | `VersionComparison.tsx` — orphan dead code.                                                                                                                                                                                                                                  |
| F11 | `LibraryFilterChips.tsx:42` min-h 32px vs `CompactFilterBar.tsx:148` 44px — touch-target baseline mismatch.                                                                                                                                                                  |
| F12 | `LazyImage` lacks `aria-busy` / `aria-live` during shimmer.                                                                                                                                                                                                                  |

---

### 🎨 Спринт 046 — Desktop Layout Polish + 4K Awareness (2026-07-03) — ЗАВЕРШЁН ✅

Full-surface desktop-layout audit (40+ компонентов) на брейкпоинтах `lg`/`xl`/`2xl`/`3xl`/`4xl`. Три атомарных коммита, каждый зелёный по `tsc` + ESLint + Prettier + pre-commit hooks.

#### Phase A — 4K-aware tokens (коммит `8eb55c78`)

Расширена центральная token-система (`src/lib/breakpoints.ts`, `src/lib/design-tokens.ts`, `src/components/layout/Section.tsx`):

- `BREAKPOINTS`: добавлены `3xl: 1920`, `4xl: 2560`
- `GRID_COLS.{cards,tracks,tools,compact}` — расширены ступенями `2xl:grid-cols-N 3xl:grid-cols-N+1`
- `MAX_WIDTHS`: добавлены `ultrawide: max-w-[1600px]`, `fourk: max-w-[1760px]`
- `LAYOUT_RATIOS.{default,equal,wide}` — добавлены `xl:` и `2xl:` step-downs (60/40 → 55/45 → 50/50)
- `SIDEBAR_WIDTHS.expanded`: добавлены `xl:w-72 2xl:w-80`
- `GAPS`: добавлены `3xl: gap-10`, `4xl: gap-12`
- `spacingClass.cardPadding: "p-3 sm:p-4 lg:p-5 xl:p-6"`, `spacingClass.lyricsWord: "text-base xl:text-lg 2xl:text-xl leading-[1.5]"`
- Новый `containerMax` блок (`narrow`/`medium`/`wide`/`full`/`ultrawide`/`fourk`)
- `Section.tsx`: `SectionDensity` `4xl` / `5xl`, `SectionMaxWidth` `ultrawide` / `fourk`

Все токены обратно-совместимы — старые call-sites не сломались, `npm run build` чистый.

#### Phase B — Surface alignment (коммит `c0d5b942`) — 19 файлов

Применение 4K-токенов к high-traffic поверхностям:

- **Player:** `CompactPlayer` (cover 14→16/72px, dock `max-w-5xl`→1280px на 2xl); `DesktopFullscreenPlayer` (outer padding xl/2xl, container cap 2xl, typography step-up, cover+controls `max-w-md`→`xl:lg`/`2xl:xl`); `WaveformProgressBar` (detailed mode → `fullscreen` density, 36→44px); `QueueSheet` (mobile `h-[75vh]` → desktop centered dialog 640px); `LyricsPanel` + `LyricsPage` + `DetailsPage` (`max-w-[28rem]` → `xl:max-w-[36rem]`, lyrics word size через `typographyClass.lyricsWord`); `CoverPage` (cover cap 22rem → xl:96 / 2xl:28rem).
- **Track cards + Library:** `VirtualizedTrackList` (grid xl:5 → 2xl:6 → 3xl:7); `Library.tsx` (skeleton parity xl:6, 4 header buttons step up на lg, master-detail scale на xl/2xl, двойной border артефакт убран); `TrackDetailPanel` (cover 32→40/48, raw `<img>` → `LazyImage`); `EnhancedVariant` (raw `<img>` → `LazyImage`, `line-clamp-1` → `line-clamp-2` для паритета); `GridVariant` (title `text-xs/sm` → `xl:text-base 2xl:text-lg`).
- **Filter parity:** `LibraryFilterChips` min-h 32→36 (touch baseline); `CompactFilterBar` `hidden xs:inline` → `hidden sm:inline`.
- **Lyrics + Studio:** `LyricsAIPanel` (hard-coded `width: 400` → named constant `LYRICS_AI_PANEL_WIDTH`); `LyricsStudioPage` editor обёрнут в `max-w-3xl/5xl/6xl mx-auto` для line-length readability; `StudioShell` transport bar `flex-wrap` + `xl:gap-3`, master volume slider 20→32/40; `StudioShellHeader` tabs labels `hidden lg:` → `hidden sm:` (parity с правым actions блоком).
- **Pre-existing type cleanup:** 4 pre-existing `@typescript-eslint/no-explicit-any` ошибки в `LyricsStudioPage.tsx` и `StudioShell.tsx` типизированы (типы, не поведение) — разблокировали pre-commit hook.

#### Phase C — Polish (коммит `6d57fa68`) — 4 файла

Схлопывание cross-cutting паттернов из аудита:

- `DesktopContentHubLayout.tsx` — detail panel теперь использует `layoutRatio.detail` token (xl/2xl step-down); empty-state placeholder `2xl:hidden` чтобы не тратить 40% рельса на ultra-wide.
- `DesktopDashboardLayout.tsx` + `DesktopToolsGridLayout.tsx` — ручные `gapClasses`/`space-y-N`/`mt-N` мигрированы в `GAPS` token; column gap и bottom margins step up на lg/xl/2xl.
- `LyricsHeader.tsx` — `bg-card/50` → `bg-background/95 backdrop-blur-md` (parity с `Projects.tsx:98` и `StudioShellHeader.tsx:75`).

#### Верификация Sprint 046

- `npx tsc --noEmit -p tsconfig.app.json` → exit 0 во всех 3 коммитах
- ESLint changed files → 0 errors (4 pre-existing `any` ошибки типизированы)
- Prettier → все touched files отформатированы
- pre-commit hooks: Section tokens / eslint / prettier / tsc / commitlint — все ✅
- 3 коммита в main: `8eb55c78` → `c0d5b942` → `6d57fa68`
- 12 функциональных флагов переданы build-agent (functional policy = design-only)

### 🎨 Спринт 045 — UX/UI Deep Polish (2026-07-03) — В РАБОТЕ 🟡

#### Исправлено

- **Emoji-as-icons → Lucide** в 4 файлах (коммит `0813d631`):
  - `src/components/track/track-card-new/variants/EnhancedVariant.tsx` — символ `✓` → `<Check>` с текстом «Подписка»
  - `src/components/track/track-card-new/variants/GridVariant.tsx` — fallback `♪` → `<Music2>`
  - `src/components/track/track-card-new/variants/ListVariant.tsx` — fallback `🎵` → `<Music2>`
  - `src/components/hints/ContextualHint.tsx` — категорийные emoji (`🚀 ✨ 📁 👤 💬 ⚙️ 💡`) → `<Rocket> <Sparkles> <FolderOpen> <User> <MessageCircle> <Settings> <Lightbulb>`
- **Touch-target ≥ 44×44px** на 3 ключевых сценариях:
  - `CompactVariant.tsx` — more-menu кнопка `w-10 h-10` → `w-11 h-11 min-w-[44px] min-h-[44px]`
  - `UnifiedTipCard.tsx` — close-button `h-8 w-8` → `h-11 w-11 min-[44px]`; «Понятно»/«Далее» получили `min-h-[44px]` на мобиле
  - `ContextualHint.tsx` — close + action + «Не показывать» кнопки приведены к 44px на мобиле (`md:` снижает до компактного)
- **Raw color tokens → semantic** (`text-white`/`bg-black`/`from-black`):
  - `EnhancedVariant.tsx` — `text-white` (4× на like/plus/follow/share) → `text-foreground`; `from-black/70 via-black/10` → `from-foreground/70 via-foreground/10`
  - `GridVariant.tsx` — `bg-red-500/20 text-red-500` swipe-like indicator → `bg-primary/20 text-primary`
  - `CompactPlayer.tsx` — `ring-white/10` → `ring-border/30`; `shadow-black/10` → `shadow-foreground/10`

#### Изменено

- `src/components/track/track-card-new/variants/ListVariant.tsx` — удалён дубль `useTrackCardState()` (две подписки на один стейт вместо одной); `isOwnTrack` теперь из основной деструктуризации
- `src/components/track/track-card-new/types.ts` — без изменений (типы уже правильные после Sprint 038)

#### Верификация

- `npx tsc --noEmit -p tsconfig.app.json` → exit 0 (0 errors)
- ESLint changed files → 0 errors, 13 pre-existing warnings (не связаны с правками)
- Grep подтвердил отсутствие `text-white|bg-white|text-black|bg-black|ring-white|shadow-black|from-black|from-white` и emoji-as-icons во всех изменённых файлах
- pre-commit hooks пройдены (Section tokens / eslint / prettier / tsc / commitlint)

#### Phase B — Motion Hygiene (коммит `68cae274`)

- **PageTransition keyframes fix** (`src/index.css`) — 4 варианта (`page-fade`, `page-slide-up`, `page-slide-left`, `page-scale`) переписаны как `from { opacity: 0 } → to { opacity: 1 }` с `animation-fill-mode: both`. До: анимации стартовали с `opacity: 1` и мгновенно завершались — UI всегда видна без transition.
- **BottomNavigation `isActive()` fix** — `/` использовал `path + "/"` prefix-match, который матчил любой pathname (т.к. все начинаются с `/`), из-за чего Home оставалась активной на всех маршрутах. Теперь: exact match для root, prefix match только для nested.
- **HomeHeader `repeat: Infinity` ×5 guards** — все 5 бесконечных framer-motion переходов обёрнуты в `safeTransition({...})` из `useReducedMotion`. При `prefers-reduced-motion: reduce` коллапсирует в `duration: 0`. Соответствие WCAG SC 2.3.3.

#### Phase C — Token Consolidation (коммит `28413a5d`)

- **`typographyClass.navLabel`** — новый design token `"text-[11px] leading-none tracking-tight"` в `src/lib/design-tokens.ts`. BottomNavigation `<span>` подписи переведены с произвольного `text-[11px]` на семантический токен.
- **`aurora-glow` documented as composition** — два определения в `index.css` (L2275 box-shadow, L2440 ::before radial-gradient) — намеренная двухслойная композиция (ring + halo), не дубль. Добавлены комментарии.
- **`vinyl-spin` / `vinyl-spin-slow` motion-reduce guard** — в `@media (prefers-reduced-motion: reduce)` оба варианта получают `animation: none`. Соответствие WCAG SC 2.3.3.

#### Phase D — Visual Polish (коммит `69e652a8`)

- **`.glass-card:hover` hover guard** — обёрнут в `@media (hover: hover)`. Touch-only устройства (Telegram mobile, планшеты) больше не получают sticky `translateY(-2px)` после тапа. Реальные курсоры сохраняют elevation lift (WCAG SC 2.5.1).
- **Shadow rgba() → HSL tokens** — `--shadow-elevation-{1..4}` добавлены в `:root` (light) и `.dark` (dark). 8 redundant `.dark .elevation-N` override-блоков удалены — теперь работает через token swap.
- **Emoji-as-icons → Lucide (3 файла, 8 замен):**
  - `VocalMapResultCard.tsx` — helper `getEffectIcon()` переписан с 7 emoji (🌊 ⏱️ 🎵 🤫 ✨ ⚡ 🎤) на Lucide (`Waves Timer Music Mic2 Sparkles Volume2 Mic`). Возвращаемый тип — `LucideIcon`. JSX рендерит `<Icon className="w-2.5 h-2.5 mr-0.5" aria-hidden />`.
  - `HintsSettings.tsx` — футер (💡 ⏱️ 🎯 👁️) → `<Lightbulb>` `<Timer>` `<Target>` `<Eye>` с `inline w-3.5 h-3.5 mr-1 align-text-bottom`.
  - `InstrumentalGeneratorPanel.tsx` — BPM badge ⏱️ → `<Timer className="inline w-3 h-3 mr-1" aria-hidden />`.

#### Phase D-4 — Флаг для build-agent

- `ErrorBoundary` home button требует `useNavigate` hook — выходит за рамки design-audit (functional change). Флаг передан в Phase E сборки.

#### Верификация (Phases B + C + D)

- `npx tsc --noEmit -p tsconfig.app.json` → exit 0 (0 errors) для всех трёх фаз
- ESLint changed files → 0 errors во всех коммитах
- WCAG SC 2.3.3 (Animation from Interactions) — `prefers-reduced-motion: reduce` honored для всех бесконечных анимаций
- WCAG SC 2.5.1 (Target Size) — touch-target guard через `@media (hover: hover)`
- WCAG SC 1.4.11 (Non-text Contrast) — semantic HSL shadows с одинаковой яркостью в обоих режимах
- pre-commit hooks пройдены (Section tokens / eslint / prettier / tsc / commitlint)

### 🔧 Спринт 044 — Type Safety Wave 2 (2026-07-02)

#### Изменено

- **`any` в `src/components/**` 155 → 0** в 37 файлах (5 коммитов):
  - `1016b3db` — `src/components/ui` примитивы (LazyImage, GlowButton, …)
  - `996f0846` — `src/components/{player, track-card, track-actions}`
  - `927d22f3` — `src/components/studio/**`
  - `7f344eed` — `src/components/generate-form/**`
  - `134231b8` — `src/components/{project, prompt-dj, shared, lyrics-ai-agent}`
  - `cd2c759d` — оставшиеся 23 файла в `src/components/**`
- **3 сервиса → `Result<T,E>`** (`@/lib/result`), throwing-обёртки сохранены для backward compat:
  - `991566ce` — `VoiceCloneService` (8 публичных методов, новый `VoiceCloneServiceError`)
  - `6074e64e` — `AudioAnalysisService` (4 публичных + 1 internal метод, новый `AudioAnalysisServiceError`; хук `useUnifiedAnalysis` обновлён)
  - `0852cb8c` — `ReferenceManager` (3 публичных метода, новый `ReferenceManagerError`)

#### Добавлено

- **+45 unit-тестов** для сервисов с `Result<T,E>`:
  - `src/services/voice/__tests__/VoiceCloneService.test.ts` — 23 теста
  - `src/services/unified-analysis/__tests__/AudioAnalysisService.test.ts` — 11 тестов
  - `src/services/audio-reference/__tests__/ReferenceManager.test.ts` — 11 тестов
- **Доменные error-классы** с `code`, `operation`/`provider`/`mode`, `details`, `cause`: `VoiceCloneServiceError`, `AudioAnalysisServiceError`, `ReferenceManagerError`
- **`.superpowers/sdd/briefs/D5-report.md`** — отчёт по сужению `any` в `src/components/**`
- **`.superpowers/sdd/briefs/D6-report.md`** — отчёт по конвертации 3 сервисов на `Result<T,E>`

### 🏗 Спринт 039 — Layer Architecture & Type Safety (2026-06-30)

#### Изменено

- **Layer-fix добивание (039-03b)** — закрыты все 4 батча: `src/{components,stores}` больше не вызывают `supabase.from/rpc/storage` напрямую (35 → 0 нарушений в 17 файлах).
  - Batch 1 (admin/analytics, 6 файлов).
  - Batch 2 (project/wizard, 4 файла): `ProjectCreationWizard`, `ProjectBannerEditor`, `ProjectCoverEditor`, `useProjectStore`.
  - Batch 3 (studio/dialogs, 4 файла): `ImportAudioDialog`, `SaveVersionDialog`, `AudioActionDialog`, `useEnhancedStudioLogger`.
  - Batch 4 (misc, 3 файла): `ReportCommentDialog`, `ProfileSetupOnboarding`, `ArtistDetailsPanel`.
- **API-слой расширен:** `projects.api` (`checkPremiumStatus`, `invokeProjectAi`, `invokeGenerateCoverImage`, `invokeGenerateProjectMedia`, `updateProjectFields`, `updateProjectCover`, `updateProjectBanner`), `studio.api` (`ensureTrackVersion`, `invokeMergeStems`, `insertTrackChangeLog`, `createStudioProject` принимает row-shape).

#### Добавлено

- `.github/workflows/e2e.yml` — отдельный Playwright pipeline (matrix `chromium` / `Mobile Chrome`, артефакты HTML-репорта и traces, `workflow_dispatch`).
- `docs/audit/SPRINT-039-AUDIT-2026-06-30.md` — полный отчёт по аудиту спринта.
- `SPRINTS/SPRINT-040-TYPE-SAFETY-PLAN.md`, `SPRINTS/SPRINT-041-PLAN.md` — планы следующих двух спринтов (Type Safety + UX features).

#### Исправлено

- Pre-existing TS-поломки (`withHistory`, `useProjectStore`, `StudioNotationPanel`, `ProjectSettingsSheet`, `studio.api`, `profiles.api`) — `tsc --noEmit` снова зелёный.

### 🎨 Спринт 038 — Design System Unification (2026-06-30)

#### Добавлено

- **NavigationShell** — render-prop компонент (`src/components/navigation/NavigationShell.tsx`) инкапсулирует breakpoint-логику, sidebar collapse, `hasOwnBottomNav`, CSS-var публикацию (`--nav-h`, `--player-h`); `ActiveTabIndicator` анимированный индикатор таба
- **OnboardingFlow + FSM** — `OnboardingStateMachine.ts` (типизированные состояния `idle → quick-start → feature-tour → done`) + `OnboardingFlow.tsx` оркестратор на `useReducer`; заменяет 4 разрозненных `useEffect` в `MainLayout`
- **Container queries** — 5 компонентов (`PresetBrowser`, `Library`, `Playlists`, `Community`, `ProjectsSkeleton`) мигрированы с `sm:` медиа-брейкпоинтов на `@sm:`/`@lg:`/`@xl:` container queries
- **Player Shared Element Transition** — Framer Motion `layoutId` spring-анимация (stiffness 300, damping 30) artwork обложки между `CompactPlayer` и `CoverPage`; `AnimatePresence mode="sync"` для одновременной анимации
- **Elevation system** — CSS утилиты `.elevation-0`..`.elevation-4` с тёмным режимом + `.glass-surface` (backdrop-blur, HSL border) в `src/index.css`
- **Семантическая типографика** — CSS классы `.text-display`, `.text-heading`, `.text-overline`, `.text-body-base`, `.text-caption-base` с clamp() для адаптивных размеров; применены к h1/h2/h3 в BlogHeroSection, BlogPostCard, ProjectHero, TrackCoverSection
- **Storybook: 20 stories** — 15 новых story-файлов: Heading, StatusBadge, Shimmer, ProgressSteps, CollapsibleSection, ChipInput, TouchTarget, LoadingOverlay, Badge, Card, Avatar, Alert, Progress, Skeleton, Switch
- **DnD унификация** — `@hello-pangea/dnd` удалён, все drag-and-drop (ProjectDetail, LyricsVisualEditor, ProjectTracklistSection) мигрированы на `@dnd-kit`
- **Z-Index константы** — `src/lib/z-index.ts` с семантическими токенами
- **Haptics** — `src/lib/haptics.ts` враппер над Telegram HapticFeedback API
- **Animation presets** — duration/easing константы в `src/lib/motion-presets.ts`
- **useSafeMotion** — хук проверки `prefers-reduced-motion` для всех анимированных компонентов
- **Safe area fixes** — `100vh` заменён на `dvh`/`var(--vh)` по всему приложению
- **LazyImage аудит** — добавлен `loading="lazy" decoding="async"` ко всем bare `<img>` тегам
- **Lighthouse baseline** — `docs/LIGHTHOUSE_BASELINE_038.md` со статическими метриками (FCP ~1.8s, LCP ~3.2s, TBT ~180ms, Perf ~82)

#### Удалено

- `src/pages/Onboarding.tsx` — устаревший онбординг (заменён `OnboardingFlow`)
- `src/components/OnboardingSlider.tsx` — 5-слайдовый слайдер (заменён `TelegramOnboarding`)
- `LazyOnboardingSlider` экспорт из `src/components/lazy/index.ts`

#### Изменено

- `MainLayout.tsx` — убраны 4 `useMediaQuery`, `sidebarCollapsed` state, CSS var `useEffect`, `handleSidebarCollapsedChange`; навигация делегирована `NavigationShell`, онбординг — `OnboardingFlow`
- `ResizablePlayer.tsx` — обёрнут в `PlayerTransitionProvider`; `AnimatePresence mode="wait"` → `mode="sync"`
- Responsive typography CSS custom properties (`--text-display`, `--text-heading` и др.) добавлены в `:root`
- `font-display` применён к hero-заголовкам (ProjectHero h1, TrackCoverSection h3, BlogPostCard h2)
- `vite.config.ts`: чанк `@hello-pangea/dnd` удалён из manualChunks

### 🔧 Спринт 035 — Стабилизация + Чистка (2026-06-29)

#### Исправлено

- **TDZ краш page-admin чанка** — удалён `manualChunks` для `/pages/AdminDashboard`, вызывавший `Cannot access 'ft' before initialization` из-за разделения admin-страниц и их зависимостей по разным чанкам. Rollup теперь автоматически разбивает admin-страницы на отдельные файлы.
- **rules-of-hooks enforced as error** — исправлены 24 нарушения условных вызовов хуков в 10 файлах (FirstCommentCTA, KaraokeWord, IntegratedStemTracks, TrackAnalysisTab, VersionPills, useFeatureAccess, useProfile, useTracks, debug/index, touchTargets); правило повышено с `"warn"` до `"error"` в eslint.config.js

### 🔧 Спринт 037 — Infrastructure Hardening & Developer Experience (2026-06-29)

#### Добавлено

- **21 unit-тест AudioElementPool** — singleton, acquire/release, priority eviction, статистика, releaseAll
- **4 Storybook stories** — LazyImage, EmptyState, Button, LoadingSpinner с autodocs
- **tsconfig.strict.json** — инкрементальная миграция на строгий TypeScript (noUnusedLocals, noUnusedParameters, strictNullChecks, и др.)
- **docs/FSM_STATE_SCHEMA.md** — документация всех 4 state machines (Modal, Player, Generation, AudioContext)

#### Исправлено

- **TDZ краш админ-панели** (`Cannot access 'ft'/'ht' before initialization`) — устранена циклическая зависимость barrel export + слияние 8 взаимозависимых чанков в `feature-admin-studio` в `vite.config.ts`. Импорт `useGenerateForm` теперь прямой из модуля-источника.
- Добавлены правила 10-11 в Common Pitfalls CLAUDE.md для предотвращения повторения

#### Изменено

- `vite.config.ts` manualChunks: слияние page-admin, feature-generation-form, feature-stem-studio, feature-lyrics-wizard, feature-studio, feature-studio-unified, store-studio, page-lyrics-studio → единый `feature-admin-studio`
- `src/components/library/DesktopLibrarySidebar.tsx`: прямой импорт `useGenerateForm` из `@/hooks/generation/useGenerateForm`
- SPRINTS/SPRINT-PROGRESS.md: Sprint 037 → ✅ COMPLETE, обновлены метрики
- CLAUDE.md: обновлены дата, метрики, 2 новых правила для предотвращения barrel-циклов

### 📚 Спринт 035 — Редизайн документации репозитория

#### Добавлено

- **Новый README.md** — профессиональная витрина с шилдсами, скриншотами, прогрессом, секцией для инвесторов.
- **Ролевая навигация в DOCUMENTATION_INDEX.md** — пути для разработчика, дизайнера, инвестора, клиента, контрибьютора.
- **Единый стиль футеров** — навигация «← Предыдущий · ↑ Индекс · Следующий →» во всех корневых .md файлах.
- **Скриншоты приложения** — 4 скриншота (главная, плеер, студия, библиотека) в `public/screenshots/`.
- **Playwright скрипт** — автоматическая генерация скриншотов `scripts/capture-screenshots.ts`.
- **Обновлён PROJECT_STATUS.md** — завершение 033-mobile-ui-improvements (114/114), новый спринт 035.

#### Изменено

- **KNOWLEDGE_BASE.md** — удалён (733 строки), информация перенесена в целевые документы.
- **MAINTENANCE.md** — полностью актуализирован, добавлены чек-листы.
- **ROADMAP.md** — добавлен спринт 035.
- **REPOSITORY_STRUCTURE.md** — обновлён с `public/screenshots/`.

### ✨ Спринт 034 — Надёжность генерации

#### Добавлено

- **Dashboard метрик генерации** — `/admin/generation-metrics` с визуализацией failure rate, retry count, параметров генерации.
- **Auto-retry в handleGenerate()** — 2 попытки с exponential backoff, интегрировано в основной flow генерации.
- **Structured failure tracking** — категории ошибок (`failure_category`), счётчик ретраев (`retry_count`), параметры генерации (`generation_params`).
- **Prompt pre-validation** — проверка длины, кодировки и запрещённого контента перед отправкой в Suno API.
- **A/B framework** — эксперименты `PROMPT_SUGGESTIONS` и `WIZARD_STEPS` (50/50 split), хук `useExperiment`.
- **Generation queue position UI** — отображение позиции в очереди с учётом rate-limit.
- **Failure pattern analysis RPC** — `get_generation_failure_patterns` для серверного анализа паттернов ошибок.
- **Failure rate alerts** — Edge Function + уведомления в Telegram для админов при превышении порога.
- **A/B тест 2-step vs 4-step wizard** — эксперимент `WIZARD_STEPS` для оптимизации конверсии.
- **Delivery tracking** — статус `partial_delivery`, хук `useDeliveryTracking` для отслеживания доставки A/B клипов.
- **Sentry breadcrumbs** — полный flow генерации покрыт breadcrumbs для диагностики.

#### Исправлено

- TDZ-ошибка в analytics chunk из-за циклической зависимости lucide-react.
- Централизация экспортов lucide-react для оптимизации бандла.
- Конфликт в lyricspanel.tsx после merge.

### 🔧 Инфраструктура

- Миграция тестов с Jest на Vitest + Husky pre-commit hooks.
- Удаление мёртвого кода (chore/remove-dead-code).
- Автоматическое обновление version badges в README.

---

### ✨ Спринт 033 — Аудит интерфейса и UX-переработка

#### Добавлено

- **Режим Studio Lite/Pro** — переключатель в StudioShellHeader для скрытия продвинутых функций (стемы, MIDI, аранжировка) от начинающих. Сохраняется в localStorage через ViewStore.
- **Комментарии с таймкодами** — комментарии с привязкой к времени воспроизведения (как в SoundCloud). Бейджи с таймкодами отображаются инлайново в CommentItem.
- **Анимация взрыва при лайке** — 6 частиц разлетаются радиально при нажатии лайка в QuickLikeButton.
- **Пульсирующее кольцо pull-to-refresh** — индикатор пульсации при достижении порога pull-to-refresh.
- **Троттлинг монетизации** — UpsellStrategy ограничивает проактивные баннеры до 1 за сессию и пейволлы до 5-минутного кулдауна. Интегрировано в ProactiveUpsellBanner и SmartPaywallDialog.

#### Изменено

- **Визард генерации 6→4 шага** — объединены Стиль+Настройки в StyleSettingsStep, Вокал+Тексты в VocalsLyricsStep. Новый тип `WizardStep` в сторе.
- **Dialog → BottomSheet на мобильных** — значение `mobileSheet` по умолчанию изменено с `false` на `true` в DialogContent. Все 56+ диалогов автоматически рендерятся как vaul Drawer на мобильных (<640px).
- **Инлайн-фильтры библиотеки** — удалён LibraryFilterModal на мобильных, заменён на инлайн-выпадающий список сортировки в CompactFilterBar.
- **BottomNavigation** — иконки увеличены до 20px, подписи до 11px для лучшей читаемости.
- **Упрощённый онбординг** — удалена 10-шаговая страница Onboarding, QuickStartOverlay (3 шага) обрабатывает онбординг. Маршрут перенаправляет на `/`.

#### Исправлено

- Области касания < 44px в QuickLikeButton, PaymentButton, LyricsVisualEditor, AudioActionDialog, SmartPromptSuggestions.
- Добавлены ARIA-метки в компоненты навигации (MenuSearch, QuickActionsBar, MoreMenuSheet).
- `console.log` заменён на `logger` в SortableTrackList.
- Конфиг commitlint переименован в `.cjs` для совместимости с ESM, разрешён конфликт правил header-case и subject-case.

### 📚 Документация

- **Редизайн документации репозитория** — унифицированные шаблоны хедеров/футеров/бейджей, mermaid-диаграммы, карта онбординга по ролям в `DOCUMENTATION_INDEX`.
- Архивированы 9 дублирующих документов в `docs/archive/2026-06-27/`.
- Новый отчёт аудита: `docs/_audit/REPO_DOCS_AUDIT_2026-06-27.md`.

### ✅ Добавлено

- Защита dev-overlay от IME, принудительная видимость, E2E покрытие ориентации.
- CI разделён на задачи `e2e` + `e2e-mobile` с повторами.

### 🛠 Изменено

- `SmartAlertProvider` больше не открывает автоматически модалку «Стемы готовы».

---

## [1.30.0] — 2026-06-15 — _Спринт 030: Unified Studio Mobile_

### Добавлено

- Мобильный DAW-стиль в едином окне.
- Стемы-панель с паритетом микшера.
- UX перегенерации секций на мобильных.

### Исправлено

- z-index для порталированных диалогов поверх фиксированных оверлеев.
- Тапы на модалке формы генерации на мобильных.

## [1.29.0] — 2026-05-22

### Добавлено

- Студия клонирования голоса (6-шаговый процесс).
- Эндпоинты Suno `upload-extend` и `upload-cover`.

### Производительность

- Бандл: 1.02 МБ → 918 КБ.

## [1.28.0] — 2026-04-10

### Добавлено

- Разделение стемов (4 стема) с полным микшером.
- MIDI-транскрипция (6 ИИ-моделей).

### Безопасность

- Паттерн `has_role()` security-definer для админских маршрутов.

## [1.27.0] — 2026-03-04

### Добавлено

- A/B версионирование треков (`is_primary` + `active_version_id`).
- Оптимистичный UI для лайков/прослушиваний/переключения версий.

## [1.26.0] — 2026-02-08

### Добавлено

- Оплата через Telegram Stars + тарифные подписки.
- Геймификация: серии, XP, 20+ достижений.

## [1.25.0] — 2026-01-12

### Добавлено

- Первый релиз Telegram Mini App на продакшн-домене.

---

> [!TIP]
> Детали по спринтам см. в [`SPRINTS/`](SPRINTS/). Историю по фичам — в соответствующих документах [`docs/`](docs/).

---

<div align="center">

### 🔗 Связанная документация

|            📚 Указатель             |       🗺 Дорожная карта       |          📊 Статус          |             🪲 Проблемы             |         🤝 Контрибуция         |
| :---------------------------------: | :--------------------------: | :-------------------------: | :---------------------------------: | :----------------------------: |
| [Указатель](DOCUMENTATION_INDEX.md) | [Дорожная карта](ROADMAP.md) | [Статус](PROJECT_STATUS.md) | [Проблемы](KNOWN_ISSUES_TRACKED.md) | [Контрибуция](CONTRIBUTING.md) |

<sub>Последнее обновление: 2026-07-03</sub>

</div>

### 🎵 Sprint 053 — Suno API: Sounds + MIDI Direct + Boost Style (2026-07-04)

> ✅ ЗАВЕРШЁН — Suno API coverage: 25/28 → 28/28 (100%)

#### Added

- **`supabase/functions/suno-sounds/`** — Edge function для SFX генерации (tempo/key/duration). DB table `sound_effects` (id, user_id, name, audio_url, image_url, status, metadata).
- **`supabase/functions/suno-sounds-callback/`** — Callback handler для `suno-sounds`, пишет в `sound_effects` при готовности.
- **`supabase/functions/suno-sounds-status/`** — Проверка статуса SFX задачи.
- **`supabase/functions/suno-midi/`** — Edge function для MIDI транскрипции. Прямой Suno API (primary), Replicate fallback при FAILED. Race-condition protection через `midi_generation_source` enum.
- **`supabase/functions/suno-midi-callback/`** — Callback handler для `suno-midi`.
- **`supabase/functions/suno-midi-details/`** — Получение деталей MIDI транскрипции по task_id.
- **`supabase/functions/_shared/suno-details.ts`** — Shared fetcher для details-endpoints (6 штук).
- **`src/components/SfxGeneratorSheet.tsx`** — UI sheet для генерации SFX (MobileBottomSheet + usePreviewAudio).
- **`src/hooks/studio/useSunoSounds.ts`** — Hook для SFX генерации (TanStack Query mutation).
- **`src/hooks/studio/useSunoMidi.ts`** — Hook для MIDI транскрипции (Suno primary → Replicate fallback).
- **`src/stories/mashup/SfxGeneratorSheet.stories.tsx`** — 3 Storybook stories (Empty, Loading, Success).
- **Migration `20260708000000_sound_effects.sql`**** — DB table для SFX (RLS enabled).
- **Migration `20260708000001_midi_url.sql`**** — `midi_url`, `midi_generation_source` (enum: 'suno', 'replicate') в `track_versions`.
- **Telegram `/sfx` command** — Wizard для генерации SFX (prompt → tempo/key → генерация → отправка в чат).

#### Changed

- **`useGenerateFormBoostStyle.ts`** — Подключён `suno-boost-style` (Lovable AI gateway proxy, НЕ Suno endpoint). 8 unit-тестов подтверждают wiring.

#### Fixed

- **`suno-check-status/index.ts`** — 449 LOC dead code удалён (zero client callers). Alias `[functions.suno-check-status]` убран из `supabase/config.toml`.

#### Metrics

- +28 unit tests (320 → 348 passing, 24 suites)
- +8 edge functions (30 → 38)
- +1 DB table (`sound_effects`)
- +2 columns (`midi_url`, `midi_generation_source`)
- −449 LOC dead code

---

### 📊 Sprint 054 — Suno API: Details Suite (2026-07-04)

> ✅ ЗАВЕРШЁН — Suno API coverage: 28/28 (100%)

#### Added

- **`supabase/functions/suno-music-details/`** — Details endpoint для music генерации.
- **`supabase/functions/suno-cover-details/`** — Details endpoint для cover generation.
- **`supabase/functions/suno-video-details/`** — Details endpoint для video generation.
- **`supabase/functions/suno-wav-details/`** — Details endpoint для WAV конверсии.
- **`supabase/functions/suno-lyrics-details/`** — Details endpoint для lyrics генерации.
- **`supabase/functions/suno-separation-details/`** — Details endpoint для vocal separation.
- **`src/hooks/studio/useSunoTaskDetails.ts`** — Generic polling hook для всех Suno task types.
- **`src/api/suno-task-details.api.ts`** — Edge-bridge wrapper для details-endpoints.
- **`_shared/suno-details.ts`**** — Shared fetcher `fetchSunoTaskDetails(taskType, taskId)` с per-type backoff.

#### Changed

- **`suno-check-status/index.ts`** — Удалён (449 LOC, zero callers). Функционал заменён на `useSunoTaskDetails`.

#### Metrics

- +7 edge functions (38 → 45, но suno-check-status удалён, так что net +8)
- +1 generic polling hook
- Suno API coverage: 28/28 (100%)
- Polling error-rate target: <2%

---

### 🎨 Sprint 055 — UX Critical Fixes (2026-07-06)

> ✅ Phase A+B ЗАВЕРШЕНА — 13/13 P0/P1 tasks

#### Added

- **Save Draft functionality** — `useGenerateDraft.saveDraft()` wired to SecondaryButton, UI fallback in GenerateSheet.
- **Generation cancellation** — Soft-cancel pattern via `useSunoCancelTask`.
- **Telegram deeplink** — `startapp=generate` → open GenerateSheet.
- **Welcome Bonus idempotency** — 30-day TTL guard.
- **Dual CTA in footer** — UI button + Telegram MainButton.
- **Footer generation summary** — Shows "Вокал · 30–90 сек · N кредитов".
- **Hint positioning** — Не перекрывает FAB.
- **GenerationProgressBadge keyboard-aware** — Focus management.
- **FormStepper** — Custom mode wizard (3 steps instead of 4).
- **VoiceInput in Custom mode** — Voice input available.
- **Home sticky CTA** — CustomEvent + floating button for cold users.
- **Analytics events** — 7 new events.

#### Fixed

- **Data loss prevention** — Draft auto-save now wired.
- **Mobile UX friction** — All P1 issues resolved.

#### Metrics

- +12 unit tests
- +2 E2E tests (Save Draft, Deeplink generate)
- P0 Blockers: 5 → 0 (−100%)
- P1 Issues: 6 → 0 (−100%)
- Bundle delta: +2.1 KiB gzip (within +5 KiB budget)

---

### 🎯 Sprint 056 — GenerateSheet Redesign (2026-07-06)

> ✅ Phase A-D ЗАВЕРШЕНА — Thin Orchestrator Pattern

#### Changed

- **GenerateSheet restructuring** → thin orchestrator pattern (~300 LOC vs ~800 LOC).
- **Header/Body/Footer shell components** → Extracted into separate files.
- **ReferenceChipsRow consolidation** → Single interface for all references.
- **AdvancedSettings card-based layout** — Popovers for each option.

#### Added

- **Storybook stories** — 6/6 components documented:
  - `GenerateSheet.stories.tsx` — 7 scenarios (default, modes, loading, mobile/desktop viewports).
  - `AdvancedSettings.stories.tsx` — 6 scenarios (states, interaction examples).
  - `LyricsAssistantSheet.stories.tsx` — 3 scenarios (chat states).
  - `LyricsVisualEditor.stories.tsx` — 4 scenarios (editor states).
  - `ReferenceChipsRow.stories.tsx` — 5 scenarios (reference combinations).
  - `ValidationReasonsSheet.stories.tsx` — 6 scenarios (validation + accessibility).
- **Documentation** — `COMPONENTS.md`, `THIN_ORCHESTRATOR_PATTERN.md`.

#### Fixed

- **Wizard code cleanup** — Deleted dead wizard code from Sprint 050.

#### Metrics

- GenerateSheet LOC: ~800 → ~300
- Storybook stories: 0 → 6 (25+ interactive examples)
- Documentation coverage: 0% → 100%

---

### 📱 Sprint 050-B — Mobile Audit F1-F12 (2026-07-06)

> ✅ ЗАВЕРШЕНА — 6/6 mobile fixes

#### Fixed

- **F1: useScrollLock** → Applied on 4 surfaces (Library, Community, QueueSheet, TrackDetail).
- **B2: QueueSheet auto-close** → Auto-close on track play + toast.
- **B3: cover_url normalization** — Unified cover URL handling.
- **B4: ErrorBoundary home button** — UseNavigate() integration.
- **B5: Lazy imports** — canvas-confetti dynamic import (already applied).
- **B6: GitHub Pages** — Enabled for project docs.

#### Metrics

- Mobile UX: 6 friction points resolved
- Bundle impact: Neutral (lazy imports already applied)
- Documentation: GitHub Pages enabled

---
