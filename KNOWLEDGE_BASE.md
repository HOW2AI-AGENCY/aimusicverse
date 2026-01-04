# 📚 БАЗА ЗНАНИЙ ПРОЕКТА MusicVerse AI

> **Последнее обновление:** 2026-01-04 (Session 7)  
> **Версия проекта:** 1.2.0 (Sprint 030 - DAW Canvas)

---

## 🆕 НОВОЕ В СЕССИИ 7

### Sprint 030 Specification Complete (January 4, 2026) ✅

Завершена комплексная спецификация Sprint 030: Unified Studio Mobile (DAW Canvas)

**Артефакты спецификации:** `specs/001-unified-studio-mobile/`

**Phase 0-1 Complete (Specification & Design):**
- ✅ spec.md - 8 user stories, 43 requirements, 26 success criteria (672 lines)
- ✅ plan.md - 5-phase implementation plan, 142 tasks (1,548 lines, 61KB)
- ✅ tasks.md - Dependency-ordered task breakdown (628 lines)
- ✅ research.md - Technical research and risk analysis (685 lines, 21KB)
- ✅ data-model.md - Component hierarchy and state shape (907 lines, 21KB)
- ✅ quickstart.md - Developer setup and workflow guide (654 lines, 15KB)
- ✅ contracts/ - TypeScript interfaces (components, hooks, stores - 2,201 lines)

**Качество спецификации:**
- 100% compliance with constitution (all 8 principles)
- 142 tasks across 5 phases (January 4-20, 2026)
- 60 tests planned (40 unit + 15 integration + 5 E2E)
- 80% code coverage target
- TDD enforced for P1 features
- Risk management (16 risks with mitigation)
- Rollback plan with feature flags
- Performance targets (TTI <1.8s, 60 FPS, <80ms tab switch)

**Используемые агенты:**
- speckit.analyze - Project consistency analysis
- speckit.specify - Specification generation
- speckit.plan - Implementation planning
- speckit.tasks - Task breakdown generation

---

### DAW Canvas Architecture (ADR-011)

Архитектурное решение: объединение 3 студий в единый DAW-подобный интерфейс.

**Проблема:** 3 параллельные студии с дублирующимся кодом (~40%)
- `StudioShell` — основной интерфейс
- `StemStudioContent` — legacy с богатым функционалом
- `MultiTrackStudioLayout` — DAW с drag-drop

**Решение:** Итеративная интеграция в StudioShell без деструктивных изменений

**Компоненты для переиспользования из stem-studio:**
- `QuickCompare` — A/B/C сравнение секций
- `TrimDialog` — обрезка треков
- `MixPresetsMenu` — пресеты микса
- `ReplacementProgressIndicator` — прогресс AI замены

**Новые компоненты:**
- `MobileDAWTimeline` — timeline с pinch-zoom, tap-seek
- `AIActionsFAB` — floating action button для AI
- `useUnifiedStudio` — унифицированный hook

**ADR:** `ADR/ADR-011-UNIFIED-STUDIO-ARCHITECTURE.md`

### Track Operation Lifecycle (Operation Lock)

Логика блокировки операций в зависимости от состояния трека:

```
┌─────────────────────────────────────────────────────────────┐
│                    TRACK LIFECYCLE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐                                          │
│   │    FRESH     │  ← Только что сгенерирован               │
│   │    TRACK     │                                          │
│   └──────┬───────┘                                          │
│          │                                                  │
│   ┌──────┴───────────────────────────────┐                  │
│   │  Доступные операции:                  │                 │
│   │  ✅ Extend                            │                 │
│   │  ✅ Replace Section                   │                 │
│   │  ✅ Separate Stems                    │                 │
│   │  ✅ Cover                             │                 │
│   │  ✅ Add Vocals (если instrumental)   │                 │
│   └──────┬───────────────────────────────┘                  │
│          │                                                  │
│   ┌──────▼───────┐      ┌────────────────┐                  │
│   │   EXTEND     │      │ REPLACE SECTION │                 │
│   │   ────────   │      │ ──────────────  │                 │
│   │   Трек       │      │ Трек обновлён,  │                 │
│   │   удлинён    │      │ Extend работает │                 │
│   │              │      │ с новой версией │                 │
│   └──────┬───────┘      └────────┬───────┘                  │
│          │                       │                          │
│          └───────────┬───────────┘                          │
│                      │                                      │
│          ┌───────────▼───────────┐                          │
│          │   SEPARATE STEMS      │                          │
│          │   ─────────────────   │                          │
│          │   Стемы созданы       │                          │
│          └───────────┬───────────┘                          │
│                      │                                      │
│          ┌───────────▼───────────┐                          │
│          │  BLOCKED OPERATIONS   │                          │
│          │  ──────────────────   │                          │
│          │  ❌ Extend            │                          │
│          │  ❌ Replace Section   │                          │
│          │  ✅ Cover             │                          │
│          │  ✅ Add Vocals        │                          │
│          │  ❌ Separate (уже)    │                          │
│          └───────────┬───────────┘                          │
│                      │                                      │
│          ┌───────────▼───────────┐                          │
│          │ SAVE AS NEW VERSION   │ ← Выход из блокировки    │
│          │ ────────────────────  │                          │
│          │ Удаляет стемы,        │                          │
│          │ создаёт новую версию  │                          │
│          │ трека                 │                          │
│          └───────────────────────┘                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Файлы:**
- `src/hooks/studio/useStudioOperationLock.ts` — логика блокировки
- `src/components/studio/unified/AIActionsFAB.tsx` — UI с disabled states

---

## 🔔 Централизованная система уведомлений (notify)

```typescript
import { notify } from '@/lib/notifications';

// Базовое использование
notify.success('Успешно сохранено');
notify.error('Ошибка загрузки');
notify.warning('Внимание');
notify.info('Информация');

// С дедупликацией (предотвращает дублирование)
notify.success('Настройки сохранены', { 
  dedupe: true, 
  dedupeKey: 'settings-saved',
  dedupeTimeout: 2000 // 2 секунды
});

// С кастомными опциями
notify.error('Ошибка сети', { 
  duration: 5000,
  action: { label: 'Повторить', onClick: () => retry() }
});
```

**Файлы:** `src/lib/notifications.ts`

### Admin Panel - GenerationStatsPanel

Новая панель статистики генерации в админ-панели:
- Общая статистика (генерации, успешность, пользователи, кредиты)
- Разбивка по типам (custom, simple, extend, cover, stems)
- Ежедневная статистика за последние 7 дней
- Топ-5 пользователей по генерациям

**Файлы:** `src/components/admin/GenerationStatsPanel.tsx`

### User Settings - UserStatsSection

Персональная статистика пользователя в настройках:
- Статистика за сегодня (генерации, кредиты, успешность)
- Общая статистика (всего генераций, типы)
- Разбивка по типам генерации
- История за последние 7 дней

**Файлы:** `src/components/settings/UserStatsSection.tsx`

---

## 🎯 ОБЗОР ПРОЕКТА

**MusicVerse AI** — профессиональная платформа для создания музыки на базе AI, реализованная как Telegram Mini App.

### Технологический стек

| Категория | Технология |
|-----------|------------|
| Frontend | React 19, TypeScript, Vite 5 |
| Стили | Tailwind CSS 3.4, shadcn/ui |
| Состояние | Zustand, TanStack Query |
| Backend | Supabase (Lovable Cloud) |
| AI API | Suno API, Lovable AI Gateway |
| Платформа | Telegram Mini App |
| Анимации | Framer Motion |
| Аудио | Web Audio API, Tone.js, WaveSurfer.js |

---

## 📁 СТРУКТУРА ПРОЕКТА

### Корневые директории

```
/
├── src/                    # Исходный код фронтенда
├── supabase/               # Edge Functions и конфигурация
│   ├── functions/          # 80+ Edge Functions
│   └── migrations/         # SQL миграции
├── docs/                   # Документация (80+ файлов)
├── ADR/                    # Architecture Decision Records
├── specs/                  # Спецификации спринтов
├── SPRINTS/                # Планирование спринтов
└── public/                 # Статические файлы
```

### Структура src/

```
src/
├── components/             # 150+ React компонентов
│   ├── ui/                 # Base UI (shadcn/ui)
│   ├── player/             # Аудио плеер
│   ├── library/            # Библиотека треков
│   ├── generate-form/      # Форма генерации
│   ├── stem-studio/        # Разделение стемов
│   ├── lyrics/             # Работа с текстами
│   ├── lyrics-workspace/   # Lyrics Workspace с AI Agent (NEW)
│   │   └── ai-agent/       # AI Agent инструменты
│   ├── admin/              # Админ панель
│   ├── telegram/           # Telegram компоненты
│   ├── audio-record/       # Запись аудио
│   ├── profile/            # Профиль пользователя
│   ├── projects/           # Музыкальные проекты
│   └── ...
├── hooks/                  # 80+ кастомных хуков
│   ├── audio/              # Аудио хуки
│   ├── generation/         # Генерация
│   ├── studio/             # Студийные хуки
│   ├── telegram/           # Telegram хуки
│   └── ...
├── stores/                 # Zustand stores
├── services/               # Сервисы API
├── contexts/               # React контексты
├── lib/                    # Утилиты и хелперы
│   ├── errors/             # Типизированные ошибки
│   ├── audio/              # Аудио утилиты
│   └── ...
├── types/                  # TypeScript типы
├── constants/              # Константы
├── pages/                  # Страницы приложения
└── integrations/           # Интеграции (Supabase)
```

### Структура Edge Functions

```
supabase/functions/
├── _shared/                # Общие утилиты
│   ├── cors.ts             # CORS headers
│   ├── logger.ts           # Логирование
│   ├── telegram-utils.ts   # Telegram утилиты
│   └── suno.ts             # Suno API клиент
├── suno-generate/          # Legacy прокси генерации
├── suno-music-generate/    # Основная генерация
├── suno-extend-audio/      # Расширение треков
├── suno-remix/             # Каверы (upload-cover)
├── suno-separate-vocals/   # Разделение стемов
├── ai-lyrics-assistant/    # AI помощник для текстов (15+ actions)
├── telegram-bot/           # Telegram бот
├── analyze-audio/          # Анализ аудио
├── generate-cover/         # Генерация обложек
└── ... (80+ функций)
```

---

## 🔑 КЛЮЧЕВЫЕ ФАЙЛЫ

### ⚠️ Файлы которые НЕЛЬЗЯ редактировать

| Файл | Причина |
|------|---------|
| `src/integrations/supabase/client.ts` | Автогенерируется Supabase |
| `src/integrations/supabase/types.ts` | Автогенерируется из схемы БД |
| `supabase/config.toml` | Конфигурация Supabase |
| `.env` | Переменные окружения |
| `package.json` | Только через lov-add-dependency |

### Конфигурация

| Файл | Описание |
|------|----------|
| `src/App.tsx` | Корневой компонент с провайдерами |
| `tailwind.config.ts` | Конфигурация Tailwind |
| `vite.config.ts` | Конфигурация Vite |
| `src/index.css` | CSS переменные дизайн-системы |

### Состояние и хуки

| Файл | Описание |
|------|----------|
| `src/hooks/audio/usePlayerState.ts` | Zustand store плеера |
| `src/hooks/generation/useGenerateForm.ts` | Логика формы генерации |
| `src/hooks/audio/useAudioTime.ts` | Глобальное аудио время |
| `src/stores/lyricsWizardStore.ts` | Store мастера лирики |
| `src/stores/planTrackStore.ts` | Store планирования треков |
| `src/hooks/useRecordingUpload.ts` | Автосохранение записей |

### Основные компоненты

| Файл | Описание |
|------|----------|
| `src/components/GlobalAudioProvider.tsx` | Синглтон аудио элемента |
| `src/components/MainLayout.tsx` | Основной layout приложения |
| `src/components/player/` | Все компоненты плеера |
| `src/components/generate-form/` | Форма генерации музыки |
| `src/components/library/` | Библиотека треков |
| `src/components/stem-studio/` | Студия стемов |

### Типы

| Файл | Описание |
|------|----------|
| `src/types/track.ts` | Типы треков (Track, TrackWithCreator) |
| `src/types/branded.ts` | Branded types (TrackId, UserId) |
| `src/types/telegram.ts` | Telegram типы |
| `src/types/generation.ts` | Типы генерации |

### Утилиты

| Файл | Описание |
|------|----------|
| `src/lib/logger.ts` | Централизованное логирование |
| `src/lib/errors/AppError.ts` | Типизированные ошибки |
| `src/lib/errorHandling.ts` | Обработка ошибок UI |
| `src/lib/performance.ts` | Утилиты производительности |
| `src/lib/audio/audioContextHelper.ts` | Хелпер AudioContext |
| `src/lib/waveformCache.ts` | Кэш waveform в IndexedDB |

---

## 🚨 ЧАСТО ПОВТОРЯЮЩИЕСЯ ОШИБКИ И ИСПРАВЛЕНИЯ

### 1. Аудио ошибки при старте приложения

**Симптом:** Ошибка "NotAllowedError" или "NotSupportedError" при загрузке.

**Причина:** Старые данные в localStorage с недействительными audio_url.

**Решение:**
```typescript
// В GlobalAudioProvider.tsx
const mountTimeRef = useRef(Date.now());
const isStartupPeriod = () => Date.now() - mountTimeRef.current < 2000;

// Подавляем ошибки первые 2 секунды после загрузки
if (isStartupPeriod()) return; // не показывать toast
```

**Файлы:** `src/components/GlobalAudioProvider.tsx`

---

### 2. Telegram Mini App Safe Area

**Симптом:** Контент обрезается сверху/снизу в Telegram.

**Решение:**
```typescript
// Правильный отступ сверху для Telegram
paddingTop: `calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 0.75rem, calc(env(safe-area-inset-top, 0px) + 0.75rem)))`

// Правильный отступ снизу
paddingBottom: `calc(max(var(--tg-safe-area-inset-bottom, 0px) + 70px, calc(env(safe-area-inset-bottom, 0px) + 70px)))`
```

**Файлы:** `src/components/MainLayout.tsx`, `src/index.css`

---

### 3. Сжатие высоты Drawer/Sheet панелей

**Симптом:** Drawer сжимается после отправки сообщения или взаимодействия.

**Решение:**
```tsx
// Контейнер
<div className="flex-1 min-h-0 overflow-hidden relative">
  {/* Используй absolute позиционирование для контента */}
  <div className="absolute inset-0 overflow-y-auto overscroll-contain">
    {content}
  </div>
</div>

// DrawerContent
<DrawerContent className="h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden">
```

**Файлы:** `src/components/generate-form/LyricsChatAssistant.tsx`

---

### 4. AudioContext не инициализирован

**Симптом:** "The AudioContext was not allowed to start".

**Причина:** Браузер требует user interaction для запуска AudioContext.

**Решение:**
```typescript
import { getAudioContext, resumeAudioContext } from '@/lib/audio/audioContextHelper';

// Всегда проверяй состояние и возобновляй при user gesture
const handlePlay = async () => {
  const ctx = getAudioContext();
  await resumeAudioContext(ctx);
  // теперь можно воспроизводить
};
```

**Файлы:** `src/lib/audio/audioContextHelper.ts`

---

### 5. Неправильный эндпоинт для Cover/Extend

**Симптом:** Cover или Extend создают новый трек вместо обработки референса.

**Правильные эндпоинты:**
```typescript
// ✅ Для Cover (создание кавера с референсом)
POST /api/v1/generate/upload-cover
// Обрабатывается: suno-remix

// ✅ Для Extend (расширение трека)
POST /api/v1/generate/upload-extend  
// Обрабатывается: suno-extend-audio

// ❌ НЕ используй для Cover/Extend:
POST /api/v1/generate  // это создание НОВОГО трека
```

**Файлы:** `supabase/functions/suno-remix/`, `supabase/functions/suno-extend-audio/`

---

### 6. RLS политики блокируют запросы

**Симптом:** "new row violates row-level security policy".

**Чек-лист:**
1. Проверь что `auth.uid()` совпадает с `user_id` в записи
2. Убедись что есть INSERT политика с `WITH CHECK`
3. Проверь что пользователь аутентифицирован
4. Проверь что таблица добавлена в RLS

**Пример правильной политики:**
```sql
CREATE POLICY "Users can CRUD own data"
ON public.table_name FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

### 7. Bundle size слишком большой

**Решение - централизованные импорты:**
```typescript
// ✅ Правильно
import { motion, AnimatePresence } from '@/lib/motion';
import { format, formatDistance } from '@/lib/date-utils';

// ❌ Неправильно (тянет весь пакет)
import { motion } from 'framer-motion';
import { format } from 'date-fns';
```

**Lazy loading для тяжелых компонентов:**
```typescript
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Skeleton />}>
  <HeavyComponent />
</Suspense>
```

---

### 8. Утечки памяти в Realtime подписках

**Симптом:** Память растет со временем, дублирующиеся события.

**Решение:**
```typescript
useEffect(() => {
  const channel = supabase.channel('my-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tracks' }, callback)
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel); // ⚠️ ОБЯЗАТЕЛЬНО!
  };
}, []);
```

---

### 9. Waveform перегенерируется каждый раз

**Симптом:** При каждом открытии трека waveform генерируется заново.

**Решение:**
```typescript
import { getWaveformFromCache, saveWaveformToCache } from '@/lib/waveformCache';

// Проверяем кэш перед генерацией
const cached = await getWaveformFromCache(trackId);
if (cached) return cached;

// Генерируем и сохраняем
const waveform = await generateWaveform(audioUrl);
await saveWaveformToCache(trackId, waveform);
```

**Файлы:** `src/lib/waveformCache.ts`

---

### 10. iOS Safari не воспроизводит аудио

**Причина:** Safari требует user interaction для autoplay.

**Решение:**
```typescript
// ❌ Не пытайся автовоспроизведение
audioRef.current.play(); // Будет заблокировано

// ✅ Показывай кнопку play, используй user gesture
<button onClick={() => audioRef.current.play()}>Play</button>
```

---

### 11. Типы не обновляются после миграции

**Симптом:** TypeScript не видит новые колонки/таблицы.

**Причина:** `types.ts` генерируется автоматически после применения миграции.

**Решение:**
1. Дождись применения миграции пользователем
2. Типы обновятся автоматически
3. **НЕ** редактируй `src/integrations/supabase/types.ts` вручную

---

### 12. Edge Function возвращает 500

**Чек-лист отладки:**
1. Проверь логи: `supabase--edge-function-logs`
2. Проверь CORS headers
3. Проверь что все env переменные настроены
4. Проверь JSON.parse ошибки

**Шаблон обработки ошибок:**
```typescript
try {
  const body = await req.json();
} catch (e) {
  return new Response(
    JSON.stringify({ error: 'Invalid JSON body' }),
    { status: 400, headers: corsHeaders }
  );
}
```

---

### 13. Дублирование toast уведомлений

**Симптом:** Одинаковые toast появляются несколько раз.

**Решение - использовать notify с дедупликацией:**
```typescript
import { notify } from '@/lib/notifications';

// ❌ Может дублироваться
toast.success('Сохранено');

// ✅ С дедупликацией
notify.success('Сохранено', { 
  dedupe: true, 
  dedupeKey: 'save-success',
  dedupeTimeout: 2000 
});
```

**Файлы:** `src/lib/notifications.ts`

---

### 14. Компактный layout на мобильных устройствах

**Симптом:** Слишком много контента, сложно читать на мобильных.

**Решение - адаптивные гриды:**
```tsx
// Компактные карточки
<div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 sm:gap-2">
  <Card className="p-1.5 sm:p-2">
    <p className="text-[10px] sm:text-xs">{label}</p>
    <p className="text-sm sm:text-base font-bold">{value}</p>
  </Card>
</div>

// Scroll areas для списков
<ScrollArea className="h-32 sm:h-40">
  {items.map(...)}
</ScrollArea>
```

---

## 📐 АРХИТЕКТУРНЫЕ ПАТТЕРНЫ

### Error Handling (ADR-004)

```typescript
import { 
  AppError, NetworkError, APIError, 
  toAppError, tryCatch, retryWithBackoff 
} from '@/lib/errors';

// Result type для async операций
const result = await tryCatch(() => fetchData());
if (!result.success) {
  showErrorWithRecovery(result.error);
  return;
}

// Retry с exponential backoff
const data = await retryWithBackoff(
  () => apiCall(),
  { maxRetries: 3, initialDelayMs: 1000 }
);
```

**Файлы:** `src/lib/errors/`, `ADR/ADR-004-error-handling.md`

---

### State Machine (ADR-005)

```typescript
import { useStateMachine, StateConfig } from '@/lib/stateMachine';

const config: StateConfig<States, Context> = {
  initial: 'idle',
  context: { data: null },
  states: {
    idle: { on: { FETCH: 'loading' } },
    loading: { 
      on: { SUCCESS: 'success', ERROR: 'error' },
      entry: (ctx) => console.log('Loading started')
    },
    success: { on: { RESET: 'idle' } },
    error: { on: { RETRY: 'loading', RESET: 'idle' } }
  }
};

const { state, send, can } = useStateMachine(config);
```

**Файлы:** `src/lib/stateMachine.ts`, `ADR/ADR-005-state-machine.md`

---

### Логирование

```typescript
import { logger } from '@/lib/logger';

// Уровни логирования
logger.debug('Debug info', { data });     // Только в dev
logger.info('User action', { userId });    // Только в dev
logger.warn('Warning', { issue });         // Всегда
logger.error('Error occurred', error);     // Всегда

// Таймеры для измерения производительности
const timer = logger.startTimer('API Call');
await apiCall();
timer(); // логирует длительность

// Группировка логов
logger.group('Operation');
logger.info('Step 1');
logger.info('Step 2');
logger.groupEnd();
```

**Файлы:** `src/lib/logger.ts`

---

### Типизированные ID (Branded Types)

```typescript
import { TrackId, UserId, createTrackId, isTrackId } from '@/types/branded';

// Создание типизированного ID
const trackId: TrackId = createTrackId('uuid-string');

// Type guard
if (isTrackId(value)) {
  // value гарантированно TrackId
}

// Предотвращает смешивание разных типов ID
function playTrack(id: TrackId) { ... }
playTrack(userId); // ❌ TypeScript ошибка
playTrack(trackId); // ✅ OK
```

**Файлы:** `src/types/branded.ts`

---

### Централизованный Audio Provider

```typescript
// Синглтон аудио элемента для всего приложения
<GlobalAudioProvider>
  <App />
</GlobalAudioProvider>

// Использование в компонентах
const { audioRef, play, pause, seek } = useAudio();
```

**Файлы:** `src/components/GlobalAudioProvider.tsx`

---

## 📊 БАЗА ДАННЫХ

### Ключевые таблицы

| Таблица | Описание | RLS |
|---------|----------|-----|
| `tracks` | Треки пользователей | По user_id |
| `track_versions` | Версии треков (A/B) | По user_id |
| `track_stems` | Стемы (vocals, drums, bass, other) | По user_id |
| `profiles` | Профили пользователей | По user_id |
| `user_credits` | Баланс и гамификация | По user_id |
| `generation_tasks` | Задачи генерации | По user_id |
| `music_projects` | Музыкальные проекты | По user_id |
| `project_tracks` | Треки в проектах | Через project |
| `playlists` | Плейлисты | По user_id |
| `playlist_tracks` | Треки в плейлистах | Через playlist |
| `comments` | Комментарии к трекам | По user_id |
| `track_likes` | Лайки треков | По user_id |
| `stars_transactions` | Telegram Stars платежи | По user_id |
| `reference_audio` | Референсные аудио | По user_id |
| `lyrics_templates` | Шаблоны лирики | По user_id |

### RLS паттерны

```sql
-- Пользователь может CRUD свои данные
CREATE POLICY "Users can CRUD own data"
ON public.table_name FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Публичный доступ на чтение
CREATE POLICY "Public read access"
ON public.table_name FOR SELECT
USING (is_public = true);

-- Админ доступ
CREATE POLICY "Admin full access"
ON public.table_name FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Доступ к связанным данным
CREATE POLICY "Access through parent"
ON public.child_table FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM parent_table 
    WHERE parent_table.id = child_table.parent_id 
    AND parent_table.user_id = auth.uid()
  )
);
```

### Включение Realtime

```sql
-- Включить realtime для таблицы
ALTER PUBLICATION supabase_realtime ADD TABLE public.tracks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.generation_tasks;
```

---

## 🔧 EDGE FUNCTIONS

### Архитектура генерации

```
suno-generate (legacy proxy)
    │
    ├── action: 'generate'    → suno-music-generate
    ├── action: 'extend'      → suno-extend-audio / suno-music-extend
    ├── action: 'cover'       → suno-remix
    ├── action: 'stems'       → suno-separate-vocals
    ├── action: 'add_vocals'  → suno-add-vocals
    └── action: 'lyrics'      → ai-lyrics-assistant
```

### Шаблон Edge Function

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Парсинг body
    const body = await req.json();
    const { param1, param2 } = body;

    // Валидация
    if (!param1) {
      return new Response(
        JSON.stringify({ error: 'param1 is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Получение секретов
    const apiKey = Deno.env.get('API_KEY');
    if (!apiKey) {
      throw new Error('API_KEY not configured');
    }

    // Логика функции
    console.log('Processing request:', { param1 });
    
    const result = await someAsyncOperation();

    // Успешный ответ
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
```

### Shared утилиты

```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// supabase/functions/_shared/suno.ts
export const SUNO_API_BASE = 'https://api.sunoapi.org';

export function isSunoSuccessCode(code: number | undefined): boolean {
  return code === 200 || code === 0;
}
```

---

## 📱 TELEGRAM ИНТЕГРАЦИЯ

### CSS переменные Telegram

```css
/* Автоматически устанавливаются Telegram WebApp */
--tg-viewport-height: высота viewport
--tg-viewport-stable-height: стабильная высота
--tg-safe-area-inset-top: верхний safe area
--tg-safe-area-inset-bottom: нижний safe area
--tg-content-safe-area-inset-top: контентный safe area сверху
--tg-content-safe-area-inset-bottom: контентный safe area снизу
--tg-theme-bg-color: цвет фона темы
--tg-theme-text-color: цвет текста темы
--tg-theme-button-color: цвет кнопок
--tg-theme-button-text-color: цвет текста кнопок
```

### Хуки Telegram

```typescript
import { useTelegramIntegration } from '@/hooks/useTelegramIntegration';

const { 
  isTelegram,      // boolean - запущено ли в Telegram
  tgUser,          // TelegramUser | null
  telegramId,      // number | null
  webApp,          // WebApp API
  platform,        // 'ios' | 'android' | 'web' | etc.
  colorScheme,     // 'light' | 'dark'
  themeParams,     // Параметры темы
  isReady,         // boolean - готов ли WebApp
} = useTelegramIntegration();

// Haptic feedback
webApp?.HapticFeedback.impactOccurred('medium');

// Main button
webApp?.MainButton.setText('Submit');
webApp?.MainButton.show();

// Back button
webApp?.BackButton.show();
```

### Telegram Stars платежи

```typescript
// Создание инвойса
const invoice = await supabase.functions.invoke('create-stars-invoice', {
  body: { 
    productCode: 'credits_100',
    amount: 100 
  }
});

// Открытие окна оплаты
webApp?.openInvoice(invoice.data.invoiceLink, (status) => {
  if (status === 'paid') {
    // Успешная оплата
  }
});
```

---

## 📋 ДОКУМЕНТАЦИЯ ПРОЕКТА

### Ключевые документы

| Файл | Описание |
|------|----------|
| `PROJECT_STATUS.md` | Текущий статус и прогресс |
| `ROADMAP.md` | Дорожная карта развития |
| `KNOWN_ISSUES_TRACKED.md` | Отслеживание известных проблем |
| `KNOWLEDGE_BASE.md` | Этот файл |

### Директория docs/

| Файл | Описание |
|------|----------|
| `docs/KNOWN_ISSUES.md` | Известные проблемы и решения |
| `docs/ARCHITECTURE.md` | Архитектура приложения |
| `docs/SUNO_API.md` | Документация Suno API |
| `docs/TELEGRAM_INTEGRATION.md` | Интеграция с Telegram |
| `docs/GAMIFICATION.md` | Система гамификации |

### ADR (Architecture Decision Records)

| Файл | Описание |
|------|----------|
| `ADR/ADR-001-audio-architecture.md` | Архитектура аудио |
| `ADR/ADR-002-player-state.md` | Состояние плеера |
| `ADR/ADR-003-track-versions.md` | Версии треков |
| `ADR/ADR-004-error-handling.md` | Обработка ошибок |
| `ADR/ADR-005-state-machine.md` | State machine |
| `ADR/ADR-006-telegram-webapp.md` | Telegram WebApp |

---

## ✅ ЧЕК-ЛИСТ ПРИ ДОБАВЛЕНИИ ФУНКЦИОНАЛА

### Перед началом работы

- [ ] Проверить существующие компоненты — возможно уже есть похожий функционал
- [ ] Изучить связанные файлы через поиск
- [ ] Проверить типы в `src/types/` и `src/integrations/supabase/types.ts`

### При разработке

- [ ] Использовать типизированные ошибки из `@/lib/errors`
- [ ] Логирование через `@/lib/logger`
- [ ] CSS переменные для Telegram safe area
- [ ] Семантические токены из дизайн-системы (НЕ прямые цвета)
- [ ] Lazy loading для тяжелых компонентов

### При работе с БД

- [ ] RLS политики для новых таблиц
- [ ] Проверить что auth.uid() используется корректно
- [ ] Включить Realtime если нужно

### При создании Edge Functions

- [ ] CORS headers
- [ ] Проверка секретов
- [ ] Обработка ошибок
- [ ] Логирование

### После разработки

- [ ] Cleanup в useEffect для подписок
- [ ] Проверить на мобильных устройствах
- [ ] Проверить в Telegram Mini App
- [ ] Особенно протестировать iOS Safari

---

## 🎨 ДИЗАЙН-СИСТЕМА

### Использование токенов

```tsx
// ✅ Правильно - семантические токены
<div className="bg-background text-foreground">
<div className="bg-primary text-primary-foreground">
<div className="bg-muted text-muted-foreground">
<div className="border-border">

// ❌ Неправильно - прямые цвета
<div className="bg-white text-black">
<div className="bg-purple-500">
```

### Основные токены

```css
/* Backgrounds */
--background: основной фон
--foreground: основной текст
--card: фон карточек
--card-foreground: текст карточек
--popover: фон поповеров
--popover-foreground: текст поповеров

/* Primary */
--primary: основной акцент
--primary-foreground: текст на primary

/* Secondary */
--secondary: вторичный акцент
--secondary-foreground: текст на secondary

/* Muted */
--muted: приглушенный фон
--muted-foreground: приглушенный текст

/* Accent */
--accent: акцентный цвет
--accent-foreground: текст на accent

/* Destructive */
--destructive: цвет ошибок/удаления
--destructive-foreground: текст на destructive

/* Border & Input */
--border: цвет границ
--input: фон инпутов
--ring: цвет фокуса
```

---

## 🔄 WORKFLOW РАЗРАБОТКИ

### Добавление новой таблицы

1. Создать миграцию через `supabase--migration`
2. Добавить RLS политики
3. Дождаться применения миграции
4. Типы обновятся автоматически
5. Использовать типы из `@/integrations/supabase/types`

### Добавление Edge Function

1. Создать файл в `supabase/functions/function-name/index.ts`
2. Использовать шаблон из этой документации
3. Добавить секреты через `secrets--add_secret` если нужно
4. Функция задеплоится автоматически

### Отладка

1. Console logs: `lov-read-console-logs`
2. Network requests: `lov-read-network-requests`
3. Edge function logs: `supabase--edge-function-logs`
4. DB queries: `supabase--read-query`
5. Session replay: `lov-read-session-replay`

---

## 📞 КОНТАКТЫ И РЕСУРСЫ

### API Документация

- **Suno API:** `docs/SUNO_API.md`
- **Telegram Bot API:** https://core.telegram.org/bots/api
- **Telegram Mini Apps:** https://core.telegram.org/bots/webapps

### Внутренние ресурсы

- **Supabase Project ID:** `ygmvthybdrqymfsqifmj`
- **Edge Functions URL:** `https://ygmvthybdrqymfsqifmj.supabase.co/functions/v1/`

---

> 💡 **Совет:** Используй поиск по этому файлу для быстрого нахождения решений. Ключевые слова: ошибка, проблема, решение, паттерн, шаблон.
