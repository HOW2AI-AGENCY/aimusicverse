# 🔧 Telegram Mini App: Critical Fixes

Документация критических исправлений для стабильной работы TG Mini App.

## Проблема: Чёрный экран при запуске

### Симптомы
- Приложение не загружается в Telegram
- Белый/чёрный экран без контента
- Ошибки в консоли: "Cannot access before initialization"
- Ошибки: "Cannot read useSyncExternalStore"

### Причины

#### 1. Circular Dependencies в Tone.js
```
Error: Cannot access 'X' before initialization
```

**Причина**: Vite tree-shaking разбивает Tone.js на chunks, создавая circular dependencies.

**Решение** (vite.config.ts):
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        tone: ['tone'], // Держать Tone.js в одном chunk
      }
    }
  }
}

optimizeDeps: {
  include: ['tone'], // Pre-bundle для избежания проблем
}
```

#### 2. useSyncExternalStore Chunking
```
Error: Cannot read property 'useSyncExternalStore' of undefined
```

**Причина**: React hook `useSyncExternalStore` (используется Zustand) неправильно разделяется.

**Решение** (vite.config.ts):
```typescript
optimizeDeps: {
  include: ['use-sync-external-store'],
}
```

#### 3. Blocking tg.showPopup во время инициализации
**Причина**: Вызов `tg.showPopup()` до полной инициализации блокирует UI.

**Решение** (TelegramContext.tsx):
```typescript
// НЕ использовать blocking popups в процессе инициализации
try {
  await authenticate();
} catch (error) {
  // Логировать ошибку, но НЕ показывать popup
  logger.error('Auth failed', error);
} finally {
  // ВСЕГДА вызывать ensureInitialized
  ensureInitialized();
}
```

#### 4. Missing Fallback UI
**Причина**: Нет fallback контента пока React грузится.

**Решение** (index.html):
```html
<div id="root">
  <div id="initial-loader" style="...">
    <div class="spinner"></div>
    <p>Загрузка MusicVerse...</p>
  </div>
</div>

<style>
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255,255,255,0.3);
    border-top-color: #8B5CF6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
```

## InitializationGuard

Multi-level timeout strategy для graceful recovery:

```typescript
// src/components/InitializationGuard.tsx
const TIMEOUT_LEVELS = [
  { ms: 1500, message: 'Подключение...' },
  { ms: 3000, message: 'Проверка соединения...' },
  { ms: 5000, message: 'Восстановление...' }
];

function InitializationGuard({ children }) {
  const [level, setLevel] = useState(0);
  const { isInitialized, error } = useTelegram();
  
  useEffect(() => {
    if (isInitialized) return;
    
    const timer = setTimeout(() => {
      if (level < TIMEOUT_LEVELS.length - 1) {
        setLevel(l => l + 1);
      } else {
        // Force initialization after all timeouts
        forceInitialize();
      }
    }, TIMEOUT_LEVELS[level].ms);
    
    return () => clearTimeout(timer);
  }, [level, isInitialized]);
  
  if (!isInitialized) {
    return <LoadingScreen message={TIMEOUT_LEVELS[level].message} />;
  }
  
  return children;
}
```

## Vite Configuration

Полная конфигурация для стабильной работы:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          // Критические библиотеки в отдельных chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-tone': ['tone'],
          'vendor-motion': ['framer-motion'],
        }
      },
      treeshake: {
        moduleSideEffects: 'no-external', // Важно!
      }
    }
  },
  optimizeDeps: {
    include: [
      'tone',
      'use-sync-external-store',
      'zustand',
      '@tanstack/react-query'
    ]
  }
});
```

## Чеклист проверки

- [ ] Приложение загружается за < 3 секунды
- [ ] Нет ошибок "Cannot access before initialization"
- [ ] Нет ошибок "useSyncExternalStore"
- [ ] Fallback loader отображается до загрузки React
- [ ] tg.ready() вызывается корректно
- [ ] InitializationGuard корректно обрабатывает timeouts

## Мониторинг

### Ключевые метрики
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Initialization success rate
- Error rate by type

### Логирование
```typescript
// Логировать критические события инициализации
logger.info('TG Mini App init start', { 
  platform: tg.platform,
  version: tg.version 
});

logger.info('TG Mini App init complete', { 
  duration: Date.now() - startTime 
});
```

## Known Issues

1. **iOS Safari**: Иногда требует повторного открытия Mini App
2. **Android WebView**: Возможны проблемы с Audio Context
3. **Desktop Telegram**: Некоторые API недоступны

## Rollback Plan

При критических проблемах:
1. Откатить vite.config.ts к предыдущей версии
2. Отключить проблемные features через feature flags
3. Использовать CDN версии библиотек как fallback
