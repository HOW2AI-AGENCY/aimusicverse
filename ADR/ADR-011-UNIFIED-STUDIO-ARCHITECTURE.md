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

## Decision

Объединить функционал в **StudioShell** итеративно, создав единый DAW-подобный интерфейс:

### 1. Архитектура унификации

```
StudioShell (главный контейнер)
├── Переиспользуемые компоненты из stem-studio:
│   ├── QuickCompare (A/B сравнение версий)
│   ├── RemixDialog, ExtendDialog, TrimDialog
│   ├── MixPresetsMenu
│   ├── ReplacementProgressIndicator
│   └── DAWMixerPanel (визуализация эффектов)
├── DAW функции из MultiTrackStudioLayout:
│   ├── DAWTrackLane (drag-drop клипов)
│   ├── TimelineRuler (BPM grid)
│   └── Playhead с drag
└── Новые компоненты:
    ├── MobileDAWTimeline (pinch-zoom, tap-seek)
    ├── AIActionsFAB (floating AI actions)
    └── useUnifiedStudio hook
```

### 2. Фазы реализации

| Фаза | Описание | Время |
|------|----------|-------|
| 1 | Интеграция компонентов из StemStudio | 4ч |
| 2 | DAW Timeline Enhancement | 6ч |
| 3 | Mobile DAW Mode | 6ч |
| 4 | Unified Effects & Mixer | 3ч |
| 5 | State Consolidation | 3ч |

### 3. Компоненты для переиспользования

#### Из stem-studio (готовые, не модифицировать):
- `QuickCompare.tsx` — A/B/C сравнение секций
- `RemixDialog.tsx` — диалог ремикса
- `ExtendDialog.tsx` — диалог расширения
- `TrimDialog.tsx` — обрезка треков
- `MixPresetsMenu.tsx` — пресеты микса
- `ReplacementProgressIndicator.tsx` — прогресс замены
- `DAWMixerPanel.tsx` — панель микшера с визуализацией

#### Из MultiTrackStudioLayout (адаптировать):
- `MultiTrackTimeline` → `DAWTrackLane`
- Drag-drop логика для клипов

### 4. Новые компоненты

```typescript
// src/hooks/studio/useUnifiedStudio.ts
export function useUnifiedStudio(options: {
  mode: 'track' | 'project';
  id: string;
}) {
  return {
    // Project/Track data
    project, tracks,
    // Playback
    isPlaying, play, pause, seek, currentTime, duration,
    // Track controls
    toggleMute, toggleSolo, setVolume, setPan,
    // AI Actions
    separateStems, replaceSection, addVocals, extend, cover,
    // Effects
    trackEffects, setTrackEffects,
    // History
    canUndo, canRedo, undo, redo,
    // Export
    exportMix, downloadStems,
  };
}
```

### 5. Mobile Layout

```
┌─────────────────────────────────┐
│ Header: Name | AI | Menu        │
├─────────────────────────────────┤
│ Mini Track Overview (collapsed) │
├─────────────────────────────────┤
│ Expandable Timeline             │
│ ┌─────────────────────────────┐ │
│ │ 🎤 Vocals     [M][S] ▬▬▬▬▬ │ │
│ │ 🎸 Instr.     [M][S] ▬▬▬▬▬ │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ AI Quick Actions (FAB menu)     │
│ [✨ Generate] [🔀 Extend] [🎤] │
├─────────────────────────────────┤
│ Transport: ◄◄ | ▶ | ■ | ►► | Vol│
└─────────────────────────────────┘
```

## Consequences

### Positive
- ✅ Единый интерфейс для всех режимов работы
- ✅ Сохранение обратной совместимости
- ✅ Переиспользование проверенного кода
- ✅ Улучшенный мобильный UX
- ✅ Сокращение дублирования на 40%

### Negative
- ⚠️ Временное увеличение сложности (2 системы параллельно)
- ⚠️ Требуется тестирование всех путей
- ⚠️ Постепенная миграция пользователей

### Neutral
- Существующие роуты продолжают работать
- Legacy компоненты остаются как fallback

## Implementation Plan

### Файлы для создания

| Файл | Описание |
|------|----------|
| `src/components/studio/unified/DAWTrackLane.tsx` | Drag-drop lane |
| `src/components/studio/unified/TimelineRuler.tsx` | BPM grid ruler |
| `src/components/studio/unified/MobileDAWTimeline.tsx` | Mobile timeline |
| `src/components/studio/unified/AIActionsFAB.tsx` | AI actions FAB |
| `src/hooks/studio/useUnifiedStudio.ts` | Unified hook |

### Файлы для обновления

| Файл | Изменение |
|------|-----------|
| `StudioShell.tsx` | Добавить QuickCompare, TrimDialog, Progress |
| `MobileStudioLayout.tsx` | Интегрировать MobileDAWTimeline |
| `StemEffectsDrawer.tsx` | Улучшить визуализацию |

### Файлы БЕЗ изменений (переиспользуем)

- Все компоненты в `src/components/stem-studio/`
- `src/stores/useStudioProjectStore.ts` (совместимость)
- `src/components/studio/MultiTrackStudioLayout.tsx` (reference)

## Related Documents

- [SPRINT-030-UNIFIED-STUDIO-MOBILE.md](../SPRINTS/SPRINT-030-UNIFIED-STUDIO-MOBILE.md)
- [STEM_STUDIO.md](../docs/STEM_STUDIO.md)
- [KNOWLEDGE_BASE.md](../KNOWLEDGE_BASE.md)

---

**Author:** Lovable AI  
**Date:** 2026-01-04  
**Reviewers:** —
