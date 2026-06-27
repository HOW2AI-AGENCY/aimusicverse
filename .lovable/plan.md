
# Полный аудит проекта MusicVerse AI и план работ

## 1. Краткие итоги аудита

| Область | Состояние | Комментарий |
|---|---|---|
| Core platform (Sprint 001–032) | ✅ 100% | 935+ компонентов, 200+ хуков, 80+ edge functions |
| Bundle | ✅ 918 KB / 950 KB | В пределах бюджета, но без запаса |
| Unit-тесты | ✅ 82% | Над целью 80% |
| E2E (Playwright) | 🟡 47 spec'ов есть, но фаза 10C формально 0% | Покрытие неровное: много spec'ов для dev-overlay/hints, мало для критических пользовательских сценариев (generate→play→library→share) |
| CI/CD | 🟡 quality+build+docs+badges есть | Нет отдельного e2e job (mobile + desktop), нет визуальной регрессии, нет Lighthouse-бюджета |
| Документация | ✅ Переработана 2026-06-27 | Style guide, mkdocs, link-check, badges-bot активны |
| Известные баги | 🟡 3 open / 2 watch | iOS audio pool, Suno 429, Studio mobile stutter |
| Code TODO | 🟡 23 шт. | AI-сюжеты в IdeaStep/LyricsStep, virtual scroll, srcset/blurhash, Studio loop/export/MIDI |
| Reliability генерации | 🔴 failure rate 12% | Цель < 8% (Sprint 034, не начат) |
| Spec 001 UI Improvements | 🔴 0% | Sprint 033 не начат |
| Tech debt | 🟡 | `useUnifiedStudioStore` 38 KB, legacy generators, WCAG AA не завершён |

Главные риски: (a) запас bundle тает, (b) надёжность генерации, (c) отсутствие визуальной/E2E регрессии в CI на критических флоу, (d) накопление TODO в коде и тех. долга в Studio.

## 2. План работ (6 направлений, 4 спринта × 2 нед)

### Спринт 033 — UI Improvements & Tech Debt Cleanup (2 нед)
- Реализовать `specs/001-ui-improvements` (визуальная иерархия, анимации, фокус-стили)
- Разбить `useUnifiedStudioStore` на доменные слайсы (playback / mixer / sections / lyrics)
- Закрыть мелкие UI TODO: T019 (навигация GenerateWizard), T020 (типобезопасность), T021 (upload-диалоги), T022 (sort-иконка в Library), T024 (batch actions), T025 (BottomNavigation иерархия)
- Заменить TODO в `useInfinitePublicTracks` и `TracksGridSection` на IntersectionObserver + react-virtuoso

### Спринт 034 — Generation Reliability (2 нед)
- Инструментировать `suno-music-generate`/`suno-extend-audio`/`suno-remix`: структурированные ошибки, корреляция task_id ↔ Sentry
- Exponential back-off + очередь на 429; circuit-breaker на Suno API
- Idempotency keys для retry, чтобы не списывать кредиты дважды
- Алерты в админ-панели при росте failure rate > 8% за 1 ч
- Цель: failure rate 12% → < 8%, time-to-first-clip P95 < 90 с

### Спринт 035 — E2E coverage & visual regression (2 нед)
- Pуть-критические сценарии (Phase 10C): generate→result-sheet→play→version-switch, library→filter→player, auth→onboarding, voice-clone, stems
- Раздельные CI-job: `e2e-desktop` (Chrome+Firefox+Safari) и `e2e-mobile` (Pixel5+iPhone12), с shards × 4 и retry 2
- Screenshot-diff через `@playwright/test` `toHaveScreenshot` на 6 экранах (home, generate, library, player, studio, admin)
- Lighthouse CI бюджет: perf ≥ 90, a11y ≥ 95, bundle ≤ 950 KB как failing gate
- Накопить артефакты: HTML report + trace + видео при падении

### Спринт 036 — Mobile / iOS / Telegram stability (2 нед)
- Закрыть Known Issue #1: hard-eviction `audioElementPool` при > 8 неактивных элементов, телеметрия pool-size
- Studio mobile stutter: throttle waveform render до 30 FPS, off-main-thread в Worker
- Telegram iOS 17.4 keyboard jump: переписать на `visualViewport` с дебаунсом 80 мс
- Wavesurfer memory leak: `destroy()` в cleanup, регрессионный тест на 50 переключений
- WCAG AA pass на Library + Studio (axe в CI, фикс контрастов и aria-labels)

### Сквозные задачи (фоном, во всех спринтах)
- Удалить/закрыть code-TODO list: AI-suggestions в Idea/LyricsStep (через `lovable-ai-gateway`), Artists.tsx навигация, admin alerts → suno-credits edge fn, srcset+blurhash в `imageOptimization.ts`
- Обновить `KNOWN_ISSUES_TRACKED.md` и `PROJECT_STATUS.md` каждое окончание спринта
- В каждый PR — авто-обновление badge через `update-badges.yml`

## 3. Технические детали

### CI pipeline (целевой)
```text
quality → build (size-limit) → e2e-desktop (shards×4)
                            → e2e-mobile  (shards×4)
                            → lighthouse-ci (perf/a11y budget)
                            → docs (mkdocs strict + lychee)
                            → visual-diff (toHaveScreenshot)
```

### Метрики качества (gates)
- Bundle gzip ≤ 950 KB (hard fail)
- Unit coverage ≥ 80%
- Lighthouse mobile: perf ≥ 90, a11y ≥ 95
- E2E flake rate < 2%
- Sentry error rate (24h) < 0.1%
- Suno generation failure rate < 8%

### Затрагиваемые файлы (примерно)
- `.github/workflows/ci.yml` — добавить e2e-desktop/mobile/lighthouse-ci jobs
- `playwright.config.ts` — projects `desktop`, `mobile-android`, `mobile-ios`, retries, sharding
- `tests/e2e/critical/*.spec.ts` — новые сценарии
- `src/stores/unifiedStudio/*.ts` — разбиение store
- `supabase/functions/suno-*` — back-off, idempotency, structured logging
- `src/components/generate-form/wizard/steps/{IdeaStep,LyricsStep}.tsx` — AI suggestions
- `src/lib/imageOptimization.ts` — srcset + blurhash
- `src/lib/audioElementPool.ts` — hard-eviction + телеметрия

### Out of scope
- Platform integrations (Spotify/Apple/YouTube) — Sprint 035+ по ROADMAP
- React Native / Electron — Q1 2027
- Marketplace MVP — отдельная инициатива

## 4. Что делать прямо сейчас (приоритеты)

1. Подтвердить порядок спринтов 033 → 034 → 035 → 036.
2. Стартовать с CI-обвязки (e2e split + Lighthouse) — даёт защиту следующим спринтам.
3. Параллельно — генерационный reliability, как самая болезненная пользовательская метрика.

Готов начать с любого пункта по вашему выбору — по умолчанию предлагаю Sprint 033 + параллельно настройку CI e2e.
