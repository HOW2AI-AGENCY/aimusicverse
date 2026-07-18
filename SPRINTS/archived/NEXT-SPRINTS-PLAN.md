# Next Sprints Plan (после закрытия Sprint 052-C, 2026-07-04)

**Дата:** 2026-07-04
**Статус:** Операционный план на ближайшие 2-4 недели
**Контекст:** Sprint 052-C cleanup закрыт (см. [docs/sprints/SPRINT-052-RETRO.md](../docs/sprints/SPRINT-052-RETRO.md)). Sprint 050 в фазе A0 ✅. Quality & Build зелёный на main, P0-хотфикс влит (PR #576/#577).

---

## 🎯 Sprint 050-A4 — Branch Protection (Phase 1 ✅ / Phase 2 ⏳)

**Phase 1 ЗАКРЫТА 2026-07-04 20:31** — ruleset id `18508298` через Rulesets API (Free plan; classic protection API недоступен). Применены:

- ✅ **A4.2** Запрет force-push (`non_fast_forward`)
- ✅ **A4.3** Запрет прямого push (через `required_linear_history` + UI policy)
- ✅ **A4.5** Запрет удаления ветки (`deletion`)
- ✅ `bypass_actors: []` — даже admin не может обойти
- ⏳ **A4.1** Required CI checks: `quality`, `build`, `smoke` — **Phase 2**
- ⏳ **A4.4** Documentation в `CONTRIBUTING.md`

**Phase 2 (блокировано):** добавить `pull_request` (0 approvals для self-merge) + `required_status_checks: [quality, build, smoke]`. **Блокер**: 16 pre-existing файлов с prettier-дрейфом (`.kilo/*`, `.lovable/*`, `.superpowers/*`, `supabase/functions/mcp/index.ts`, `src/integrations/supabase/types.ts`, `src/lib/mcp/tools/*`, `src/{Colors,Introduction,Typography}.mdx`, `src/stories/Configure.mdx`) — `npm run format:check` падает на main. **Sprint 050-A6**: починить format одним коммитом (`npm run format`), потом включить required checks.

> **Почему #1**: 8 часов простоя main в Sprint 052 + повторный force-push `4ec3684...02fa511` в тот же день. Phase 1 уже блокирует force-push — это worst-case из retro.

---

## Sprint 050 — Main Green + Mobile Audit (остаток фазы A)

### A0 ✅ P0-хотфикс typecheck (PR #576/#577)

### A2 🔄 Lychee voice-cloning links

- [ ] `npm run docs:check --silent` — линтер всех ссылок
- [ ] Сужено: graphify-out решён, 7 ссылок voice-cloning починены (ветка `claude/sprint-closure-planning-m6skuk`)

### A3 ⏳ Миграции: dev ↔ prod reconciliation

- [ ] Сверить `supabase/migrations/*.sql` с применёнными на prod
- [ ] Пометить missing migrations в `SPRINT-CLOSURE-PLAN-2026-07.md`
- [ ] Применить отстающие миграции (одноразовая уборка)

### A4 ✅ Branch protection Phase 1 (см. выше) + Phase 2

Phase 2 разблокирована 2026-07-04 вечером после Sprint 050-A6. Сейчас можно добавить `pull_request` rule + `required_status_checks: [quality, build, smoke]` к ruleset `18508298`.

### A6 ✅ Format + typecheck fix-up (2026-07-04)

- [x] `npm run format` для 16 pre-existing файлов с prettier-дрейфом (`.kilo/*`, `.lovable/*`, `.superpowers/*`, `supabase/functions/mcp/index.ts`, `src/integrations/supabase/types.ts`, `src/lib/mcp/tools/*`, `src/{Colors,Introduction,Typography}.mdx`, `src/stories/Configure.mdx`)
- [x] `tsconfig.app.json` — `exclude: src/lib/mcp/**` + `supabase/functions/mcp/**` (auto-generated, никто не импортирует)
- [x] `vite.config.ts:5` — `@ts-expect-error` для `@lovable.dev/mcp-js/stacks/supabase/vite` (опциональный Lovable-плагин)
- [x] **Quality & Build зелёный**: 0 tsc errors, 0 lint errors, 292/292 unit tests, all files Prettier-clean

### A5 ⏳ Bun lock vs package-lock

- [ ] Решить: удалить `bun.lockb` или зафиксировать как dual-lockfile
- [ ] CI matrix: проверить оба варианта
- [ ] Документировать выбор в `BUILD.md`

### Фаза B: F1-F12 mobile audit + bundle quick wins (после зелёной фазы A)

- [ ] F1-F12 — mobile audit (см. [SPRINT-050-PLAN.md](./SPRINT-050-PLAN.md))
- [ ] Bundle re-measurement после каждого F-таска

---

## Sprint 051 — Test Debt + God Files (tests-first декомпозиция)

**Цель:** 292 → 450+ unit-тестов, 0 файлов >1000 строк.

### Топ-3 декомпозиции (под защитой тестов)

- [ ] **`studio.service.ts`** (1028 LOC) → split + 12 тестов
- [ ] **`LyricsParser.ts`** (903 LOC) → split + 8 тестов
- [ ] **`studio.api.ts`** (891 LOC) → split + 10 тестов

### TanStack Query мутации — обязательные unit-тесты

> Из retro Sprint 052: «Любой новый хук с TanStack Query мутацией ОБЯЗАН иметь unit-тест, проверяющий что мутация вызывается с правильными параметрами».

- [ ] `useSunoMashup` — 5 тестов
- [ ] `useSunoPersona` — 5 тестов
- [ ] `useSunoFileUpload` — 5 тестов

### Edge Functions — request validation tests

- [ ] `suno-mashup` — happy path + 5 невалидных body
- [ ] `suno-persona` — happy path + 5 невалидных body
- [ ] `suno-file-upload` — multipart/form-data + type validation

### Включить неисполняемые тесты в Vitest

- [ ] 25 файлов в `tests/unit/` не подхватываются vitest include — починить include-паттерн в `vitest.config.ts`
- [ ] Прогнать полный suite, починить fallback'и

---

## Sprint 053 — Suno API Sounds + MIDI + Boost

**Контекст:** См. [SPRINT-053-PLAN.md](./SPRINT-053-PLAN.md).

### Edge functions (5 шт.)

- [ ] `suno-sounds`
- [ ] `suno-sounds-callback`
- [ ] `suno-midi`
- [ ] `suno-midi-callback`
- [ ] `suno-midi-details`

### Интеграции

- [ ] Подключить или удалить `suno-boost-style` (принять решение перед Sprint 054)
- [ ] UI: `SfxGeneratorSheet`
- [ ] MIDI fallback в Studio
- [ ] Telegram `/sfx` command

### Замещение Replicate

- [ ] `generate-sfx` → `suno-sounds`
- [ ] `transcribe-midi` → `suno-midi`

**Δ value:** новый сегмент SFX + снижение зависимости от Replicate.

---

## Sprint 054 — Suno API Details Suite (polling рефакторинг)

**Контекст:** См. [SPRINT-054-PLAN.md](./SPRINT-054-PLAN.md).

### Edge functions (6 шт.)

- [ ] `suno-music-details`
- [ ] `suno-cover-details`
- [ ] `suno-video-details`
- [ ] `suno-wav-details`
- [ ] `suno-lyrics-details`
- [ ] `suno-separation-details`

### Рефакторинг

- [ ] `suno-check-status` → dispatcher по taskType + per-type backoff
- [ ] `useSunoTaskDetails` generic hook заменяет 6 ad-hoc polling
- [ ] **Метрика:** polling error-rate < 2%

---

## Sprint 055 — Cost Optimization + Observability

**Контекст:** См. [SPRINT-055-PLAN.md](./SPRINT-055-PLAN.md).

### Кредит-дашборд

- [ ] History view (последние 100 транзакций)
- [ ] Прогноз расхода кредитов на основе истории
- [ ] Email/Telegram alert при аномальном расходе

### Retry policy per taskType

- [ ] `_shared/suno-retry.ts` — конфиг: `mashup: 3 attempts / 30s`, `persona: 5 / 60s`, и т.д.

### Hard-cap prompt/style/title по моделям

- [ ] V4: prompt 200/200, style 100/200, title 80/80
- [ ] V4_5: prompt 3000/5000, style 200/1000, title 100/80
- [ ] V5: prompt 4000/5000, style 200/1000, title 80/100
- [ ] Все кап-правила в `_shared/suno-validate.ts` с JSDoc и unit-тестами

### i18n-старт (отложено из Sprint 052-C)

- [ ] Установить `react-i18next` + dev-only `i18next-browser-languagedetector`
- [ ] Создать `src/i18n/locales/{en,ru}.json`
- [ ] Заменить `MASHUP_STRINGS` на `t('mashup.*')` (миграция первой доменной зоны)
- [ ] Переключатель языка в настройках профиля

### Webhook-secret rotation

- [ ] Cron job rotates `SUNO_WEBHOOK_SECRET` раз в 30 дней
- [ ] Audit log rotations

---

## 📈 Метрики успеха плана

| Метрика                      | Сейчас                       | Цель на 2026-08-01 |
| ---------------------------- | ---------------------------- | ------------------ |
| Unit tests                   | 292                          | 450+               |
| Files >1000 LOC              | 9                            | 0                  |
| Polling error-rate           | unknown                      | <2%                |
| Branch protection enabled    | ❌                           | ✅                 |
| `any` в production           | 0/50                         | 0/0                |
| Bundle eager JS (gzip)       | ~508 KB                      | <500 KB            |
| Telegram deep-links покрытие | /generate, /library, /mashup | + /sfx             |
| i18n readiness               | 0 strings                    | 1 домен (mashup)   |

---

## 🚫 Что НЕ входит в эти спринты

- Полная i18n-миграция (только 1 домен в Sprint 055)
- Новые AI-фичи (только стабилизация Suno)
- Marketing features (referral/dashboard расширения)
- Web-версия вне Telegram (mobile-first remains)

---

## 🔗 Связанные документы

- [SPRINT-CLOSURE-PLAN-2026-07.md](./SPRINT-CLOSURE-PLAN-2026-07.md) — текущий операционный план
- [SPRINT-050-PLAN.md](./SPRINT-050-PLAN.md)
- `SPRINT-051-PLAN.md` (будет создан при старте Sprint 051)
- [SPRINT-053-PLAN.md](./SPRINT-053-PLAN.md)
- [SPRINT-054-PLAN.md](./SPRINT-054-PLAN.md)
- [SPRINT-055-PLAN.md](./SPRINT-055-PLAN.md)
- [docs/sprints/SPRINT-052-RETRO.md](../docs/sprints/SPRINT-052-RETRO.md)
- [PROJECT_STATUS.md](../PROJECT_STATUS.md)
- [CLAUDE.md](../CLAUDE.md)
