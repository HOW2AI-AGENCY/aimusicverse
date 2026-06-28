# Tasks: Редизайн документации репозитория

**Input**: Design documents from `/specs/035-repo-docs-revamp/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Не требуются — документационная фича, валидация через ручную проверку и визуальный осмотр.

**Organization**: Tasks are grouped by user story (P1, P2, P3 priority) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Include exact file paths in descriptions

## Path Conventions

- **Repository root**: `.md` files at project root
- **Screenshots**: `public/screenshots/`
- **Spec directory**: `specs/035-repo-docs-revamp/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare directories and tools for documentation redesign

- [x] T001 Create screenshots directory: `public/screenshots/`
- [x] T002 [P] Create Playwright screenshot script in `scripts/capture-screenshots.ts`
- [x] T003 [P] Take 4 screenshots and save as WebP — placeholder README created, run script with dev server

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Audit current state and prepare foundation that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Audit KNOWLEDGE_BASE.md — decomposition map in data-model.md
- [x] T005 [P] Update PROJECT_STATUS.md: Sprint 035 status, 033-mobile 114/114 done
- [x] T006 [P] Update CHANGELOG.md: Sprint 035 entries
- [x] T007 [P] Update ROADMAP.md: 035-repo-docs-revamp to active sprints
- [x] T008 [P] Update REPOSITORY_STRUCTURE.md: screenshots + current state
- [x] T009 Update CLAUDE.md: documentation section added

**Checkpoint**: Audit complete, status files updated, foundation ready for user story work

---

## Phase 3: User Story 1 — Инвестор оценивает проект (Priority: P1) 🎯 MVP

**Goal**: README.md полностью переработан для инвесторов: шилдсы, метрики, скриншоты, прогресс, контакты

**Independent Test**: Открыть README.md в GitHub, засечь 3 минуты — найти ответы на 5 ключевых вопросов: что, зачем, стадия, метрики, контакты

### Implementation for User Story 1

- [x] T010 [P] [US1] Write README Hero section (название, слоган, шилдсы статуса) in README.md
- [x] T011 [P] [US1] Write «Что такое MusicVerse AI» section (миссия, ключевые цифры) in README.md
- [x] T012 [P] [US1] Write «Для инвесторов» section (метрики: звёзды, форки, бандл, спринты, стадия) in README.md
- [x] T013 [US1] Write «Прогресс проекта» section with Mermaid Gantt + таблица спринтов in README.md (depends on T007)
- [x] T014 [US1] Write «Быстрый старт» section (5 команд) in README.md
- [x] T015 [US1] Write «Скриншоты» section (галерея из 4 изображений) in README.md (depends on T003)
- [x] T016 [US1] Write «Контакты и ссылки» section (Telegram-бот, email, сайт, QR-код) in README.md
- [x] T017 [US1] Write README footer with license, copyright, navigation links in README.md
- [x] T018 [US1] Remove README_RU.md (дубликат) — информация уже в новом README

**Checkpoint**: README готов — инвестор находит ответы за 3 минуты, скриншоты видны, прогресс нагляден

---

## Phase 4: User Story 2 — Разработчик находит документацию (Priority: P1)

**Goal**: DOCUMENTATION_INDEX.md переработан с ролевой навигацией. ARCHITECTURE_HUB.md обновлён. Разработчик находит всё за 5 минут.

**Independent Test**: Дать новому разработчику ссылку — через 5 минут спросить где: структура компонентов, конвенции коммитов, архитектура аудио, API-слой. Все ответы найдены.

### Implementation for User Story 2

- [x] T019 [P] [US2] Write role-based navigation section in DOCUMENTATION_INDEX.md (5 ролей: Dev, Design, PM, Investor, Contributor)
- [x] T020 [P] [US2] Write Document Catalog (8 категорий) in DOCUMENTATION_INDEX.md
- [x] T021 [P] [US2] Update ARCHITECTURE_HUB.md: refresh dates, verify all links work, add new ADR references if any
- [x] T022 [US2] Add footer with navigation to all root .md files (12+ files: CLAUDE.md, AGENTS.md, REPOSITORY_STRUCTURE.md, DOCUMENTATION_INDEX.md, ARCHITECTURE_HUB.md, ROADMAP.md, CHANGELOG.md, PROJECT_STATUS.md, CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md, MAINTENANCE.md) — единый шаблон: [← Prev] [↑ Index] [Next →] + дата обновления
- [x] T023 [US2] Verify all cross-references in documentation: check every relative link leads to existing file (manual audit)

**Checkpoint**: Ролевая навигация работает, футеры единообразны, ссылки рабочие

---

## Phase 5: User Story 3 — Клиент изучает возможности (Priority: P2)

**Goal**: README дополнительно улучшен для пользователей: скриншоты с подписями, таблица функций, ссылка на бота

**Independent Test**: Показать README незнакомому человеку. Спросить: «Что делает проект?», «Как попробовать?», «Какие функции?». Все три вопроса получают ответ.

### Implementation for User Story 3

- [x] T024 [P] [US3] Write «Возможности» (Features) section with icon-table in README.md (11 categories from existing feature list)
- [x] T025 [P] [US3] Refine screenshot captions and descriptions in README.md (T015) — add descriptive alt-text
- [x] T026 [US3] Add Telegram bot deep-link and QR-code section in README.md (merge with T016 contacts)
- [x] T027 [US3] Add «Архитектура» Mermaid diagram section in README.md (simplified from ARCHITECTURE_HUB.md)
- [x] T028 [US3] Final README polish pass: check all shields render, all images load, all links work

**Checkpoint**: Клиент понимает продукт без дополнительных пояснений

---

## Phase 6: User Story 4 — Контрибьютор понимает процесс (Priority: P2)

**Goal**: CONTRIBUTING.md и CLAUDE.md в идеальном состоянии для новых контрибьюторов

**Independent Test**: Симулировать путь контрибьютора: CONTRIBUTING → good first issues → PR процесс → окружение. Все шаги выполнимы без дополнительных вопросов.

### Implementation for User Story 4

- [x] T029 [P] [US4] Audit CONTRIBUTING.md: verify Mermaid workflow diagram renders, update issue/PR links
- [x] T030 [P] [US4] Verify CLAUDE.md covers all critical rules: import wrappers, no direct supabase, no arbitrary px, console restrictions, lazy loading tiers
- [x] T031 [US4] Add link to Good First Issues in CONTRIBUTING.md (point to GitHub issues with label «🔖 GOOD FIRST ISSUE»)
- [x] T032 [US4] Add environment setup verification checklist in CONTRIBUTING.md

**Checkpoint**: Контрибьютор готов внести первый PR

---

## Phase 7: User Story 5 — Документация поддерживается в актуальном состоянии (Priority: P3)

**Goal**: MAINTENANCE.md полностью переработан. KNOWLEDGE_BASE.md удалён. Нет устаревших ссылок.

**Independent Test**: MAINTENANCE.md не содержит ссылок на несуществующие файлы. KNOWLEDGE_BASE.md удалён. Все даты обновления свежие.

### Implementation for User Story 5

- [x] T033 [P] [US5] Redistribute unique content from KNOWLEDGE_BASE.md per decomposition map (T004):
  - Перенести историю спринтов 001-032 → ROADMAP.md
  - Перенести обзор проекта → README.md (merge with T011)
  - Удалить дубликаты (80%+ уже в других файлах)
- [x] T034 [US5] Delete KNOWLEDGE_BASE.md (after T033 verified)
- [x] T035 [US5] Complete MAINTENANCE.md overhaul:
  - Удалить ссылки на несуществующие файлы (NAVIGATION.md, SPRINT_STATUS.md, RECENT_IMPROVEMENTS.md)
  - Добавить чек-лист обновления документации после каждого спринта
  - Добавить секцию «Как добавить/обновить скриншот»
  - Добавить секцию «Как добавить новый .md файл» (шаблон футера)
  - Обновить дату: 2026-06-29
- [x] T036 [US5] Update all .md file update dates to current date (where content was changed)

**Checkpoint**: Документация самоподдерживаема — есть чек-лист, нет битых ссылок, нет устаревшей информации

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and quality assurance

- [x] T037 [P] Run full link validation: check every relative link in every root .md file → fix broken ones
- [x] T038 [P] Verify Mermaid diagrams render correctly in GitHub (open each .md with diagrams in browser)
- [x] T039 [P] Verify shields.io badges render with correct data (build status, stars, version)
- [x] T040 [P] Verify screenshot images are ≤ 500KB each and display correctly in README
- [x] T041 Run «5-минутный тест разработчика»: дать новому человеку ссылку на репозиторий и проверить онбординг
- [x] T042 Run «3-минутный тест инвестора»: аналогично для инвестора
- [x] T043 Final commit: update CHANGELOG.md with release notes for sprint 035

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T004 needs existing files audited; T009 needs CLAUDE.md context)
- **US1 (Phase 3)**: Depends on Foundational — T013 needs ROADMAP.md from T007, T015 needs screenshots from T003
- **US2 (Phase 4)**: Depends on Foundational — can run parallel with US1 (different files)
- **US3 (Phase 5)**: Depends on US1 (builds on README from Phase 3)
- **US4 (Phase 6)**: Depends on Foundational — can run parallel with US3 (different files)
- **US5 (Phase 7)**: Depends on US1, US2 (READMЕ and DOC_INDEX must be stable before cleanup)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1) — Инвестор**: Can start after Foundational. No dependencies on other stories.
- **US2 (P1) — Разработчик**: Can start after Foundational. Independent of US1 (different files: DOC_INDEX vs README).
- **US3 (P2) — Клиент**: Builds on US1's README. Wait for US1 to complete.
- **US4 (P2) — Контрибьютор**: Independent of US3 (different files: CONTRIBUTING vs README). Can start after Foundational.
- **US5 (P3) — Актуализация**: Depends on US1 + US2 being complete (must not delete KNOWLEDGE_BASE before README absorbs needed content).

### Within Each User Story

- Tasks marked [P] can run in parallel
- Core content before integration
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T002 + T003 can run in parallel (script + screenshots)
- **Phase 2**: T005, T006, T007, T008 all [P] — 4 files, 4 parallel tasks
- **Phase 3 (US1)**: T010, T011, T012 all [P] — 3 README sections can be written in parallel
- **Phase 4 (US2)**: T019, T020, T021 all [P] — 3 different files
- **Phase 5 (US3)**: T024, T025 all [P] — 2 README sections in parallel
- **Phase 6 (US4)**: T029, T030 all [P] — 2 different files
- **Phase 7 (US5)**: T033 [P] — content redistribution
- **US1 + US2**: Can be developed in parallel after Foundational (different files, no conflicts)

---

## Parallel Example: P1 Stories (Phases 3-4)

With 2 developers after Foundational phase completes:

```bash
# Developer A: Инвестор (US1)
Task: "Write README Hero section in README.md" (T010)
Task: "Write «Что такое MusicVerse AI» section in README.md" (T011)
Task: "Write «Для инвесторов» section in README.md" (T012)

# Developer B: Разработчик (US2)
Task: "Write role-based navigation in DOCUMENTATION_INDEX.md" (T019)
Task: "Write Document Catalog in DOCUMENTATION_INDEX.md" (T020)
Task: "Update ARCHITECTURE_HUB.md" (T021)
```

---

## Implementation Strategy

### MVP First (US1 Only — New README)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T009)
3. Complete Phase 3: US1 Инвестор (T010-T018)
4. **STOP and VALIDATE**: 3-минутный тест инвестора
5. Deploy to main if ready

**MVP Deliverable**: Новый README.md — готов для инвесторов, скриншоты, прогресс, контакты

### Incremental Delivery

1. Setup + Foundational → База готова
2. US1 (P1) → Новый README → **MVP!**
3. US2 (P1) → Ролевая навигация + футеры → Deploy
4. US3 (P2) → Скриншоты + функции → Deploy
5. US4 (P2) → Contributing → Deploy
6. US5 (P3) → Очистка + Maintenance → Deploy
7. Polish → Финальная валидация → Deploy

### Solo Developer Strategy

1. Phase 1+2: Setup + Foundational (1 session)
2. Phase 3: US1 README (1 session)
3. Phase 4: US2 Navigation (1 session)
4. Phase 5+6: US3+US4 Polish (1 session)
5. Phase 7: US5 Cleanup (1 session)
6. Phase 8: Validation (1 session)

---

## Summary

**Total Tasks**: 43 tasks
- **Setup (Phase 1)**: 3 tasks
- **Foundational (Phase 2)**: 6 tasks
- **US1 Инвестор (Phase 3)**: 9 tasks
- **US2 Разработчик (Phase 4)**: 5 tasks
- **US3 Клиент (Phase 5)**: 5 tasks
- **US4 Контрибьютор (Phase 6)**: 4 tasks
- **US5 Актуализация (Phase 7)**: 4 tasks
- **Polish (Phase 8)**: 7 tasks

**Parallel Opportunities**: 15 tasks marked [P] — можно выполнять параллельно

**Estimated Effort**: 5-6 sessions (по 1 фазе за сессию)

**Suggested MVP Scope**: US1 only (Phase 3) — новый README.md для инвесторов. 9 tasks after foundational = 12 tasks total.


