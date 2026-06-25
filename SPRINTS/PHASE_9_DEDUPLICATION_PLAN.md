# Phase 9: Deduplication & Refactoring Plan

**Дата:** 2026-06-25
**Статус:** Запланирован
**Предыдущая фаза:** Phase 8 — Удалено 196 мёртвых файлов, 45K строк ([PR #283](https://github.com/HOW2AI-AGENCY/aimusicverse/pull/283))

---

## Контекст

После удаления мёртвого кода в Phase 8, кодовая база сократилась с 426K до 381K строк (1,788 файлов). Остаются системные проблемы:

- **30+ дубликатов** — компоненты с одинаковыми именами/функциями в разных директориях
- **50+ файлов-гигантов** — файлы >500 строк, нарушающие конвенцию проекта
- **Хаос lyrics** — 30+ lyrics-компонентов разбросаны по 6 директориям
- **Плоская ui/** — 90+ файлов без группировки

---

## Sprint 9A: Объединение дубликатов компонентов

**Effort:** 2-3 дня | **Risk:** Средний (затрагивает импорты)

### 9A.1 — Простые дубликаты (одинаковая функциональность)

| Каноничный | Дубликат(ы) для удаления | Строк экономии |
|-----------|--------------------------|---------------|
| `components/ui/EmptyState.tsx` (239) | `components/common/EmptyState.tsx` (248) | ~248 |
| `components/mobile/MobileBottomSheet.tsx` (166) | `components/ui/BottomSheet.tsx` (162) | ~162 |
| `components/admin/analytics/DeeplinkAnalyticsPanel.tsx` (206) | `components/admin/DeeplinkAnalyticsPanel.tsx` (375) | ~375 |
| `components/admin/analytics/GenerationStatsPanel.tsx` (233) | `components/admin/GenerationStatsPanel.tsx` (455) | ~455 |
| `components/performance/PerformanceDashboard.tsx` (200) | `components/admin/PerformanceDashboard.tsx` (365) | ~365 |

**Действия:**
1. Определить каноничный компонент (оставить более компактный/актуальный)
2. Обновить все импорты на каноничный путь
3. Удалить дубликат
4. Проверить `tsc --noEmit`

### 9A.2 — Компоненты-вариации (нужно объединить API)

| Каноничный | Вариации | Стратегия |
|-----------|----------|-----------|
| `shared/UnifiedVersionSelector.tsx` (405) | `studio/unified/StudioVersionSelector.tsx` (83), `track-detail/HeaderVersionSelector.tsx` (185) | Один компонент с пропсами `variant: 'studio' \| 'header' \| 'default'` |
| `studio/unified/StudioShell/AddTrackDialog.tsx` (106) | `project/AddTrackDialog.tsx` (99), `studio/AddTrackDialog.tsx` (137) | Один с пропсом `context: 'studio' \| 'project'` |
| `studio/actions/StudioActionsPanel.tsx` (361) | `studio/panels/StudioActionsPanel.tsx` (438), `track-actions/sections/StudioActions.tsx` (223) | Ревью → выбрать каноничный |
| `studio/NotesViewerDialog.tsx` (666) | Оставить как есть (отличается от NotationDrawer) | — |

### 9A.3 — Lyrics-компоненты с одинаковыми именами

| Каноничный | Дубликат |
|-----------|----------|
| `components/studio/unified/LyricsPanel.tsx` (647) | `components/player/LyricsPanel.tsx` (383) — разная функция, переименовать в `PlayerLyricsPanel` |
| `components/studio/unified/SectionNotesPanel.tsx` (954) | `components/lyrics-workspace/SectionNotesPanel.tsx` (611) — ревью и объединить |

**Ожидаемая экономия Sprint 9A:** ~2,000-3,000 строк

---

## Sprint 9B: Разбиение файлов-гигантов

**Effort:** 3-4 дня | **Risk:** Средний

### Топ-10 файлов для рефакторинга

| Файл | Строк | Стратегия разбиения |
|------|-------|---------------------|
| `studio/unified/StudioShell.tsx` | 1,852 | → StudioShellLayout, StudioShellToolbar, StudioShellPanels, StudioShellDialogs, useStudioShellState |
| `studio/unified/UnifiedStudioContent.tsx` | 1,477 | → ContentHeader, ContentPanels, ContentTimeline, ContentActions, useContentState |
| `services/lyrics.service.ts` | 1,079 | → lyrics-parser.service, lyrics-validator.service, lyrics-transform.service |
| `pages/LyricsStudio.tsx` | 1,073 | → LyricsStudioLayout, LyricsStudioPanels, LyricsStudioToolbar |
| `player/MobileFullscreenPlayer.tsx` | 1,052 | → PlayerControls, PlayerQueue, PlayerLyrics, PlayerWaveform |
| `hooks/usePromptDJEnhanced.ts` | 1,009 | → usePromptDJCore, usePromptDJEffects, usePromptDJState |
| `hooks/generation/useGenerateForm.ts` | 995 | → useGenerateFormState, useGenerateFormValidation, useGenerateFormSubmit |
| `studio/unified/SectionNotesPanel.tsx` | 954 | → SectionNotesList, SectionNoteEditor, SectionNoteAI |
| `GlobalAudioProvider.tsx` | 937 | → useAudioEngine, useAudioQueue, useAudioState |
| `generate-form/lyrics-chat/useLyricsChat.ts` | 894 | → useLyricsChatState, useLyricsChatActions, useLyricsChatAI |

**Правило:** Ни один файл >500 строк после рефакторинга.

---

## Sprint 9C: Консолидация Lyrics-экосистемы

**Effort:** 2-3 дня | **Risk:** Высокий (затрагивает много компонентов)

### Текущее состояние: 30+ файлов в 6 директориях

```
components/lyrics/                  — 5 файлов (viewer, display)
components/lyrics-workspace/        — 12 файлов (editor, AI agent)
components/generate-form/           — 6 lyrics-файлов (assistant, wizard, chat)
components/studio/unified/          — 4 Lyrics* файла (studio-specific)
components/stem-studio/             — 2 StudioLyrics* файла
components/player/                  — 1 LyricsPanel (player lyrics)
```

### Целевая структура

```
components/lyrics/
├── display/                    — StructuredLyricsDisplay, OptimizedLyricsLine, UnifiedLyricsView
├── editor/                     — MobileLyricsEditor, InlineLyricsEditor, LyricsVisualEditor
├── workspace/                  — LyricsWorkspace, LyricsVersionsPanel, LyricsVersionDiff
├── ai/                         — LyricsAIChatAgent, LyricsChatAssistant, AIAgentPanel
├── player/                     — PlayerLyricsPanel (бывший player/LyricsPanel)
├── studio/                     — StudioLyricsPanel, StudioLyricsPanelCompact
└── common/                     — LyricsHistoryBar, LyricsValidationAlert, LyricsPresetsRow
```

**Действия:**
1. Создать поддиректории
2. Переместить файлы
3. Обновить все импорты
4. Проверить `tsc --noEmit`
5. Обновить index.ts реэкспорты

---

## Sprint 9D: Реорганизация components/ui/

**Effort:** 1-2 дня | **Risk:** Низкий

### Текущее состояние: 90+ файлов в плоской структуре

### Целевая структура

```
components/ui/
├── forms/                — button, input, select, checkbox, radio, switch, slider, textarea, label, form
├── layout/               — card, separator, tabs, accordion, collapsible, sidebar, resizable
├── feedback/             — alert, badge, toast, toaster, sonner, tooltip, progress, skeleton
├── overlay/              — dialog, drawer, sheet, popover, dropdown-menu, alert-dialog, command
├── data/                 — table, scroll-area, carousel, avatar, calendar
├── typography/           — typography
└── (корень)              — Реэкспорт index.ts
```

---

## Sprint 9E: Финальная верификация

**Effort:** 1 день

- [ ] `tsc --noEmit` — 0 ошибок
- [ ] `npm run build` — успешный билд
- [ ] `npm run size` — проверка размера бандла
- [ ] `npm test` — все тесты проходят
- [ ] Ручное тестирование: Studio, Player, Generation, Library
- [ ] Обновление CLAUDE.md (новые пути, количество компонентов)

---

## Суммарные ожидания

| Спринт | Экономия строк | Файлов затронуто | Сложность |
|--------|---------------|------------------|-----------|
| 9A: Дедупликация | ~3,000 | ~30 | Средняя |
| 9B: Разбиение гигантов | ~0 (рефакторинг) | ~50 | Высокая |
| 9C: Lyrics консолидация | ~500 | ~30 | Высокая |
| 9D: UI реорганизация | ~0 (структура) | ~90 | Низкая |
| 9E: Верификация | — | — | Низкая |

**Итого:** ~3,500 строк экономии + значительное улучшение maintainability

---

## Приоритет выполнения

```
9A (дедупликация) → 9B (разбиение) → 9C (lyrics) → 9D (ui/) → 9E (верификация)
```

Каждый спринт — отдельный PR для безопасного review.
