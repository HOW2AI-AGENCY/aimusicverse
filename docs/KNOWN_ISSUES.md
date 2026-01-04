# ⚠️ Known Issues

Документация известных проблем и их обходных путей.

## Критические

### 1. Telegram Mini App Black Screen
**Статус**: ✅ Исправлено (Sprint 022)

**Симптомы**: Приложение не загружается, чёрный/белый экран.

**Причина**: Circular dependencies в Tone.js и useSyncExternalStore при tree-shaking.

**Решение**: См. [TELEGRAM_MINI_APP_CRITICAL_FIXES.md](./TELEGRAM_MINI_APP_CRITICAL_FIXES.md)

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

### 5. Bundle Size > 800KB
**Статус**: 🔄 В процессе (Sprint 022)

**Симптомы**: Медленная загрузка на слабых устройствах.

**Текущий размер**: ~1.16MB

**План**:
- Lazy loading тяжёлых компонентов
- Tree-shaking framer-motion через @/lib/motion
- Code splitting по routes

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
| Bundle Size | Medium | 🔄 In Progress | 022 |
| Audio Context | Medium | ✅ Fixed | 021 |
| Realtime Leak | Medium | ✅ Fixed | 020 |
| iOS Autoplay | Low | ⚠️ Workaround | - |
| TG Desktop API | Low | ⚠️ Workaround | - |
| Long Names | Low | 📋 Backlog | - |

## Как сообщить о проблеме

1. Проверить этот документ на наличие известной проблемы
2. Собрать информацию: платформа, версия TG, шаги воспроизведения
3. Создать issue с тегом `bug` и приоритетом
4. Приложить console logs если возможно
