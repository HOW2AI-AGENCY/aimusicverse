# Sprint 040: Тестовое покрытие + Audio Export (Q4 2026)

**Дата:** 2026-06-30
**Длительность:** 15 дней (3 фазы по 5 дней)
**Зависимость:** Sprint 039 завершён (рефакторинг god-хуков, layer violations устранены)
**Цель:** Поднять тестовое покрытие с 25 до 100+ файлов, реализовать экспорт аудио, обеспечить offline-режим

---

## Контекст

После Sprint 039 архитектурный долг устранён — компоненты чистые, хуки модульные, API-слой типизирован. Sprint 040 строит надёжность поверх чистой архитектуры: тесты, экспорт, мониторинг.

**Состояние входа (после Sprint 039):**
- ✅ 0 нарушений архитектурных слоёв
- ✅ Все god-хуки разбиты (<300 строк каждый)
- ✅ `any` < 50
- ✅ E2E ≥35/47 зелёных в CI
- ❌ Unit-тест файлов: 25 (нужно 100+)
- ❌ API-слой не покрыт тестами (20 файлов без тестов)
- ❌ Нет экспорта в WAV/MP3/FLAC
- ❌ Нет Service Worker / offline-режима

---

## Сводка

| Фаза                       | Дни    | Задач  | SP     | Бюджет    |
| -------------------------- | ------ | ------ | ------ | --------- |
| A: Unit Tests (API + Hooks) | 1-5   | 5      | 15     | ~40h      |
| B: Audio Export            | 6-10   | 5      | 13     | ~35h      |
| C: Infrastructure          | 11-15  | 5      | 12     | ~30h      |
| **Итого**                  | **15** | **15** | **40** | **~105h** |

---

## Фаза A: Unit Tests (API + Hooks) (Дни 1-5, 15 SP)

### Цель

Добрать тестовое покрытие API-слоя и хуков. После рефакторинга в Sprint 039 хуки стали модульными и тестируемыми.

### Задачи

| ID     | Название                                                    | Статус  | SP  | Зависимости |
| ------ | ----------------------------------------------------------- | ------- | --- | ----------- |
| 040-01 | **Unit-тесты для API-слоя (20 файлов, ~200 тестов)**        | 🔴 OPEN | 5   | Sprint 039  |
| 040-02 | **Unit-тесты для сервисов (18 файлов, ~150 тестов)**        | 🔴 OPEN | 4   | Sprint 039  |
| 040-03 | **Unit-тесты для generation hooks (после 039-06)**          | 🔴 OPEN | 3   | 039-06      |
| 040-04 | **Unit-тесты для audio hooks (после 039-07)**               | 🔴 OPEN | 2   | 039-07      |
| 040-05 | **Result-паттерн для унификации обработки ошибок в API**    | 🔴 OPEN | 1   | 040-01      |

### 040-01: Unit-тесты API-слоя

**Приоритизация файлов:**

| Файл | Важность | Тестов |
| ---- | -------- | ------ |
| `tracks.api.ts` | Критический | 20+ |
| `generation.api.ts` | Критический | 15+ |
| `credits.api.ts` | Критический | 10+ |
| `analysis.api.ts` | Высокий | 10+ |
| `payments.api.ts` | Высокий | 10+ |
| остальные 15 файлов | Средний | 5-10 каждый |

**Паттерн тестирования:**
```typescript
// tests/unit/api/tracks.api.test.ts
import { vi } from "vitest";
import { getTrackById, createTrack, updateTrack } from "@/api/tracks.api";

vi.mock("@/lib/supabase", () => ({
  supabase: { from: vi.fn().mockReturnValue({ select: vi.fn(), eq: vi.fn(), single: vi.fn() }) }
}));

describe("tracks.api", () => {
  it("getTrackById: returns track on success", async () => {
    /* ... */
  });
  it("getTrackById: returns error on not found", async () => {
    /* ... */
  });
});
```

**Критерии:**
- [ ] Тесты для всех 20 API-файлов (не менее 5 тестов на файл)
- [ ] Покрытие ≥ 70% строк в `src/api/`
- [ ] Все тесты проходят (`npx vitest run tests/unit/api/`)

### 040-02: Unit-тесты сервисов

**Топ-приоритет:**
- `credits.service.ts` — бизнес-логика монетизации
- `payment.service.ts` — платёжные транзакции
- `export.service.ts` — новый сервис (Sprint 040-06)
- `tracks.service.ts` — трансформация данных треков
- `studio.service.ts` — логика студии

**Критерии:**
- [ ] Тесты для 15+ из 18 сервисов
- [ ] Покрытие ≥ 60% в `src/services/`

### 040-03 + 040-04: Unit-тесты hooks

После разбивки god-хуков в Sprint 039 каждый хук можно тестировать изолированно.

**Generation hooks:**
- `useGenerateValidation.ts` — Zod валидация
- `useGenerateSubmit.ts` — API call + retry
- `useGenerateDraft.ts` — localStorage
- `useGenerateState.ts` — form state

**Audio hooks:**
- `useAudioCore.ts` — HTMLAudioElement lifecycle
- `useAudioQueue.ts` — queue operations
- `useAudioControls.ts` — play/pause/seek

**Критерии:**
- [ ] ≥ 30 тестов для generation hooks
- [ ] ≥ 25 тестов для audio hooks
- [ ] Все тесты работают без реального DOM audio

### 040-05: Result-паттерн

**Текущая проблема:** 20 API-файлов возвращают `{ data, error }` от Supabase по-разному — нет консистентного обработки ошибок.

**Целевой паттерн:**
```typescript
// src/lib/result.ts
export type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export function fromSupabase<T>(
  result: { data: T | null; error: PostgrestError | null }
): Result<T> {
  if (result.error) return { ok: false, error: new Error(result.error.message) };
  if (!result.data) return { ok: false, error: new Error("Not found") };
  return { ok: true, data: result.data };
}
```

**Критерии:**
- [ ] `Result<T>` тип в `src/lib/result.ts`
- [ ] `fromSupabase()` хелпер
- [ ] API-файлы используют Result в возвращаемых типах
- [ ] Unit-тесты для `fromSupabase` (5+ тестов)

---

## Фаза B: Audio Export (Дни 6-10, 13 SP)

### Задачи

| ID     | Название                                                | Статус  | SP  | Зависимости |
| ------ | ------------------------------------------------------- | ------- | --- | ----------- |
| 040-06 | **Export Service: WAV/MP3/FLAC backend**                | 🔴 OPEN | 5   | —           |
| 040-07 | **Export UI: ExportDialog компонент**                   | 🔴 OPEN | 3   | 040-06      |
| 040-08 | **Export: Интеграция в TrackActions menu**              | 🔴 OPEN | 2   | 040-07      |
| 040-09 | **Export: Progress tracking + notifications**           | 🔴 OPEN | 2   | 040-08      |
| 040-10 | **Export: Unit + E2E тесты**                           | 🔴 OPEN | 1   | 040-09      |

### 040-06: Export Service

**Backend (Edge Function):**
```
supabase/functions/audio-export/
  index.ts          — entry point, auth check
  formats.ts        — WAV/MP3/FLAC конвертация (ffmpeg-wasm или cloudconvert)
  metadata.ts       — ID3 теги (название, исполнитель, обложка)
  download.ts       — подписанный URL для скачивания
```

**Frontend сервис:**
```typescript
// src/services/export.service.ts
export interface ExportOptions {
  format: "wav" | "mp3" | "flac";
  quality: "low" | "standard" | "high"; // 128kbps / 256kbps / 320kbps
  includeMetadata: boolean;
  includeCoverArt: boolean;
}

export async function exportTrack(
  trackId: string,
  options: ExportOptions
): Promise<Result<{ downloadUrl: string; expiresAt: Date }>>
```

**Критерии:**
- [ ] WAV export работает (без перекодирования, прямой download)
- [ ] MP3 export с выбором качества
- [ ] FLAC export (lossless)
- [ ] ID3 теги: название, исполнитель, обложка
- [ ] Edge Function деплоится без ошибок

### 040-07: ExportDialog UI

**Интерфейс:**
```
ExportDialog
  ├── Format selector (WAV / MP3 / FLAC) — radio group
  ├── Quality selector (только для MP3: 128 / 256 / 320 kbps)
  ├── Metadata toggles (Include title/artist/cover)
  ├── Preview: estimated file size
  ├── Export button → progress bar → download link
  └── Share to Telegram button (после экспорта)
```

**Критерии:**
- [ ] Dialog открывается из TrackActions menu
- [ ] Progress отображается во время экспорта
- [ ] Download автоматически начинается после успешного экспорта
- [ ] Работает в Telegram WebApp (использует `openLink`)

### 040-08 + 040-09: Интеграция и прогресс

**В TrackActions menu:**
```typescript
{ label: "Экспорт", icon: Download, onClick: () => openExportDialog(trackId) }
```

**Progress tracking:**
- Используем существующий `useNotification` для уведомлений
- Telegram haptic feedback при успешном экспорте
- Локальная история экспортов (последние 10) в localStorage

---

## Фаза C: Infrastructure (Дни 11-15, 12 SP)

### Задачи

| ID     | Название                                               | Статус  | SP  | Зависимости |
| ------ | ------------------------------------------------------ | ------- | --- | ----------- |
| 040-11 | **Service Worker + offline-first cache**               | 🔴 OPEN | 4   | —           |
| 040-12 | **Lighthouse CI budget enforcement**                   | 🔴 OPEN | 2   | —           |
| 040-13 | **`structuredClone()` вместо JSON deep-clone хаков**   | 🔴 OPEN | 1   | —           |
| 040-14 | **Согласовать staleTime/gcTime в QueryClient**         | 🔴 OPEN | 1   | —           |
| 040-15 | **Финальный аудит и верификация Sprint 040**           | 🔴 OPEN | 4   | все         |

### 040-11: Service Worker

**Scope:** Кэш-first стратегия для статических ресурсов (shell, fonts, vendor chunks).

**Реализация (vite-plugin-pwa или ручной SW):**
```javascript
// src/sw.ts
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("musicverse-v1").then((cache) =>
      cache.addAll(["/", "/index.html", "/assets/vendor-react.js", "/assets/vendor-tone.js"])
    )
  );
});

self.addEventListener("fetch", (event) => {
  // Cache-first для статики, Network-first для API
  if (event.request.url.includes("/api/") || event.request.url.includes("supabase")) {
    return; // сеть
  }
  event.respondWith(caches.match(event.request).then((r) => r || fetch(event.request)));
});
```

**Telegram WebApp Note:** SW работают в Telegram только на последних версиях клиента. Добавить fallback и не полагаться на SW для критического функционала.

**Критерии:**
- [ ] SW регистрируется без ошибок
- [ ] Статические ресурсы кэшируются
- [ ] Offline: показывает `NetworkErrorState` для API запросов
- [ ] SW не мешает hot-reload в dev режиме

### 040-12: Lighthouse CI

**GitHub Actions workflow:**
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push, pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: treosh/lighthouse-ci-action@v9
        with:
          budgetPath: .lighthouserc.json
          uploadArtifacts: true
```

**Budget `.lighthouserc.json`:**
```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.80}],
        "categories:accessibility": ["error", {"minScore": 0.90}],
        "first-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "interactive": ["error", {"maxNumericValue": 5000}]
      }
    }
  }
}
```

**Критерии:**
- [ ] Lighthouse CI запускается на каждый PR
- [ ] Performance ≥ 80, Accessibility ≥ 90
- [ ] Упавший PR помечается в GitHub как failed

### 040-13: structuredClone

**Текущая проблема:** 8+ мест с `JSON.parse(JSON.stringify(obj))` для deep clone.

```bash
grep -rn "JSON.parse(JSON.stringify" src/
```

**Замена:**
```typescript
// ❌ До
const snapshot = JSON.parse(JSON.stringify(state));

// ✅ После
const snapshot = structuredClone(state);
```

**Критерии:**
- [ ] `grep -rn "JSON.parse(JSON.stringify" src/` → 0 результатов
- [ ] Все тесты проходят (structuredClone поддерживается в jsdom)

### 040-14: QueryClient defaults

**Текущая проблема:** Каждый `useQuery` задаёт свои `staleTime`/`gcTime`, нет глобального дефолта.

```typescript
// src/App.tsx или src/lib/queryClient.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,      // 30 секунд (текущий разброс: 0ms - 5min)
      gcTime: 10 * 60_000,    // 10 минут
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
  },
});
```

**Критерии:**
- [ ] Единый `QueryClient` с дефолтами в `src/lib/queryClient.ts`
- [ ] `staleTime`/`gcTime` в отдельных хуках — только переопределения от дефолта
- [ ] `grep -rn "staleTime: 0" src/hooks/` → устранены (или документированы исключения)

### 040-15: Финальная верификация

**Ожидаемые метрики Sprint 040:**

| Метрика | До Sprint 040 | После Sprint 040 | Цель |
| ------- | ------------- | ---------------- | ---- |
| Unit-тест файлов | 25 | 100+ | ✅ |
| Unit-тестов (штук) | 341 | 1000+ | ✅ |
| API покрытие | 0% | ≥70% | ✅ |
| Services покрытие | 0% | ≥60% | ✅ |
| E2E pass rate | ≥35/47 (Sprint 039) | ≥42/47 | ✅ |
| Lighthouse (mobile) | 92 | ≥90 + CI | ✅ |
| Export WAV/MP3 | ❌ | ✅ | ✅ |
| Offline-режим | ❌ | ✅ (SW) | ✅ |

---

## Критерии успеха Sprint 040

### Тесты
- [ ] Unit-тест файлов ≥ 100
- [ ] Unit-тестов ≥ 1000
- [ ] API-слой покрыт ≥ 70%
- [ ] Сервисы покрыты ≥ 60%
- [ ] Все тесты зелёные в CI

### Export
- [ ] WAV export работает для любого трека
- [ ] MP3 export с выбором качества (128/256/320)
- [ ] FLAC export (lossless)
- [ ] ExportDialog в TrackActions menu
- [ ] Download работает в Telegram WebApp

### Infrastructure
- [ ] Service Worker регистрируется без ошибок
- [ ] Lighthouse CI на каждый PR (perf ≥80)
- [ ] `structuredClone()` вместо JSON хаков
- [ ] Единый QueryClient с дефолтами

---

## Ожидаемое состояние проекта после Sprint 040

| Метрика | До Sprint 035 | После Sprint 040 | Улучшение |
| ------- | ------------- | ---------------- | --------- |
| Оценка архитектуры | 6.1/10 | 8.5/10 | +39% |
| Нарушений слоёв | 30+ | 0 | -100% |
| Файлов > 1000 строк | 2 | 0 | -100% |
| Использований `any` | 342 | <50 | -85% |
| Unit-тест файлов | 7 | 100+ | +1300% |
| E2E pass rate | 0% | ≥90% | +90% |
| Бандл (gzip) | 918 КБ | ≤880 КБ | -4% |
| Export | ❌ | WAV/MP3/FLAC | новая фича |
| Offline | ❌ | SW cache-first | новая фича |

---

## Зависимости

```
Sprint 038 (Design System) ── финальная фаза D
  └─→ Sprint 039 (Architecture Refactor)
        ├── 039-06 useGenerateForm split ──→ 040-03 (generation tests)
        ├── 039-07 GlobalAudioProvider split ──→ 040-04 (audio tests)
        ├── 039-10 Type Safety ──→ 040-01 (API tests с полными типами)
        └── 039-11 E2E green ──→ 040-15 (финальная верификация E2E)
```

---

<div align="center">

[← Sprint 039](./SPRINT-039-PLAN.md) · [↑ К индексу](../DOCUMENTATION_INDEX.md)

<sub>Создано: 2026-06-30 · Статус: 📋 Plan</sub>

</div>
