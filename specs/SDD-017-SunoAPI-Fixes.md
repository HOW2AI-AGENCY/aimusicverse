# 📋 SDD: SunoAPI Edge Functions Fixes v1.0

**Epic ID:** E017-SunoAPI-Fixes  
**Создано:** 2025-12-12  
**Статус:** ✅ Completed  
**Приоритет:** P1 (Critical)

---

## 🎯 Проблема

Ряд edge функций SunoAPI возвращают non-2xx ошибки из-за несоответствия параметров документации API.

### Затронутые функции:
- `suno-add-vocals` - ✅ Исправлено (валидация параметров)
- `suno-add-instrumental` - ✅ Исправлено (валидация параметров)
- `suno-upload-cover` - ✅ Работает
- `suno-music-extend` - ✅ Исправлено (логика defaultParamFlag)
- `suno-replace-section` - ✅ Работает
- `generate-track-cover` - ✅ Исправлено (модель google/gemini-3-pro-image-preview)

---

## 📊 Анализ API документации

### Add Vocals (add-vocals)
**Endpoint:** `https://api.sunoapi.org/api/v1/generate/add-vocals`

**Обязательные параметры:**
- `uploadUrl` - URL аудио файла (инструментал)
- `prompt` - Описание желаемого вокала
- `title` - Название трека (макс 80 символов)
- `style` - Стиль музыки и вокала
- `negativeTags` - Исключаемые стили
- `callBackUrl` - URL для callback

**Опциональные параметры:**
- `vocalGender` - 'm' или 'f'
- `styleWeight` - 0.00-1.00
- `weirdnessConstraint` - 0.00-1.00
- `audioWeight` - 0.00-1.00
- `model` - V4_5PLUS (default), V5

### Add Instrumental (add-instrumental)
**Endpoint:** `https://api.sunoapi.org/api/v1/generate/add-instrumental`

Аналогичные обязательные параметры как add-vocals.

---

## ✅ Исправления (2025-12-12)

### Sprint 017-A: Parameter Validation

| ID | Задача | Статус |
|----|--------|--------|
| T017-A-01 | Добавить валидацию обязательных параметров в suno-add-vocals | ✅ Done |
| T017-A-02 | Добавить валидацию обязательных параметров в suno-add-instrumental | ✅ Done |
| T017-A-03 | Исправить маппинг модели V4_5ALL → V4_5PLUS | ✅ Done |
| T017-A-04 | Добавить логирование payload для отладки | ✅ Done |
| T017-A-05 | Исправить AddVocalsDialog - всегда передавать обязательные параметры | ✅ Done |
| T017-A-06 | Исправить AddInstrumentalDialog - всегда передавать обязательные параметры | ✅ Done |
| T017-A-07 | Исправить generate-track-cover - модель google/gemini-3-pro-image-preview | ✅ Done |

### Изменённые файлы:
- `supabase/functions/suno-add-vocals/index.ts`
- `supabase/functions/suno-add-instrumental/index.ts`
- `supabase/functions/generate-track-cover/index.ts`
- `src/components/AddVocalsDialog.tsx`
- `src/components/AddInstrumentalDialog.tsx`

---

## 🔍 Рекомендации по клиентскому коду

Компоненты `AddVocalsDialog` и `AddInstrumentalDialog` должны обязательно передавать:
- `prompt` - описание вокала/инструментала
- `title` - название трека
- `style` - стиль музыки
- `negativeTags` - опционально, но рекомендуется

---

## 📝 Код исправлений

### suno-add-vocals/index.ts - Валидация параметров

```typescript
// Validate required parameters per SunoAPI docs
if (!prompt) {
  return new Response(
    JSON.stringify({ error: 'prompt is required for add-vocals' }),
    { status: 400 }
  );
}
if (!title) {
  return new Response(
    JSON.stringify({ error: 'title is required for add-vocals' }),
    { status: 400 }
  );
}
if (!style) {
  return new Response(
    JSON.stringify({ error: 'style is required for add-vocals' }),
    { status: 400 }
  );
}

// Build request body - all fields required
const requestBody = {
  uploadUrl,
  prompt,
  title,
  style,
  negativeTags: negativeTags || '',
  callBackUrl,
  model: model === 'V4_5ALL' ? 'V4_5PLUS' : model,
};
```

---

## ⚠️ Известные ограничения SunoAPI

1. **Rate Limiting (429)** - Частые запросы вызывают блокировку
2. **Credit Limit (430)** - Недостаточно кредитов
3. **Model versions** - Только V4_5PLUS и V5 для add-vocals/add-instrumental
4. **Audio retention** - Сгенерированное аудио хранится 15 дней

---

## 🔗 Связанные спринты

- SDD-015 Sprint 015-A: Исправление критических багов Studio
- SDD-014 Sprint 014-C: Real-time логи генерации
