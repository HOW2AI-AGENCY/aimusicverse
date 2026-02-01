
# План: Создание унифицированного хука useAudioProcessing

## Цель
Объединить логику 4 отдельных хуков прогресса (`useAddVocalsProgress`, `useAddInstrumentalProgress`, `useExtendProgress`, и частично Cover) в единый `useAudioProcessing` хук с общим отслеживанием прогресса и типобезопасным API.

## Анализ текущего состояния

### Существующие хуки (дублирование ~85% кода):
- `useAddVocalsProgress` (262 строки)
- `useAddInstrumentalProgress` (269 строк)
- `useExtendProgress` (266 строк)
- Cover - логика встроена прямо в `AudioCoverDialog.tsx`

### Общие элементы:
- Статусы: `idle`, `submitting`, `pending`, `processing`, `streaming_ready`, `completed`, `error`
- Realtime подписки на `generation_tasks`
- Polling fallback каждые 5 секунд
- Инвалидация React Query кэша

## Архитектура решения

```
src/hooks/generation/
├── useAudioProcessing.ts       # Новый унифицированный хук
├── audioProcessing/
│   ├── types.ts                # Типы и интерфейсы
│   ├── constants.ts            # Константы статусов и сообщений
│   ├── useProgressTracking.ts  # Базовый хук отслеживания
│   └── operations/
│       ├── extend.ts           # Операция расширения
│       ├── cover.ts            # Операция кавера
│       ├── addVocals.ts        # Операция добавления вокала
│       └── addInstrumental.ts  # Операция добавления инструментала
└── index.ts                    # Экспорты (обновить)
```

## Детали реализации

### 1. Типы (`audioProcessing/types.ts`)

```typescript
// Типы операций
export type AudioProcessingOperation = 
  | 'extend' 
  | 'cover' 
  | 'add_vocals' 
  | 'add_instrumental';

// Общий статус
export type ProcessingStatus = 
  | 'idle'
  | 'submitting'
  | 'pending'
  | 'processing'
  | 'streaming_ready'
  | 'completed'
  | 'error';

// Базовое состояние
export interface ProcessingState {
  status: ProcessingStatus;
  taskId: string | null;
  trackId: string | null;
  error: string | null;
  progress: number;
  message: string;
  completedTrack: CompletedTrack | null;
}

// Расширенные данные для специфичных операций
export interface ExtendedProcessingState extends ProcessingState {
  operation: AudioProcessingOperation;
  studioProjectId?: string | null;  // для add_instrumental
  sourceTrackId?: string | null;    // для extend
}

// Параметры операций
export interface ExtendParams {
  sourceTrackId: string;
  continueAt?: number;
  prompt?: string;
  style?: string;
  title?: string;
  model?: string;
  // ... остальные параметры
}

export interface CoverParams {
  audioFile?: File;
  audioUrl?: string;
  style: string;
  title?: string;
  lyrics?: string;
  instrumental?: boolean;
  model?: string;
  // ...
}

export interface AddVocalsParams {
  trackId?: string;
  audioUrl?: string;
  lyrics: string;
  style: string;
  title?: string;
  // ...
}

export interface AddInstrumentalParams {
  trackId?: string;
  audioUrl?: string;
  style: string;
  title?: string;
  openInStudio?: boolean;
  // ...
}
```

### 2. Константы (`audioProcessing/constants.ts`)

```typescript
export const STATUS_MESSAGES: Record<AudioProcessingOperation, Record<ProcessingStatus, string>> = {
  extend: {
    idle: '',
    submitting: 'Отправляем запрос...',
    pending: 'В очереди на обработку...',
    processing: 'AI расширяет трек...',
    streaming_ready: 'Почти готово...',
    completed: 'Трек расширен!',
    error: 'Ошибка при расширении трека',
  },
  cover: {
    // аналогично для cover
  },
  add_vocals: {
    // аналогично для add_vocals
  },
  add_instrumental: {
    // аналогично для add_instrumental
  },
};

export const OPERATION_ENDPOINTS: Record<AudioProcessingOperation, string> = {
  extend: 'suno-music-extend',
  cover: 'suno-upload-cover',
  add_vocals: 'suno-add-vocals',
  add_instrumental: 'suno-add-instrumental',
};
```

### 3. Базовый хук отслеживания (`audioProcessing/useProgressTracking.ts`)

```typescript
export function useProgressTracking(operation: AudioProcessingOperation) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ExtendedProcessingState>({...});

  // Универсальные методы
  const setSubmitting = useCallback(() => {...}, [operation]);
  const startTracking = useCallback((taskId, trackId, extra?) => {...}, [operation]);
  const setError = useCallback((error) => {...}, [operation]);
  const reset = useCallback(() => {...}, []);

  // Realtime подписка + polling
  useEffect(() => {
    if (!state.taskId || state.status === 'completed' || state.status === 'error') return;

    const channel = supabase
      .channel(`audio-processing-${state.taskId}`)
      .on('postgres_changes', {...}, handleTaskUpdate)
      .subscribe();

    const pollInterval = setInterval(pollTaskStatus, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [state.taskId, state.status]);

  return {
    state,
    setSubmitting,
    startTracking,
    setError,
    reset,
    isActive: ...,
    isCompleted: ...,
    isError: ...,
  };
}
```

### 4. Главный хук (`useAudioProcessing.ts`)

```typescript
export function useAudioProcessing() {
  // Инстансы для каждой операции (ленивая инициализация)
  const extendProgress = useProgressTracking('extend');
  const coverProgress = useProgressTracking('cover');
  const addVocalsProgress = useProgressTracking('add_vocals');
  const addInstrumentalProgress = useProgressTracking('add_instrumental');

  // Функции запуска операций
  const extend = useCallback(async (params: ExtendParams) => {
    extendProgress.setSubmitting();
    try {
      const { data, error } = await supabase.functions.invoke('suno-music-extend', {
        body: buildExtendPayload(params),
      });
      if (error) throw error;
      if (data?.taskId) {
        extendProgress.startTracking(data.taskId, data.trackId);
      }
      return { success: true, taskId: data.taskId, trackId: data.trackId };
    } catch (err) {
      extendProgress.setError(getErrorMessage(err));
      return { success: false, error: err };
    }
  }, []);

  const cover = useCallback(async (params: CoverParams) => {...}, []);
  const addVocals = useCallback(async (params: AddVocalsParams) => {...}, []);
  const addInstrumental = useCallback(async (params: AddInstrumentalParams) => {...}, []);

  // Активные операции
  const activeOperations = useMemo(() => {
    const ops: AudioProcessingOperation[] = [];
    if (extendProgress.isActive) ops.push('extend');
    if (coverProgress.isActive) ops.push('cover');
    if (addVocalsProgress.isActive) ops.push('add_vocals');
    if (addInstrumentalProgress.isActive) ops.push('add_instrumental');
    return ops;
  }, [extendProgress.isActive, coverProgress.isActive, ...]);

  return {
    // Операции
    extend,
    cover,
    addVocals,
    addInstrumental,

    // Прогресс по операциям
    extendProgress: extendProgress.state,
    coverProgress: coverProgress.state,
    addVocalsProgress: addVocalsProgress.state,
    addInstrumentalProgress: addInstrumentalProgress.state,

    // Управление
    resetAll: () => {
      extendProgress.reset();
      coverProgress.reset();
      addVocalsProgress.reset();
      addInstrumentalProgress.reset();
    },

    // Мета
    activeOperations,
    hasActiveOperation: activeOperations.length > 0,
  };
}
```

### 5. Обратная совместимость

Сохраним старые хуки как обёртки:

```typescript
// useAddVocalsProgress.ts (deprecated wrapper)
/** @deprecated Use useAudioProcessing().addVocalsProgress instead */
export function useAddVocalsProgress() {
  const { addVocals, addVocalsProgress, resetAll } = useAudioProcessing();
  
  return {
    ...addVocalsProgress,
    setSubmitting: () => {}, // handled internally
    startTracking: (taskId, trackId) => {}, // handled internally
    setError: () => {}, // handled internally
    reset: resetAll,
    isActive: addVocalsProgress.status !== 'idle' && ...,
    isCompleted: addVocalsProgress.status === 'completed',
    isError: addVocalsProgress.status === 'error',
  };
}
```

## Файлы для создания/изменения

### Создать:
1. `src/hooks/generation/audioProcessing/types.ts` - Типы и интерфейсы
2. `src/hooks/generation/audioProcessing/constants.ts` - Константы статусов
3. `src/hooks/generation/audioProcessing/useProgressTracking.ts` - Базовый хук
4. `src/hooks/generation/audioProcessing/index.ts` - Экспорты модуля
5. `src/hooks/generation/useAudioProcessing.ts` - Главный унифицированный хук

### Изменить:
1. `src/hooks/generation/index.ts` - Добавить экспорт нового хука
2. `src/hooks/generation/useAddVocalsProgress.ts` - Пометить как deprecated (опционально - для миграции)
3. `src/hooks/generation/useAddInstrumentalProgress.ts` - Пометить как deprecated
4. `src/hooks/generation/useExtendProgress.ts` - Пометить как deprecated

## Преимущества

1. **Уменьшение дублирования**: ~800 строк кода → ~300 строк
2. **Единая точка входа**: Один хук для всех audio processing операций
3. **Типобезопасность**: Строгая типизация параметров для каждой операции
4. **Расширяемость**: Легко добавить новые операции (remix, stems, etc.)
5. **Обратная совместимость**: Старые хуки продолжают работать

## Технические детали

- Использование `useCallback` и `useMemo` для оптимизации
- Единый канал Realtime подписки с фильтрацией по taskId
- Централизованная обработка ошибок через `@/lib/errors`
- Интеграция с существующим `GenerationProgressBar` компонентом
