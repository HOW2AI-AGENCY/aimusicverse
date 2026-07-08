# План дальнейших работ — AI MusicVerse

На основе аудита от 2026-07-07. План разбит на 4 фазы по приоритету: от критичных гигиенических фиксов до стратегических улучшений качества и UX.

## Фаза 0 — Гигиена репозитория (сегодня, ~2 часа)

Цель: устранить P0-риски, вернуть CI/скрипты в зелёный статус.

1. **Разобрать незакоммиченные изменения (−5135 LOC, 28 удалённых файлов)**
   - Сделать `git diff --stat` и просмотреть каждую группу удалений.
   - Проверить импорты удалённых модулей (`a11y.ts`, `a11yHelpers.ts`, `accessibility.ts`, `gesture-manager.ts`, `stateMachine.ts`, `retry.ts`, `haptics.ts`, `branded.ts`, Suno `SectionBlock/SunoTimeline/TagMenu`) через `rg` по `src/`.
   - Если импортов нет — закоммитить одним `refactor:` commit'ом с явным списком удалений.
   - Если импорты есть — восстановить файлы через `git restore` и открыть отдельный спринт на плавную деприкацию.

2. **Починить `scripts/count-any.mjs`**
   - Добавить `fs.existsSync(abs)` guard перед `readFileSync` в цикле по `git ls-files`, чтобы не падать на удалённых-но-tracked файлах.

3. **Починить Prettier gate**
   - Прогнать `npx prettier --write .claude/settings.json` (и любые другие файлы, которые всплывут в `format:check`).

4. **Проверить полный `npm run check-all`** — lint + format:check + typecheck + test должны быть зелёными.

## Фаза 1 — Синхронизация документации (1-2 дня)

Цель: устранить расхождения между `README.md`, `PROJECT_STATUS.md`, `ROADMAP.md`, `CLAUDE.md`.

1. **Единый источник счётчиков.** Обновить `scripts/update-badges.mjs`, чтобы он рекурсивно считал `src/services/**/*.service.ts`, `src/stores/**/*.ts`, `src/api/**/*.api.ts`, `src/components/**/*.tsx`, `src/hooks/**/*.ts`. Прогнать и обновить бейджи.
2. **Разрешить конфликт статуса Sprint 050.** В `PROJECT_STATUS.md` перевести из «🔄 В работе» в «✅ Завершён» (PR #657 merged, Branch Protection Phase 2 активен).
3. **Разрешить коллизию номеров Sprint 057.** Переименовать один из них (Audio Analysis Refactoring остаётся 057, Collaboration Features → 058).
4. **Обновить метрику unit tests** после решения по Фазе 0 (1484 или восстановленные 1497).
5. **Добавить в scope аудита `supabase/functions/`** — 11 файлов >800 LOC не покрыты ни одним спринтом. Явно указать это в `PROJECT_STATUS.md` как известный tech debt.

## Фаза 2 — Технический долг и качество кода (2-3 недели)

### Sprint 058 — Edge Functions Decomposition

- Декомпозировать 11 файлов >800 LOC в `supabase/functions/` (до 1871 LOC — вероятно, `suno-*` семейство).
- Выделить общие модули в `supabase/functions/_shared/` (сейчас там уже есть `cors.ts`, `logger.ts`, `telegram-utils.ts`, `suno.ts`).
- Целевая планка: 0 файлов >500 LOC в edge functions.
- Добавить unit-тесты для критичных helper-модулей через Deno test.

### Sprint 059 — Test Coverage Recovery

- Восстановить (или явно списать) 4 удалённых тестовых файла: `accessibility.test.ts`, `performance.test.ts`, `withHistory.test.ts`, `generate-sheet-redesign-flag.test.ts`.
- Поднять покрытие критичных модулей: `GlobalAudioProvider`, `useUnifiedStudioStore`, `useVersionSwitcher`, `secure_credit_update` RPC.
- Цель: 1500+ unit tests, ≥70% branch coverage на критичных путях.

### Sprint 060 — Security & Dependencies

- Разрешить 6 уязвимостей `npm audit` (1 high, 4 moderate, 1 low) — либо через обновление, либо через явные overrides с обоснованием.
- Прогнать `security--run_security_scan` и обработать все P0/P1 findings.
- Аудит RLS-политик: убедиться, что все `public.*` таблицы имеют явные GRANT и политики (по проектной памяти).

## Фаза 3 — UX и производительность (4-6 недель)

### Sprint 061 — Mobile Studio Polish

- Пройти по `MOBILE_AUDIT_F1-F12.md` и `MBILE_FIXES_F3F6F7.md`, закрыть остатки.
- Валидация touch targets 44×44px, safe areas, keyboard handling на реальном iOS Safari через Telegram.
- Haptic feedback consistency: аудит по мемори «Standardized Haptic Feedback».

### Sprint 062 — Performance Budget Hardening

- Bundle size сейчас 508 KB gzip eager (лимит 950 KB) — есть запас, но задача: снизить до 400 KB через lazy loading второй волны (Studio, StemSeparation, MidiEditor).
- Lighthouse CI: закрепить порог Performance ≥90 на mobile, LCP <2.5s, TBT <200ms.
- Аудит `react-virtuoso` использования — все списки >50 элементов должны быть виртуализированы.

### Sprint 063 — A/B Testing & Analytics Loop

- Замкнуть цикл `useExperiment` → `deeplink-tracker` → аналитика в admin панели.
- Дашборд конверсий по `ConversionStage` (visit → engaged → registered → generation → payment).
- Автоматические отчёты в Telegram-канал по ключевым метрикам недели.

### Sprint 064 — Collaboration Features (перенумерованный)

- Совместное редактирование проектов (real-time через Supabase Realtime).
- Роли в проекте (owner, editor, viewer) через `user_roles` паттерн.
- Комментарии с таймкодами к трекам.

## Фаза 4 — Стратегические улучшения (квартальный горизонт)

1. **AI Quality Layer** — метрики качества генерации (loudness, LUFS, spectral balance) через существующий `AudioAnalysisService`. Показывать пользователю «Оценка трека: 8.5/10».
2. **Voice Cloning Studio v2** — расширить `Voice Library` и `Voice History` (страницы 16-17 из PRD) с превью и версионированием.
3. **Marketplace / Community** — публичные треки, лайки, ремиксы. Использовать существующие `track_likes`, `comments`, `safe_public_profiles`.
4. **Telegram Bot v2** — inline queries для поиска треков, deep links в конкретные Studio-сессии, Stars payment flow ready.

## Технические детали

- **Git flow:** conventional commits, PR review обязательный (Branch Protection Phase 2 активен).
- **Test gates:** `check-all` = lint + format:check + typecheck + test; должен быть зелёный до merge.
- **Bundle gate:** `npm run size` (950 KB limit) — не превышать.
- **Design tokens:** строго через `src/lib/design-tokens.ts` и `src/lib/glass.ts`.
- **Логирование:** только `logger.error()` / `logger.warn()`, никаких `console.*`.
- **Импорты:** `framer-motion` → `@/lib/motion`, `lucide-react` → `@/lib/icons`, никаких `supabase.from()` в компонентах (только через API layer).

## Порядок исполнения

```text
Фаза 0 (сегодня)
   │
   ▼
Фаза 1 (1-2 дня)  ──►  готовность к спринт-планированию
   │
   ▼
Фаза 2 (Sprints 058-060, 2-3 недели, параллельно)
   │
   ▼
Фаза 3 (Sprints 061-064, 4-6 недель, последовательно)
   │
   ▼
Фаза 4 (квартал, стратегия)
```

## Критерии приёмки плана

- Все P0-риски из аудита закрыты в Фазе 0.
- Документация синхронизирована в Фазе 1 (один источник правды).
- Tech debt в edge functions ликвидирован в Sprint 058.
- Test coverage ≥70% на критичных путях в Sprint 059.
- Bundle eager ≤400 KB в Sprint 062.
- Lighthouse Performance ≥90 (mobile) закреплено в CI.
