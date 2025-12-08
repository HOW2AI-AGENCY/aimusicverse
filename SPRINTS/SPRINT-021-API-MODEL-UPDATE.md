# Sprint 021: Suno API Model Parameter Update

## Overview

Исправление критической проблемы с устаревшими параметрами Suno API. API больше не принимает `mv` параметр и `chirp-*` идентификаторы моделей.

## Status: ✅ COMPLETED

## Duration: 1 day (2025-12-08)

## Problem Statement

Suno API изменил формат параметров:
- Параметр `mv` заменен на `model`
- Идентификаторы `chirp-crow`, `chirp-bluejay`, `chirp-auk`, `chirp-v4` заменены на `V5`, `V4_5PLUS`, `V4_5`, `V4`

## Completed Tasks

### Task 1: Update suno-music-generate ✅
- [x] Заменить `mv` на `model` в payload
- [x] Изменить getApiModelName возвращать V5/V4_5/V4 вместо chirp-*
- [x] Протестировать генерацию

### Task 2: Update suno-upload-extend ✅
- [x] Обновить MODEL_MAP на VALID_MODELS
- [x] Изменить getApiModelName для новых идентификаторов
- [x] Добавить маппинг V4_5ALL → V4_5

### Task 3: Update suno-upload-cover ✅
- [x] Обновить MODEL_MAP на VALID_MODELS
- [x] Изменить getApiModelName для новых идентификаторов
- [x] Добавить маппинг V4_5ALL → V4_5

### Task 4: Update retry-failed-tasks ✅
- [x] Обновить VALID_MODELS массив
- [x] Изменить getApiModelName функцию

### Task 5: Update Documentation ✅
- [x] Обновить docs/SUNO_API.md
- [x] Заменить все примеры с `mv` на `model`
- [x] Заменить chirp-* на V5/V4_5/V4 в таблице моделей
- [x] Добавить предупреждение о breaking changes
- [x] Добавить историю изменений

## Technical Changes

### Before (Deprecated)
```typescript
// Old MODEL_MAP
const MODEL_MAP = {
  'V5': 'chirp-crow',
  'V4_5PLUS': 'chirp-bluejay',
  'V4_5ALL': 'chirp-auk',
  'V4': 'chirp-v4',
};

// Old payload
const payload = {
  prompt: "...",
  mv: "chirp-crow"
};
```

### After (Current)
```typescript
// New VALID_MODELS
const VALID_MODELS = ['V5', 'V4_5PLUS', 'V4_5', 'V4', 'V3_5'];

function getApiModelName(uiKey: string): string {
  if (uiKey === 'V4_5ALL') return 'V4_5';
  return VALID_MODELS.includes(uiKey) ? uiKey : 'V4_5';
}

// New payload
const payload = {
  prompt: "...",
  model: "V5"
};
```

## Files Modified

1. `supabase/functions/suno-music-generate/index.ts`
2. `supabase/functions/suno-upload-extend/index.ts`
3. `supabase/functions/suno-upload-cover/index.ts`
4. `supabase/functions/retry-failed-tasks/index.ts`
5. `docs/SUNO_API.md`
6. `src/constants/sunoModels.ts` (already had correct mapping)

## Testing

- [x] Генерация в non-custom режиме с V5
- [x] Проверка логов - model: "V5" вместо mv: "chirp-crow"
- [x] Успешное завершение генерации

## Lessons Learned

1. API могут менять параметры без уведомления
2. Важно следить за актуальностью документации
3. Централизованная логика getApiModelName упрощает обновления
