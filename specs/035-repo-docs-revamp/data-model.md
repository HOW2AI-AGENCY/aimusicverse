# Data Model: Редизайн документации репозитория

**Feature**: 035-repo-docs-revamp
**Date**: 2026-06-29

## Overview

Документационная фича — нет программных сущностей. Вместо этого определены структуры документов.

## Document Entities

### 1. README.md Structure

```
README.md
├── Hero Section (название, слоган, шилдсы)
├── Screenshots (4 изображения WebP)
├── What is MusicVerse AI (миссия, метрики)
├── Quick Start (5 команд)
├── Features Overview (таблица с иконками)
├── Project Progress (Mermaid Gantt + таблица спринтов)
├── Architecture Overview (Mermaid диаграмма)
├── For Investors (метрики, стадия, рост)
├── Tech Stack (таблица)
├── Project Structure (дерево)
├── Documentation Links (навигация)
├── Contacts & Links (Telegram, email, сайт)
└── Footer (лицензия, копирайт)
```

### 2. DOCUMENTATION_INDEX.md Structure

```
DOCUMENTATION_INDEX.md
├── Role Selector (5 ролей: Dev/Design/PM/Investor/Contributor)
│   ├── 👨‍💻 Я разработчик → CLAUDE.md, ARCHITECTURE_HUB.md, ...
│   ├── 🎨 Я дизайнер → design-system/, компоненты, токены
│   ├── 📊 Я инвестор → ROADMAP.md, PROJECT_STATUS.md, CHANGELOG.md
│   ├── 🎵 Я пользователь → README.md, скриншоты, ссылка на бота
│   └── 🤝 Я контрибьютор → CONTRIBUTING.md, issues, конвенции
├── Document Catalog (8 категорий)
│   ├── Getting Started
│   ├── Architecture
│   ├── Features
│   ├── Development
│   ├── Design System
│   ├── Operations
│   ├── Telegram
│   └── Project Management
└── Footer
```

### 3. Footer Template

```
Footer (единый для всех .md)
├── Navigation: [← Prev] [↑ Index] [Next →]
├── Last Updated: ДД.ММ.ГГГГ
└── Changelog Link
```

### 4. KNOWLEDGE_BASE.md Decomposition Map

| Source Section | → | Target Document |
|----------------|---|-----------------|
| Архитектурный аудит | → | Уже в PROJECT_STATUS.md — удалить |
| История спринтов 001-032 | → | ROADMAP.md (добавить сводку) |
| Обзор проекта | → | README.md |
| Техстек детали | → | CLAUDE.md (уже есть) |
| Компоненты (987) | → | ARCHITECTURE_HUB.md |
| Аудио архитектура | → | CLAUDE.md (уже есть) |
| State management | → | CLAUDE.md (уже есть) |
| Telegram интеграция | → | docs/TELEGRAM_MINI_APP/ |
| Известные проблемы | → | KNOWN_ISSUES_TRACKED.md (уже есть) |

## File Operations Summary

| Файл | Операция | Размер |
|------|----------|:------:|
| README.md | Редизайн | ~500 строк |
| README_RU.md | Удалить | -178 строк |
| ROADMAP.md | Обновление | +20 строк |
| PROJECT_STATUS.md | Обновление | +30 строк |
| CHANGELOG.md | Обновление | +10 строк |
| DOCUMENTATION_INDEX.md | Редизайн | +50 строк |
| MAINTENANCE.md | Актуализация | -100 строк |
| KNOWLEDGE_BASE.md | Удалить | -733 строки |
| ARCHITECTURE_HUB.md | Обновление | +10 строк |
| REPOSITORY_STRUCTURE.md | Обновление | +10 строк |
| CLAUDE.md | Обновление | +15 строк |
| public/screenshots/*.webp | Новые | ~1.5 MB |

**Net change**: ~550 строк добавлено, ~900 удалено (net -350 строк)
