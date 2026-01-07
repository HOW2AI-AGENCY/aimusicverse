# ADR-003: Архитектура оптимизации производительности

- **Статус:** Принято
- **Дата:** 2025-12-05

## Контекст

С ростом функциональности и объёма данных в приложении возникла необходимость систематизировать подходы к оптимизации производительности. Пользователи отмечали замедление загрузки данных, особенно на главной странице и в библиотеке треков.

## Решение

Мы внедряем следующие паттерны оптимизации производительности:

### 1. Консолидация запросов данных

**Проблема:** Множественные параллельные запросы к базе данных для разных секций страницы.

**Решение:** Единый хук `usePublicContentOptimized` выполняет один запрос и распределяет данные между секциями:
- Featured tracks
- New releases  
- Popular tracks
- Auto-playlists по жанрам

### 2. Оптимизированное кэширование TanStack Query

**Настройки для большинства хуков:**
```typescript
{
  staleTime: 30 * 1000,        // 30 секунд
  gcTime: 10 * 60 * 1000,      // 10 минут
  refetchOnWindowFocus: false,  // Без рефетча при фокусе
}
```

### 3. Виртуализация списков

**Библиотека:** react-virtuoso

**Применение:**
- Библиотека треков (grid и list режимы)
- Плейлисты с большим количеством треков

**Компонент:** `VirtualizedTrackList.tsx`

### 4. Ленивая загрузка изображений

**Компонент:** `LazyImage`

**Функции:**
- Native lazy loading (`loading="lazy"`)
- Blur placeholder с shimmer-эффектом
- Плавное появление через opacity transition
- Fallback для ошибок загрузки

### 5. Batch-запросы для счётчиков

**Хук:** `useTrackCounts`

**Оптимизация:** Один запрос для версий и стемов всех треков вместо N+1 запросов на каждый трек.

### 6. Studio State Management (NEW - 2026-01-07)

**Хук:** `useStudioState`

**Функции:**
- Централизованное управление mute/solo/volume/pan
- Effective volume calculation с учётом master и solo
- Memoized callbacks для минимизации re-renders
- Batch state updates

### 7. Waveform Caching (NEW - 2026-01-07)

**Хук:** `useWaveformCache`

**Функции:**
- IndexedDB для персистентного хранения peaks
- LRU memory cache (20 entries)
- 7-day TTL с автоматической очисткой
- Web Worker для генерации peaks

### 8. Optimized Playback (NEW - 2026-01-07)

**Хук:** `useOptimizedPlayback`

**Функции:**
- RAF-based time updates (50ms throttle)
- Lightweight state management
- Proper cleanup и event handling

### 9. Optimized Components (NEW - 2026-01-07)

**Компоненты:**
- `OptimizedWaveform` - Canvas-based с кэшированием
- `OptimizedVolumeSlider` - Touch-optimized с throttling
- `OptimizedMixerPanel` - Виртуализованные каналы
- `OptimizedMixerChannel` - Memoized с stable callbacks

## Последствия

### Положительные:
- **Уменьшение запросов:** ~70% снижение количества запросов на главной странице
- **Быстрая прокрутка:** Виртуализация позволяет работать с 1000+ треков без лагов
- **Меньше трафика:** Ленивая загрузка экономит bandwidth
- **Лучший UX:** Placeholder'ы вместо пустоты при загрузке
- **Плавная студия:** Минимальные re-renders в миксере
- **Быстрые waveforms:** IndexedDB кэширование экономит CPU

### Отрицательные:
- **Сложность:** Дополнительная абстракция в коде
- **Память:** Виртуализация требует осторожности с высотой элементов
- **IndexedDB:** Требует обработки ошибок для приватного режима браузера

## Метрики

| До оптимизации | После оптимизации |
|----------------|-------------------|
| 12+ запросов на Index | 3-4 запроса |
| 100+ запросов на Library (100 треков) | 2-3 запроса |
| Нет кэширования | 30s staleTime |
| Waveform каждый раз | IndexedDB cache 7 days |
| Mixer re-renders | Memoized channels |

## Связанные изменения

- `src/hooks/usePublicContentOptimized.ts` - Консолидированный хук
- `src/components/library/VirtualizedTrackList.tsx` - Виртуализация
- `src/components/ui/lazy-image.tsx` - Ленивые изображения
- `src/components/home/*Optimized.tsx` - Оптимизированные секции
- `src/hooks/studio/useStudioState.ts` - Unified studio state
- `src/hooks/studio/useWaveformCache.ts` - IndexedDB waveform cache
- `src/hooks/studio/useOptimizedPlayback.ts` - RAF playback
- `src/components/studio/unified/Optimized*.tsx` - Optimized components
