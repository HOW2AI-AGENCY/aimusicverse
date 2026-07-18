# Architecture Refactoring — 2026-07-18

> 6 из 7 критических архитектурных проблем исправлено.  
> Все изменения: 4 коммита, 0 ошибок tsc, `npm run build` успешно.

---

## Что сделано

| # | Задача | Коммит | Описание |
|---|---|---|---|
| 1 | **Vite/Storybook peer dep** | `a510db24e` | `@storybook/addon-essentials` ^7.0.6 → ^8.1.0. `npm install` теперь без `--legacy-peer-deps` |
| 2 | **Дублирующиеся директории** | `a510db24e` | `error↔errors` → `errors/`, `dialog↔dialogs` → `dialog/`, `payment↔payments` → `payments/`. Пустые `gestures/`, `queue/` удалены |
| 3 | **Декомпозиция AudioRecordDialog** | `758c2a09e` | 715→143 строк (-80%). Логика → `useAudioRecordDialog`, UI → `RecordTabContent`, `ProcessingActionCards` |
| 4 | **Supabase types 7k → subdir** | `d0e9044a1` | `types.ts` → `types/_generated.ts`, создан `types/index.ts` barrel. Добавлен `npm run supabase:types` |
| 5 | **any → unknown** | `567ff1940` | 6 `eslint-disable no-explicit-any` удалены из `suno-error-mapper.ts` + `errorHandling.ts`. Паттерн: `asErrorLike()` type guard |
| 6 | **Sprint docs entropy** | `a510db24e` | 39 stale файлов → `SPRINTS/archived/`. README обновлён, указан WORKPLAN как source of truth |

## Что осталось

| # | Задача | Сложность | Когда |
|---|---|---|---|
| 7 | **Бандл 7.9 MB → 2.3 MB** | Средняя | Отложено. Нужно: `vite.config.ts` → `manualChunks`, `rollupOptions` |

## Структурные изменения

### Новые файлы
- `src/components/audio-record/useAudioRecordDialog.ts` — хук записи
- `src/components/audio-record/RecordTabContent.tsx` — UI записи
- `src/components/audio-record/ProcessingActionCards.tsx` — сетка действий
- `src/integrations/supabase/types/index.ts` — barrel
- `src/integrations/supabase/types/_generated.ts` — сгенерированные типы

### Перемещённые файлы
- `src/components/dialogs/*` → `src/components/dialog/*`
- `src/components/error/*` → `src/components/errors/*`
- `src/components/payment/*` → `src/components/payments/*`
- `src/integrations/supabase/types.ts` → `src/integrations/supabase/types/_generated.ts`

### Удалённые директории
- `src/components/dialogs/`
- `src/components/error/`
- `src/components/payment/`
- `src/components/gestures/`
- `src/components/queue/`

## Метрики (2026-07-18)

- Components: 1042 | Hooks: 439 | Stores: 23 | API: 32 | Services: 62 | Pages: 71 | Lib: 138
- tsc: 0 errors
- Tests: 1810 unit, 59 E2E
- Bundle: ~508 KB gzip eager JS, 2.11 MB total
- Файлы >500 LOC в src/: 83 (уменьшение на 1 после декомпозиции AudioRecordDialog)
- Edge-функции >800 LOC: 7 (Sprint 067)
