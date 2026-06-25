# Список задач для Спринта 008

**Спринт**: 008 - Library & Player MVP (User Stories 1 & 2)  
**Период**: 2025-12-15 - 2025-12-29 (2 недели)  
**Цель**: Реализовать критически важные пользовательские сценарии для мобильной библиотеки и оптимизированного плеера

---

## 📊 Прогресс спринта

**Общий прогресс**: 0% (0/22 задачи)

- ⏳ **Запланировано**: 22 задачи
- 🔄 **В работе**: 0 задач
- ✅ **Завершено**: 0 задач

---

## 🎯 Пользовательские сценарии (User Stories)

### User Story 1: Library Mobile Redesign & Versioning (P1)

**Как пользователь мобильного устройства**, я хочу видеть компактную, удобную библиотеку с поддержкой версий треков, чтобы эффективно управлять своей музыкой одной рукой.

**Критерии приемки**:

1. ✅ TrackCard корректно отображается на разрешениях 320px-1920px
2. ✅ Touch targets всех интерактивных элементов ≥44×44px
3. ✅ Swipe gestures работают с haptic feedback
4. ✅ Версии треков отображаются с бейджами
5. ✅ Master версия помечена визуально
6. ✅ List/Grid режимы переключаются плавно
7. ✅ Lazy loading работает со скелетонами
8. ✅ Lighthouse Mobile Score >90

### User Story 2: Player Mobile Optimization (P1)

**Как пользователь мобильного устройства**, я хочу иметь адаптивный плеер с тремя режимами (компактный/расширенный/полноэкранный), чтобы слушать музыку без отрыва от других задач.

**Критерии приемки**:

1. ✅ CompactPlayer занимает 64px
2. ✅ ExpandedPlayer открывается свайпом вверх
3. ✅ FullscreenPlayer отображает синхронизированную лирику
4. ✅ Прогресс бар работает на касание
5. ✅ QueueSheet поддерживает drag-to-reorder
6. ✅ Shuffle и repeat работают корректно
7. ✅ Smooth animations 60fps

---

## 📋 Задачи User Story 1: Library (10 задач)

### US1-T01: TrackCard Mobile Redesign 🔴 КРИТИЧНО

- **Статус**: ⏳ Запланировано
- **Файл**: `src/components/library/TrackCard.tsx`
- **Приоритет**: P0
- **Зависимости**: Sprint 007 завершен

**Описание**: Адаптировать компонент TrackCard для мобильных устройств с touch-friendly интерфейсом.

**Технические требования**:

- Touch targets минимум 44×44px
- Swipe gestures (свайп влево/вправо)
- Haptic feedback при взаимодействии
- Mobile-first layout (320px → 1920px)
- Поддержка Grid и List режимов

**Реализация**:

```tsx
// src/components/library/TrackCard.tsx
import { motion } from "framer-motion";
import { useTelegram } from "@/hooks/useTelegram";

export function TrackCard({ track }: { track: Track }) {
  const { hapticFeedback } = useTelegram();

  const handleSwipeLeft = () => {
    hapticFeedback("impact", "medium");
    // Действие: добавить в избранное
  };

  const handleSwipeRight = () => {
    hapticFeedback("impact", "medium");
    // Действие: удалить
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: -100, right: 100 }}
      onDragEnd={(e, { offset }) => {
        if (offset.x < -50) handleSwipeLeft();
        if (offset.x > 50) handleSwipeRight();
      }}
      className="min-h-[88px] touch-manipulation"
    >
      {/* Track content */}
    </motion.div>
  );
}
```

**Проверка**:

- [ ] Touch targets ≥44×44px (инструмент: Chrome DevTools)
- [ ] Swipe работает плавно на 320px-1920px
- [ ] Haptic feedback срабатывает (тест на реальном устройстве)
- [ ] Grid режим: 2 колонки на mobile, 3+ на tablet/desktop
- [ ] List режим: 1 колонка, компактный layout

---

### US1-T02: TrackRow Component [P]

- **Статус**: ⏳ Запланировано
- **Файл**: `src/components/library/TrackRow.tsx` (создать)
- **Приоритет**: P0
- **Зависимости**: Нет (параллельно с T01)

**Описание**: Создать компонент для компактного строчного отображения трека в list режиме.

**Технические требования**:

- Высота: 56-64px
- Compact layout: cover (48x48) + info + actions
- Touch-friendly кнопки действий
- Быстрая прокрутка без лагов

**Реализация**:

```tsx
// src/components/library/TrackRow.tsx
export function TrackRow({ track }: { track: Track }) {
  return (
    <div className="flex items-center gap-3 h-16 px-4 touch-manipulation">
      <img src={track.cover_url} className="w-12 h-12 rounded" loading="lazy" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{track.title}</p>
        <p className="text-xs text-muted-foreground truncate">{track.style}</p>
      </div>
      <button className="w-11 h-11 touch-manipulation">{/* Play button */}</button>
      <button className="w-11 h-11 touch-manipulation">{/* More actions */}</button>
    </div>
  );
}
```

**Проверка**:

- [ ] Высота ровно 64px
- [ ] Текст не выходит за границы (truncate)
- [ ] Кнопки ≥44×44px
- [ ] Изображения lazy loading

---

### US1-T03: VersionBadge Component [P]

- **Статус**: ⏳ Запланировано
- **Файл**: `src/components/library/VersionBadge.tsx` (создать)
- **Приоритет**: P0
- **Зависимости**: Нет

**Описание**: Бейдж с индикацией количества версий и отметкой master версии.

**Технические требования**:

- Показывает количество версий: "v1", "v3 (5 versions)"
- Master версия: золотая звезда ⭐
- Компактный размер: ~24-32px высота
- Clickable: открывает VersionSwitcher

**Реализация**:

```tsx
// src/components/library/VersionBadge.tsx
import { Badge } from "@/components/ui/badge";

export function VersionBadge({ versionNumber, versionCount, isMaster, onClick }: VersionBadgeProps) {
  return (
    <Badge
      variant={isMaster ? "default" : "secondary"}
      className="text-xs cursor-pointer touch-manipulation min-h-[28px]"
      onClick={onClick}
    >
      {isMaster && "⭐ "}v{versionNumber}
      {versionCount > 1 && ` (${versionCount})`}
    </Badge>
  );
}
```

**Проверка**:

- [ ] Бейдж кликабельный (≥44×44px touch area)
- [ ] Master версия визуально выделена
- [ ] Текст читается на всех темах (light/dark)

---

### US1-T04: VersionSwitcher Component

- **Статус**: ⏳ Запланировано
- **Файл**: `src/components/library/VersionSwitcher.tsx` (создать)
- **Приоритет**: P0
- **Зависимости**: T03 (VersionBadge), useTrackVersions, useVersionSwitcher hooks

**Описание**: UI для переключения между версиями трека с dropdown или bottom sheet.

**Технические требования**:

- Desktop: Dropdown menu
- Mobile: Bottom Sheet (более удобно)
- Список версий с деталями (дата, размер)
- Кнопка "Set as Master"
- Оптимистичные обновления UI

**Реализация**:

```tsx
// src/components/library/VersionSwitcher.tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useTrackVersions } from "@/hooks/useTrackVersions";
import { useVersionSwitcher } from "@/hooks/useVersionSwitcher";

export function VersionSwitcher({ trackId, open, onOpenChange }: Props) {
  const { data: versions, isLoading } = useTrackVersions(trackId);
  const { switchToVersion, setPrimaryVersion } = useVersionSwitcher(trackId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[60vh]">
        <SheetHeader>
          <SheetTitle>Select Version</SheetTitle>
        </SheetHeader>

        <div className="space-y-2 mt-4">
          {versions?.map((version) => (
            <div key={version.id} className="flex items-center gap-3 p-3 border rounded">
              <div className="flex-1">
                <p className="font-medium">v{version.version_number}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(version.created_at)} • {formatSize(version.file_size_bytes)}
                </p>
              </div>

              {version.is_primary && <Badge>Primary</Badge>}

              <Button size="sm" onClick={() => switchToVersion(version.id)} className="touch-manipulation">
                Use This
              </Button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

**Проверка**:

- [ ] Bottom sheet плавно открывается
- [ ] Версии отображаются с деталями
- [ ] Переключение работает с оптимистичными обновлениями
- [ ] UI обновляется после переключения

---

### US1-T05: TrackTypeIcons Component [P]

- **Статус**: ⏳ Запланировано
- **Файл**: `src/components/library/TrackTypeIcons.tsx` (создать)
- **Приоритет**: P1
- **Зависимости**: Нет

**Описание**: Иконки для визуальной индикации типа трека (инструментал, вокал, стемы).

**Технические требования**:

- Иконки: 🎵 (vocal), 🎸 (instrumental), 🎛️ (stems)
- Размер: 16×16px
- Tooltip при hover
- Группируются горизонтально

**Реализация**:

```tsx
// src/components/library/TrackTypeIcons.tsx
export function TrackTypeIcons({ track }: { track: Track }) {
  return (
    <div className="flex gap-1">
      {track.has_vocals && (
        <Tooltip content="Has vocals">
          <Music className="w-4 h-4 text-blue-500" />
        </Tooltip>
      )}
      {track.is_instrumental && (
        <Tooltip content="Instrumental">
          <Guitar className="w-4 h-4 text-green-500" />
        </Tooltip>
      )}
      {track.has_stems && (
        <Tooltip content="Stems available">
          <Sliders className="w-4 h-4 text-purple-500" />
        </Tooltip>
      )}
    </div>
  );
}
```

**Проверка**:

- [ ] Иконки отображаются корректно
- [ ] Tooltip работает (desktop)
- [ ] Цвета различимы на всех темах

---

### US1-T06: Library Page Update

- **Статус**: ⏳ Запланировано
- **Файл**: `src/pages/Library.tsx`
- **Приоритет**: P0
- **Зависимости**: T01-T05 (все компоненты Library)

**Описание**: Интегрировать новые компоненты в Library page, добавить backend фильтрацию, lazy loading.

**Технические требования**:

- Режимы отображения: Grid / List (переключение)
- Backend фильтрация и сортировка
- Infinite scroll с lazy loading
- Skeleton loaders при загрузке
- Search и фильтры

**Реализация**:

```tsx
// src/pages/Library.tsx (обновить)
import { useInfiniteQuery } from "@tanstack/react-query";
import { TrackCard } from "@/components/library/TrackCard";
import { TrackRow } from "@/components/library/TrackRow";
import { SkeletonLoader } from "@/components/ui/skeleton-loader";

export default function Library() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["tracks", filters],
    queryFn: ({ pageParam = 0 }) => fetchTracks({ page: pageParam, ...filters }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  return (
    <div className="p-4">
      {/* Header with view mode toggle */}
      <div className="flex justify-between mb-4">
        <h1>Library</h1>
        <ToggleGroup value={viewMode} onValueChange={setViewMode}>
          <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
          <ToggleGroupItem value="list">List</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Track list */}
      <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-2"}>
        {isLoading ? (
          <SkeletonLoader count={8} type={viewMode === "grid" ? "card" : "row"} />
        ) : (
          data?.pages.flatMap((page) =>
            page.tracks.map((track) =>
              viewMode === "grid" ? (
                <TrackCard key={track.id} track={track} />
              ) : (
                <TrackRow key={track.id} track={track} />
              ),
            ),
          )
        )}
      </div>

      {/* Infinite scroll trigger */}
      {hasNextPage && <div ref={loadMoreRef}>{isFetchingNextPage && <SkeletonLoader count={4} type={viewMode} />}</div>}
    </div>
  );
}
```

**Проверка**:

- [ ] Grid/List режимы переключаются
- [ ] Infinite scroll работает
- [ ] Backend фильтрация быстрее клиентской
- [ ] Skeleton loaders отображаются

---

### US1-T07: Swipe Actions

- **Статус**: ⏳ Запланировано
- **Файл**: `src/components/library/TrackCard.tsx`
- **Приоритет**: P1
- **Зависимости**: T01 (TrackCard)

**Описание**: Реализовать swipe-to-like, swipe-to-delete с haptic feedback.

**Технические требования**:

- Swipe влево: Like/Unlike
- Swipe вправо: Delete
- Haptic feedback при действии
- Визуальная индикация при свайпе
- Подтверждение для delete

**Реализация**:

```tsx
// Добавить в TrackCard.tsx
const handleSwipe = (direction: "left" | "right") => {
  if (direction === "left") {
    // Like action
    hapticFeedback("impact", "light");
    toggleLike(track.id);
  } else {
    // Delete action - показать confirmation
    hapticFeedback("impact", "heavy");
    setShowDeleteConfirm(true);
  }
};
```

**Проверка**:

- [ ] Swipe работает плавно
- [ ] Haptic feedback ощутим на устройстве
- [ ] Delete требует подтверждения
- [ ] Визуальная индикация понятна

---

### US1-T08: Skeleton Loaders [P]

- **Статус**: ⏳ Запланировано
- **Файл**: `src/components/ui/skeleton-loader.tsx` (создать)
- **Приоритет**: P1
- **Зависимости**: Нет

**Описание**: Создать скелетоны для TrackCard и TrackRow.

**Реализация**:

```tsx
// src/components/ui/skeleton-loader.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonLoader({ count = 4, type = "card" }: Props) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          {type === "card" ? (
            <div className="space-y-2">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ) : (
            <div className="flex items-center gap-3 h-16">
              <Skeleton className="w-12 h-12 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
```

**Проверка**:

- [ ] Скелетоны соответствуют реальным компонентам
- [ ] Анимация загрузки плавная

---

### US1-T09: Library Tests (опционально)

- **Статус**: ⏳ Запланировано
- **Файл**: `src/pages/Library.test.tsx` (создать)
- **Приоритет**: P2
- **Зависимости**: T01-T08

**Описание**: Unit и integration тесты для версионирования.

**Тесты**:

- Переключение Grid/List режимов
- Версионирование треков
- Swipe actions
- Infinite scroll

---

### US1-T10: Library Mobile E2E (опционально)

- **Статус**: ⏳ Запланировано
- **Файл**: `tests/e2e/library.spec.ts` (создать)
- **Приоритет**: P2
- **Зависимости**: T01-T08

**Описание**: E2E тесты с Playwright на мобильном viewport.

**Сценарии**:

- Открыть Library на 375×667px
- Переключить на List режим
- Свайпнуть трек влево (like)
- Открыть VersionSwitcher
- Переключить версию

---

## 📋 Задачи User Story 2: Player (12 задач)

### US2-T01: CompactPlayer Redesign [P]

- **Статус**: ⏳ Запланировано
- **Файл**: `src/components/player/CompactPlayer.tsx`
- **Приоритет**: P0
- **Зависимости**: usePlayerState hook

**Описание**: Минималистичный плеер высотой 64px для bottom navigation.

**Технические требования**:

- Высота: фиксированная 64px
- Layout: cover (48×48) + track info + play/pause
- Swipe up → ExpandedPlayer
- Tap → ExpandedPlayer
- Не закрывает контент (fixed bottom)

**Реализация**:

```tsx
// src/components/player/CompactPlayer.tsx
import { motion } from "framer-motion";
import { usePlayerState } from "@/hooks/usePlayerState";

export function CompactPlayer() {
  const { state, play, pause, setMode } = usePlayerState();

  const handleSwipeUp = () => {
    setMode("expanded");
  };

  if (!state.currentTrack) return null;

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-40"
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      onDragEnd={(e, { offset }) => {
        if (offset.y < -50) handleSwipeUp();
      }}
    >
      <div className="flex items-center gap-3 h-full px-4">
        <img src={state.currentTrack.cover_url} className="w-12 h-12 rounded" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{state.currentTrack.title}</p>
          <p className="text-xs text-muted-foreground truncate">{state.currentTrack.style}</p>
        </div>
        <button onClick={() => (state.isPlaying ? pause() : play())} className="w-11 h-11 touch-manipulation">
          {state.isPlaying ? <Pause /> : <Play />}
        </button>
      </div>
    </motion.div>
  );
}
```

**Проверка**:

- [ ] Высота ровно 64px
- [ ] Swipe up открывает ExpandedPlayer
- [ ] Не перекрывает контент страницы
- [ ] Play/pause работает

---

### US2-T02: ExpandedPlayer Component [P]

- **Статус**: ⏳ Запланировано
- **Файл**: `src/components/player/ExpandedPlayer.tsx` (создать)
- **Приоритет**: P0
- **Зависимости**: usePlayerState, PlaybackControls, ProgressBar

**Описание**: Средний режим плеера (~40% viewport) с основными контролами.

**Технические требования**:

- Высота: ~40vh (динамическая)
- Bottom sheet дизайн
- Swipe down → CompactPlayer
- Swipe up → FullscreenPlayer
- Cover, progress bar, controls, queue button

**Реализация**:

```tsx
// src/components/player/ExpandedPlayer.tsx
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { usePlayerState } from "@/hooks/usePlayerState";
import { PlaybackControls } from "./PlaybackControls";
import { ProgressBar } from "./ProgressBar";

export function ExpandedPlayer() {
  const { state, setMode } = usePlayerState();
  const isExpanded = state.mode === "expanded";

  return (
    <Sheet open={isExpanded} onOpenChange={(open) => setMode(open ? "expanded" : "compact")}>
      <SheetContent side="bottom" className="h-[40vh]">
        <div className="flex flex-col h-full justify-between">
          {/* Cover art */}
          <div className="flex justify-center">
            <img src={state.currentTrack?.cover_url} className="w-32 h-32 rounded-lg shadow-lg" />
          </div>

          {/* Track info */}
          <div className="text-center">
            <h3 className="font-semibold text-lg">{state.currentTrack?.title}</h3>
            <p className="text-sm text-muted-foreground">{state.currentTrack?.style}</p>
          </div>

          {/* Progress bar */}
          <ProgressBar current={state.currentTime} duration={state.duration} />

          {/* Playback controls */}
          <PlaybackControls />
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

**Проверка**:

- [ ] Открывается плавно (анимация)
- [ ] Swipe down закрывает
- [ ] Swipe up открывает Fullscreen
- [ ] Контролы работают

---

### US2-T03: FullscreenPlayer Redesign [P]

- **Статус**: ⏳ Запланировано
- **Файл**: `src/components/player/FullscreenPlayer.tsx`
- **Приоритет**: P0
- **Зависимости**: TimestampedLyrics, PlaybackControls, QueueSheet

**Описание**: Полноэкранный режим с синхронизированной лирикой и всеми контролами.

**Технические требования**:

- Fullscreen (100vh)
- Large cover art
- Синхронизированная лирика (если доступна)
- Waveform visualization (опционально)
- Все контролы: volume, queue, shuffle, repeat

**Реализация**:

```tsx
// src/components/player/FullscreenPlayer.tsx
export function FullscreenPlayer() {
  const { state, setMode } = usePlayerState();
  const [showLyrics, setShowLyrics] = useState(true);
  const isFullscreen = state.mode === "fullscreen";

  if (!isFullscreen) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between p-4">
        <button onClick={() => setMode("expanded")}>
          <ChevronDown />
        </button>
        <button onClick={() => setShowLyrics(!showLyrics)}>
          <Music />
        </button>
      </div>

      {/* Cover or Lyrics */}
      <div className="flex-1 overflow-auto p-6">
        {showLyrics && state.currentTrack?.lyrics ? (
          <TimestampedLyrics lyrics={state.currentTrack.lyrics} currentTime={state.currentTime} />
        ) : (
          <img src={state.currentTrack?.cover_url} className="w-full max-w-sm mx-auto rounded-xl shadow-2xl" />
        )}
      </div>

      {/* Progress and Controls */}
      <div className="p-6 space-y-4">
        <ProgressBar />
        <PlaybackControls size="large" />
        <VolumeControl />
      </div>
    </div>
  );
}
```

**Проверка**:

- [ ] Fullscreen режим работает
- [ ] Лирика синхронизируется
- [ ] Swipe down закрывает
- [ ] Все контролы доступны

---

### US2-T04: PlaybackControls Component [P]

- **Статус**: ⏳ Запланировано
- **Файл**: `src/components/player/PlaybackControls.tsx` (создать)
- **Приоритет**: P0
- **Зависимости**: usePlayerState, usePlaybackQueue

**Описание**: Универсальные контролы воспроизведения.

**Технические требования**:

- Кнопки: Previous, Play/Pause, Next
- Shuffle, Repeat toggles
- Touch-friendly (≥44×44px)
- Responsive sizes: compact, medium, large

**Реализация**:

```tsx
// src/components/player/PlaybackControls.tsx
export function PlaybackControls({ size = "medium" }: Props) {
  const { state, play, pause } = usePlayerState();
  const { previous, next, toggleShuffle, setRepeatMode } = usePlaybackQueue();

  const buttonSize = {
    compact: "w-8 h-8",
    medium: "w-11 h-11",
    large: "w-14 h-14",
  }[size];

  return (
    <div className="flex items-center justify-center gap-4">
      <button onClick={toggleShuffle} className={buttonSize}>
        <Shuffle className={state.queue.shuffle ? "text-primary" : ""} />
      </button>

      <button onClick={previous} className={buttonSize}>
        <SkipBack />
      </button>

      <button
        onClick={() => (state.isPlaying ? pause() : play())}
        className={`${buttonSize} bg-primary text-primary-foreground rounded-full`}
      >
        {state.isPlaying ? <Pause /> : <Play />}
      </button>

      <button onClick={next} className={buttonSize}>
        <SkipForward />
      </button>

      <button onClick={() => setRepeatMode(cycleRepeat(state.queue.repeat))} className={buttonSize}>
        <Repeat className={state.queue.repeat !== "off" ? "text-primary" : ""} />
      </button>
    </div>
  );
}
```

**Проверка**:

- [ ] Все кнопки ≥44×44px
- [ ] Shuffle/Repeat визуально активны
- [ ] Previous/Next работают
- [ ] Play/Pause переключается

---

### US2-T05: ProgressBar Component [P]

- **Статус**: ⏳ Запланировано
- **Файл**: `src/components/player/ProgressBar.tsx` (создать)
- **Приоритет**: P0
- **Зависимости**: usePlayerState

**Описание**: Прогресс бар с seek и buffering индикатором.

**Технические требования**:

- Touch-friendly: высота ≥44px touch area
- Drag to seek
- Tap to seek
- Buffering indicator
- Time labels (current / total)

**Реализация**:

```tsx
// src/components/player/ProgressBar.tsx
export function ProgressBar() {
  const { state, seek } = usePlayerState();

  const handleSeek = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * state.duration;
    seek(newTime);
  };

  return (
    <div className="space-y-2">
      <div
        className="relative h-1 bg-secondary rounded-full cursor-pointer touch-manipulation"
        onClick={handleSeek}
        style={{ minHeight: "44px", paddingTop: "21px", paddingBottom: "21px" }}
      >
        <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-secondary rounded-full">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${(state.currentTime / state.duration) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatTime(state.currentTime)}</span>
        <span>{formatTime(state.duration)}</span>
      </div>
    </div>
  );
}
```

**Проверка**:

- [ ] Seek работает на touch
- [ ] Прогресс обновляется плавно
- [ ] Time labels корректны

---

### US2-T06: QueueSheet Component [P]

- **Статус**: ⏳ Запланировано
- **Файл**: `src/components/player/QueueSheet.tsx` (создать)
- **Приоритет**: P1
- **Зависимости**: usePlaybackQueue, QueueItem

**Описание**: Bottom sheet с очередью воспроизведения.

**Технические требования**:

- Drag-to-reorder tracks
- Swipe-to-remove
- Current track highlight
- Clear queue button

**Реализация**:

```tsx
// src/components/player/QueueSheet.tsx
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

export function QueueSheet({ open, onOpenChange }: Props) {
  const { queue, reorderQueue, removeFromQueue } = usePlaybackQueue();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh]">
        <SheetHeader>
          <SheetTitle>Queue ({queue.items.length})</SheetTitle>
        </SheetHeader>

        <DndContext onDragEnd={handleDragEnd}>
          <SortableContext items={queue.items} strategy={verticalListSortingStrategy}>
            {queue.items.map((track, index) => (
              <QueueItem
                key={track.id}
                track={track}
                isCurrentTrack={index === queue.currentIndex}
                onRemove={() => removeFromQueue(index)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </SheetContent>
    </Sheet>
  );
}
```

**Проверка**:

- [ ] Drag-to-reorder работает
- [ ] Swipe-to-remove работает
- [ ] Current track выделен
- [ ] Smooth animations

---

### US2-T07: QueueItem Component [P]

- **Статус**: ⏳ Запланировано
- **Файл**: `src/components/player/QueueItem.tsx` (создать)
- **Приоритет**: P1
- **Зависимости**: Нет

**Описание**: Элемент очереди с drag handle и swipe-to-remove.

**Реализация**:

```tsx
// src/components/player/QueueItem.tsx
import { useSortable } from "@dnd-kit/sortable";

export function QueueItem({ track, isCurrentTrack, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, transform } = useSortable({ id: track.id });

  return (
    <div ref={setNodeRef} className={`flex items-center gap-3 p-3 ${isCurrentTrack ? "bg-accent" : ""}`}>
      <div {...attributes} {...listeners} className="touch-manipulation cursor-grab">
        <GripVertical className="w-5 h-5" />
      </div>

      <img src={track.cover_url} className="w-10 h-10 rounded" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{track.title}</p>
        <p className="text-xs text-muted-foreground truncate">{track.style}</p>
      </div>

      <button onClick={onRemove} className="w-9 h-9 touch-manipulation">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
```

**Проверка**:

- [ ] Drag handle работает
- [ ] Remove button работает
- [ ] isCurrentTrack выделяется

---

### US2-T08: TimestampedLyrics Update

- **Статус**: ⏳ Запланировано
- **Файл**: `src/components/player/TimestampedLyrics.tsx`
- **Приоритет**: P1
- **Зависимости**: Нет

**Описание**: Исправить синхронизацию и видимость лирики на мобильных.

**Технические требования**:

- Word-by-word highlight
- Auto-scroll to current line
- Mobile-optimized layout
- Fallback для треков без timestamps

**Проверка**:

- [ ] Лирика синхронизируется
- [ ] Auto-scroll работает
- [ ] Читается на mobile

---

### US2-T09: Player State Management

- **Статус**: ⏳ Запланировано
- **Файл**: `src/hooks/usePlayerState.ts`
- **Приоритет**: P0
- **Зависимости**: Sprint 007 (hooks готовы)

**Описание**: Интеграция usePlayerState и usePlaybackQueue хуков в компоненты.

**Задачи**:

- Подключить usePlayerState в все компоненты плеера
- Подключить usePlaybackQueue в QueueSheet
- Тестирование state transitions
- Persist state в localStorage

**Проверка**:

- [ ] State синхронизируется между компонентами
- [ ] Queue корректно обновляется
- [ ] State сохраняется при перезагрузке

---

### US2-T10: Player Transitions

- **Статус**: ⏳ Запланировано
- **Файл**: `src/components/player/` (все компоненты)
- **Приоритет**: P1
- **Зависимости**: T01-T03 (все компоненты плеера)

**Описание**: Плавные переходы между режимами плеера с анимациями.

**Технические требования**:

- Framer Motion для анимаций
- Smooth transitions (60fps)
- Spring physics
- Gesture-based transitions

**Реализация**:

```tsx
// Добавить в компоненты плеера
const variants = {
  compact: { height: "64px", opacity: 1 },
  expanded: { height: "40vh", opacity: 1 },
  fullscreen: { height: "100vh", opacity: 1 },
};

<motion.div
  initial={false}
  animate={state.mode}
  variants={variants}
  transition={{ type: "spring", damping: 30, stiffness: 300 }}
>
  {/* Player content */}
</motion.div>;
```

**Проверка**:

- [ ] Transitions плавные (60fps)
- [ ] Нет лагов при свайпе
- [ ] Spring animation натуральная

---

### US2-T11: Player Tests (опционально)

- **Статус**: ⏳ Запланировано
- **Файлы**: `src/components/player/*.test.tsx` (создать)
- **Приоритет**: P2

**Тесты**:

- PlaybackControls: play/pause, next/prev, shuffle, repeat
- ProgressBar: seek, time display
- QueueSheet: drag-to-reorder, remove

---

### US2-T12: Player Mobile E2E (опционально)

- **Статус**: ⏳ Запланировано
- **Файл**: `tests/e2e/player.spec.ts` (создать)
- **Приоритет**: P2

**Сценарии**:

- Открыть плеер в Compact режиме
- Свайп вверх → Expanded
- Свайп вверх → Fullscreen
- Управление воспроизведением
- Drag-to-reorder в очереди

---

## 🎯 Критерии приемки спринта

### Функциональные требования

- [ ] Все задачи US1 (1-10) выполнены
- [ ] Все задачи US2 (1-12) выполнены
- [ ] TrackCard и TrackRow работают на 320px-1920px
- [ ] Плеер имеет 3 режима (compact/expanded/fullscreen)
- [ ] Версионирование треков работает
- [ ] Swipe gestures работают с haptic feedback
- [ ] Queue management работает (drag-to-reorder)

### Качество кода

- [ ] Code review пройден
- [ ] TypeScript: 0 ошибок `tsc --noEmit`
- [ ] ESLint: 0 ошибок `npm run lint`
- [ ] Prettier: код отформатирован `npm run format`
- [ ] Unit тесты: покрытие >80% (опционально)

### Performance

- [ ] Lighthouse Mobile Score >90
- [ ] FCP (First Contentful Paint) <2s на 3G
- [ ] Smooth animations 60fps
- [ ] No layout shifts (CLS <0.1)

### Accessibility

- [ ] WCAG 2.1 AA compliance
- [ ] Touch targets ≥44×44px
- [ ] ARIA labels на всех интерактивных элементах
- [ ] Keyboard navigation работает
- [ ] Screen reader support

### Документация

- [ ] README обновлен с новыми компонентами
- [ ] Storybook stories созданы для новых компонентов
- [ ] API документация обновлена

---

## 📝 Команды для разработки

### Запуск проекта

```bash
npm run dev
```

### Проверка типов

```bash
npx tsc --noEmit
```

### Линтинг и форматирование

```bash
npm run lint
npm run lint -- --fix
npm run format
```

### Тестирование

```bash
npm test
npm test:coverage
npm test -- --watch
```

### Storybook

```bash
npm run storybook
```

### Performance audit

```bash
npm run build
npm run preview
# Open Chrome DevTools → Lighthouse → Run audit (mobile)
```

---

## ⚠️ Риски и митигация

| Риск                                | Вероятность | Влияние | Митигация                                             |
| ----------------------------------- | ----------- | ------- | ----------------------------------------------------- |
| Сложность анимаций Framer Motion    | Средняя     | Средне  | Начать с простых анимаций, постепенно усложнять       |
| Performance на старых устройствах   | Средняя     | Высокое | Profiling, оптимизация, fallback для старых устройств |
| Gesture conflicts (swipe vs scroll) | Высокая     | Средне  | Threshold detection, direction detection              |
| Haptic feedback не работает везде   | Низкая      | Низкое  | Graceful fallback, optional feature                   |
| Зависимость от Sprint 007           | Низкая      | Высокое | Убедиться что Sprint 007 завершен перед началом       |

---

## 🔗 Зависимости

### Внешние зависимости

- ✅ Sprint 007 завершен (миграции, типы, хуки)
- ⏳ Design assets для компонентов
- ⏳ Тестовые данные (треки с версиями, лирика)

### NPM пакеты (установить при необходимости)

```bash
# Framer Motion (анимации)
npm install framer-motion

# DnD Kit (drag-and-drop)
npm install @dnd-kit/core @dnd-kit/sortable

# TanStack Query (уже установлен)
# @twa-dev/sdk (уже установлен)
```

---

## 📊 Метрики успеха

### User Story 1: Library

- Touch target compliance: 100%
- Mobile responsiveness: 320px-1920px
- Lighthouse Mobile: >90
- Версионирование: <500ms переключение

### User Story 2: Player

- Player mode transitions: <300ms
- 60fps animations на всех переходах
- Queue reorder: smooth drag-and-drop
- Haptic feedback: работает на iOS/Android

---

## 🔄 Следующий спринт

**Sprint 009: Track Details & Actions (User Stories 3 & 4)**

- Период: 2025-12-29 - 2026-01-12
- Задачи: 19 задач
- Фокус:
  - Панель деталей трека (лирика, версии, стемы, analysis, changelog)
  - Меню действий (Create Persona, Open in Studio, Add to Project/Playlist)

---

## 📚 Полезные ссылки

- 📄 Детальный план: `specs/copilot/audit-interface-and-optimize/tasks.md` (T025-T046)
- 📊 Спецификация: `specs/copilot/audit-interface-and-optimize/spec.md`
- 💾 Модель данных: `specs/copilot/audit-interface-and-optimize/data-model.md`
- 🔌 API контракты: `specs/copilot/audit-interface-and-optimize/contracts/`
- 📖 Quickstart: `specs/copilot/audit-interface-and-optimize/quickstart.md`
- 🎨 Design: Telegram Design Guidelines - https://core.telegram.org/bots/webapps#design-guidelines

---

_Последнее обновление: 2025-12-02_
