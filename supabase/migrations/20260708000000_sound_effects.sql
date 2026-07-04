-- Sprint 053-A1: Sound Effects table for Suno SFX generation.
-- Stores individual sound effects as separate entities (not tracks) since
-- SFX have no lyrics, vocals, or A/B versions.

create table public.sound_effects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  suno_task_id    text unique,
  prompt          text not null,
  audio_url       text,
  image_url       text,
  duration        numeric(8, 2),
  tempo           integer,
  key             text,
  model           text not null default 'V5',
  status          text not null default 'processing'
                  check (status in ('processing', 'completed', 'failed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamstz not null default now()
);

-- RLS: users see and manage only their own SFX
alter table public.sound_effects enable row level security;

create policy "Users manage own sound effects"
  on public.sound_effects
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast user-scoped lookups
create index sound_effects_user_id_idx on public.sound_effects(user_id, created_at desc);
create index sound_effects_status_idx on public.sound_effects(status) where status = 'processing';