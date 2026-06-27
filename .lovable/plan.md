# Repository Documentation Audit & Redesign

## Goal
Полностью переработать оформление root-документации (README + ключевые `.md` файлы) и навигацию между ними: единый визуальный стиль, продвинутые компоненты GitHub-markdown (collapsible sections, alerts, mermaid-диаграммы, бейджи shields.io, таблицы возможностей), консистентная навигация, удаление дублей.

## Scope

**Audit (read-only, через sub-agents параллельно):**
1. Root `.md` (18 файлов: README, README_RU, CLAUDE, KNOWLEDGE_BASE, REPOSITORY_STRUCTURE, DOCUMENTATION_INDEX, ARCHITECTURE_HUB, ROADMAP, CHANGELOG, CONTRIBUTING, SECURITY, MAINTENANCE, SUMMARY, REPOSITORY_IMPROVEMENTS_SUMMARY, PROJECT_STATUS, KNOWN_ISSUES_TRACKED, AGENTS, CODE_OF_CONDUCT).
2. `docs/` (80+ файлов) — найти дубли (ARCHITECTURE vs ARCHITECTURE_ANALYSIS vs COMPREHENSIVE_ARCHITECTURE vs ARCHITECTURE_DIAGRAMS; NAVIGATION vs NAVIGATION_GUIDE; KNOWN_ISSUES vs root-версия; INDEX vs DOCUMENTATION_INDEX), битые ссылки, устаревшие даты.
3. Проверить, что бейджи/badges актуальны (версии React 19.2, TS 5.9 и т.д.), ссылки рабочие.

**Findings deliverable:** `docs/_audit/REPO_DOCS_AUDIT_2026-06-27.md` — список дублей, битых ссылок, рекомендаций к слиянию/архивированию.

## Redesign deliverables

### 1. New visual system for docs
Единый header-блок для топ-документов:
- Hero с центрированным логотипом, проектным tagline.
- Badge-стек (build, version, license, coverage, bundle size, telegram, docs, contributors) — shields.io с консистентной цветовой палитрой (стиль `for-the-badge`).
- Навигационная панель-чипы со ссылками на основные разделы.
- Footer-блок «Related docs» по шаблону `docs/templates/HEADER_TEMPLATE.md`.

### 2. README.md (root) — полная переработка
- Hero: логотип + tagline + badges (≥10) + nav chips.
- GitHub Alerts (`> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`) для статуса и quick-start.
- Mermaid-диаграмма архитектуры (frontend → API → services → Supabase).
- Feature matrix-таблица с emoji-иконками и статусами (✅/🚧/📋).
- Collapsible `<details>` секции: Quick Start, Tech Stack, Project Structure, Scripts, Testing, Deployment, FAQ.
- Скриншоты в `<table>` галерее (placeholder если нет).
- Star-history бейдж, contributors-grid.
- Footer с links на CONTRIBUTING/SECURITY/CODE_OF_CONDUCT/CHANGELOG.

### 3. README_RU.md
Симметричная RU-версия с тем же оформлением.

### 4. DOCUMENTATION_INDEX.md
Полная переработка как навигационного хаба:
- Категории (Getting Started / Architecture / Features / API / Guides / Operations / Archive) — таблицы со статусом и кратким описанием.
- Mermaid-карта документации (зависимости между документами).
- Поисковые подсказки и onboarding-пути для разных ролей (Frontend Dev / Backend Dev / Designer / PM / DevOps).

### 5. REPOSITORY_STRUCTURE.md
- Mermaid tree для верхнего уровня + collapsible деревья для `src/`, `supabase/`, `docs/`.
- Таблицы «директория → назначение → ключевые файлы».

### 6. CONTRIBUTING.md / SECURITY.md / CODE_OF_CONDUCT.md / CHANGELOG.md
- Унифицированные header/footer, alerts, badge-блоки.
- CHANGELOG — Keep a Changelog 1.1 + бейджи релизов.

### 7. ROADMAP.md & PROJECT_STATUS.md
- Progress-bars (shields.io) по эпикам, Gantt-mermaid, статус-таблицы.

### 8. Архивация / слияние
- Перенести в `docs/archive/2026-06-27/`: `SUMMARY.md`, `REPOSITORY_IMPROVEMENTS_SUMMARY.md`, дубли в `docs/` (ARCHITECTURE_ANALYSIS, COMPREHENSIVE_ARCHITECTURE, NAVIGATION_GUIDE) — оставив единственный canonical документ со ссылками на архив.
- Объединить root `KNOWN_ISSUES_TRACKED.md` + `docs/KNOWN_ISSUES.md` в один.

### 9. Templates
- Обновить `docs/templates/HEADER_TEMPLATE.md` и добавить `FOOTER_TEMPLATE.md`, `BADGES_TEMPLATE.md` как single-source-of-truth.

## Process (iterative с self-reflection)

1. **Pass 1 — Audit.** Параллельно 3 sub-agent'а: (a) root markdown, (b) `docs/`, (c) ссылки/бейджи/даты. Сводный отчёт.
2. **Pass 2 — Design system.** Утвердить визуальный язык (badge palette, header/footer-шаблоны, alert-конвенции, mermaid theme).
3. **Pass 3 — Rewrite.** Применить к топ-документам параллельными правками.
4. **Pass 4 — Self-reflection.** Sub-agent перечитывает результаты, проверяет: согласованность tone-of-voice (RU/EN), валидность mermaid, рабочие ссылки (link-check), отсутствие дублей.
5. **Pass 5 — Fixes & finalize.** Точечные правки по итогам ревью.

## Technical notes
- Все ссылки относительные, проверяются `scripts/check-links.js`.
- Бейджи только через `shields.io` (style=for-the-badge, единая палитра: primary `#26A5E4`, success `#10B981`, warning `#F59E0B`, danger `#EF4444`, neutral `#475569`).
- Mermaid — встроенный GitHub renderer, theme=`dark` совместимый.
- НЕ трогаем код приложения, только `.md` и шаблоны в `docs/templates/`.

## Out of scope
- Изменения логики приложения, тестов, CI.
- Перевод страниц `docs/` файлов (только root README имеет RU-версию).
- Создание новых скриншотов/видео (используем placeholder).

## Outputs (files changed)
- Rewritten: `README.md`, `README_RU.md`, `DOCUMENTATION_INDEX.md`, `REPOSITORY_STRUCTURE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, `ROADMAP.md`, `PROJECT_STATUS.md`, `ARCHITECTURE_HUB.md`, `KNOWN_ISSUES_TRACKED.md`.
- New: `docs/_audit/REPO_DOCS_AUDIT_2026-06-27.md`, `docs/templates/FOOTER_TEMPLATE.md`, `docs/templates/BADGES_TEMPLATE.md`.
- Archived (moved): `SUMMARY.md`, `REPOSITORY_IMPROVEMENTS_SUMMARY.md`, дубли из `docs/` → `docs/archive/2026-06-27/`.
