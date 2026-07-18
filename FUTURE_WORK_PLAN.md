# План дальнейших работ MusicVerse AI

**Дата:** 2026-07-14 (сверка расхождений — актуальный операционный план: [WORKPLAN-2026-07-14.md](WORKPLAN-2026-07-14.md))
**Статус:** Sprint 063 ✅ + 064 ✅ закрыты; **Sprint 065 🔄** (Generate v2 + Home Redesign + Visual Regression — в `main`). tsc 0 errors ✅ (верифицировано `npm run typecheck:app`). Бэклог переопределён: 066 Dependency Health → 067 Edge Decomposition → 068 Test/Story → 069 Bundle.
**Фокус:** Sprint 065 closure → разрешить конфликт зависимостей (Storybook 8.x peer ↔ vite ≤6) → декомпозиция edge-функций (≥10 файлов >800 LOC) → bundle 2.11 MB → ≤1.8 MB

---

## 🔬 Sprint «Bundle Slim» (2026-07-17) — разведка завершена, разблокирующий рефактор описан

**Цель:** feature-studio (742 KB gz) → вынести recharts в lazy `vendor-charts` + разбить на `feature-generation`. **Результат:** оптимизация заблокирована двумя фундаментальными chunk-graph циклами. Спринт превратился в точную разведку root-cause.

### Что выяснено (madge --circular + build-логи Rollup)

1. **Source-level циклов НЕТ.** madge по 2220 файлам нашёл лишь 1 тривиальный цикл внутри `generate-form/lyrics/` (`useLyricsSections ↔ LyricsSectionTemplates`, оба в одном каталоге). Прежний mega-chunk комментарий про «feature-studio → feature-generation → feature-studio» описывал chunk-graph цикл, а не TypeScript import cycle.

2. **Однако chunk-graph циклы РЕАЛЬНЫ и блокируют разделение:**

   - **Цикл A (vendor-charts):** 14 компонентов в `/components/admin/`, `/components/analytics/`, `/pages/admin/` делают **статический** `from "recharts"` (например `admin/analytics/ForecastPanel.tsx:11`, `admin/RevenueForecast.tsx:24`, `pages/admin/GenerationMetrics.tsx:31`). Так как `/components/admin/` жёстко привязан к `feature-studio`, вынос recharts в отдельный чанк создаёт ребро `feature-studio → vendor-charts`, а общий модуль — обратное ребро → `Circular chunk: vendor-charts -> feature-studio -> vendor-charts` (CI-гейт `ci.yml:94-100` хард-фейлит это).

   - **Цикл B (feature-generation):** `generate-form/GuitarModeRecorder.tsx:13,18` импортирует **оба** `/components/guitar/ChordDiagram` (в feature-studio) **И** `/hooks/studio/useStudioAudio` (в feature-studio) — два ребра `feature-generation → feature-studio`; shared hook `useRealtimeChordDetection` создаёт обратное ребро → `Circular chunk: feature-studio -> feature-generation -> feature-studio`.

3. **`@/lib/recharts-lazy.ts` уже реализует правильный паттерн** (`useRecharts()` hook с `import("recharts")`) и используется `PerformanceChart.tsx`. Это и есть миграционная цель.

### Что сделано в этом спринте (устойчивые улучшения)

- ✅ Удалён мёртвый код `src/components/ui/chart.tsx` (0 импортёров, 0 re-export'ов; статический `import * from "recharts"`). Чистая卫生, размер не изменился (мёртвый код не входил в граф).
- ✅ `package.json` size-limit: добавлены 4 новых бюджета для ранее untracked vendor-чанков (`vendor-supabase` 60 KB, `vendor-radix` 60 KB, `vendor-lamejs` 60 KB, `vendor-jszip` 30 KB); `feature-studio` ужесточён с 1.05 MB → 800 KB gz. **Все 11 бюджетов PASS.**
- ✅ `vite.config.ts`: подробные комментарии с root-cause обоих циклов и точным roadmap рефактора (см. ниже).
- ✅ Build зелёный (exit 0, нет Circular chunk warning), 1810 unit-тестов проходят.

### Roadmap разблокировки (для следующего bundle-спринта)

Чтобы вынести recharts в lazy `vendor-charts` (шаг 1), нужно сначала мигрировать **14 файлов** со статического `from "recharts"` на динамический `useRecharts()` из `@/lib/recharts-lazy`:
`admin/analytics/{CampaignPerformance,ContentAnalyticsPanel,DeeplinkTrendsChart,ErrorTrendsPanel,ForecastPanel,PerformanceMetricsPanel,RetentionPanel,RevenueAnalyticsPanel,TelemetryOverview}.tsx`, `admin/{AlertAnalyticsPanel,PerformanceDashboard,RevenueAnalytics,RevenueForecast}.tsx`, `analytics/GenreDistributionChart.tsx` (только type-import, ок), `pages/admin/GenerationMetrics.tsx`.

Чтобы разбить feature-studio на feature-generation (шаг 2), нужно разорвать guitar-ребро: переместить `ChordDiagram.tsx` в `/components/ui/` (у него 0 feature-зависимостей) **или** перенести `GuitarModeRecorder.tsx` + `GuitarRecordDialog.tsx` из `generate-form/` в `/components/guitar/` (это guitar-recording UI, не generation-form); плюс назначить `useRealtimeChordDetection` + `lib/chord-detection` в нейтральный chunk.

**Метрика спринта:** точный root-cause задокументирован (экономит будущие спринты дни слепых попыток); 4 новых size-limit бюджета предотвращают регрессии; мёртвый код удалён. feature-studio остался 742 KB gz — фактическое снижение требует roadmap-рефактора выше.

---

## 🎯 Текущее состояние (верифицировано 2026-07-09)

| Метрика             | Значение                                  | Статус |
| ------------------- | ----------------------------------------- | ------ |
| Unit tests          | 1810 passing (166 files)                  | ✅     |
| TypeScript          | 0 errors                                  | ✅     |
| E2E specs           | 59 (CI green — Sprint 057)                | ✅     |
| Components          | 1043                                      | ✅     |
| Hooks               | 440                                       | ✅     |
| API files           | 32                                        | ✅     |
| Services            | 37 *.service.ts (12 top + 25 в subfolder) | ✅     |
| Stores              | 25                                        | ✅     |
| Suno edge functions | 46 (28/28 API — 100%)                     | ✅     |
| Files >800 LOC src/ | 0                                         | ✅     |
| `any` budget        | 0/50                                      | ✅     |
| Bundle eager JS     | ~508 KB gzip                              | ✅     |
| Total bundle        | 2.11 MB gzip                              | 🟡     |
| Branch Protection   | Phase 2 active (ruleset 18581121)         | ✅     |
| Design Score        | C+ (AI Slop: B)                           | 🟡     |

### ✅ Завершённые спринты

- **Sprint 051** — Test Debt: god-file decomposition 9/9, 1497 unit tests
- **Sprint 053** — Suno Sounds + MIDI Direct + Boost Style
- **Sprint 054** — Suno Details Suite (28/28 Suno API — 100%)
- **Sprint 055** — UX Critical Fixes (P0/P1 — 13/13)
- **Sprint 056** — GenerateSheet Redesign + Storybook (31 story)
- **Sprint 057** ✅ — E2E CI Green + Branch Protection (9Router cleanup, E2E stab, BP Phase 2)
- **Sprint 058** ✅ — i18n EN/RU (mashup → generation → language switcher)

---

## 📋 Sprint Backlog (июль–август 2026)

### Sprint 058 — i18n EN/RU Localization ✅

**Результат:** EN/RU cross-language поддержка готова. 2 домена (mashup + generation) на 2 языках, переключатель языка в профиле.

- [x] `react-i18next` + `i18next-browser-languagedetector` (уже были)
- [x] `src/i18n/locales/{en,ru}.json` (расширены: persona + generationResult + generation.*)
- [x] Мигрировать `MASHUP_STRINGS` → `useMashupStrings()` (MashupDialog, MashupFormFields, GenerationResultSheet)
- [x] Удалить старый `src/lib/locale/mashupStrings.ts` (−102 строки)
- [x] `LanguageSwitcher` компонент (RU/ЕН toggle, localStorage persisted)
- [x] `useGenerationStrings()` hook + 100+ generation keys
- [x] Мигрировать генерационные компоненты (GenerateFormSimple, GenerateFormActions, VocalsToggle, PrivacyToggle)
- [x] `useSectionHints()` hook — i18n-aware динамические подсказки
- [ ] Persist в `profiles.locale` (DB миграция — deferred)

**Коммиты:** `423db524b` (B — mashup + switcher), `85593b2a4` (C — generation)
**Метрика:** 2 домена × 2 языка, tsc 0 errors, 1489 tests ✅

---

### Sprint 059 — Bundle Optimization + API/Service unit tests

**Часть A — Bundle optimization: ✅**

**Текущее:** 508 KB eager JS, 2.11 MB total. Цель: ≤1.8 MB total.

- [x] Анализ — `visualizer` встроен в сборку, stats.html доступен
- [x] `manualChunks` — zustand/use-sync-external-store остались в `vendor-react` (попытка `vendor-state` вызвала runtime crash: React.createContext undefined. Причина: порядок загрузки чанков.)
- [x] barrel re-export циклы устранены — `useGenerateFormStateInternal`, `useGenerateFormDraft` импортируют напрямую, не через `index.ts`
- [x] 1 benign circular warning: vendor-other→vendor-react→vendor-other (косметический, React всегда грузится первым)
- [x] Аудит framer-motion — только `src/lib/motion.ts` импортирует `framer-motion` (✅ чисто)
- [x] Все страницы уже lazy-loaded (50 lazyWithRetry вызовов в App.tsx)
- [ ] Tree-shaking проверка (частично — `treeshake: { preset: "recommended" }` уже включён)
- [ ] **Понизить vendor-other/feature-admin-studio (REDUX)** — не реализовано, см. ниже

**Часть B — API/Service unit tests: ✅**

**Текущее:** 1810 unit tests (166 файлов). Цель: 1800+ ✅ достигнуто.

- [x] 5 новых тестовых файлов: missions.service, audio-reference-generation.service, profile-setup.service, upsell-strategy.service, session.service
- [x] +40 тестов (1489→1529)
- [x] API: 29/30 покрыто (все кроме studio.api)
- [x] 8 тестов batch 2: missions, audio-reference-generation, profile-setup, upsell-strategy, session, studio-operations, webhook-setup, cloud-audio, reference-analysis, deeplink, track-detail
- [x] 7 тестов batch 3: track-versions, ai-tools, theme-idea, content-analytics, audio-analysis, forecast, user-activity-heatmap
- [x] 2 теста batch 4: studio-stems, studio-realtime
- [x] Services: 37/37 покрыто (все *.service.ts)
- [x] TanStack Query mutations: useSunoMashup, useSunoPersona, useSunoFileUpload (+12 тестов)
- [ ] Edge functions декомпозиция (11 файлов >800 LOC в `supabase/functions/`)

**Срок:** 3-5 дней
**Метрика:** 1810 unit tests, 166 test файлов

---

### Sprint 060 — Design Polish ✅

**5 quick wins применены (2026-07-06 + 09):** color-scheme: dark, font consolidation, H2→H3, search box на главной.

- [x] **Search box на главной** (high impact — music app needs search) — added HomeSearchBar, reads ?q= in Library
- [x] **Skeleton loading states** (already exist — GridSkeleton, TrackCardSkeleton, HorizontalScrollSkeleton)
- [x] **Route transition animation** (already exists — RouteWithTransition + PageTransition + MobilePageTransition)
- [x] **Border-radius hierarchy** (already exists — design-tokens.ts: sm=8, md=12, lg=16)
- [x] **Nav simplification** (already simple — 5 items: Home, Library, Create, Projects, Profile)

**Срок:** 1 день (только search box)
**Метрика:** Design score C+ → B- (search box added, other items already existed)

---

### Sprint 061 — Bundle: vendor splits + barrel cleanup + chunk split ✅

**Результат:** `feature-admin-studio` (366 KB gzip) разделён на `feature-generation` (184 KB) + `feature-studio` (223 KB). useStudioAudio перенесён в hooks/audio. Super-barrel очищен от 30+ dead re-exports.

**Коммит:** `bcf56fba4`

---

### Sprint 062 — UI/UX Audit: P0/P1/P2 Fixes 📋

**План:** [SPRINTS/SPRINT-062-PLAN.md](SPRINTS/SPRINT-062-PLAN.md)

3 фазы:

- **A (день 1)** — P0 блокеры: Suspense fallback, QuickCreate опции, touch targets, градиент ✅
- **B (день 2)** — P1 фиксы: Error Boundary на Index, i18n миграция, PullToRefresh scope, waveform shimmer, MixerChannel empty state ✅
- **C (день 3)** — P2 polish: step indicator, volume slider UX, GenerateSheet h-dvh, memo 🔄

**Цель:** Design Score C+ → B.

---

### Backlog (после Sprint 062)

- **Edge Functions декомпозиция** — 11 файлов >800 LOC (telegram-bot 1871, suno-callback-handler ~1200, …). Изолированная задача, не блокирует другие.
- **Storybook Story покрытие** — 31 story, цель 50+
- **Лицензионный compliance** — `reuse-licenses.yml` workflow на русский текст
- **Translation pipeline** — CI для auto-перевода через какой-нибудь API
- **Performance budgets** — bundle-size, lighthouse, Core Web Vitals в CI
- **Sentry fixes** — 6 уязвимостей (1 high, 4 moderate, 1 low) — security review

---

## 📅 Timeline (июль–август 2026)

```
Week 1 (July 9-13):
  Mon-Tue:  Sprint 063 — Homepage UI/UX P0/P1 fixes (completed)
  Wed-Fri:  Sprint 064 — P2 polish + Edge func decomp planning

Week 2 (July 14-20):
  Mon-Wed:  Sprint 064-A — P2 audit items (stagger, motion, tablet cols, sheet right-side)
  Thu-Fri:  Sprint 064-B — Edge function decomposition (telegram-bot, suno-callback)

Week 3 (July 21-27):
  Mon-Wed:  Sprint 064-C — Bundle reduction (lazy modals, image sizes, feature-studio audit)
  Thu-Fri:  Sprint 065 — API/Service tests + Storybook coverage (target: 1700+ tests, 50+ stories)

Week 4 (July 28 - Aug 3):
  Mon-Fri:  Sprint 066 — Sentry vulnerability fixes + perf budgets CI

Week 5 (Aug 4-8):
  Backlog: Translation pipeline, license compliance, Lighthouse CI
```

---

## 🚀 Q3 2026 (после стабилизации)

| Sprint  | Фокус                                                | Статус      |
| ------- | ---------------------------------------------------- | ----------- |
| **057** | E2E CI green + Branch Protection complete            | ✅ ЗАВЕРШЁН |
| **058** | i18n EN/RU (mashup + generation домены)              | ✅ ЗАВЕРШЁН |
| **059** | Bundle optimization (A) + API/Service unit tests (B) | ✅ ЗАВЕРШЁН |
| **060** | Design polish (search, skeleton, transitions)        | ✅ ЗАВЕРШЁН |
| **061** | Bundle: vendor splits + barrel cleanup + chunk split | ✅ ЗАВЕРШЁН |
| **062** | UI/UX Audit: P0/P1 fixes (A+B ✅), P2 polish (C ✅)  | ✅ ЗАВЕРШЁН |
| **063** | Homepage UX audit P0/P1 fixes                        | ✅ ЗАВЕРШЁН |
| **064** | P2 polish (tablet cols, error, More label)           | ✅ ЗАВЕРШЁН |
| **065** | Generate v2 + Home Redesign + Visual Regression      | 🔄 В РАБОТЕ |
| **066** | Dependency Health (vite↔storybook) + build hygiene   | ⏳ ПЛАН     |
| **067** | Edge Functions Decomposition (≥10 файлов >800 LOC)   | ⏳ ПЛАН     |
| **068** | Test & Story Coverage (Storybook 31→50+, visual reg) | ⏳ ПЛАН     |
| **069** | Bundle 2.11 MB → ≤1.8 MB + Lighthouse budgets в CI   | ⏳ ПЛАН     |

---

## 🔄 Ритуалы

- **Каждый PR:** tsc + lint + unit tests + size-limit
- **Еженедельно:** E2E smoke на main, bundle re-measure
- **При закрытии спринта:** обновить PROJECT_STATUS.md, CHANGELOG.md, CLAUDE.md, README.md
- **Каждые 2 недели:** Design review session, bundle re-measure, security audit

---

## 📝 Notes

- **Suno API 28/28 (100%)** — все категории реализованы, 46 edge functions
- **God-file decomposition завершена** — 0 файлов >800 LOC в `src/`
- **Design-review C+** — функциональный, search box добавлен (Sprint 060)
- **Branch protection Phase 2** — required checks active, force-push заблокирован
- **9Router fully removed** — Sprint 057 (использовался только как Claude skill, не код)
- **Collaboration features** — out of scope per user decision 2026-07-08

---

**Последнее обновление:** 2026-07-14 (Sprint 065 🔄 зафиксирован; бэклог 066–069 переопределён; актуальный операционный план — [WORKPLAN-2026-07-14.md](WORKPLAN-2026-07-14.md))
**Следующий review:** 2026-07-21
