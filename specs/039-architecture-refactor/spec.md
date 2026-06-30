# Spec 039: Архитектурный рефакторинг + Type Safety

**Sprint:** 039  
**Дата:** 2026-06-30  
**Статус:** 🟡 В работе  
**Приоритет:** Critical (технический долг блокирует масштабирование)  
**Зависимость:** Sprint 038 ✅ завершён

---

## Контекст и мотивация

Архитектурный аудит 2026-06-28 выявил системные нарушения, накопившиеся за 38 спринтов:

- **60+ компонентов** обходят API-слой и вызывают `supabase.from()` напрямую, нарушая принцип единой точки доступа к данным
- **615 использований `any`** в TypeScript исходниках — типичный индикатор срочно написанного кода, не прошедшего code review
- **Несколько god-компонентов** (GlobalAudioProvider 982 строк, StudioShell 995+ строк) нарушают принцип единственной ответственности
- **E2E тесты написаны (47 spec), но 0% проходят в CI** из-за отсутствия правильного окружения
- Оценка архитектуры: **6.1/10** → цель **8.4/10**

Без исправления этих проблем каждый новый спринт увеличивает стоимость изменений и риск регрессий.

**Два пункта уже выполнены до старта Sprint 039:**
- `useGenerateForm.ts` (god-хук) уже разбит на sub-хуки (039-06 ✅)
- `@hello-pangea/dnd` удалён, DnD унифицирован на `@dnd-kit` (039-09 ✅)

---

## Цели

| Метрика | Было | Цель |
|---------|------|------|
| Прямые вызовы `supabase.from()` в UI | 60+ | 0 |
| Использования `any` | 615 | <50 |
| Файлы >1000 строк | 5+ | 0 |
| E2E тесты в CI | 0% | ≥75% |
| DnD библиотеки | 2 | 1 ✅ |
| Бандл | 918 KB | ≤900 KB |

---

## Архитектурные принципы

### 1. Строгое разделение слоёв

```
Component/Page
    ↓ useQuery / useMutation
Hook
    ↓ import
Service (бизнес-логика)
    ↓ import
API (src/api/*.api.ts)
    ↓ import
supabase client
```

**Запрещено:** Любой вызов `supabase.from()`, `supabase.rpc()`, `supabase.auth.*`, `supabase.storage.*` за пределами `src/api/` директории.

**Исключение:** `src/integrations/supabase/client.ts` (конфигурация клиента).

### 2. Размер файлов

| Категория | Лимит |
|-----------|-------|
| Компонент | ≤300 строк |
| Хук | ≤250 строк |
| Сервис | ≤200 строк |
| API файл | ≤150 строк |
| Страница (Page) | ≤200 строк |

God-компоненты (>500 строк) должны быть декомпозированы на субкомпоненты с чёткими границами ответственности.

### 3. Type Safety

- Нет `any` в `src/api/` файлах
- Нет `as any` в `src/services/` файлах  
- Нет `as unknown as X` (обходной кастинг)
- Все Supabase RPC вызовы типизированы через сгенерированные типы

### 4. E2E тестирование

- Все внешние API (Suno, Supabase) мокируются в тестах
- `page.route()` перехватывает сетевые запросы
- CI pipeline запускает E2E на каждом push в main

---

## Фаза A: Layer Architecture (39-01 — 039-05)

### Нарушения слоёв — список файлов

Выявлено grep-ом `supabase\.from\|supabase\.rpc\|supabase\.auth\|supabase\.storage` в `src/components/`, `src/pages/`, `src/stores/`:

**Приоритетные нарушители (read-only, batch 1):**
- `UnifiedVersionSelector.tsx` — `select * from track_versions`
- `GenerationResultSheet.tsx` — `select from generation_tasks`
- `GlobalGenerationIndicator.tsx` — realtime subscription на `generation_tasks`
- `TrackCard.tsx` — `update likes_count`
- `LibraryPage.tsx` — `select from tracks`

**Write-операции (batch 2):**
- `EditableTrackTitle.tsx` — `update tracks`
- `AudioActionDialog.tsx` — `select + update tracks`
- `ExtendTrackDialog.tsx` — `insert into generation_tasks`
- Store-файлы с прямым Supabase доступом

### Паттерн исправления

```typescript
// ❌ ЗАПРЕЩЕНО: компонент обращается к Supabase напрямую
const { data } = await supabase
  .from("track_versions")
  .select("*")
  .eq("track_id", trackId);

// ✅ ПРАВИЛЬНО: через API-слой
import { getTrackVersions } from "@/api/tracks.api";
const { data } = await getTrackVersions(trackId);
```

### Generic Undo/Redo Middleware (039-04)

Три независимые реализации undo/redo унифицируются в одну:

```typescript
// src/stores/middleware/undoRedo.ts
export function withHistory<T>(config: {
  limit?: number;       // default: 50
  include?: (keyof T)[]; // tracked fields only
}): StateCreator<T & HistoryState<T>>

// Использование
const useMyStore = create(withHistory<MyState>({ limit: 30 })(
  (set) => ({ /* state */ })
))
```

**Затронутые сторы:** `useMixerHistoryStore`, `useLyricsHistoryStore`, `useUnifiedStudioStore`

---

## Фаза B: God-компоненты + Bundle (039-06 — 039-09)

### 039-06: useGenerateForm ✅ ЗАВЕРШЕНО

**Факт:** `useGenerateForm.ts` уже является orchestrator-хуком (280 строк). Sub-хуки существуют:
- `useGenerateFormSubmit.ts` (552 строки) — бизнес-логика отправки
- `useGenerateFormDraft.ts` — LocalStorage persistence  
- `useGenerateFormValidation.ts` — валидация и Boost
- `useGenerateDraft.ts` — черновики

**Следующий шаг:** Рассмотреть декомпозицию `useGenerateFormSubmit.ts` (552 строки > лимит 250).

### 039-07: GlobalAudioProvider.tsx (982 строки)

**Критически важный компонент** — используется через весь app как единственный источник аудио.

Целевая декомпозиция:
```
GlobalAudioProvider.tsx     (~150 строк) — провайдер + контекст
  ├── useAudioCore.ts       (~200 строк) — HTMLAudioElement management
  ├── useAudioQueue.ts      (~200 строк) — queue logic, shuffle, repeat
  ├── useAudioControls.ts   (~150 строк) — play/pause/seek/volume
  └── useAudioAnalytics.ts  (~100 строк) — play tracking, history
```

**Инвариант:** Публичный API `useGlobalAudioPlayer()` не изменяется. Компоненты-потребители не требуют изменений.

**Риск:** Высокий. iOS Safari AudioContext. Обязательно писать тесты перед рефакторингом.

### 039-08: Oversized компоненты

| Файл | Строк | Целевое разбиение |
|------|-------|-------------------|
| `StudioShell.tsx` | 995+ | `StudioLayout` + `StudioToolbar` + `StudioPanels` |
| `LyricsStudio.tsx` | 1092 | `LyricsEditor` + `LyricsTimeline` + `LyricsToolbar` |
| `usePromptDJEnhanced.ts` | 1071 | разбить на `usePromptDJState` + `usePromptDJActions` + `usePromptDJAI` |
| `drum-kits.ts` | 1439 | разбить на файлы по категориям |

### 039-09: DnD унификация ✅ ЗАВЕРШЕНО

`@hello-pangea/dnd` удалён. Все drag-and-drop операции используют `@dnd-kit`.

---

## Фаза C: Type Safety + E2E Green (039-10 — 039-14)

### Стратегия устранения `any` (039-10)

**Приоритет 1 — API файлы (нулевой допуск):**
```typescript
// ❌ Было
const { data } = await supabase.rpc("get_stats", params) as any;

// ✅ Стало
interface StatsRow { total: number; completed: number; }
const { data } = await supabase.rpc<StatsRow[]>("get_stats", params);
```

**Приоритет 2 — Сервисы:**
- `export.service.ts` — типизировать форматы экспорта
- `credits.service.ts` — уже типизирован, проверить

**Приоритет 3 — Хуки (после декомпозиции god-хуков):**
- Декомпозиция делает хуки меньше и легче типизировать

**Инструменты:**
```bash
grep -rn ": any\|as any\|<any>" src/ --include="*.ts" --include="*.tsx" | wc -l
npx tsc --noEmit 2>&1 | grep "error TS"
```

### E2E CI Pipeline (039-11 — 039-13)

**Проблема:** 47 spec-файлов написаны, но 0% проходят в CI.

**Корневые причины:**
1. Supabase credentials отсутствуют в CI окружении
2. Suno API вызывается напрямую (нет моков)
3. Telegram WebApp API не инициализирован в headless браузере

**Решение:**

```typescript
// tests/e2e/fixtures/api-mocks.ts
export async function mockSunoAPI(page: Page) {
  await page.route("**/suno-music-generate**", async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ task_id: "mock-task-123" }),
    });
  });
  
  await page.route("**/generation_tasks**", async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([{ 
        id: "mock-task-123", 
        status: "completed",
        track_id: "mock-track-456"
      }]),
    });
  });
}
```

**Целевой pass rate:** ≥35 из 47 тестов (75%).

---

## Критерии успеха

### Архитектурные

```bash
# Нулевые нарушения слоёв
grep -rn "supabase\.from\|supabase\.rpc" src/components/ src/pages/ src/stores/ | wc -l
# Ожидается: 0

# Нет файлов >1000 строк
find src/ -name "*.ts" -o -name "*.tsx" | xargs wc -l | awk '$1 > 1000'
# Ожидается: пусто
```

### Type Safety

```bash
grep -rn ": any\|as any" src/api/ src/services/ | wc -l
# Ожидается: 0

npx tsc --noEmit
# Ожидается: 0 ошибок
```

### Bundle

```bash
npm run size
# Ожидается: <900 KB (было 918 KB)
```

### E2E

```bash
npm run test:e2e
# Ожидается: ≥35/47 pass
```

---

## Риски

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| Рефакторинг GlobalAudioProvider ломает iOS audio | Высокая | Тесты перед рефакторингом; один хук за раз |
| `any` removal открывает скрытые ошибки типов | Средняя | Исправлять итеративно; `tsc --noEmit` после каждой партии |
| StudioShell разбивка нарушает Studio | Высокая | E2E smoke-тест после каждого компонента |
| E2E тесты flaky (Suno timing) | Высокая | Мокировать всё; не зависеть от реального API |
| 60+ layer violations требуют >40ч | Средняя | Автоматизировать паттерн через codemod-скрипт |

---

## Связанные документы

- [Sprint 039 Plan](../../SPRINTS/SPRINT-039-PLAN.md)
- [Architecture Hub](../../ARCHITECTURE_HUB.md)
- [Sprint 038 Spec](../038-design-ux-audit/spec.md) — предыдущий спринт
- [CLAUDE.md](../../CLAUDE.md) — архитектурные правила

---

<div align="center">

[↑ К индексу спецификаций](../README.md) · [Sprint 039 Plan →](../../SPRINTS/SPRINT-039-PLAN.md)

<sub>Создано: 2026-06-30 · Статус: 🟡 В работе</sub>

</div>
