# ADR-011: Unified Studio Architecture - DAW Canvas Integration

## Status
**Accepted** (January 4, 2026)

## Context

MusicVerse AI имеет 3 параллельные студийные реализации с частично дублирующимся функционалом:

1. **StudioShell** (`src/components/studio/unified/`) — основной интерфейс, работает ✅
2. **StemStudioContent** (`src/components/stem-studio/`) — legacy студия с богатым функционалом
3. **MultiTrackStudioLayout** (`src/components/studio/MultiTrackStudioLayout.tsx`) — DAW-стиль с drag-drop

### Проблемы текущей архитектуры

- Дублирование кода между студиями (~40%)
- Разные UX паттерны в разных местах
- Сложность поддержки трёх параллельных реализаций
- Неоптимальный мобильный опыт с табами

### Требования

- **Без деструктивных изменений** — не удалять рабочий код
- **Итеративный подход** — добавлять функции постепенно
- **Переиспользование** — брать готовые компоненты из существующих студий
- **Mobile-first** — оптимизация для мобильных устройств
- **БЕЗ ТАБОВ** — единый DAW-подобный интерфейс в одном окне (все функции видны сразу)

## Decision

Создать **UnifiedDAWLayout** - единый DAW-подобный интерфейс БЕЗ табов:

### 1. Архитектура унификации

```
UnifiedDAWLayout (единый интерфейс без табов)
├── Header: Project name + actions (Save, Mixer, Export)
├── Timeline Ruler (DAWTimeline from stem-studio)
├── Track Lanes (vertically stacked, scrollable)
│   └── DAWTrackLane для каждого трека с waveform
├── Transport Controls (Play/Pause, Skip, Master Volume)
├── Floating AI Actions Button (AIActionsFAB)
└── Collapsible Mixer Panel (slide from right)
    ├── Master Volume control
    └── Per-track controls (Mute, Solo, Volume, Pan)

❌ НЕТ табов - все в одном окне
✅ Вертикальная прокрутка треков
✅ Все функции видны сразу
✅ Timeline всегда на экране
✅ Transport controls всегда доступны
```

### 2. Фазы реализации

| Фаза | Описание | Время | Статус |
|------|----------|-------|--------|
| 1 | Создание UnifiedDAWLayout (без табов) | 4ч | ✅ DONE |
| 2 | Интеграция с UnifiedStudioMobile | 2ч | ✅ DONE |
| 3 | Переиспользование компонентов (DAWTimeline, DAWTrackLane) | 2ч | ✅ DONE |
| 4 | Добавление AI Actions FAB | 1ч | ⏳ In Progress |
| 5 | Mixer Panel с эффектами | 2ч | ⏳ Pending |
| 6 | Тестирование и оптимизация | 3ч | ⏳ Pending |

### 3. Реализованные компоненты

#### ✅ UnifiedDAWLayout (НОВЫЙ - основной компонент)
Единый DAW-подобный интерфейс БЕЗ табов:
- Timeline ruler вверху (реиспользует DAWTimeline)
- Track lanes в центре (вертикальная прокрутка)
- Transport controls внизу
- Floating AI Actions Button (FAB)
- Collapsible Mixer Panel (справа)
- Все функции в одном окне - НЕТ навигации по табам

#### Переиспользованные компоненты из stem-studio:
- `DAWTimeline.tsx` — Timeline ruler с временными метками
- `DAWTrackLane.tsx` — Track lane с waveform и контролами
- `DAWMixerPanel.tsx` (будет интегрирован) — панель микшера с визуализацией

#### ❌ Deprecated (больше не используются):
- `MobileStudioLayout.tsx` — старый tab-based интерфейс
- `MobileStudioTabs.tsx` — tab navigation компонент
- Tab content компоненты (Player, Tracks, Sections, Mixer, Actions)

Эти компоненты помечены как deprecated и будут удалены после полного тестирования.

### 4. Структура интерфейса (Реализованная)

```
┌─────────────────────────────────────────────┐
│ Header: Project Name | Save | Mixer | Export│
├─────────────────────────────────────────────┤
│ ⏱️ Timeline Ruler (0:00 ─── playhead ─── 3:45)│
├─────────────────────────────────────────────┤
│ 🎤 Track 1: Vocals     [M][S] ▬▬▬▬▬ volume│
│    ╭───────── waveform ─────────────────╮  │
├─────────────────────────────────────────────┤
│ 🎸 Track 2: Guitar     [M][S] ▬▬▬▬▬ volume│
│    ╭───────── waveform ─────────────────╮  │
├─────────────────────────────────────────────┤
│ 🥁 Track 3: Drums      [M][S] ▬▬▬▬▬ volume│
│    ╭───────── waveform ─────────────────╮  │
├─────────────────────────────────────────────┤
│                   ⬆ scroll ⬆               │
├─────────────────────────────────────────────┤
│ Transport: 0:23/3:45  ◄◄ | ▶ | ►► | Vol    │
└─────────────────────────────────────────────┘
         ┌──────────┐
         │ ✨ AI    │  ← Floating Action Button
         └──────────┘
```

**Ключевые особенности:**
- ❌ НЕТ ТАБОВ - все в одном окне
- ✅ Timeline всегда видим вверху
- ✅ Треки прокручиваются вертикально
- ✅ Transport controls всегда внизу
- ✅ Mixer открывается как panel справа
- ✅ AI actions доступны через FAB

## Consequences

### Positive
- ✅ Единый интерфейс для всех режимов работы БЕЗ табов
- ✅ Сохранение обратной совместимости (legacy компоненты остались)
- ✅ Переиспользование проверенного кода (DAWTimeline, DAWTrackLane)
- ✅ Улучшенный мобильный UX - все видно сразу
- ✅ Сокращение сложности - нет переключения между табами
- ✅ Соответствует требованиям ADR-011 и SPRINT-030

### Negative
- ⚠️ Временное увеличение кодовой базы (legacy компоненты остались)
- ⚠️ Требуется тестирование всех сценариев
- ⚠️ Для маленьких экранов может быть много прокрутки

### Neutral
- Существующие роуты продолжают работать
- Legacy компоненты остаются как fallback
- Постепенная миграция без breaking changes

## Implementation Plan

### ✅ Файлы созданные

| Файл | Описание | Статус |
|------|----------|--------|
| `src/components/studio/unified/UnifiedDAWLayout.tsx` | Единый DAW интерфейс БЕЗ табов | ✅ DONE |

### ✅ Файлы обновленные

| Файл | Изменение | Статус |
|------|-----------|--------|
| `UnifiedStudioMobile.tsx` | Использует UnifiedDAWLayout вместо MobileStudioLayout | ✅ DONE |
| `index.ts` | Экспорты обновлены, legacy помечены | ✅ DONE |

### ⏳ Файлы для будущих улучшений

| Файл | Задача |
|------|--------|
| `AIActionsFAB.tsx` | Интеграция с реальными AI функциями |
| `UnifiedDAWLayout.tsx` | Добавить pinch-zoom на timeline |
| `UnifiedDAWLayout.tsx` | Интегрировать DAWMixerPanel для эффектов |

### ❌ Файлы НЕ изменяются (переиспользуем)

- Все компоненты в `src/components/stem-studio/` (DAWTimeline, DAWTrackLane, DAWMixerPanel)
- `src/stores/useStudioProjectStore.ts` (совместимость)
- `src/hooks/studio/useUnifiedStudio.ts` (уже существует)

## Related Documents

- [SPRINT-030-UNIFIED-STUDIO-MOBILE.md](../SPRINTS/SPRINT-030-UNIFIED-STUDIO-MOBILE.md)
- [STEM_STUDIO.md](../docs/STEM_STUDIO.md)
- [KNOWLEDGE_BASE.md](../KNOWLEDGE_BASE.md)

---

**Author:** Lovable AI + GitHub Copilot
**Date:** 2026-01-04  
**Status:** Implemented (Phase 1-3 Complete)
**Last Updated:** 2026-01-04 (Unified DAW Layout created)
**Reviewers:** —
