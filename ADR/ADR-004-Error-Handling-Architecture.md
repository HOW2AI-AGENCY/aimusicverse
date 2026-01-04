# ADR-004: Архитектура обработки ошибок

- **Статус:** Принято
- **Дата:** 2025-12-19

## Контекст

Приложение имело разрозненную обработку ошибок: часть использовала try-catch с console.error, часть — toast уведомления, часть — собственные типы ошибок. Это приводило к:
- Непоследовательному UX при ошибках
- Сложности в отладке
- Невозможности корректно обрабатывать retry логику

## Решение

### 1. Иерархия типизированных ошибок

```typescript
AppError (base)
├── NetworkError     // Сетевые ошибки
├── APIError         // Ошибки API (401, 403, 404, 429, 5xx)
├── ValidationError  // Ошибки валидации
├── AudioError       // Ошибки аудио
├── GenerationError  // Ошибки генерации
├── InsufficientCreditsError
└── StorageError
```

### 2. Метаданные ошибок

Каждый `ErrorCode` имеет метаданные:
- `severity`: LOW | MEDIUM | HIGH | FATAL
- `recoveryStrategy`: NONE | RETRY | RETRY_BACKOFF | REFRESH | REAUTH | MANUAL
- `retryable`: boolean
- `retryAfterMs`: number (optional)
- `userActionRequired`: string (optional)

### 3. Result Type

Функциональный подход без try-catch:

```typescript
type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Использование
const result = await tryCatch(() => fetchData());
if (!result.success) {
  showErrorWithRecovery(result.error);
  return;
}
// result.data теперь типизирован
```

### 4. Retry с Backoff

```typescript
const data = await retryWithBackoff(
  () => apiCall(),
  { maxRetries: 3, initialDelayMs: 1000 }
);
```

## Последствия

### Положительные:
- **Консистентность**: Все ошибки проходят через единую систему
- **Типобезопасность**: TypeScript гарантирует корректную обработку
- **Автоматический retry**: Retryable ошибки автоматически обрабатываются
- **Лучший UX**: Пользователь видит понятные сообщения с действиями

### Отрицательные:
- **Миграция**: Нужно постепенно обновить существующий код
- **Обучение**: Новый паттерн для команды

## Файлы

- `src/lib/errors/AppError.ts` — Классы и утилиты
- `src/lib/errors/index.ts` — Экспорты
- `src/lib/errorHandling.ts` — Централизованные обработчики
