# Исправление ошибки useSyncExternalStore - 9 декабря 2025

## 🎯 Проблема

При запуске Telegram Mini App возникала критическая ошибка:

```
vendor-other-CIhvNVqJ.js:10 Uncaught TypeError: Cannot read properties of undefined (reading 'useSyncExternalStore')
```

Приложение не могло запуститься из-за того, что библиотека TanStack Query пыталась использовать React хук до того, как React был полностью загружен.

## 🔍 Анализ причины

### Обнаруженная проблема

1. **Разделение пакетов**:
   - `@tanstack/query-core` (ядро) → попадал в `vendor-other` (500 КБ)
   - `@tanstack/react-query` (React биндинги) → попадал в `vendor-query` (3.2 КБ)

2. **Циклическая зависимость**:
   - `vendor-query` импортировал утилиты из `vendor-other`
   - Обе части использовали `useSyncExternalStore` хук
   - Если `vendor-other` загружался до инициализации React → ошибка

3. **Порядок загрузки**:
   ```html
   1. vendor-react ✅ 2. vendor-utils ✅ 3. vendor-other ⚠️ (содержит query-core с хуками) 4. vendor-radix ... 11.
   vendor-query ⚠️ (импортирует из vendor-other)
   ```

## ✅ Решение

### Изменения в коде

Обновлен файл `vite.config.ts` (строки 118-121):

```typescript
// БЫЛО (неправильно):
if (id.includes("@tanstack/react-query")) {
  return "vendor-query";
}

// СТАЛО (правильно):
// TanStack Query - ОБЯЗАТЕЛЬНО включать react-query И query-core
// Утилиты query-core должны быть вместе с react-query для предотвращения циклических зависимостей
if (id.includes("@tanstack/react-query") || id.includes("@tanstack/query-core")) {
  return "vendor-query";
}
```

### Почему это работает

1. ✅ **Колокация**: Весь код TanStack Query теперь в одном чанке
2. ✅ **Нет циклических импортов**: `vendor-query` больше не импортирует из `vendor-other`
3. ✅ **Правильный порядок**: `vendor-query` импортирует только из `vendor-react` (который загружается первым)
4. ✅ **Безопасная инициализация**: Когда TanStack Query инициализируется, React хуки гарантированно доступны

## 📊 Результаты

### Размеры чанков

| Чанк         | До        | После     | Изменение                         |
| ------------ | --------- | --------- | --------------------------------- |
| vendor-query | 3.2 КБ    | 43.32 КБ  | +40 КБ ✅ (теперь самодостаточен) |
| vendor-other | 500.26 КБ | 460.05 КБ | -40 КБ ✅ (убран query-core)      |

### Импорты

**До (НЕПРАВИЛЬНО):**

```javascript
// vendor-query импортировал из vendor-other:
import {az as c, aA as l, ...} from "./vendor-other-CIhvNVqJ.js";
```

**После (ПРАВИЛЬНО):**

```javascript
// vendor-query импортирует только из vendor-react:
from"./vendor-react-CSX_DmOJ.js"
```

## ✅ Проверки

### Сборка

```bash
npm run build
# ✓ built in 30.91s
# Ошибок нет, все чанки сгенерированы правильно ✅
```

### TypeScript

```bash
npx tsc --noEmit
# Ошибок типов нет ✅
```

### Dev сервер

```bash
npm run dev
# VITE v5.4.21 ready in 272 ms
# ➜ Local: http://localhost:8080/
# Запускается успешно ✅
```

### Code Review

- ✅ Прошел проверку кода
- 2 комментария о датах (не критично)

### Безопасность (CodeQL)

- ✅ 0 уязвимостей найдено
- ✅ Все проверки безопасности пройдены

## 📚 Документация

Создано:

- ✅ `TANSTACK_QUERY_CHUNKING_FIX.md` - подробная техническая документация на английском
- ✅ `FIX_SUMMARY_RU_2025-12-09.md` - краткое описание на русском (этот файл)
- ✅ Комментарии в `vite.config.ts` с объяснением исправления

## 🔗 Связанные исправления

Это **четвертое** исправление в серии проблем с порядком загрузки React модулей:

1. ✅ **REACT_LOADING_ORDER_FIX.md** - плагин reactPriorityPlugin для приоритетной загрузки React
2. ✅ **REACT_HOOKS_UNDEFINED_FIX.md** - перемещение react-redux и zustand в vendor-react
3. ✅ **REACT_HOOKS_MODULE_INIT_FIX.md** - перемещение react-remove-scroll в vendor-radix
4. ✅ **TANSTACK_QUERY_CHUNKING_FIX.md** - это исправление (колокация TanStack Query)

## 🎓 Для будущей разработки

### Правило для библиотек с несколькими пакетами

При добавлении новых зависимостей проверяйте:

1. ❓ **Разделена ли библиотека на несколько пакетов?**
   - Например: `@tanstack/react-query` + `@tanstack/query-core`
   - Или: `@radix-ui/react-dialog` + `react-remove-scroll` + `use-callback-ref`

2. ❓ **Используют ли они React хуки во время инициализации модуля?**
   - Признаки: вызов хуков вне функций компонентов
   - Паттерн: `const useSync = React.useLayoutEffect || React.useEffect`

3. ✅ **Если да → все пакеты должны быть в одном чанке!**

### Шаблон для vite.config.ts

```typescript
// ✅ ПРАВИЛЬНО - все связанные пакеты вместе
if (id.includes("@library/react") || id.includes("@library/core")) {
  return "vendor-library";
}

// ❌ НЕПРАВИЛЬНО - создает циклические зависимости
if (id.includes("@library/react")) {
  return "vendor-library";
}
// @library/core попадет в vendor-other!
```

## 🚀 Статус

- ✅ **Код**: Исправлен и протестирован
- ✅ **Сборка**: Успешна
- ✅ **Проверки**: Все пройдены
- ✅ **Документация**: Создана
- ✅ **Безопасность**: Уязвимостей нет
- ⏳ **Тестирование в Telegram**: Требуется после деплоя

---

**Готово к слиянию и деплою для тестирования в Telegram Mini App.**

**Дата**: 9 декабря 2025  
**Статус**: ✅ Исправлено и проверено  
**Приоритет**: P0 (критический - приложение не запускалось)  
**Влияние**: Готово к продакшен деплою
