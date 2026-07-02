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

<sub>Последнее обновление: 2026-07-02</sub>

</div>
