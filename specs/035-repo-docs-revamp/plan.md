# Implementation Plan: Редизайн документации репозитория

**Branch**: `035-repo-docs-revamp` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/035-repo-docs-revamp/spec.md`

## Summary

Полный редизайн документации GitHub-репозитория MusicVerse AI. Цель — превратить репозиторий в профессиональную витрину для инвесторов, клиентов и разработчиков. Ключевые изменения: обновление README с прогрессом и скриншотами, ролевая навигация в DOCUMENTATION_INDEX, разделение KNOWLEDGE_BASE.md, актуализация MAINTENANCE.md, единый стиль футеров во всех .md файлах. Это чисто документационная фича — без изменений кода.

## Technical Context

**Language/Version**: Markdown, GitHub Flavored Markdown, Mermaid diagrams
**Primary Dependencies**: GitHub shields.io badges, Mermaid.js (родной рендеринг GitHub)
**Storage**: N/A (документация — файлы .md в репозитории)
**Testing**: Ручная валидация: проверка ссылок (`check-md-links`), визуальный просмотр в GitHub
**Target Platform**: GitHub.com (веб-интерфейс репозитория)
**Project Type**: Documentation (no code changes)
**Performance Goals**: Загрузка README < 2 секунд (ограничение на размер изображений: скриншоты ≤ 500KB каждый, WebP формат)
**Constraints**: Скриншоты должны быть в WebP для минимизации размера. Все ссылки должны быть рабочими. Максимум 5 Mermaid-диаграмм в одном .md файле (ограничение GitHub).
**Scale/Scope**: ~20 корневых .md файлов, ~100 документов в docs/, 4-6 скриншотов, 3-5 Mermaid-диаграмм

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Принцип | Статус | Комментарий |
|----------|:------:|-------------|
| §4.1 Spec-First Development | ✅ | Спецификация создана через `/speckit.specify` |
| §4.2 Код (стиль, коммиты, ветвление) | ✅ | Conventional Commits для документации: `docs:` |
| §4.3 Архитектура | N/A | Не применимо — документация, не код |
| §4.4 State Management | N/A | Не применимо |
| §4.5 Performance Budget | N/A | Не применимо к документации. Но: скриншоты ≤500KB |
| §4.6 Тестирование | N/A | Валидация ссылок ручная, не автоматическая |
| §4.7 Безопасность | ✅ | Никакие секреты не затрагиваются |
| §4.8 Accessibility & UX | ✅ | Документация на русском для целевой аудитории |
| §5 Кодекс Поведения | ✅ | Соответствует |
| Документация на русском | ✅ | Все внешние документы на русском |

**GATE RESULT**: PASS — все применимые принципы соблюдены. Нарушений нет.

## Project Structure

### Documentation (this feature)

```text
specs/035-repo-docs-revamp/
├── plan.md              # Этот файл
├── research.md          # Phase 0: исследование лучших практик
├── quickstart.md        # Phase 1: гайд по обновлению документации
└── tasks.md             # Phase 2: список задач (отдельная команда)
```

### Source Code (repository root)

```text
# Только изменения документации — нет изменений в src/
# Затрагиваемые файлы (корень репозитория):
README.md                   # MODIFY: полный редизайн
README_RU.md                # DELETE: дубликат (информация перенесена)
ROADMAP.md                  # MODIFY: обновление статусов
PROJECT_STATUS.md           # MODIFY: обновление прогресса
CHANGELOG.md                # MODIFY: добавление Sprint 035
DOCUMENTATION_INDEX.md      # MODIFY: ролевая навигация
MAINTENANCE.md              # MODIFY: актуализация
KNOWLEDGE_BASE.md           # DELETE: разделён по целевым документам
CONTRIBUTING.md             # NO CHANGE (уже в хорошем состоянии)
SECURITY.md                 # NO CHANGE
CODE_OF_CONDUCT.md          # NO CHANGE
ARCHITECTURE_HUB.md         # MODIFY: обновление дат, ссылок
REPOSITORY_STRUCTURE.md     # MODIFY: обновление актуальной структуры
AGENTS.md                   # NO CHANGE
CLAUDE.md                   # MODIFY: добавление документационной секции

public/screenshots/         # NEW: скриншоты для README
public/screenshots/home.png # NEW: главный экран
public/screenshots/player.png # NEW: плеер
public/screenshots/studio.png # NEW: студия
public/screenshots/library.png # NEW: библиотека
```

**Structure Decision**: Все изменения только в .md файлах корня репозитория. Никаких изменений в `src/`. Новые скриншоты в `public/screenshots/`.

## Complexity Tracking

> Нарушений конституции нет — секция не применима.
