# 📋 SDD: Player Improvements v1.0

**Epic ID:** E016-Player-Improvements  
**Создано:** 2025-12-11  
**Статус:** In Progress  
**Приоритет:** P1 (Critical)

---

## 🎯 Цели и Обоснование

### Бизнес-цели:
- Обеспечить стабильное воспроизведение музыки без потери звука
- Улучшить UX синхронизированной лирики в fullscreen mode
- Повысить engagement через караоке-подобный опыт

### Технические цели:
- Устранить потерю звука при переключении режимов плеера
- Сохранять настройки громкости между сессиями
- Улучшить автоскроллинг лирики

---

## 📊 Проблемы и Решения

### Проблема 1: Звук пропадает после открытия fullscreen
**Root Cause:**
1. Volume сбрасывается на 0 при переключении режимов
2. AudioContext переходит в suspended state
3. Audio routing теряется при создании MediaElementSource

**Решение (Implemented 2025-12-11):**
- ✅ Добавлен `volume` в Zustand store для персистентности
- ✅ Добавлена синхронизация volume при каждом play attempt
- ✅ Добавлен `resumeAudioContext` при открытии fullscreen mode
- ✅ Добавлен `ensureAudioRoutedToDestination` для восстановления routing

### Проблема 2: Лирика не скроллится автоматически
**Root Cause:**
1. Scroll происходил даже когда плеер на паузе
2. userScrolling флаг не сбрасывался корректно

**Решение (Implemented 2025-12-11):**
- ✅ Добавлена проверка `isPlaying` перед скроллом
- ✅ Scroll происходит только если строка вне видимой области
- ✅ Оптимизирован timing для smooth scroll

---

## 🗂️ Структура Спринтов

### Sprint 016-A: Critical Audio Fixes (COMPLETED 2025-12-11)

| ID | Задача | Приоритет | Статус |
|----|--------|-----------|--------|
| T016-A-01 | Добавить volume в PlayerState store | P1 | ✅ |
| T016-A-02 | Синхронизировать volume в GlobalAudioProvider | P1 | ✅ |
| T016-A-03 | Resume AudioContext при открытии fullscreen | P1 | ✅ |
| T016-A-04 | Улучшить автоскролл лирики | P2 | ✅ |

### Sprint 016-B: Volume Persistence & Controls (TODO)

| ID | Задача | Приоритет | Статус |
|----|--------|-----------|--------|
| T016-B-01 | Сохранять volume в localStorage | P2 | 🔄 |
| T016-B-02 | Добавить VolumeControl в fullscreen player | P2 | 🔄 |
| T016-B-03 | Добавить mute/unmute toggle | P2 | 🔄 |

### Sprint 016-C: Lyrics Enhancement (TODO)

| ID | Задача | Приоритет | Статус |
|----|--------|-----------|--------|
| T016-C-01 | Добавить lyrics toggle в compact player | P3 | 🔄 |
| T016-C-02 | Кэшировать timestamped lyrics локально | P3 | 🔄 |
| T016-C-03 | Добавить lyrics edit mode | P3 | 🔄 |

### Sprint 016-D: Fullscreen Player Gestures (COMPLETED 2026-01-04)

| ID | Задача | Приоритет | Статус |
|----|--------|-----------|--------|
| T016-D-01 | Горизонтальный свайп для переключения треков | P1 | ✅ |
| T016-D-02 | Предзагрузка обложек (usePrefetchTrackCovers) | P2 | ✅ |
| T016-D-03 | Предзагрузка аудио (usePrefetchNextAudio) | P2 | ✅ |
| T016-D-04 | Double-tap seek ±10 секунд | P1 | ✅ |
| T016-D-05 | Режим караоке (KaraokeView) | P2 | ✅ |
| T016-D-06 | Word-level автоскролл лирики | P1 | ✅ |

**Новые файлы:**
- `src/hooks/audio/usePrefetchTrackCovers.ts`
- `src/hooks/audio/usePrefetchNextAudio.ts`
- `src/components/player/KaraokeView.tsx`
- `src/components/player/DoubleTapSeekFeedback.tsx`

---

## 📁 Затронутые файлы

### Изменённые (2025-12-11):
- `src/hooks/audio/usePlayerState.ts` - добавлен volume state и setVolume action
- `src/components/GlobalAudioProvider.tsx` - синхронизация volume и fix race conditions
- `src/components/player/MobileFullscreenPlayer.tsx` - resume AudioContext при open
- `.github/agents/audio-daw.md` - документация по исправлению audio issues

### Связанные:
- `src/lib/audioContextManager.ts` - управление AudioContext singleton
- `src/hooks/audio/useAudioVisualizer.ts` - visualizer integration
- `src/hooks/useTimestampedLyrics.tsx` - fetching lyrics data

---

## ✅ Acceptance Criteria

### Sprint 016-A (COMPLETED):
- [x] Звук не пропадает при открытии fullscreen mode
- [x] Volume сохраняется между переключениями режимов
- [x] Лирика автоматически скроллится при воспроизведении
- [x] Лирика не скроллится когда плеер на паузе

### Sprint 016-B:
- [ ] Volume сохраняется при перезагрузке страницы
- [ ] Volume slider доступен в fullscreen mode
- [ ] Mute/unmute работает корректно

---

## 🔍 Debugging Tips

### Проверка audio state:
```typescript
import { getAudioSystemDiagnostics } from '@/lib/audioContextManager';

const diagnostics = getAudioSystemDiagnostics();
console.log('Audio system:', diagnostics);
// {
//   hasAudioContext: true,
//   audioContextState: 'running',
//   hasMediaElementSource: true,
//   hasAnalyserNode: true,
//   connectedElementSrc: 'https://...',
//   sampleRate: 48000
// }
```

### Console logs to watch:
- `[INFO] Fullscreen player audio initialized` - успешная инициализация
- `[WARN] Volume was 0, setting to store value` - volume был сброшен
- `[ERROR] Failed to resume AudioContext` - проблема с AudioContext
