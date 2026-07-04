# Sprint 050: Main Green + Mobile Audit F1–F12 (Q3 2026)

**Дата плана:** 2026-07-04 (по итогам [аудита прогресса](../docs/audit/PROGRESS-AUDIT-2026-07-04.md))
**Длительность:** ~10 дней (2 фазы по 5 дней)
**Зависимость:** Sprint 049 завершён; prettier-фикс из ветки `claude/progress-audit-plan-fpobal` влит
**Цель:** Полностью зелёный `main` (все workflow) + закрытие 12 функциональных флагов F1–F12, накопленных design-спринтами 045–047

---

## Контекст

Аудит 2026-07-04 показал: инженерные метрики в порядке (0 `any`, 0 нарушений слоёв), но `main` красный из-за процессных проблем — прямые Lovable-коммиты мимо хуков (prettier-дрейф, build-артефакты в git), падающий link-check в Docs, неподтверждённый E2E. Параллельно design-спринты 045–047 накопили 12+ функциональных флагов, которые сознательно не правились в design-scope и ждут build-agent.

**Состояние входа:**

- 🔴 CI/CD Pipeline: Format check падал на 24 файлах (фикс уже в ветке аудита; после мержа — зелёный)
- 🔴 Docs workflow: lychee link-check падает (битые ссылки в markdown)
- 🟡 E2E: сбор suite починен в #572 (`@axe-core/playwright`), вердикт прогона run #115 не получен на момент планирования
- 🟡 Прод-миграции не сверены с репозиторием (две пересекающиеся likes-миграции: `20260703120000` и `20260704014859`)
- 🟡 F1–F12 functional flags (CHANGELOG, спринты 045–047) не закрыты
- 🟡 3 lazy-import quick wins из `docs/BUNDLE_ANALYSIS.md` не сделаны

**Ожидаемое состояние выхода:**

- ✅ Все workflow на `main` зелёные (CI/CD Pipeline, E2E, Docs, Quality & Build)
- ✅ Процесс для Lovable-коммитов: `main` не может уходить в красное от прямых пушей
- ✅ F1–F12 закрыты (или явно отклонены с обоснованием)
- ✅ ErrorBoundary home button работает (перенос из Sprint 045 Phase D-4)
- ✅ `vendor-other` похудел на ~150 КБ (lamejs, canvas-confetti, qrcode → lazy)

---

## Фаза A: Main Green (дни 1–5)

| ID     | Задача                                                                                                                                                                                                                                                                                                                                                   | Приоритет   | Оценка | Статус |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------ | ------ |
| 050-A1 | **E2E вердикт**: дождаться/перезапустить run #115; по фактическим падениям тестов — чинить (сбор suite уже исправлен в #572)                                                                                                                                                                                                                             | 🔴 Critical | 1–3d   | 🟡 In progress |
| 050-A2 | **Docs/lychee**: осталось решить судьбу 4434 закоммиченных файлов `graphify-out/**` (`git rm -r --cached` либо признать tracked)                                                                                                                                                                                                                        | 🟠 High     | 0.5d   | ⏳ Pending |
| 050-A3 | **Сверка прод-миграций**: `supabase migration list` vs `supabase/migrations/`; likes-миграции (`20260703120000` + `20260704014859`)                                                                                                                                                                                                                     | 🟠 High     | 0.5d   | ⏳ Pending |
| 050-A4 | **Процесс Lovable**: branch protection на `main` (требует владельца репозитория — вне доступа агента)                                                                                                                                                                                                                                                    | 🔴 Critical | 1d     | 🚧 Blocked (owner) |
| 050-A5 | **Гигиена репозитория**: `bun.lock` удалён, `.gitignore` обновлён — единый источник истины `package-lock.json` (npm)                                                                                                                                                                                                                                     | 🟡 Medium   | 0.5d   | ✅ Done |

## Фаза B: F1–F12 + функциональные переносы (дни 6–10)

Флаги из CHANGELOG (спринты 045–047), сгруппированы по поверхностям:

| ID     | Задача                                                                                                                                | Флаги        | Оценка | Статус |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------ | ------ |
| 050-B1 | **Scroll/viewport**: `useScrollLock` wiring в 4 surfaces; `useVisualViewport` keyboard avoidance; `useMediaQuery` SSR-guard           | F1, F8, F9   | 1.5d   | ⏳ Pending |
| 050-B2 | **Focus/keyboard**: focus-trap в sheet/dialog; Library keyboard nav (`aria-selected` + scroll-into-view); Telegram BackButton race    | F3, F6, F7   | 1.5d   | ⏳ Pending |
| 050-B3 | **Поверхности**: `PromptHistory` sub-dialog root cause; QueueSheet auto-close + misleading toast copy; `LibraryFilterChips` parity    | F2, F5, F11  | 1d     | ⏳ Pending |
| 050-B4 | **Данные/чистка**: `usePublicTracks` cover_url normalization; `VersionComparison.tsx` dead-code removal; `LazyImage` a11y             | F4, F10, F12 | 1d     | ⏳ Pending |
| 050-B5 | **ErrorBoundary home button** (`useNavigate`) — перенос из Sprint 045 Phase D-4                                                       | —            | 0.5d   | ⏳ Pending |
| 050-B6 | **Bundle quick wins**: `canvas-confetti` вынесен в lazy (`src/lib/confetti.ts`, 5 использований). `lamejs` (~100 КБ) и `qrcode` (~30 КБ) — ещё в очереди | —            | 0.5d   | 🟡 Partial (1/3) |


> Точные формулировки флагов — CHANGELOG.md (Sprint 047) и PROJECT_STATUS.md «📋 Флаг для build-agent». При закрытии каждого флага — вычёркивать в обоих местах.

## Definition of Done

- [ ] 4/4 workflow на `main` зелёные два дня подряд (включая прямые Lovable-коммиты, если они продолжатся)
- [ ] Все 12 флагов закрыты или явно помечены «won't fix» с причиной
- [ ] `npm run size` — total bundle < 2.11 МБ (после 050-B6)
- [ ] Прод-миграции сверены; расхождения (если есть) задокументированы в `docs/DATABASE.md`
- [ ] PROJECT_STATUS.md / ROADMAP.md обновлены при закрытии спринта

## Следующие спринты (заготовка, см. ROADMAP.md)

- **Sprint 051 — Test Debt + God Files** (tests-first): unit-тесты для 20 `src/api/*.api.ts` + 18 `src/services/*.service.ts` + 9 файлов >800 LOC; затем декомпозиция топ-3 (`studio.service.ts` 1028, `LyricsParser.ts` 903, `studio.api.ts` 891) под защитой тестов. Цель: 282 → 450+ юнит-тестов, 0 файлов >1000 строк.
- **Sprint 052 — Q4 Platform** (черновик): Export service (WAV/MP3/FLAC), Service Worker + оффлайн, Lighthouse CI budget enforcement, ревизия `manualChunks` (total bundle 2.11 МБ → цель ≤1.8 МБ), подготовка i18n (EN/RU) — из Sprint 040-плана и Q4-целей ROADMAP.
