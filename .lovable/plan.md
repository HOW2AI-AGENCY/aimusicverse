## Цель

Закрыть последний пробел в design-system guard: дать ESLint собственное правило `section-tokens/no-saturated-brand` с автофиксом, синхронизированное с CLI codemod `scripts/check-section-tokens.mjs`. Затем запланировать следующие спринты по дизайн-системе, тестам и аудиту.

---

## Часть 1 — Реализация ESLint правила (этот спринт)

### Технические детали

**Новый пакет/файл:** `eslint-rules/section-tokens.js` (локальный ESLint plugin, без публикации).

- Экспортирует `rules: { "no-saturated-brand": rule }`.
- Правило работает на узлах `Literal` и `TemplateElement` (строки в JSX/`cn(...)`/`clsx(...)`).
- Использует общий источник правды — импортирует `FORBIDDEN` и `rewriteText` из `scripts/check-section-tokens.mjs` (уже экспортируются), чтобы regex/замены не расходились с codemod.
- `meta.fixable = "code"` → автофикс через `fixer.replaceText(node, rewritten)`.
- `messages`:
  - `forbidden`: `"Saturated brand token '{{matched}}' is not allowed in layout primitives. Use '{{suggestion}}' instead."`
- `options[0].targets`: glob-список файлов, по умолчанию = `DEFAULT_TARGETS` из скрипта.
- `options[0].allowComment`: `"section-tokens-allow"` (тот же маркер, что в CLI).

**Интеграция:**

- `eslint.config.js`: подключить локальный плагин через `import sectionTokens from "./eslint-rules/section-tokens.js"`, добавить блок `files: [...DEFAULT_TARGETS]` с `"section-tokens/no-saturated-brand": "error"`.
- Снять старый `no-restricted-syntax`-блок (он давал хуже сообщение и не фиксил).
- `package.json`: добавить `"lint:fix": "eslint . --fix"` (если ещё нет).

**Тесты:** `tests/unit/eslint-section-tokens.test.ts` через `RuleTester` (ESLint flat API):
- valid: `bg-card/60`, `text-primary`, `bg-primary-foreground`, allow-comment.
- invalid: `bg-primary`, `from-accent`, `bg-gradient-primary` — c проверкой `output` после автофикса = результат `rewriteText`.

**Документация:** дописать в `README.md` раздел Section tokens:
- `npm run lint -- --fix` теперь чинит токены автоматически на сохранении в IDE.
- CLI `npm run check:section-tokens -- --fix` остаётся для bulk/CI вне ESLint scope.

### Definition of Done

- `npm run lint` падает на `bg-primary` в `Section.tsx` с понятным сообщением.
- `npm run lint -- --fix` приводит файл к тем же токенам, что `check-section-tokens --fix`.
- Юнит-тесты ESLint правила и существующие тесты `check-section-tokens` зелёные.
- Pre-commit и CI пайплайн без изменений (правило ловится через общий `npm run lint`).

---

## Часть 2 — Дорожная карта спринтов

### Sprint 033 — Design System Guard Hardening (1 неделя)

- T1. ESLint rule `section-tokens/no-saturated-brand` + автофикс (Часть 1 выше).
- T2. Расширить `DEFAULT_TARGETS`: добавить `src/components/home/**`, `src/components/library/SectionHeader.tsx`, hero-карточки.
- T3. ESLint правило `no-hex-literals` для `src/components/**` (бан `bg-[#...]`, `text-[#...]`) с авто-предложением токена из `docs/DESIGN_TOKENS.md`.
- T4. Storybook story `Section.stories.tsx` с примерами правильного/неправильного использования + visual baseline.
- T5. Обновить `docs/DESIGN_TOKENS.md` разделом «Запрещено в Section/Hero/Card» с диффами до/после.

### Sprint 034 — Smoke & Visual Regression Stabilization (1 неделя)

- T1. Включить WebKit в smoke-матрицу CI (сейчас best-effort) после стабилизации.
- T2. Baseline для visual regression на 3 ключевых страницах: `/`, `/library`, `/studio`.
- T3. PR-комментарий с inline-диффом скриншотов (через `actions/upload-artifact` + markdown image links).
- T4. Авто-rerun только упавшего проекта в CI (перенос логики из `scripts/e2e.sh --rerun-failed`).
- T5. Метрика flake-rate в `docs/CI_METRICS.md`, цель < 2%.

### Sprint 035 — Supabase Audio Audit Follow-up (1–2 недели)

По итогам `docs/audit/SUPABASE_AUDIO_AUDIT_2026-06-27.md`:

- T1. Миграция `tracks.tags`: `text` → `text[]` + GIN index + бэкафилл из CSV.
- T2. Унификация полей промптов: `prompt`, `style_prompt`, `lyrics_prompt` в одну JSONB колонку `generation_input` с zod-схемой.
- T3. Структурный лог `api_usage_logs.request_payload` → JSONB с обязательными ключами (`model`, `tags[]`, `genre`, `mood`, `bpm`).
- T4. RPC `search_tracks_by_facets(genres text[], tags text[], moods text[])` + индексы.
- T5. Storage audit: единый префикс `tracks/{user_id}/{track_id}/{kind}` для audio/stems/cover.

### Sprint 036 — Section/Card Dedup & Layout Tokens (1 неделя)

- T1. Аудит дублей `Section`/`Hero`/`Card`/`Panel` → consolidation map в `docs/UI_DEDUP_2026-Q3.md`.
- T2. Единый API `<Section tone="neutral|surface|muted">` без brand-вариантов.
- T3. Codemod `scripts/migrate-section-variants.mjs` для замены legacy `variant="primary"`.
- T4. Удалить deprecated компоненты с алиасами на 1 спринт.

### Sprint 037 — Design Tokens Linter v2 (1 неделя)

- T1. Динамический парс `index.css` → список валидных tokens, ESLint правило сверяет имена.
- T2. CI job `check:tokens-drift` — diff между `index.css`, `tailwind.config.ts`, `design-tokens.ts`.
- T3. Web-страница `/internal/tokens` (dev only) со всеми токенами и контрастом WCAG.

---

## Часть 3 — Бэклог (без спринта)

- Lighthouse perf budget в CI (из `ROADMAP.md` → tech debt).
- Split `useUnifiedStudioStore` на доменные slices.
- WCAG AA pass на Library + Studio.
- Multi-language UI (EN/RU/ES/DE) — Q4.

---

## Порядок исполнения

1. Этот тикет: реализовать Часть 1 (ESLint rule + автофикс + тесты + README).
2. После апрува — открыть Sprint 033 как первый по очереди.
3. Спринты 034–037 запускать последовательно, каждый с retro в `SPRINTS/completed/`.
