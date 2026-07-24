# Клиентский код — что править

## Хорошая новость

- Все прямые запросы к БД уже собраны в **32 API-модулях** в `src/api/*` (ESLint-правило `no-restricted-syntax` запрещает `supabase.from()` вне этого слоя).
- Realtime — в 26 хуках/сервисах, не размазан по компонентам.
- Storage — в ~15 местах, все через `supabase.storage.from(...)`.
- Auth — только в `src/contexts/AuthContext.tsx` и `useAuth`.

## Плохая новость

- Клиент импортируется как singleton из **автогенерируемого** файла `src/integrations/supabase/client.ts` — редактировать нельзя (перезапишется).
- `.env` с ключами Supabase — тоже управляется платформой Lovable.

## Стратегия по вариантам платформы

### Вариант A/B: другой Supabase (self-hosted или managed)

**Минимальное вмешательство**:

1. Заменить содержимое `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`) на новые значения. На Lovable Cloud это делается через переподключение бэкенда в UI.
2. Сгенерировать новые типы БД: `supabase gen types typescript --project-ref NEW_REF > src/integrations/supabase/types/_generated.ts`.
3. Пересобрать: `npm run build`.
4. Обновить hardcoded-ссылки, если где-то остался `ygmvthybdrqymfsqifmj` (`rg ygmvthybdrqymfsqifmj src/` — сейчас: только в `.env`, что нормально).

**Код не трогается.**

### Вариант C: разделённый стек (Postgres + Auth + Storage разные)

**Значительная работа**. Что менять:

1. **API-слой (`src/api/*`)** — заменить `supabase.from(...)` на fetch к своему REST/GraphQL-слою (или PostgREST-совместимой замене типа `postgrest-py`).
2. **Realtime (26 файлов)** — заменить `.channel()` на подписку к своему WS-сервису (Ably/Pusher/Soketi/Centrifugo).
3. **Storage (15 мест)** — заменить `supabase.storage` на fetch к своему pre-signed URL сервису.
4. **Auth (`AuthContext.tsx`)** — заменить `supabase.auth.*` на API целевого провайдера (Clerk SDK / Auth.js).
5. Удалить `@supabase/supabase-js` из зависимостей после полного отсоединения.

Оценка усилий: **2–3 недели fullstack**, риск регрессий высокий.

## Опциональная работа сейчас (не блокирует миграцию)

Ввести **единую точку конфига** `src/config/backend.ts`, чтобы после миграции URL/ключи не приходилось искать по всему коду. Сейчас `import.meta.env.VITE_SUPABASE_*` встречается в:

- `src/integrations/supabase/client.ts` (авто)
- `src/config/app.config.ts`
- Одиночные использования в некоторых edge-function-invoke хелперах и деplink-трекерах

**Что предлагается** (пример, не применяем в этом заходе — файл автогенерируемый лучше не трогать):

```ts
// src/config/backend.ts
export const backend = {
  url: import.meta.env.VITE_SUPABASE_URL,
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID,
  functionsBase: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`,
} as const;
```

Затем везде `import { backend } from "@/config/backend"`. При смене провайдера правится 1 файл.

## Что НЕ трогать никогда

- `src/integrations/supabase/client.ts` — автогенерируется.
- `src/integrations/supabase/types/_generated.ts` — автогенерируется командой `npm run supabase:types`.
- `supabase/config.toml` (project-level настройки) — управляется платформой.
- `.env` — управляется Lovable Cloud подключением бэкенда.

## Realtime — список каналов для мониторинга после миграции

Сразу после переезда прогнать smoke по каждому:

| Файл                                                                             | Что подписывается                             |
| -------------------------------------------------------------------------------- | --------------------------------------------- |
| `hooks/generation/useGenerationResult.ts`                                        | `generation_tasks` — прогресс новой генерации |
| `hooks/useGenerationRealtime.tsx`                                                | INSERT в `tracks`                             |
| `hooks/useStemSeparationRealtime.ts`                                             | `stem_separation_tasks`                       |
| `hooks/useReplaceSectionRealtime.ts`                                             | `generation_tasks` (replace-section)          |
| `hooks/generation/useExtendProgress.ts`                                          | `generation_tasks` (extend)                   |
| `hooks/generation/useAddVocalsProgress.ts`                                       | `generation_tasks` (add-vocals)               |
| `hooks/generation/useAddInstrumentalProgress.ts`                                 | `generation_tasks` (add-instrumental)         |
| `hooks/useVideoGenerationStatus.ts`                                              | `video_generation_tasks`                      |
| `hooks/useAchievementNotifications.ts`                                           | `user_achievements`                           |
| `contexts/NotificationContext.tsx`                                               | `notifications` для юзера                     |
| `hooks/useTracks.ts`, `useTrackCounts.ts`                                        | INSERT/UPDATE `tracks`                        |
| `hooks/voice/useCustomVoices.ts`, `useVoiceCloneWizard.ts`                       | `custom_voices`                               |
| `services/smart-alerts.service.ts`                                               | `notifications`                               |
| `hooks/useProjects.tsx`, `useProjectTracks.tsx`, `studio/useProjectTrackSync.ts` | `music_projects`, `project_tracks`            |
| `api/*.api.ts` (batch, presets, analytics, generation, studio)                   | вспомогательные live-обновления               |

Все 26 файлов — обязательный чек-лист QA-после-переезда.
