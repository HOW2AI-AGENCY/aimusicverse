# ⚠️ Known Issues

Документация известных проблем и их обходных путей.

## Критические

### 1. Telegram Mini App Black Screen
**Статус**: ✅ Исправлено (Sprint 022)

**Симптомы**: Приложение не загружается, чёрный/белый экран.

**Причина**: Circular dependencies в Tone.js и useSyncExternalStore при tree-shaking.

**Решение**: См. [TELEGRAM_MINI_APP_FEATURES.md](./TELEGRAM_MINI_APP_FEATURES.md) и [TELEGRAM_MINI_APP_ADVANCED_FEATURES.md](./TELEGRAM_MINI_APP_ADVANCED_FEATURES.md)

---

### 2. Waveform Height Inconsistency
**Статус**: ✅ Исправлено (Sprint 023)

**Симптомы**: Waveform секция меняет высоту после загрузки данных.

**Причина**: Hardcoded height в AudioWaveform (48px) vs fallback progress bar (12-16px).

**Решение**: 
- Добавлен `height` prop в AudioWaveform
- Унифицирована высота с fallback

---

### 3. Waveform Black Color
**Статус**: ✅ Исправлено (Sprint 023)

**Симптомы**: Waveform отображается чёрным цветом без различия played/unplayed.

**Причина**: Canvas API не интерпретирует CSS переменные `hsl(var(--primary))`.

**Решение**: 
- Вычисление реальных цветов через `getComputedStyle()`
- Применение gradient для played секции
- Glow effect для progress indicator

---

### 4. Waveform Regeneration on Each Play
**Статус**: ✅ Исправлено (Sprint 023)

**Симптомы**: Waveform генерируется заново при каждом воспроизведении.

**Причина**: Локальный кэш в компоненте теряется при unmount.

**Решение**: 
- IndexedDB для persistent storage
- In-memory cache для быстрого доступа
- LRU cleanup для ограничения размера

---

## Средние

### 5. Bundle Size Optimization
**Статус**: 🔄 В процессе (Phase 6)

**Симптомы**: vendor-other bundle 184 KB, цель <150 KB.

**Текущие оптимизации (Sprint A):**
- ✅ Заменён date-fns на dayjs (`src/lib/date-utils.ts`)
- ✅ Lazy loading для recharts (`useRecharts` hook)
- ✅ DNS-prefetch/preconnect hints

**План (Phase 6):**
- [ ] Lazy loading для opensheetmusicdisplay (-20 KB)
- [ ] Dynamic import для wavesurfer.js (-25 KB)
- [ ] Tree-shaking audit для lucide-react (-5 KB)
- [ ] Service Worker implementation

---

### 6. MIDI Transcription Model Errors
**Статус**: ✅ Исправлено (Sprint 023)

**Симптомы**: Ошибка 422 "Invalid version or not permitted" при транскрипции MIDI.

**Причина**: Устаревшие версии моделей Replicate (bytedance/piano-transcription, cjwbw/omnizart).

**Решение**: 
- Переход на `spotify/basic-pitch` как основную модель
- Добавлен retry с exponential backoff
- Улучшена обработка ошибок

---

### 6. Audio Context Multiple Instances
**Статус**: ✅ Исправлено

**Симптомы**: Проблемы с аудио на iOS, ошибки AudioContext.

**Решение**: Singleton AudioContext в useAudioVisualizer

---

### 7. Realtime Subscription Memory Leak
**Статус**: ✅ Исправлено

**Симптомы**: Утечки памяти при множественных подписках на треки.

**Решение**: Batch subscription на уровне Library page через useTrackCounts

---

## Низкие

### 8. iOS Safari Audio Autoplay
**Симптомы**: Аудио не воспроизводится автоматически.

**Причина**: Safari требует user interaction для autoplay.

**Обходной путь**: Показываем play button, user должен кликнуть

---

### 9. Telegram Desktop Limited API
**Симптомы**: Некоторые TG Mini App features не работают на desktop.

**Обходной путь**: Feature detection и fallback UI

---

### 10. Long Track Names Truncation
**Симптомы**: Длинные названия обрезаются без tooltip.

**План**: Добавить tooltip при hover/long-press

---

## Отслеживание

| Issue | Priority | Status | Sprint |
|-------|----------|--------|--------|
| TG Black Screen | Critical | ✅ Fixed | 022 |
| Waveform Height | High | ✅ Fixed | 023 |
| Waveform Color | High | ✅ Fixed | 023 |
| Waveform Cache | High | ✅ Fixed | 023 |
| MIDI Transcription | High | ✅ Fixed | 023 |
| track_versions constraint | Critical | ✅ Fixed | 029 |
| Add Vocals/Instrumental | Critical | ✅ Fixed | 029 |
| Player Deep Links | High | ✅ Fixed | 029 |
| Bundle Size | Medium | 🔄 In Progress | Phase 6 |
| Design System | Medium | ✅ Fixed | Sprint C |
| User Journey | Medium | ✅ Fixed | Sprint D |
| Audio Context | Medium | ✅ Fixed | 021 |
| Realtime Leak | Medium | ✅ Fixed | 020 |
| iOS Autoplay | Low | ⚠️ Workaround | - |
| TG Desktop API | Low | ⚠️ Workaround | - |
| Long Names | Low | 📋 Backlog | - |

## Новые исправления (2026-01-04)

### 11. Tooltips не работают на мобильных
**Статус**: ✅ Исправлено (Session 9)

**Симптомы**: Подсказки в форме генерации не показываются на touch устройствах.

**Причина**: Tooltip требует hover, который недоступен на мобильных.

**Решение**:
- Заменён `Tooltip` на `Popover` в `SectionLabel.tsx`
- Подсказки открываются по клику

---

### 12. Copy/Delete кнопки всегда активны
**Статус**: ✅ Исправлено (Session 9)

**Симптомы**: Кнопки копирования и удаления видны даже когда поле пустое.

**Решение**:
- Условный рендеринг в `FormFieldToolbar.tsx`
- Кнопки появляются только когда есть текст

---

### 13. Форма генерации слишком громоздкая
**Статус**: ✅ Исправлено (Session 9)

**Симптомы**: Много места занимает хедер, логотип, дублирование выбора модели.

**Решение**:
- Удалён логотип из хедера
- Уменьшены размеры и отступы
- Убрано дублирование Model Selector из Advanced Options
- Создан компактный `LyricsVisualEditorCompact.tsx`

---

### 14. track_versions Constraint Violation
**Статус**: ✅ Исправлено (Sprint 029)

**Симптомы**: "new row violates row-level security policy" при добавлении вокала/инструментала.

**Причина**: CHECK constraint не включал типы `vocal_add`, `instrumental_add`, `cover`.

**Решение**:
- Расширен constraint в миграции `20260104054551_*.sql`
- Обновлена логика `getVersionType()` в `suno-music-callback`
- Исправлен `suno-check-status` ('original' → 'initial')

---

### 12. Player Deep Links Missing
**Статус**: ✅ Исправлено (Sprint 029)

**Симптомы**: Нет возможности открыть полноэкранный плеер через deep link.

**Решение**:
- Добавлены паттерны `play_`, `player_`, `listen_` в TelegramContext
- Создана standalone страница `/player/:trackId` (MobilePlayerPage)
- Автовоспроизведение при переходе по deep link

---

### 13. Russian Text Overflow on Mobile
**Статус**: ✅ Исправлено (Sprint 030)

**Симптомы**: Русский текст выходит за границы на мобильных устройствах.

**Причина**: Русский текст на 15-30% длиннее английского.

**Решение**:
- Добавлены design tokens: `textBalance.ru`, `textBalance.balance`
- Применён `truncate` и `text-balance` к критичным элементам
- Улучшены touch targets до min 44px

---

### 14. Touch Targets Too Small
**Статус**: ✅ Исправлено (Sprint 030)

**Симптомы**: Сложно нажать на кнопки/бейджи на мобильных устройствах.

**Решение**:
- Добавлен `touchTargetClass` в design tokens
- Все интерактивные элементы ≥44px
- `touch-manipulation` для предотвращения задержки

---

## Как сообщить о проблеме

1. Проверить этот документ на наличие известной проблемы
2. Собрать информацию: платформа, версия TG, шаги воспроизведения
3. Создать issue с тегом `bug` и приоритетом
4. Приложить console logs если возможно

---

---

### 15. Design Token Inconsistency
**Статус**: ✅ Исправлено (Sprint C)

**Симптомы**: Разные размеры шрифтов, отступов и touch targets по приложению.

**Решение**:
- Создан `src/lib/design-tokens.ts` с унифицированными классами
- `typographyClass` для шрифтов
- `spacingClass` для отступов
- `touchTargetClass` для интерактивных элементов
- `textBalance` для русского текста

---

*Обновлено: 2026-01-23*
