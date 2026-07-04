# 📋 MANIFEST: Sprint 053 + 054 — что применить в Lovable.dev

> **Назначение:** исчерпывающий список ручных действий для развёртывания Sprint 053 + 054 в Lovable.dev после merge в `main`. Код уже в репозитории — этот документ покрывает только то, что Lovable.dev не делает автоматически.

**Sprint:** 053 + 054 (закрыт 2026-07-04) · **Ветка:** `claude/sprint-053-054-suno-completion-pilot` (merge в main после PR review) · **Suno API:** 24/28 → **28/28 (100%)** ✅

---

## 1. 🗄️ Миграции (применить через Lovable SQL Editor или CLI)

### 1.1 `sound_effects` (новая таблица)

**Файл:** [supabase/migrations/20260708000000_sound_effects.sql](../supabase/migrations/20260708000000_sound_effects.sql)

```sql
-- Sprint 053-A1: SFX (звуковые эффекты) — хранилище для suno-sounds генераций.
-- Edge-bridge pattern: таблица НЕ в generated TypeScript-типах сразу после миграции,
-- клиент НЕ обращается к ней напрямую (только через suno-sounds-* edges).

create table public.sound_effects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  task_id         text not null,
  prompt          text not null,
  audio_url       text,
  image_url       text,
  duration        numeric,
  status          text not null default 'processing'
                  check (status in ('processing', 'completed', 'failed')),
  error_message   text,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index idx_sound_effects_task_id on public.sound_effects(task_id);
create index idx_sound_effects_user_status
  on public.sound_effects(user_id, status, created_at desc);

alter table public.sound_effects enable row level security;

create policy "Users manage own sound effects"
  on public.sound_effects
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger для auto-updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_sound_effects_updated_at
  before update on public.sound_effects
  for each row execute function public.set_updated_at();
```

### 1.2 `track_versions.midi_*` (MIDI direct + Replicate fallback)

**Файл:** [supabase/migrations/20260708000000_midi_source.sql](../supabase/migrations/20260708000000_midi_source.sql)

```sql
-- Sprint 053-A3: Suno MIDI direct + Replicate fallback.
-- midi_generation_source маркирует, какая система сгенерировала MIDI.
-- NULL = не сгенерировано; 'suno' = Suno primary; 'replicate' = Replicate fallback.

alter table public.track_versions
  add column if not exists midi_url text;

alter table public.track_versions
  add column if not exists midi_generation_source text
    check (midi_generation_source in ('suno', 'replicate'));

-- Partial index — ускоряет callback-resolve WHERE midi_generation_source='suno' AND midi_url IS NULL
create index if not exists idx_track_versions_midi_source
  on public.track_versions(midi_generation_source)
  where midi_generation_source is not null;
```

### 1.3 ⚠️ Не применять на прод до проверки Sprint 050-A3

В рамках Sprint 050-A3 сверяются **все pending миграции** между репозиторием и прод-БД. Если Lovable.dev применяет миграции автоматически из папки `supabase/migrations/`, эти две миграции будут подхвачены автоматически — НЕ дублируйте их вручную через SQL Editor.

**Проверка после применения:**

```sql
-- Должно вернуть 2 строки
select tablename from pg_tables where tablename = 'sound_effects';

-- Должно вернуть midi_url + midi_generation_source
select column_name from information_schema.columns
where table_name = 'track_versions'
  and column_name in ('midi_url', 'midi_generation_source');
```

---

## 2. 🪣 Storage buckets (создать через Lovable Storage UI или SQL)

### 2.1 `midi` (новый)

**Назначение:** хранит `.mid` файлы, сгенерированные Suno (`suno-midi` edge) или Replicate fallback.

**Создать через SQL:**

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'midi',
  'midi',
  true,                  -- public read (URL подписан не нужен)
  5242880,               -- 5 MB (типичный MIDI < 100 KB, но запас)
  array['audio/midi', 'audio/x-midi', 'application/octet-stream']
)
on conflict (id) do nothing;
```

**Storage policies** (RLS на `storage.objects`):

```sql
-- Чтение: public (любой может проигрывать MIDI по URL)
create policy "Public MIDI read"
  on storage.objects for select
  using (bucket_id = 'midi');

-- Запись: только edge functions через service role.
-- -- suno-midi-callback: использует service role key → RLS bypass.
-- -- Replicate fallback: аналогично.
-- Если хотите разрешить пользователям загружать свои .mid:
create policy "Users can upload own MIDI"
  on storage.objects for insert
  with check (
    bucket_id = 'midi'
    and auth.uid()::text = (storage.foldername(name))[1]  -- path = {user_id}/{file}.mid
  );
```

**Структура путей:**

```
midi/
└── tracks/
    └── {track_version_id}.mid
```

### 2.2 Существующие buckets — без изменений

- `project-assets` — для audio/cover (Sprint 050/052 уже используют)
- `avatars`, `covers`, `stems` — без изменений
- `lyrics` — без изменений

---

## 3. ⚡ Edge Functions (задеплоить)

### 3.1 Через Lovable Edge Functions UI

> **Рекомендация:** Lovable.dev обычно деплоит edge functions автоматически при merge в main, если папка `supabase/functions/{name}/index.ts` существует. Если нет — задеплоить вручную:

| Edge function             | Путь                                                  | Секреты                                     | Описание             |
| ------------------------- | ----------------------------------------------------- | ------------------------------------------- | -------------------- |
| `suno-sounds`             | `supabase/functions/suno-sounds/index.ts`             | `SUNO_API_KEY`                              | SFX generation       |
| `suno-sounds-callback`    | `supabase/functions/suno-sounds-callback/index.ts`    | `SUPABASE_SERVICE_ROLE_KEY`                 | SFX callback         |
| `suno-sounds-status`      | `supabase/functions/suno-sounds-status/index.ts`      | `SUPABASE_SERVICE_ROLE_KEY`                 | SFX status (DB read) |
| `suno-midi`               | `supabase/functions/suno-midi/index.ts`               | `SUNO_API_KEY`                              | MIDI generation      |
| `suno-midi-callback`      | `supabase/functions/suno-midi-callback/index.ts`      | `SUNO_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | MIDI callback        |
| `suno-midi-details`       | `supabase/functions/suno-midi-details/index.ts`       | `SUNO_API_KEY`                              | MIDI polling         |
| `suno-music-details`      | `supabase/functions/suno-music-details/index.ts`      | `SUNO_API_KEY`                              | Music polling        |
| `suno-cover-details`      | `supabase/functions/suno-cover-details/index.ts`      | `SUNO_API_KEY`                              | Cover polling        |
| `suno-video-details`      | `supabase/functions/suno-video-details/index.ts`      | `SUNO_API_KEY`                              | Video polling        |
| `suno-wav-details`        | `supabase/functions/suno-wav-details/index.ts`        | `SUNO_API_KEY`                              | WAV polling          |
| `suno-lyrics-details`     | `supabase/functions/suno-lyrics-details/index.ts`     | `SUNO_API_KEY`                              | Lyrics polling       |
| `suno-separation-details` | `supabase/functions/suno-separation-details/index.ts` | `SUNO_API_KEY`                              | Separation polling   |

### 3.2 Удалить (Sprint 054-A7' cleanup)

- `suno-check-status` — **больше не нужен**, удалить через Lovable UI или `supabase functions delete suno-check-status`.

### 3.3 Секреты (проверить через Lovable Secrets UI)

```bash
# Обязательные
SUNO_API_KEY=<existing>           # уже настроен в Sprint 050
SUPABASE_SERVICE_ROLE_KEY=<auto>  # auto-injected by Supabase
SUPABASE_URL=<auto>               # auto-injected
SUPABASE_ANON_KEY=<auto>          # auto-injected

# НЕ требуются для Sprint 053/054
LOVABLE_API_KEY                   # только для suno-boost-style (Sprint 053-A6 — уже настроен)
```

### 3.4 Обновить `supabase/config.toml`

Уже сделано в коммите `6dc90af5`:

```toml
# Удалено:
# [functions.suno-check-status]
# verify_jwt = true
```

Убедитесь, что ваш локальный `supabase/config.toml` содержит это изменение после merge.

### 3.5 Команда для массового деплоя (если Lovable.dev не делает автоматически)

```bash
# Из корня репозитория, после merge в main:
supabase functions deploy suno-sounds
supabase functions deploy suno-sounds-callback
supabase functions deploy suno-sounds-status
supabase functions deploy suno-midi
supabase functions deploy suno-midi-callback
supabase functions deploy suno-midi-details
supabase functions deploy suno-music-details
supabase functions deploy suno-cover-details
supabase functions deploy suno-video-details
supabase functions deploy suno-wav-details
supabase functions deploy suno-lyrics-details
supabase functions deploy suno-separation-details
supabase functions delete suno-check-status  # если ещё существует
```

---

## 4. 🔄 Миграция фронтенда (после merge в main)

### 4.1 Pull + rebuild

```bash
git checkout main
git pull origin main
npm install   # если есть новые зависимости (нет — Sprint 053/054 использовал только существующие)
npm run build # проверка перед деплоем Lovable
```

### 4.2 Lovable.dev auto-deploy

Если Lovable.dev настроен на auto-deploy при push в main — после merge фронт обновится автоматически. Проверить в Lovable Dashboard → Deployments.

### 4.3 Manual deploy (если Lovable не делает auto)

```bash
npm run build
# upload dist/ to Lovable (зависит от Lovable setup — Cloudflare Pages, Vercel, etc.)
```

---

## 5. ✅ Smoke test (после деплоя)

### 5.1 SFX (Sprint 053-A1)

1. Открыть Telegram Mini App → Library → "Sound Effects"
2. Ввести prompt: "Glass breaking on concrete floor"
3. Tempo: 120, Key: C, Duration: 5s
4. Submit → подождать 30-60s → проверить:
   - Preview audio plays ✅
   - `sound_effects` row создан с `status='completed'`, `audio_url` не NULL
   - Toast "SFX готов!" появился

### 5.2 MIDI direct (Sprint 053-A3)

1. Открыть Unified Studio → выбрать трек
2. MIDI → "Generate MIDI"
3. Подождать ~60s → проверить:
   - `.mid` файл появился в Storage `midi/tracks/{versionId}.mid`
   - `track_versions.midi_url` заполнен
   - `track_versions.midi_generation_source = 'suno'`
4. **Fallback test:** установить `SUNO_API_KEY = 'invalid'` в env → повторить → должно сработать Replicate fallback, `midi_generation_source = 'replicate'`

### 5.3 Details suite (Sprint 054-A1..A6)

Через Lovable SQL Editor или Network tab в DevTools:

```typescript
// Music
await supabase.functions.invoke("suno-music-details", { body: { taskId: "existing-task-id" } });
// → { success: true, taskId, status: 'SUCCESS'|'PROCESSING'|..., clips: [...] }
```

Повторить для cover/video/wav/lyrics/separation.

### 5.4 useSunoTaskDetails (Sprint 054-A8)

```typescript
// В React DevTools console:
const { data, isFetching } = window.__TEST_HOOK__?.useSunoTaskDetails?.("test-task-id", "music");
// isFetching должен переключаться true → false каждые 2000ms
// data.status: PROCESSING → SUCCESS → polling stops
```

Или просто дёрнуть любой polling flow (если есть) — `Library → Active Generations` теперь использует `useSunoTaskDetails` под капотом.

---

## 6. 🚨 Rollback (если что-то сломалось)

### 6.1 Откатить миграции

```sql
-- Только если НЕТ реальных данных
drop table if exists public.sound_effects cascade;
alter table public.track_versions drop column if exists midi_url;
alter table public.track_versions drop column if exists midi_generation_source;
```

### 6.2 Откатить edge functions

```bash
supabase functions delete suno-sounds
supabase functions delete suno-midi
# ... (все 12 новых edges)
# suno-check-status УЖЕ удалён — НЕ восстанавливать (dead code)
```

### 6.3 Откатить фронт

```bash
git revert <merge-commit-hash>   # откатить merge в main
git push origin main
```

---

## 7. 📞 Контакты / куда эскалировать

- **Любые вопросы по Sprint 053/054:** см. [PROJECT_STATUS.md → Sprint 053+054 секция](../PROJECT_STATUS.md)
- **Ретро:** [docs/sprints/SPRINT-053-RETRO.md](../sprints/SPRINT-053-RETRO.md), [docs/sprints/SPRINT-054-RETRO.md](../sprints/SPRINT-054-RETRO.md)
- **Полный diff:** git log `c896baf1` ... `6dc90af5` (5 коммитов)
- **Suno API спека:** [docs/SUNO_API.md → История изменений → Sprint 053/054](../SUNO_API.md)
- **Memory note о dead code cleanup:** [memory/sprint-054-a7-a9-plan-mismatch.md](../../memory/sprint-054-a7-a9-plan-mismatch.md)

---

<sub>Создано: 2026-07-04 · Sprint 053 + 054 closeout · HOW2AI Agency © 2025-2026</sub>
