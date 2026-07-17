# 🎨 Промпт для Агента по Разработке Интерфейса MusicVerse AI

> **Версия:** 1.0  
> **Дата создания:** 27.06.2026  
> **Назначение:** Комплексное руководство для разработки пользовательских интерфейсов платформы MusicVerse AI

---

## 📋 СОДЕРЖАНИЕ

1. [🎯 Контекст и Назначение](#-контекст-и-назначение)
2. [🏗️ Архитектурные Принципы](#-архитектурные-принципы)
3. [📱 Мобильная-Первая Парадигма](#-мобильная-первая-парадигма)
4. [🎨 Система Дизайна и Компоненты](#-система-дизайна-и-компоненты)
5. [🔄 Паттерны Взаимодействия](#-паттерны-взаимодействия)
6. [⚡ Производительность и Оптимизация](#-производительность-и-оптимизация)
7. [🔊 Аудио Система](#-аудио-система)
8. [📊 Государственное Управление](#-государственное-управление)
9. [🛡️ Безопасность и Доступность](#-безопасность-и-доступность)
10. [🧪 Тестирование и Валидация](#-тестирование-и-валидация)
11. [📝 Чек-лист Разработки Интерфейса](#-чек-лист-разработки-интерфейса)

---

## 🎯 КОНТЕКСТ И НАЗНАЧЕНИЕ

### Описание Проекта

**MusicVerse AI** — это профессиональная платформа для создания музыки с использованием искусственного интеллекта, реализованная как **Telegram Mini App**. Платформа интегрирована с Suno AI v5 для генерации музыки и предоставляет расширенные возможности редактирования, сведения и социального взаимодействия.

### Ключевые Характеристики

- **Платформа:** Telegram Mini App (веб-среда внутри Telegram)
- **Технологический стек:** React 19.2 + TypeScript 5.9 + Vite 6.4.3
- **UI библиотека:** Tailwind CSS 3.4 + shadcn/ui + Radix UI
- **Управление состоянием:** Zustand 5.0 (глобальное) + TanStack Query 5.90 (серверное)
- **Аудио обработка:** Tone.js 14.9, Wavesurfer.js 7.8
- **Бэкенд:** Supabase (PostgreSQL + Edge Functions + Storage)
- **Масштаб:** 976+ компонентов, 63 страницы, 40+ модулей

### Основные Пользовательские Сценарии

1. **Генерация музыки:** Создание треков через текстовые описания и AI-ассистенты
2. **Редактирование:** Разделение на партии, сведение, A/B тестирование версий
3. **Управление:** Организация библиотеки, плейлистов, проектов
4. **Воспроизведение:** Глобальный аудио плеер с очередью и плейлистами
5. **Социальное взаимодействие:** Профили, подписки, лайки, комментарии
6. **Монетизация:** Кредитная система, подписки, платежи через Telegram Stars

---

## 🏗️ АРХИТЕКТУРНЫЕ ПРИНЦИПЫ

### 1. Модульная Архитектура Компонентов

```typescript
// ✅ ПРАВИЛЬНО: Четкое разделение ответственности
src/
├── components/
│   ├── ui/                    // Базовые UI компоненты (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── input.tsx
│   ├── player/                // Домен плеера
│   │   ├── CompactPlayer.tsx
│   │   ├── FullscreenPlayer.tsx
│   │   └── ProgressBar.tsx
│   ├── library/               // Домен библиотеки
│   │   ├── TrackCard.tsx
│   │   ├── TrackRow.tsx
│   │   └── VirtualizedTrackList.tsx
│   └── studio/                // Домен студии
│       ├── StemMixer.tsx
│       └── WaveformEditor.tsx
```

### 2. Принципы Разработки Компонентов

#### Single Responsibility Principle

```typescript
// ❌ НЕПРАВИЛЬНО: Компонент делает слишком много
function TrackCard({ track }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  // ... 300 строк кода
}

// ✅ ПРАВИЛЬНО: Разделение на подкомпоненты
function TrackCard({ track }) {
  return (
    <Card>
      <TrackImage track={track} />
      <TrackInfo track={track} />
      <TrackActions track={track} />
    </Card>
  );
}
```

#### Композиция вместо Наследования

```typescript
// ✅ ПРАВИЛЬНО: Композиция компонентов
function Page({ children }) {
  return (
    <MobileHeader>
      <h1>{children.title}</h1>
    </MobileHeader>
    <main className="pb-20">
      {children.content}
    </main>
    <BottomNav />
  </Page>
);
}
```

### 3. Иерархия Компонентов

```
Pages (Уровень 1)
  └── Layout Components (Уровень 2)
      └── Feature Components (Уровень 3)
          └── UI Components (Уровень 4 - shadcn/ui)
```

**Пример:**

- `LibraryPage` (Page)
- `VirtualizedTrackList` (Layout)
- `TrackRow` (Feature)
- `Button`, `Badge`, `Avatar` (UI)

---

## 📱 МОБИЛЬНАЯ-ПЕРВАЯ ПАРАДИГМА

### 1. Touch-First Дизайн

#### Минимальные Размеры Касания

```typescript
// ❌ НЕПРАВИЛЬНО: Слишком маленькие кнопки
<button className="w-8 h-8"> {/* 32px - слишком мало */}
  <Icon name="play" />
</button>

// ✅ ПРАВИЛЬНО: Адекватные touch targets
<button className="w-11 h-11 min-w-[44px] min-h-[44px]"> {/* 44px минимум */}
  <Icon name="play" />
</button>
```

### 2. Safe Areas для Notch/Island

```typescript
// ✅ ПРАВИЛЬНО: Использование safe-area утилит
<div className="safe-bottom safe-left safe-right">
  <BottomNavigation />
</div>

// Tailwind конфигурация
// safe-area-inset-bottom: env(safe-area-inset-bottom)
```

### 3. Обработка Клавиатуры

```typescript
// ✅ ПРАВИЛЬНО: Отслеживание высоты клавиатуры
useEffect(() => {
  const handleResize = () => {
    const keyboardHeight = window.visualViewport.height ? window.innerHeight - window.visualViewport.height : 0;
    setKeyboardHeight(keyboardHeight);
  };

  window.visualViewport?.addEventListener("resize", handleResize);
  return () => window.visualViewport?.removeEventListener("resize", handleResize);
}, []);
```

### 4. Мобильные Жесты

```typescript
// ✅ ПРАВИЛЬНО: Использование @use-gesture/react
import { useSwipeable } from '@use-gesture/react';

const swipeHandlers = useSwipeable({
  onSwipedLeft: () => handleDelete(),
  onSwipedRight: () => handlePlay(),
  swipeDuration: 250,
  swipeThreshold: 10,
});

<div {...swipeHandlers}>...</div>
```

### 5. Адаптивные Макеты

```typescript
// ✅ ПРАВИЛЬНО: Мобильный-first подход
<div className="
  /* Mobile-first (default) */
  flex flex-col gap-4
  /* Tablet */
  md:grid md:grid-cols-2 md:gap-6
  /* Desktop */
  lg:grid lg:grid-cols-3 lg:gap-8
">
  {tracks.map(track => <TrackCard key={track.id} track={track} />)}
</div>
```

---

## 🎨 СИСТЕМА ДИЗАЙНА И КОМПОНЕНТЫ

### 1. Цветовая Палитра

```typescript
// ✅ Основные цвета проекта
const colors = {
  generate: "#8B5CF6", // Фиолетовый для генерации
  library: "#3B82F6", // Синий для библиотеки
  projects: "#10B981", // Зеленый для проектов
  community: "#F59E0B", // Оранжевый для сообщества
  success: "#22C55E", // Зеленый для успеха
  warning: "#F59E0B", // Желтый для предупреждений
  error: "#EF4444", // Красный для ошибок
};

// Tailwind конфигурация
// bg-generate, text-generate, border-generate
```

### 2. Типографика

```typescript
// ✅ ПРАВИЛЬНО: Использование утилит типографики
<h1 className="text-2xl font-bold"> {/* 24px */}
  Заголовок страницы
</h1>

<h2 className="text-xl font-semibold"> {/* 20px */}
  Подзаголовок
</h2>

<p className="text-sm text-muted-foreground"> {/* 14px */}
  Основной текст
</p>

<span className="text-xs text-muted-foreground"> {/* 12px */}
  Мелкий текст
</span>
```

### 3. shadcn/ui Компоненты

#### Базовые Компоненты

```typescript
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
```

#### Использование Dialog

```typescript
// ❌ НЕПРАВИЛЬНО: Использование Dialog на мобильных
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>...</DialogContent>
</Dialog>

// ✅ ПРАВИЛЬНО: MobileBottomSheet для мобильных
import { BottomSheet, BottomSheetContent } from '@/components/ui/bottom-sheet';

<BottomSheet open={open} onOpenChange={setOpen}>
  <BottomSheetContent>...</BottomSheetContent>
</BottomSheet>
```

### 4. Кастомные Компоненты

#### LazyImage (Обязательный для всех изображений)

```typescript
import { LazyImage } from '@/components/ui/lazy-image';

// ✅ ПРАВИЛЬНО: Всегда используем LazyImage
<LazyImage
  src={track.cover_art}
  alt={track.title}
  className="w-full aspect-square object-cover"
  fallback={<Skeleton className="w-full aspect-square" />}
/>
```

#### TouchFeedback (Для мобильных кнопок)

```typescript
import { TouchFeedback } from '@/components/ui/TouchFeedback';

// ✅ ПРАВИЛЬНО: Обертка для tactile feedback
<TouchFeedback onClick={handleAction}>
  <Button className="w-11 h-11">
    <Icon name="play" />
  </Button>
</TouchFeedback>
```

---

## 🔄 ПАТТЕРНЫ ВЗАИМОДЕЙСТВИЯ

### 1. Глобальный Аудио Плеер

#### Принцип Единого Источника

```typescript
// ❌ НЕПРАВИЛЬНО: Создание множественных audio элементов
const audio1 = new Audio(track1.url);
const audio2 = new Audio(track2.url);

// ✅ ПРАВИЛЬНО: Использование глобального плеера
import { useGlobalAudioPlayer } from "@/contexts/GlobalAudioContext";

const { play, pause, currentTrack, isPlaying } = useGlobalAudioPlayer();

// Воспроизведение трека
play(track);

// Остановка воспроизведения
pause();
```

#### Управление Очередью

```typescript
import { usePlayerStore } from "@/hooks/audio/usePlayerState";

const { activeTrack, queue, currentIndex, playTrack, addToQueue, removeFromQueue, clearQueue } = usePlayerStore();

// Добавление трека в очередь
addToQueue(track, true); // true = воспроизвести немедленно

// Очистка очереди
clearQueue();
```

### 2. Optimistic Updates

```typescript
// ✅ ПРАВИЛЬНО: Оптимистичные обновления
const handleLike = async (trackId: string) => {
  // 1. Немедленное обновление UI
  queryClient.setQueryData(["track", trackId], (old) => ({
    ...old,
    is_liked: !old.is_liked,
    likes_count: old.is_liked ? old.likes_count - 1 : old.likes_count + 1,
  }));

  try {
    // 2. API вызов
    await likeTrack(trackId);
  } catch (error) {
    // 3. Откат при ошибке
    queryClient.invalidateQueries(["track", trackId]);
  }
};
```

### 3. Form States и Автосохранение

```typescript
// ✅ ПРАВИЛЬНО: Автосохранение черновиков
import { useGenerateDraft } from "@/hooks/useGenerateDraft";

const { draft, saveDraft, clearDraft } = useGenerateDraft();

useEffect(() => {
  // Автосохранение каждые 30 секунд
  const interval = setInterval(() => {
    if (formState.title || formState.prompt) {
      saveDraft(formState);
    }
  }, 30000);

  return () => clearInterval(interval);
}, [formState]);
```

### 4. Навигация и Deep Links

```typescript
// ✅ ПРАВИЛЬНО: Обработка Telegram deep links
import { useSearchParams } from "react-router-dom";

const [searchParams] = useSearchParams();
const startapp = searchParams.get("startapp");

useEffect(() => {
  if (startapp) {
    // Парсинг параметра
    const [type, id] = startapp.split("_");

    switch (type) {
      case "track":
        navigate(`/library`, { state: { highlightTrackId: id } });
        break;
      case "playlist":
        navigate(`/playlists/${id}`);
        break;
      case "studio":
        navigate(`/studio-v2/project/${id}`);
        break;
    }
  }
}, [startapp]);
```

---

## ⚡ ПРОИЗВОДИТЕЛЬНОСТЬ И ОПТИМИЗАЦИЯ

### 1. Виртуализация Списков

```typescript
// ✅ ПРАВИЛЬНО: Использование react-virtuoso
import { Virtuoso } from 'react-virtuoso';

function TrackList({ tracks }) {
  return (
    <Virtuoso
      style={{ height: '100vh' }}
      data={tracks}
      itemContent={(index, track) => (
        <TrackRow key={track.id} track={track} />
      )}
      endReached={() => fetchNextPage()}
      overscan={200}
    />
  );
}
```

### 2. Code Splitting и Lazy Loading

```typescript
// ✅ ПРАВИЛЬНО: Ленивая загрузка страниц
import { lazy, Suspense } from 'react';

const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const StudioPage = lazy(() => import('./pages/StudioPage'));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/studio-v2" element={<StudioPage />} />
      </Routes>
    </Suspense>
  );
}
```

### 3. Оптимизация Рендеринга

```typescript
// ✅ ПРАВИЛЬНО: Мемоизация компонентов
import { memo } from 'react';

const TrackRow = memo(({ track, onPlay }) => {
  return (
    <div className="flex items-center gap-3">
      <TrackImage track={track} />
      <TrackInfo track={track} />
      <PlayButton onPlay={() => onPlay(track.id)} />
    </div>
  );
}, (prevProps, nextProps) => {
  // Кастомное сравнение
  return prevProps.track.id === nextProps.track.id &&
         prevProps.track.is_liked === nextProps.track.is_liked;
});
```

### 4. Debouncing и Throttling

```typescript
// ✅ ПРАВИЛЬНО: Debounce для поиска
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

function SearchBar() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchTracks(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <Input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Поиск треков..."
    />
  );
}
```

---

## 🔊 АУДИО СИСТЕМА

### 1. Audio Element Pooling

```typescript
// ❌ НЕПРАВИЛЬНО: Создание новых audio элементов
const audio = new Audio(url);

// ✅ ПРАВИЛЬНО: Использование audio element pool
import { getAudioElement } from "@/lib/audioElementPool";

const audio = getAudioElement(url);
audio.src = url;
audio.play();
```

### 2. Waveform Кэширование

```typescript
// ✅ ПРАВИЛЬНО: Кэширование waveforms
import { getWaveform } from "@/lib/audioCache";

const waveform = await getWaveform(track.id);

// Кэшируется автоматически в:
// - localStorage (для быстрого доступа)
// - Supabase Storage (для кросс-девайса)
```

### 3. Управление Воспроизведением

```typescript
// ✅ ПРАВИЛЬНО: Полное управление плеером
import { usePlayerStore } from "@/hooks/audio/usePlayerState";

const {
  // Состояние
  activeTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  queue,
  currentIndex,

  // Действия
  playTrack,
  pauseTrack,
  nextTrack,
  previousTrack,
  seekTo,
  setVolume,
  addToQueue,
  removeFromQueue,
  shuffleQueue,

  // Моды
  playerMode, // 'compact' | 'fullscreen'
} = usePlayerStore();

// Переключение трека
playTrack(newTrack);

// Пауза/Продолжение
if (isPlaying) {
  pauseTrack();
} else {
  playTrack();
}

// Перемотка
seekTo(30); // 30 секунд

// Следующий трек
nextTrack();
```

---

## 📊 ГОСУДАРСТВЕННОЕ УПРАВЛЕНИЕ

### 1. Zustand Stores (Глобальное Состояние)

```typescript
// ✅ ПРАВИЛЬНО: Использование Zustand для сложного состояния
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { useUnifiedStudioStore } from "@/hooks/useUnifiedStudioStore";
import { useLyricsHistoryStore } from "@/hooks/useLyricsHistoryStore";

// Плеер состояние
const { activeTrack, isPlaying, playTrack } = usePlayerStore();

// Студия состояние
const { selectedTrackId, stemVolumes, updateStemVolume, activeVersionId } = useUnifiedStudioStore();

// История текстов
const { history, addToHistory, undo } = useLyricsHistoryStore();
```

### 2. TanStack Query (Серверное Состояние)

```typescript
// ✅ ПРАВИЛЬНО: Использование TanStack Query для API
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Получение данных
const {
  data: tracks,
  isLoading,
  error,
} = useQuery({
  queryKey: ["tracks", userId],
  queryFn: () => fetchTracks(userId),
  staleTime: 30 * 1000, // 30 секунд
  gcTime: 10 * 60 * 1000, // 10 минут
});

// Мутация
const queryClient = useQueryClient();

const likeMutation = useMutation({
  mutationFn: (trackId) => likeTrack(trackId),
  onMutate: async (trackId) => {
    // Optimistic update
    queryClient.setQueryData(["track", trackId], (old) => ({
      ...old,
      is_liked: !old.is_liked,
    }));
  },
  onSuccess: (data, trackId) => {
    queryClient.invalidateQueries(["track", trackId]);
  },
});
```

### 3. React Hook Form (Формы)

```typescript
// ✅ ПРАВИЛЬНО: Использование React Hook Form
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const generateSchema = z.object({
  prompt: z.string().min(10).max(500),
  style: z.string().min(1),
  has_vocals: z.boolean(),
  lyrics: z.string().optional(),
});

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm({
  resolver: zodResolver(generateSchema),
  defaultValues: {
    prompt: "",
    style: "",
    has_vocals: true,
    lyrics: "",
  },
});

const onSubmit = (data) => {
  generateTrack(data);
};
```

---

## 🛡️ БЕЗОПАСНОСТЬ И ДОСТУПНОСТЬ

### 1. Row Level Security (RLS)

```typescript
// ✅ ПРАВИЛЬНО: Проверка прав доступа
import { useAuth } from '@/contexts/AuthContext';

const { user, isAdmin } = useAuth();

if (track.user_id !== user.id && !isAdmin) {
  return <AccessDenied />;
}
```

### 2. ARIA Labels

```typescript
// ✅ ПРАВИЛЬНО: Accessibility разметка
<button
  aria-label="Воспроизвести трек"
  aria-pressed={isPlaying}
  onClick={handlePlay}
>
  <PlayIcon />
</button>

<div
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
>
  <ProgressBar value={progress} />
</div>
```

### 3. Клавиатурная Навигация

```typescript
// ✅ ПРАВИЛЬНО: Поддержка клавиатуры
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    switch (e.key) {
      case " ":
        e.preventDefault();
        togglePlay();
        break;
      case "ArrowRight":
        seekForward(5);
        break;
      case "ArrowLeft":
        seekBackward(5);
        break;
    }
  };

  window.addEventListener("keydown", handleKeyPress);
  return () => window.removeEventListener("keydown", handleKeyPress);
}, []);
```

---

## 🧪 ТЕСТИРОВАНИЕ И ВАЛИДАЦИЯ

### 1. Unit Тесты (Vitest)

```typescript
// ✅ ПРАВИЛЬНО: Тестирование компонентов
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TrackRow } from './TrackRow';

describe('TrackRow', () => {
  it('renders track information', () => {
    const track = {
      id: '1',
      title: 'Test Track',
      style: 'Pop',
      duration: 180,
    };

    render(<TrackRow track={track} />);

    expect(screen.getByText('Test Track')).toBeInTheDocument();
    expect(screen.getByText('Pop')).toBeInTheDocument();
  });

  it('calls onPlay when play button is clicked', () => {
    const onPlay = vi.fn();
    const track = { id: '1', title: 'Test' };

    render(<TrackRow track={track} onPlay={onPlay} />);

    fireEvent.click(screen.getByRole('button', { name: /play/i }));

    expect(onPlay).toHaveBeenCalledWith('1');
  });
});
```

### 2. E2E Тесты (Playwright)

```typescript
// ✅ ПРАВИЛЬНО: E2E тестирование
import { test, expect } from "@playwright/test";

test("user can generate a track", async ({ page }) => {
  await page.goto("/");

  // Заполнение формы
  await page.fill('[data-testid="prompt-input"]', "Upbeat pop song");
  await page.selectOption('[data-testid="style-select"]', "pop");
  await page.click('[data-testid="generate-button"]');

  // Ожидание результата
  await expect(page.locator('[data-testid="generation-success"]')).toBeVisible();

  // Проверка появления трека в библиотеке
  await page.goto("/library");
  await expect(page.locator("text=Upbeat pop song")).toBeVisible();
});
```

### 3. Performance Тестирование

```typescript
// ✅ ПРАВИЛЬНО: Performance проверки
import { test, expect } from "@playwright/test";

test("library page renders within performance budget", async ({ page }) => {
  await page.goto("/library");

  // Проверка времени загрузки
  const performanceMetrics = await page.evaluate(() => {
    return {
      loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
      domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
    };
  });

  expect(performanceMetrics.loadTime).toBeLessThan(3000); // 3 секунды
  expect(performanceMetrics.domContentLoaded).toBeLessThan(1500); // 1.5 секунды
});
```

---

## 📝 ЧЕК-ЛИСТ РАЗРАБОТКИ ИНТЕРФЕЙСА

### Перед Началом Разработки

- [ ] Изучить существующие паттерны в коде
- [ ] Проверить наличие похожих компонентов
- [ ] Изучить документацию по странице/фиче
- [ ] Понять пользовательский сценарий
- [ ] Проверить мобильную адаптивность

### Во Время Разработки

- [ ] Использовать существующие UI компоненты
- [ ] Следовать mobile-first подходу
- [ ] Обеспечить touch targets минимум 44×44px
- [ ] Добавить ARIA labels для accessibility
- [ ] Реализовать optimistic updates
- [ ] Добавить loading и error states
- [ ] Обработать безопасно keyboard события
- [ ] Добавить haptic feedback для мобильных

### После Разработки

- [ ] Проверить на мобильных устройствах
- [ ] Протестировать keyboard navigation
- [ ] Проверить accessibility с screen reader
- [ ] Провести performance тестирование
- [ ] Проверить bundle size влияние
- [ ] Написать unit тесты
- [ ] Написать E2E тесты для критических путей
- [ ] Обновить документацию

### Критические Проверки

- [ ] **Не создаются множественные audio элементы**
- [ ] **Не используется Dialog на мобильных (только BottomSheet)**
- [ ] **Все изображения используют LazyImage**
- [ ] **Большие списки используют виртуализацию**
- [ ] **Forms поддерживают автосохранение**
- [ ] **API вызовы используют TanStack Query**
- [ ] **Глобальное состояние использует Zustand**
- [ ] **Все действия имеют confirmation для delete**

---

## 🚀 ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

### Документация Проекта

- [CLAUDE.md](../CLAUDE.md) — Основная документация проекта
- [prd/README-ru.md](../prd/README-ru.md) — Техническая спецификация (RU)
- [docs/ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) — Архитектурные диаграммы
- [docs/PLAYER_ARCHITECTURE.md](./PLAYER_ARCHITECTURE.md) — Архитектура плеера

### Ключевые Файлы

- `src/App.tsx` — Корневой компонент с роутингом
- `src/components/GlobalAudioProvider.tsx` — Глобальный аудио плеер
- `src/hooks/audio/usePlayerState.ts` — Zustand store для плеера
- `src/lib/audioElementPool.ts` — Audio element pooling
- `src/lib/audioCache.ts` — Waveform кэширование

### Внешние Ресурсы

- [Telegram Mini Apps Docs](https://core.telegram.org/bots/webapps)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [React Hook Form Documentation](https://react-hook-form.com/)

---

**Версия:** 1.0  
**Последнее обновление:** 27.06.2026  
**Поддерживается:** MusicVerse AI Development Team
