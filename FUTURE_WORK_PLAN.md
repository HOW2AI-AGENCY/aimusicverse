# План дальнейших работ MusicVerse AI

**Дата:** 2026-07-07
**Статус:** 99% complete, 1497 unit tests passing, tsc 0 errors. ⚠️ CI на `main` был красным последние ~10 прогонов (E2E mobile) — см. P1 ниже; 2 из нескольких причин найдены и исправлены 2026-07-07.
**Фокус:** Стабилизация CI → E2E → i18n → Новые фичи

---

## 🎯 Текущее состояние (верифицировано 2026-07-06)

| Метрика             | Значение                                                                                                                     | Статус |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------ |
| Unit tests          | 1497 passing (123/125 files)                                                                                                 | ✅     |
| TypeScript          | 0 errors                                                                                                                     | ✅     |
| E2E specs           | 56 (CI на `main` красный последние ~10 прогонов — verified 2026-07-07 через GitHub Actions logs, не только "не подтверждён") | 🟡     |
| Components          | 1037                                                                                                                         | ✅     |
| Hooks               | 413                                                                                                                          | ✅     |
| API files           | 26                                                                                                                           | ✅     |
| Services            | 12 *.service.ts                                                                                                              | ✅     |
| Stores              | 12                                                                                                                           | ✅     |
| Suno edge functions | 46 (28/28 API — 100%)                                                                                                        | ✅     |
| Files >800 LOC      | 0 (исключая generated)                                                                                                       | ✅     |
| `any` budget        | 0/50                                                                                                                         | ✅     |
| Bundle eager JS     | ~508 KB gzip                                                                                                                 | ✅     |
| Design Score        | C+ (AI Slop: B)                                                                                                              | 🟡     |

### ✅ Завершённые спринты

- **Sprint 051** — Test Debt: god-file decomposition 9/9, 1497 unit tests
- **Sprint 053** — Suno Sounds + MIDI Direct + Boost Style
- **Sprint 054** — Suno Details Suite (28/28 Suno API — 100%)
- **Sprint 055** — UX Critical Fixes (P0/P1 — 13/13)
- **Sprint 056** — GenerateSheet Redesign + Storybook (31 story)

---

## 📋 Приоритеты (июль 2026)

### P0: Branch Protection Phase 2

**Задача:** Добавить required CI checks к ruleset (документы называют два разных ID — `18508298` и `18579467` — сверить, какой актуален, вживую на GitHub; ни один MCP-инструмент в этой сессии не даёт доступа к rulesets API, так что это не проверено автоматически).

- [x] Phase 1: запрет force-push + deletion + linear history
- [ ] Phase 2: `required_status_checks: [quality, build, smoke]`
- [ ] Добавить `pull_request` rule (0 approvals для self-merge)
- [ ] Проверить работу на test PR
- [x] ~~Pre-commit хуки (Prettier/lint/typecheck)~~ — уже есть: `.husky/pre-commit` гоняет `lint-staged` + `tsc --noEmit`. Реальный открытый вопрос — не локальный хук, а то, что CI required-status-checks не блокируют пуши в обход хука (GitHub UI правки, `--no-verify`).

**Срок:** 1 день
**Блокеры:** нет (050-A6 format fix-up завершён)

---

### P1: E2E стабилизация

**Текущее (verified 2026-07-07 напрямую через GitHub Actions job logs, не со слов доков):** 56 specs; последние ~10 прогонов на `main` — `failure`/`cancelled`. В последнем прогоне 7/8 джобов зелёные, падал только `E2E Tests (Mobile emulation)`.

- [x] Найдена и исправлена реальная причина топ-1 падения: первый экран онбординга (`QuickStartOverlay`, `src/components/onboarding/OnboardingFlow.tsx`) монтируется через 800мс `setTimeout` и перехватывает тапы по кнопкам `/generate` в мобильной эмуляции — `tests/e2e/generation.mobile-taps.spec.ts` теперь гасит это состояние через `localStorage` (`user-journey-state`), по образцу `tests/e2e/home.no-auto-overlays.spec.ts`.
- [x] Найден и исправлен отсутствующий роут `/index` (404) — пять E2E-файлов и `PaywallProvider.tsx` считали его алиасом `/`, но в `App.tsx` не было соответствующего `<Route>`. Добавлен `<Route path="/index" element={<Navigate to="/" replace />} />`. Разблокировал весь `dev-overlay.telegram-web.spec.ts` (был не про мобильную эмуляцию, а про 404).
- [ ] **Остаётся открытым:** `generation.mobile-taps.spec.ts` › "repeated taps on the same chip keep firing" всё ещё падает — неавторизованный `/generate` → `GenerateRedirect` → `/` показывает экран "Требуется Telegram" даже с предварительно выставленным `guestMode=true` и hostname `127.0.0.1` (по логике `ProtectedRoute.isDevEnvironment()` это должно давать доступ). Корневая причина не найдена — нужна интерактивная отладка значений `isDevMode`/`isGuestMode`/`user` в момент рендера, а не дальнейшие предположения.
- [ ] Запустить полный E2E-прогон в GitHub Actions после того, как пункт выше закрыт
- [ ] `waitForLoadState("networkidle")` → локатор-ожидания (осталось 4 файла: `library.spec.ts` ×7, `cdn.spec.ts`, `generation.dialog-orientation.spec.ts`, `storage.spec.ts`; `suno-mashup.spec.ts` уже исправлен)
- [ ] Добавить E2E-smoke в Quality & Build workflow

**Срок:** 4-5 дней
**Метрика:** 56/56 passing в CI (реально подтверждено, не по документам)

---

### P1: i18n-старт (EN/RU)

**Контекст:** Все UI-строки на русском. Английская локализация для международного рынка.

- [ ] Установить `react-i18next` + `i18next-browser-languagedetector`
- [ ] Создать `src/i18n/locales/{en,ru}.json`
- [ ] Мигрировать `MASHUP_STRINGS` как пилотный домен на `t('mashup.*')`
- [ ] Переключатель языка в настройках профиля
- [ ] RU — primary (текущие строки), EN — перевод

**Срок:** 5-7 дней
**Метрика:** 1 домен (mashup) на 2 языках

---

### P2: Bundle optimization

**Текущее:** 508 KB eager JS, 2.11 MB total.

- [ ] Пересмотреть границы `manualChunks` в `vite.config.ts`
- [ ] Выявить oversized chunks via `npm run size:why`
- [ ] Применить Tree-shaking для неиспользуемых экспортов

**Срок:** 3-5 дней
**Метрика:** Total bundle ≤1.8 MB

---

### P2: Unit-тесты для API/Service слоёв

**Текущее:** 1497 unit tests. Цель: 1800+.

- [ ] `src/api/*.api.ts` (26 файлов) — по 3-5 тестов
- [ ] `src/services/*.service.ts` (12 файлов) — по 5-8 тестов
- [ ] TanStack Query mutations: useSunoMashup, useSunoPersona, useSunoFileUpload

**Срок:** 7-10 дней
**Метрика:** 1800+ unit tests

---

### P3: Design polish (из design-review)

**5 quick wins применены** (2026-07-06): color-scheme: dark, font consolidation, H2→H3.

- [ ] Search box на главной (high impact — music app needs search)
- [ ] Skeleton loading states (medium — content pops in)
- [ ] Route transition animation (polish — SPA feels static)
- [ ] Border-radius hierarchy (3 tiers: sm/md/lg)
- [ ] Nav simplification (group 10 tabs into primary/secondary)

**Срок:** 5-7 дней

---

## 📅 Timeline (июль-август 2026)

```
Week 1 (July 7-11):
  Mon-Tue: Branch Protection Phase 2 (P0)
  Wed-Fri: E2E stabilization launch (P1)

Week 2 (July 14-18):
  Mon-Wed: E2E fixes (P1)
  Thu-Fri: i18n infrastructure + pilot domain (P1)

Week 3 (July 21-25):
  Mon-Wed: i18n translation + language switcher
  Thu-Fri: Bundle optimization (P2)

Week 4 (July 28 - Aug 1):
  API/Service unit tests (P2)
  Design polish items (P3)
```

---

## 🚀 Q3 2026 (после стабилизации)

| Sprint  | Фокус                                             | Статус     |
| ------- | ------------------------------------------------- | ---------- |
| **057** | E2E CI green + Branch Protection complete         | 📋 Planned |
| **058** | i18n EN/RU (3 домена: mashup, studio, generation) | 📋 Planned |
| **059** | Collaboration features (realtime sessions)        | 💡 Concept |
| **060** | Public Developer API + Webhooks                   | 💡 Concept |

---

## 🔄 Ритуалы

- **Каждый PR:** tsc + lint + unit tests + size-limit
- **Еженедельно:** E2E smoke на main, bundle re-measure
- **При закрытии спринта:** обновить PROJECT_STATUS.md, CHANGELOG.md, CLAUDE.md, README.md

---

## 📝 Notes

- **Suno API 28/28 (100%)** — все категории реализованы, 46 edge functions
- **God-file decomposition завершена** — 0 файлов >800 LOC в production-коде
- **Design-review C+** — функциональный, не хватает search + motion polish
- **Branch protection Phase 1** — force-push заблокирован, Phase 2 ждёт required CI checks

---

**Последнее обновление:** 2026-07-06
**Следующий review:** 2026-07-13
