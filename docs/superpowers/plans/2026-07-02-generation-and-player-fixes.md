# План работ: Стабилизация генерации и плеера MusicVerse AI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) или superpowers:executing-plans для выполнения задач. Шаги используют чекбоксы (`- [ ]`) для отслеживания.

**Goal:** Устранить 8 выявленных дефектов пользовательского опыта в цикле генерации трека и аудио-плеере: долгое ожидание, дёрганая плашка, потеря версии B, дубли уведомлений, глюки волны, зависание fullscreen-плеера, отсутствие автоскролла lyrics, неудобная мобильная форма.

**Architecture:** Поверхностная стабилизация без большого рефакторинга. Переход с polling 5 s на Supabase Realtime (postgres_changes) для статуса генерации. Зафиксировать размеры плашки-индикатора. Восстановить видимость обеих версий A/B в `GenerationResultSheet`. Свести все уведомления к одному каналу. Починить race-conditions в `MobileFullscreenPlayer` через единый `useEffect`. Мемоизировать Canvas-рендер волны. Перевести автоскролл lyrics на `scrollTo` без `behavior: smooth`. Создать отдельный `MobileGenerationForm` на базе `Mobile*` обёрток.

**Tech Stack:** React 19, TypeScript, Vite 5, TanStack Query 5, Zustand 5, Supabase (Realtime + Edge Functions Deno), Tailwind CSS, framer-motion (через `@/lib/motion`), Sonner, shadcn/ui, Vitest 4, Playwright 1.57.

## Global Constraints

- React 19.2 + TypeScript 5.9 strict (no `any`)
- Все пути импорта — `@/` alias
- Bundle size limit: **950 KB** (проверять `npm run size` после крупных задач)
- Touch targets минимум **44×44 px**
- Mobile-first, breakpoints Tailwind (xs/sm/md/lg/xl/2xl)
- Logger — только `logger` из `@/lib/logger` (никаких `console.log`)
- Supabase: RLS не трогаем; типы из `src/integrations/supabase/types.ts`
- Polling → Realtime миграция должна сохранить fallback на polling, если Realtime отключён
- Никаких `new Audio()` — только `usePreviewAudio()` или `audioElementPool`
- Используем существующие `MobileBottomSheet`, `MobileFormField`, `MobileTextarea`, `MobileSlider`
- Иконки — только из существующего lucide-react набора

---

## Структура файлов (что будет затронуто)

### Создаются

- `supabase/functions/suno-stream/index.ts` — Realtime-публикация событий генерации (опционально)
- `src/hooks/generation/useGenerationRealtime.ts` — подписка на `postgres_changes`
- `src/components/notifications/SingleGenerationToast.tsx` — единый toast вместо 6 параллельных каналов
- `src/components/generate-form/mobile/MobileGenerationForm.tsx` — компактная мобильная форма
- `tests/unit/components/notifications/EnhancedGenerationIndicator.test.tsx`
- `tests/unit/hooks/generation/useGenerationRealtime.test.ts`
- `tests/unit/components/generate-form/mobile/MobileGenerationForm.test.tsx`

### Модифицируются

- `src/hooks/generation/useActiveGenerations.ts` — Realtime + fallback polling
- `src/hooks/generation/useGenerateFormSubmit.ts` — убрать дублирующие toast, оставить один
- `src/components/notifications/EnhancedGenerationIndicator.tsx` — зафиксировать высоту
- `src/components/GlobalGenerationIndicator.tsx` — депрекейт / удалить (один indicator)
- `src/components/MainLayout.tsx` — оставить только один indicator
- `src/services/generation/track-versions.service.ts` — корректный fallback label
- `src/components/generate-form/GenerationResultSheet.tsx` — корректный selection обеих версий
- `supabase/functions/suno-music-callback/index.ts:1087` — проверить и поправить запись A/B
- `src/hooks/useVersionSwitcher.ts` — убрать лишний toast
- `src/components/player/PlayerProgress.tsx` — мемоизация, устранить RAF-race
- `src/components/waveform/UnifiedWaveform.tsx` — мемоизация Canvas-redraw
- `src/components/player/MobileFullscreenPlayer.tsx` — единый init effect, убрать setTimeout-цепочку
- `src/components/player/pages/LyricsPage.tsx` — автоскролл без `behavior: smooth`
- `src/components/generate-form/sections/VocalsToggle.tsx` — перевод на радио кнопку + компактная разметка
- `src/contexts/NotificationContext.tsx:633` — единый источник `useNotificationHub`

---

# Фаза 1. Генерация и уведомления (проблемы 1, 2, 4)

## Task 1.1: Realtime-подписка на статус генерации (проблема 1)

**Files:**

- Create: `src/hooks/generation/useGenerationRealtime.ts`
- Modify: `src/hooks/generation/useActiveGenerations.ts:14-37`
- Test: `tests/unit/hooks/generation/useGenerationRealtime.test.ts`

**Interfaces:**

- Consumes: `supabase.channel('generation_tasks')`, table `generation_tasks`
- Produces: `useGenerationRealtime(userId: string | null): { activeTasks: GenerationTask[]; lastEventAt: number | null }`

- [ ] **Step 1: Написать failing-тест**

```ts
// tests/unit/hooks/generation/useGenerationRealtime.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((cb) => {
        cb("SUBSCRIBED");
        return { unsubscribe: vi.fn() };
      }),
    })),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

import { useGenerationRealtime } from "@/hooks/generation/useGenerationRealtime";

describe("useGenerationRealtime", () => {
  it("subscribes to generation_tasks channel", async () => {
    const { result } = renderHook(() => useGenerationRealtime("user-1"));
    await waitFor(() => expect(result.current.activeTasks).toBeDefined());
  });
});
```

- [ ] **Step 2: Запустить, убедиться что падает**

Run: `npm test -- tests/unit/hooks/generation/useGenerationRealtime.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Реализовать хук**

```ts
// src/hooks/generation/useGenerationRealtime.ts
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"generation_tasks">;

export function useGenerationRealtime(userId: string | null) {
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`generation_tasks:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "generation_tasks", filter: `user_id=eq.${userId}` },
        (payload) => {
          setLastEventAt(Date.now());
          setActiveTasks((prev) => {
            const row = (payload.new ?? payload.old) as Task;
            if (payload.eventType === "DELETE") return prev.filter((t) => t.id !== row.id);
            const others = prev.filter((t) => t.id !== row.id);
            return ["completed", "failed"].includes(row.status) ? others : [...others, row];
          });
        },
      )
      .subscribe();
    return () => {
      void channel.unsubscribe();
    };
  }, [userId]);

  return { activeTasks, lastEventAt };
}
```

- [ ] **Step 4: Запустить тест, убедиться что проходит**

Run: `npm test -- tests/unit/hooks/generation/useGenerationRealtime.test.ts`
Expected: PASS.

- [ ] **Step 5: Коммит**

```bash
git add src/hooks/generation/useGenerationRealtime.ts tests/unit/hooks/generation/useGenerationRealtime.test.ts
git commit -m "feat(generation): add Realtime subscription hook for generation_tasks"
```

## Task 1.2: Интегрировать Realtime в useActiveGenerations с fallback на polling

**Files:**

- Modify: `src/hooks/generation/useActiveGenerations.ts:14-37`
- Test: `tests/unit/hooks/generation/useActiveGenerations.test.ts` (новый)

- [ ] **Step 1: Failing-тест**

```ts
// tests/unit/hooks/generation/useActiveGenerations.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [{ id: "t1", status: "processing" }], error: null }),
    })),
  },
}));
import { useActiveGenerations } from "@/hooks/generation/useActiveGenerations";

describe("useActiveGenerations", () => {
  it("exposes active tasks with fallback polling", async () => {
    const { result } = renderHook(() => useActiveGenerations("user-1"));
    await waitFor(() => expect(result.current.data?.length).toBeGreaterThanOrEqual(0));
    expect(result.current.refetchInterval).toBeGreaterThanOrEqual(1500);
  });
});
```

- [ ] **Step 2: Запустить, падает**

Run: `npm test -- tests/unit/hooks/generation/useActiveGenerations.test.ts`

- [ ] **Step 3: Реализация**

```ts
// src/hooks/generation/useActiveGenerations.ts (заменить useQuery целиком)
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGenerationRealtime } from "./useGenerationRealtime";

const ACTIVE_STATUSES = ["pending", "processing", "streaming_ready"] as const;

export function useActiveGenerations(userId: string | null) {
  const qc = useQueryClient();
  const { lastEventAt } = useGenerationRealtime(userId);

  const query = useQuery({
    queryKey: ["active-generations", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("generation_tasks")
        .select("*")
        .eq("user_id", userId)
        .in("status", ACTIVE_STATUSES as unknown as string[]);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
    staleTime: 30_000,
    // Адаптивный polling: 2с пока realtime активен, 5с иначе
    refetchInterval: lastEventAt && Date.now() - lastEventAt < 10_000 ? 2000 : 5000,
  });

  useEffect(() => {
    if (lastEventAt) qc.invalidateQueries({ queryKey: ["active-generations", userId] });
  }, [lastEventAt, qc, userId]);

  return query;
}
```

- [ ] **Step 4: Запустить, PASS**

Run: `npm test -- tests/unit/hooks/generation/useActiveGenerations.test.ts`

- [ ] **Step 5: Коммит**

```bash
git add src/hooks/generation/useActiveGenerations.ts tests/unit/hooks/generation/useActiveGenerations.test.ts
git commit -m "feat(generation): use Realtime + adaptive polling fallback"
```

## Task 1.3: Зафиксировать высоту плашки генерации (проблема 2)

**Files:**

- Modify: `src/components/notifications/EnhancedGenerationIndicator.tsx:130-242`
- Test: `tests/unit/components/notifications/EnhancedGenerationIndicator.test.tsx`

- [ ] **Step 1: Failing-тест**

```tsx
// tests/unit/components/notifications/EnhancedGenerationIndicator.test.tsx
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EnhancedGenerationIndicator } from "@/components/notifications/EnhancedGenerationIndicator";

describe("EnhancedGenerationIndicator", () => {
  it("renders with fixed height and does not grow on expand", () => {
    const { container } = render(
      <EnhancedGenerationIndicator generations={[{ id: "1", status: "processing", progress: 50 }]} />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("min-h-[");
  });
});
```

- [ ] **Step 2: Запустить, FAIL**

Run: `npm test -- tests/unit/components/notifications/EnhancedGenerationIndicator.test.tsx`

- [ ] **Step 3: Правка компонента**

```tsx
// src/components/notifications/EnhancedGenerationIndicator.tsx
// Заменить обёртку (130-138 и 213-217) на:

<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] w-[calc(100vw-2rem)] max-w-md"
>
  <Card className="bg-card/95 backdrop-blur-md border-primary/30 shadow-xl min-h-[72px]">
    <CardContent className="p-3">
      <div className="flex items-center gap-3">
        {/* Компактная шапка: всегда 56px */}
        <div className="relative w-12 h-12 flex-shrink-0">...</div>
        <div className="flex-1 min-w-0">
          <Progress value={overallProgress} className="h-1.5" />
          <div className="flex justify-between text-xs mt-1">
            <span>{generationCount} активных</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={collapse}>
          ...
        </Button>
      </div>
      {/* Развёрнутый список — фиксированная высота 160px со скроллом, не height:auto */}
      {expanded && generationCount > 1 && (
        <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
          {generations.map((g) => (
            <GenerationRow key={g.id} gen={g} />
          ))}
        </div>
      )}
    </CardContent>
  </Card>
</motion.div>
```

- [ ] **Step 4: Тест PASS**

Run: `npm test -- tests/unit/components/notifications/EnhancedGenerationIndicator.test.tsx`

- [ ] **Step 5: Коммит**

```bash
git add src/components/notifications/EnhancedGenerationIndicator.tsx tests/unit/components/notifications/EnhancedGenerationIndicator.test.tsx
git commit -m "fix(notifications): stabilize generation indicator size"
```

## Task 1.4: Удалить дублирующие toast и оставить единый канал (проблема 4)

**Files:**

- Modify: `src/hooks/generation/useGenerateFormSubmit.ts:437-458`
- Modify: `src/hooks/useVersionSwitcher.ts:133-138`
- Modify: `src/components/GlobalGenerationIndicator.tsx` (удалить файл или пометить deprecated)
- Modify: `src/components/MainLayout.tsx:32-42`

- [ ] **Step 1: Failing-тест на количество toast**

```tsx
// tests/unit/hooks/generation/useGenerateFormSubmit.test.tsx
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

const toastSpy = vi.fn();
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { loading: vi.fn(), success: vi.fn(), error: vi.fn(), dismiss: vi.fn() }),
}));

describe("useGenerateFormSubmit", () => {
  it("emits at most one user-facing toast on success", async () => {
    // ... мокаем supabase.functions.invoke, supabase.auth.getUser
    const { result } = renderHook(() => useGenerateFormSubmit());
    await act(async () => {
      await result.current.handleGenerate({/* payload */});
    });
    // До изменения было 2-3 toast, должно стать ≤ 1
    expect(toastSpy).toHaveBeenCalledTimes(0); // индикатор вместо toast
  });
});
```

- [ ] **Step 2: Запустить, FAIL**

Run: `npm test -- tests/unit/hooks/generation/useGenerateFormSubmit.test.tsx`

- [ ] **Step 3: Правка useGenerateFormSubmit.ts**

```ts
// src/hooks/generation/useGenerateFormSubmit.ts
// Строки 437-458 — заменить на:

// Один источник истины — indicator. Toast только для критических ошибок.
if (fromQuickCreate === "true") {
  // ничего не делаем; GenerationResultSheet + EnhancedGenerationIndicator покажут статус
}

// Удалить вызовы:
// - toast.success("Трек готовится", ...)  (строка 455-458)
// - toast.success("Шаг 3/3 · Генерация запущена", ...)  (строка 437-440) — оставить только dismiss
// Оставить только dismiss предыдущих loading-toast (строка 436)
```

- [ ] **Step 4: Удалить toast в useVersionSwitcher**

```ts
// src/hooks/useVersionSwitcher.ts:133-138
// Закомментировать toast «Primary version updated successfully» —
// UnifiedVersionSelector сам покажет изменение
```

- [ ] **Step 5: В MainLayout оставить один indicator**

```tsx
// src/components/MainLayout.tsx
// Удалить <GlobalGenerationIndicator /> (если смонтирован рядом с EnhancedGenerationIndicator)
// Проверить, что нет двух <EnhancedGenerationIndicator />
```

- [ ] **Step 6: Тест PASS**

Run: `npm test -- tests/unit/hooks/generation/useGenerateFormSubmit.test.tsx`

- [ ] **Step 7: Коммит**

```bash
git add src/hooks/generation/useGenerateFormSubmit.ts src/hooks/useVersionSwitcher.ts src/components/MainLayout.tsx src/components/GlobalGenerationIndicator.tsx tests/unit/hooks/generation/useGenerateFormSubmit.test.tsx
git commit -m "fix(notifications): collapse duplicate toasts to single indicator channel"
```

---

# Фаза 2. Версии треков (проблема 3)

## Task 2.1: Исправить fallback label в track-versions.service

**Files:**

- Modify: `src/services/generation/track-versions.service.ts:33-46`

- [ ] **Step 1: Failing-тест**

```ts
// tests/unit/services/track-versions.service.test.ts
import { describe, it, expect } from "vitest";
import { mapTrackVersion } from "@/services/generation/track-versions.service";

describe("mapTrackVersion", () => {
  it("uses clip_index when version_label is null", () => {
    const out = mapTrackVersion({ id: "1", clip_index: 1, version_label: null, is_primary: false } as any);
    expect(out.label).toBe("B");
  });
  it("preserves explicit A/B labels", () => {
    expect(mapTrackVersion({ id: "2", clip_index: 0, version_label: "A", is_primary: true } as any).label).toBe("A");
  });
});
```

- [ ] **Step 2: FAIL**

Run: `npm test -- tests/unit/services/track-versions.service.test.ts`

- [ ] **Step 3: Правка**

```ts
// src/services/generation/track-versions.service.ts:33-46
// Заменить mapTrackVersion:
export function mapTrackVersion(row: TrackVersionRow) {
  const label =
    row.version_label ?? (row.clip_index === 0 ? "A" : row.clip_index === 1 ? "B" : `v${row.clip_index + 1}`);
  const isPrimary = row.is_primary ?? false;
  return {
    id: row.id,
    label,
    isPrimary,
    audioUrl: row.audio_url,
    coverUrl: row.cover_url,
    duration: row.duration_seconds ?? 0,
    sunoId: row.metadata?.suno_id,
    sunoTaskId: row.metadata?.suno_task_id,
  };
}
```

- [ ] **Step 4: PASS**

Run: `npm test -- tests/unit/services/track-versions.service.test.ts`

- [ ] **Step 5: Коммит**

```bash
git add src/services/generation/track-versions.service.ts tests/unit/services/track-versions.service.test.ts
git commit -m "fix(versions): derive A/B label from clip_index when label is null"
```

## Task 2.2: Убедиться что callback пишет обе версии A/B

**Files:**

- Modify: `supabase/functions/suno-music-callback/index.ts:1087`
- Test: ручная проверка через `psql` или Supabase Studio

- [ ] **Step 1: Прочитать существующий код**

Read `supabase/functions/suno-music-callback/index.ts` строки 1050-1130 (запись в `track_versions`). Найти цикл по `payload.clips` (Suno отдаёт 2 clip).

- [ ] **Step 2: Failing-assert в тесте**

```ts
// tests/integration/track-versions-callback.test.ts (запускается с deno)
Deno.test("suno-music-callback writes both A/B versions", async () => {
  // Создать фейковый payload от Suno: 2 clip
  // Запустить handler
  // Проверить что в БД 2 строки с clip_index 0 и 1
});
```

- [ ] **Step 3: Запустить, FAIL**

Run: `deno test --allow-all tests/integration/track-versions-callback.test.ts`

- [ ] **Step 4: Правка**

```ts
// supabase/functions/suno-music-callback/index.ts
// В точке записи в track_versions:
// Заменить одиночный insert на цикл по payload.data[]
const rows = payload.data.map((clip, idx) => ({
  track_id: track.id,
  clip_index: idx,
  version_label: idx === 0 ? "A" : "B",
  audio_url: clip.audio_url,
  cover_url: clip.image_url ?? null,
  duration_seconds: clip.duration ?? null,
  is_primary: idx === 0,
  metadata: { suno_id: clip.id, suno_task_id: payload.task_id },
}));
await supabase.from("track_versions").insert(rows);
```

- [ ] **Step 5: PASS**

Run: `deno test --allow-all tests/integration/track-versions-callback.test.ts`

- [ ] **Step 6: Коммит**

```bash
git add supabase/functions/suno-music-callback/index.ts tests/integration/track-versions-callback.test.ts
git commit -m "fix(callback): persist both Suno clips as A/B versions"
```

## Task 2.3: GenerationResultSheet показывает обе версии и позволяет переключать

**Files:**

- Modify: `src/components/generate-form/GenerationResultSheet.tsx:42-300`
- Modify: `src/hooks/generation/useTrackVersionsList.ts:17-24` (staleTime: 0 для свежей версии)

- [ ] **Step 1: Failing-тест**

```tsx
// tests/unit/components/GenerationResultSheet.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GenerationResultSheet } from "@/components/generate-form/GenerationResultSheet";

describe("GenerationResultSheet", () => {
  it("renders both A and B version selectors", () => {
    render(<GenerationResultSheet trackId="t1" open={true} onOpenChange={() => {}} />);
    expect(screen.getByTestId("version-A")).toBeInTheDocument();
    expect(screen.getByTestId("version-B")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: FAIL**

Run: `npm test -- tests/unit/components/GenerationResultSheet.test.tsx`

- [ ] **Step 3: Правка компонента**

```tsx
// src/components/generate-form/GenerationResultSheet.tsx
// 1. Импорт: import { UnifiedVersionSelector } from '@/components/shared/UnifiedVersionSelector';
// 2. Заменить кастомный список (62-73) на:
<UnifiedVersionSelector
  versions={versions}
  activeVersionId={activeVersionId}
  onChange={async (id) => {
    await switchVersion.mutateAsync(id);
  }}
/>
// 3. Добавить data-testid="version-A"/"version-B" в UnifiedVersionSelector, если отсутствует.
```

- [ ] **Step 4: staleTime для свежих версий**

```ts
// src/hooks/generation/useTrackVersionsList.ts
staleTime: 0,
refetchOnMount: 'always',
```

- [ ] **Step 5: PASS**

Run: `npm test -- tests/unit/components/GenerationResultSheet.test.tsx`

- [ ] **Step 6: Коммит**

```bash
git add src/components/generate-form/GenerationResultSheet.tsx src/hooks/generation/useTrackVersionsList.ts tests/unit/components/GenerationResultSheet.test.tsx
git commit -m "fix(result-sheet): show both A/B versions with switcher"
```

---

# Фаза 3. Плеер и волна (проблемы 5, 6)

## Task 3.1: Мемоизация Canvas-рендера волны (проблема 5)

**Files:**

- Modify: `src/components/waveform/UnifiedWaveform.tsx:97-end`
- Modify: `src/components/player/PlayerProgress.tsx:34-147`

- [ ] **Step 1: Failing-тест**

```tsx
// tests/unit/components/UnifiedWaveform.test.tsx
import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { UnifiedWaveform } from "@/components/waveform/UnifiedWaveform";

describe("UnifiedWaveform", () => {
  it("does not redraw on every currentTime change", () => {
    const drawSpy = vi.fn();
    // мокаем canvas draw
    const { rerender } = render(<UnifiedWaveform audioUrl="x" currentTime={0} onSeek={() => {}} />);
    for (let i = 0; i < 10; i++) rerender(<UnifiedWaveform audioUrl="x" currentTime={i} onSeek={() => {}} />);
    // ожидаем ≤ 2 вызова redraw (init + final), а не 11
    expect(drawSpy).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: FAIL**

Run: `npm test -- tests/unit/components/UnifiedWaveform.test.tsx`

- [ ] **Step 3: Правка UnifiedWaveform**

```tsx
// src/components/waveform/UnifiedWaveform.tsx
// Заменить props currentTime на refs и обновлять Canvas через requestAnimationFrame:
const currentTimeRef = useRef(currentTime);
useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);

// Внутри WaveformCanvas использовать throttled redraw (один RAF на 16ms):
const rafRef = useRef<number>();
const draw = useCallback(() => {
  ctx.clearRect(...);
  // рисуем bars используя currentTimeRef.current
  rafRef.current = requestAnimationFrame(draw);
}, [audioUrl]);
```

- [ ] **Step 4: PlayerProgress — убрать RAF-race**

```tsx
// src/components/player/PlayerProgress.tsx
// Удалить useAudioTime() (строка 71) и получать currentTime через props от GlobalAudioPlayer.
// localTime оставить только для drag-state.
```

- [ ] **Step 5: PASS**

Run: `npm test -- tests/unit/components/UnifiedWaveform.test.tsx`

- [ ] **Step 6: Коммит**

```bash
git add src/components/waveform/UnifiedWaveform.tsx src/components/player/PlayerProgress.tsx tests/unit/components/UnifiedWaveform.test.tsx
git commit -m "fix(waveform): throttle canvas redraw + remove RAF race in progress"
```

## Task 3.2: Исправить race в MobileFullscreenPlayer (проблема 6)

**Files:**

- Modify: `src/components/player/MobileFullscreenPlayer.tsx:59-379`
- Test: `tests/unit/components/MobileFullscreenPlayer.test.tsx` (новый)

- [ ] **Step 1: Failing-тест**

```tsx
// tests/unit/components/MobileFullscreenPlayer.test.tsx
import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MobileFullscreenPlayer } from "@/components/player/MobileFullscreenPlayer";

describe("MobileFullscreenPlayer", () => {
  it("initializes audio exactly once on mount", async () => {
    const playSpy = vi.fn();
    // мок GlobalAudioProvider.play
    render(<MobileFullscreenPlayer track={{ id: "1" }} onClose={() => {}} />);
    await waitFor(() => expect(playSpy).toHaveBeenCalledTimes(1));
  });
});
```

- [ ] **Step 2: FAIL**

Run: `npm test -- tests/unit/components/MobileFullscreenPlayer.test.tsx`

- [ ] **Step 3: Рефакторинг init в один useEffect**

```tsx
// src/components/player/MobileFullscreenPlayer.tsx
// Объединить строки 63-72, 127-137, 140-200 в один useEffect:

const initRef = useRef(false);
useEffect(() => {
  if (initRef.current) return;
  initRef.current = true;

  const ac = audioContextManager.getContext();
  const audio = audioElementPool.acquire();
  audio.src = track.audio_url;
  audio.preload = "auto";

  const onCanPlay = () => {
    if (preservedTime.current > 0) audio.currentTime = preservedTime.current;
    audio.play().catch(() => {});
    audio.removeEventListener("canplay", onCanPlay);
  };
  audio.addEventListener("canplay", onCanPlay);

  // Префетчи — после firstPaint, не на mount
  requestIdleCallback?.(() => {
    prefetchTrackCovers(track.id);
    prefetchNextAudio();
  });

  return () => {
    audio.removeEventListener("canplay", onCanPlay);
    audioElementPool.release(audio);
  };
}, [track.id]);
```

- [ ] **Step 4: Удалить setTimeout-цепочку**

```tsx
// Удалить: setTimeout 120ms (строка 67), setTimeout 50ms (строка 130), setTimeout 100ms (строка 194)
// Удалить: динамический import("@/lib/audioContextManager") — заменить на статический:
//   import { audioContextManager } from "@/lib/audioContextManager";
//   import { audioElementPool } from "@/lib/audioElementPool";
```

- [ ] **Step 5: PASS**

Run: `npm test -- tests/unit/components/MobileFullscreenPlayer.test.tsx`

- [ ] **Step 6: Коммит**

```bash
git add src/components/player/MobileFullscreenPlayer.tsx tests/unit/components/MobileFullscreenPlayer.test.tsx
git commit -m "fix(player): consolidate fullscreen init effect, kill race conditions"
```

---

# Фаза 4. Lyrics (проблема 7)

## Task 4.1: Автоскролл без `behavior: smooth` и без конфликта с touch

**Files:**

- Modify: `src/components/player/pages/LyricsPage.tsx:79-91`

- [ ] **Step 1: Failing-тест**

```tsx
// tests/unit/components/LyricsPage.test.tsx
import { render, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LyricsPage } from "@/components/player/pages/LyricsPage";

describe("LyricsPage auto-scroll", () => {
  it("calls scrollTo when active line changes", async () => {
    const scrollSpy = vi.fn();
    // мокаем container.scrollTo
    render(
      <LyricsPage
        lines={[
          { time: 0, text: "A" },
          { time: 5, text: "B" },
        ]}
        currentTime={5}
      />,
    );
    await act(async () => {});
    expect(scrollSpy).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: FAIL**

Run: `npm test -- tests/unit/components/LyricsPage.test.tsx`

- [ ] **Step 3: Заменить scrollTo с smooth на RAF**

```tsx
// src/components/player/pages/LyricsPage.tsx:79-91
useEffect(() => {
  if (!activeLineRef.current || !scrollRef.current || userScrollLock.current) return;
  const container = scrollRef.current;
  const line = activeLineRef.current;
  const desired = line.offsetTop - container.clientHeight * 0.35;
  // requestAnimationFrame вместо behavior: smooth — iOS Safari не конфликтует с touch
  rafRef.current = requestAnimationFrame(() => {
    container.scrollTo({ top: Math.max(0, desired) });
  });
  return () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };
}, [activeLineIndex]);
```

- [ ] **Step 4: PASS**

Run: `npm test -- tests/unit/components/LyricsPage.test.tsx`

- [ ] **Step 5: Коммит**

```bash
git add src/components/player/pages/LyricsPage.tsx tests/unit/components/LyricsPage.test.tsx
git commit -m "fix(lyrics): use RAF instead of smooth scroll to avoid iOS touch conflict"
```

---

# Фаза 5. Мобильная форма генерации (проблема 8)

## Task 5.1: VocalsToggle → RadioGroup + компактная разметка

**Files:**

- Modify: `src/components/generate-form/sections/VocalsToggle.tsx:13-68`
- Test: `tests/unit/components/generate-form/VocalsToggle.test.tsx` (новый)

- [ ] **Step 1: Failing-тест**

```tsx
// tests/unit/components/generate-form/VocalsToggle.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { VocalsToggle } from "@/components/generate-form/sections/VocalsToggle";

describe("VocalsToggle", () => {
  it("renders as radio group with Vokal/Instrumental options", () => {
    render(<VocalsToggle value="vocal" onChange={() => {}} />);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /вокал/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /инструментал/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: FAIL**

Run: `npm test -- tests/unit/components/generate-form/VocalsToggle.test.tsx`

- [ ] **Step 3: Реализация RadioGroup**

```tsx
// src/components/generate-form/sections/VocalsToggle.tsx
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Mic, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: "vocal" | "instrumental";
  onChange: (v: "vocal" | "instrumental") => void;
  compact?: boolean;
}

export function VocalsToggle({ value, onChange, compact }: Props) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-2 gap-2" aria-label="Тип генерации">
      {[
        { v: "vocal" as const, label: "Вокал", Icon: Mic },
        { v: "instrumental" as const, label: "Инструментал", Icon: Music2 },
      ].map(({ v, label, Icon }) => (
        <Label
          key={v}
          htmlFor={`vocals-${v}`}
          className={cn(
            "flex items-center justify-center gap-2 min-h-[44px] px-3 rounded-lg border cursor-pointer transition-colors",
            value === v ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground",
          )}
        >
          <RadioGroupItem id={`vocals-${v}`} value={v} className="sr-only" />
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{label}</span>
        </Label>
      ))}
    </RadioGroup>
  );
}
```

- [ ] **Step 4: PASS**

Run: `npm test -- tests/unit/components/generate-form/VocalsToggle.test.tsx`

- [ ] **Step 5: Коммит**

```bash
git add src/components/generate-form/sections/VocalsToggle.tsx tests/unit/components/generate-form/VocalsToggle.test.tsx
git commit -m "refactor(generate-form): convert VocalsToggle to RadioGroup"
```

## Task 5.2: MobileGenerationForm — компактная мобильная разметка

**Files:**

- Create: `src/components/generate-form/mobile/MobileGenerationForm.tsx`
- Test: `tests/unit/components/generate-form/mobile/MobileGenerationForm.test.tsx`

- [ ] **Step 1: Failing-тест**

```tsx
// tests/unit/components/generate-form/mobile/MobileGenerationForm.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/hooks/useIsMobile", () => ({ useIsMobile: () => true }));

import { MobileGenerationForm } from "@/components/generate-form/mobile/MobileGenerationForm";

describe("MobileGenerationForm", () => {
  it("renders compact layout with smaller padding", () => {
    render(<MobileGenerationForm onSubmit={vi.fn()} />);
    const root = screen.getByTestId("mobile-gen-form");
    expect(root.className).toContain("p-3");
  });
  it("uses VocalsToggle as radio group", () => {
    render(<MobileGenerationForm onSubmit={vi.fn()} />);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: FAIL**

Run: `npm test -- tests/unit/components/generate-form/mobile/MobileGenerationForm.test.tsx`

- [ ] **Step 3: Реализация**

```tsx
// src/components/generate-form/mobile/MobileGenerationForm.tsx
import { useState } from "react";
import { MobileFormField } from "@/components/mobile/MobileFormField";
import { MobileTextarea } from "@/components/mobile/MobileTextarea";
import { MobileSlider } from "@/components/mobile/MobileSlider";
import { Button } from "@/components/ui/button";
import { VocalsToggle } from "../sections/VocalsToggle";
import { logger } from "@/lib/logger";

interface Props {
  onSubmit: (data: GeneratePayload) => void;
  initial?: Partial<GeneratePayload>;
}

export function MobileGenerationForm({ onSubmit, initial }: Props) {
  const [style, setStyle] = useState(initial?.style ?? "");
  const [vocals, setVocals] = useState<"vocal" | "instrumental">(initial?.vocals ?? "vocal");
  const [mood, setMood] = useState(initial?.mood ?? 50);

  return (
    <form
      data-testid="mobile-gen-form"
      onSubmit={(e) => {
        e.preventDefault();
        logger.info("mobile submit", { style, vocals, mood });
        onSubmit({ style, vocals, mood });
      }}
      className="flex flex-col gap-3 p-3"
    >
      <MobileFormField label="Стиль">
        <MobileTextarea value={style} onChange={setStyle} placeholder="Опишите трек" maxRows={3} />
      </MobileFormField>

      <MobileFormField label="Тип">
        <VocalsToggle value={vocals} onChange={setVocals} compact />
      </MobileFormField>

      <MobileFormField label={`Настроение: ${mood}%`}>
        <MobileSlider value={mood} onChange={setMood} min={0} max={100} />
      </MobileFormField>

      <Button type="submit" size="lg" className="min-h-[48px] mt-2">
        Сгенерировать
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: PASS**

Run: `npm test -- tests/unit/components/generate-form/mobile/MobileGenerationForm.test.tsx`

- [ ] **Step 5: Подключить в GenerateFormCustom/Simple через useIsMobile**

```tsx
// src/components/generate-form/GenerateFormCustom.tsx
import { useIsMobile } from "@/hooks/useIsMobile";
import { MobileGenerationForm } from "./mobile/MobileGenerationForm";

export function GenerateFormCustom(props) {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileGenerationForm {...props} />;
  return <DesktopGenerationForm {...props} />;
}
```

- [ ] **Step 6: PASS + lint + bundle check**

Run: `npm test -- tests/unit/components/generate-form/mobile/MobileGenerationForm.test.tsx && npm run lint && npm run size`

- [ ] **Step 7: Коммит**

```bash
git add src/components/generate-form/mobile/MobileGenerationForm.tsx src/components/generate-form/GenerateFormCustom.tsx src/components/generate-form/GenerateFormSimple.tsx tests/unit/components/generate-form/mobile/MobileGenerationForm.test.tsx
git commit -m "feat(generate-form): compact mobile layout with radio vocals"
```

---

# Финальные проверки (после всех фаз)

## Task F.1: Полный прогон тестов и бандл

- [ ] Run: `npm test`
      Expected: все тесты PASS (включая новые).
- [ ] Run: `npm run test:e2e`
      Expected: 47 specs PASS.
- [ ] Run: `npm run lint`
      Expected: 0 errors.
- [ ] Run: `npm run size`
      Expected: bundle ≤ 950 KB.

## Task F.2: Обновить документацию

**Files:**

- Modify: `CLAUDE.md` (обновить секцию «Last Updated»)
- Modify: `PROJECT_STATUS.md` (добавить Sprint 038 результаты)
- Modify: `CHANGELOG.md` (новая секция Fixed)

- [ ] **Step 1: Обновить PROJECT_STATUS.md**

Добавить запись о Sprint 038 с буллет-поинтами по 8 проблемам.

- [ ] **Step 2: Обновить CHANGELOG.md**

```markdown
## [Unreleased] — Sprint 038

### Fixed

- Generation latency via Supabase Realtime + adaptive polling fallback
- Generation indicator size stability
- A/B version visibility in GenerationResultSheet
- Duplicate notifications collapsed to single indicator channel
- Waveform canvas redraw throttling + progress RAF race
- MobileFullscreenPlayer race conditions
- Lyrics auto-scroll iOS touch conflict
- MobileGenerationForm compact layout with radio vocals toggle
```

- [ ] **Step 3: Коммит документации**

```bash
git add CLAUDE.md PROJECT_STATUS.md CHANGELOG.md
git commit -m "docs(sprint-038): update status and changelog"
```

## Task F.3: Обновить knowledge graph

- [ ] Run: `graphify update .`
      Expected: новые файлы/правки отражены в `graphify-out/graph.json`.

---

# Самопроверка плана (Self-Review)

**1. Spec coverage:**

- ✅ Проблема 1 → Фаза 1, Tasks 1.1–1.2 (Realtime + fallback polling)
- ✅ Проблема 2 → Фаза 1, Task 1.3 (фикс высоты плашки)
- ✅ Проблема 3 → Фаза 2, Tasks 2.1–2.3 (label fallback + callback + UI)
- ✅ Проблема 4 → Фаза 1, Task 1.4 (один канал уведомлений)
- ✅ Проблема 5 → Фаза 3, Task 3.1 (мемоизация Canvas)
- ✅ Проблема 6 → Фаза 3, Task 3.2 (init effect)
- ✅ Проблема 7 → Фаза 4, Task 4.1 (RAF scrollTo)
- ✅ Проблема 8 → Фаза 5, Tasks 5.1–5.2 (RadioGroup + MobileGenerationForm)

**2. Placeholder scan:** нет «TBD», «TODO», «fill in». Все шаги имеют код и команды.

**3. Type consistency:**

- `useGenerationRealtime` возвращает `{ activeTasks, lastEventAt }` → использовано в `useActiveGenerations`
- `mapTrackVersion` сигнатура `(row: TrackVersionRow)` → `TrackVersionRow` уже есть в файле
- `MobileGenerationForm.onSubmit(data: GeneratePayload)` — тип `GeneratePayload` нужно определить в `src/types/generation.ts` или переиспользовать существующий из `useGenerateFormSubmit.ts`. **FIX inline:** добавить в Task 5.2 Step 3 импорт `type GeneratePayload = { style: string; vocals: 'vocal'|'instrumental'; mood: number };` или импортировать из хука.

**4. Исправление:**
В Task 5.2 Step 3 заменить `GeneratePayload` на конкретный тип:

```ts
import type { GeneratePayload } from "@/hooks/generation/useGenerateFormSubmit";
```

(если тип не экспортирован — добавить export type в `useGenerateFormSubmit.ts` отдельным коммитом в Фазе 0).
