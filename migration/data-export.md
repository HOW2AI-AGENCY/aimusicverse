# Перенос данных

## Объёмы

- 105 таблиц, ~1077 пользователей.
- Основные объёмы (оценка): `tracks`, `track_versions`, `error_logs`, `content_audit_log`, `api_usage_logs` — потенциально по 100k+ строк каждая.

## Стратегии

### A. pg_dump/pg_restore (рекомендуется, если есть DB URL)

```bash
# Экспорт (только public.*)
pg_dump \
  --data-only \
  --schema=public \
  --disable-triggers \
  --no-owner \
  --column-inserts \
  "$SOURCE_DB_URL" > migration/data.sql

# Импорт
psql "$NEW_DB_URL" < migration/data.sql
```

**Обязательно `--disable-triggers`**: иначе FK-триггеры сбросят порядок вставки.

### B. Table-by-table COPY (если dump-доступа нет)

Порядок вставки — по FK. Родительские таблицы **раньше** дочерних:

```
Уровень 0 (без FK): music_styles, task_categories, feature_flags, subscription_tiers,
                    stars_products, suno_meta_tags, suno_models, promo_codes,
                    prompt_templates, achievements, blog_posts, sound_effects,
                    telegram_bot_config, telegram_menu_items, economy_config

Уровень 1 (зависит от auth.users): profiles, user_roles, user_credits, user_streaks,
                                    user_onboarding, user_notification_settings,
                                    user_generation_stats, user_activity, referrals,
                                    tinkoff_subscriptions

Уровень 2 (зависит от profiles/пользователя): artists, playlists, music_projects,
                                                custom_voices, reference_audio,
                                                studio_projects, tasks

Уровень 3: tracks, generation_tasks, video_generation_tasks, stem_separation_tasks,
           lyrics_templates, blocked_users, user_follows, comments, promo_code_usage

Уровень 4: track_versions, track_stems, track_tags, track_analytics, track_likes,
           track_change_log, comment_likes, playlist_tracks, project_tracks,
           project_assets, moderation_reports, notifications, credit_transactions,
           payment_transactions, stars_transactions

Уровень 5+: audio_analysis, guitar_recordings, cover_thumbnails, lyrics_versions,
            lyrics_section_notes, stem_transcriptions, track_versions
```

Пример COPY:

```bash
# Экспорт одной таблицы в CSV
psql "$SOURCE_DB_URL" -c "\COPY public.tracks TO 'tracks.csv' WITH CSV HEADER"

# Импорт
psql "$NEW_DB_URL" -c "\COPY public.tracks FROM 'tracks.csv' WITH CSV HEADER"
```

### C. Через Lovable Cloud UI

Cloud → Advanced → Export data. Даёт zip с CSV по каждой таблице.

## URL-rewriting в text/jsonb колонках

После переноса нужно **обязательно** обновить URL, ссылающиеся на старый Supabase-хост.

**Найти все text/jsonb колонки со ссылками**:

```sql
-- Прогон по всем text-колонкам
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema='public'
  AND data_type IN ('text','jsonb','json','ARRAY');
```

**Пример rewrite для конкретной колонки**:

```sql
-- text
UPDATE public.tracks
SET cover_url = REPLACE(cover_url, 'ygmvthybdrqymfsqifmj.supabase.co', 'NEW_HOST')
WHERE cover_url LIKE '%ygmvthybdrqymfsqifmj.supabase.co%';

-- jsonb — через каст
UPDATE public.audio_analysis
SET raw_response = REPLACE(raw_response::text, 'ygmvthybdrqymfsqifmj.supabase.co', 'NEW_HOST')::jsonb
WHERE raw_response::text LIKE '%ygmvthybdrqymfsqifmj.supabase.co%';
```

**Колонки-подозреваемые** (проверить каждую): `tracks.cover_url`, `tracks.audio_url`, `tracks.video_url`, `music_projects.cover_url`, `playlists.cover_url`, `profiles.avatar_url`, `artists.portrait_url`, `blog_posts.cover_url`, `cover_thumbnails.*`, `reference_audio.audio_url`, `custom_voices.reference_audio_url`, `audio_analysis.raw_response`, `guitar_recordings.audio_url`, `track_stems.audio_url`, `track_versions.audio_url`.

Скрипт для проверки «остались ли старые ссылки»:

```sql
DO $$
DECLARE r RECORD; cnt bigint; total bigint := 0;
BEGIN
  FOR r IN
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema='public' AND data_type IN ('text','jsonb','json')
  LOOP
    EXECUTE format(
      'SELECT count(*) FROM public.%I WHERE %I::text LIKE ''%%ygmvthybdrqymfsqifmj%%''',
      r.table_name, r.column_name
    ) INTO cnt;
    IF cnt > 0 THEN
      RAISE NOTICE '% . % : % rows', r.table_name, r.column_name, cnt;
      total := total + cnt;
    END IF;
  END LOOP;
  RAISE NOTICE 'Total leaks: %', total;
END $$;
```

## Верификация

После импорта на новой БД:

```sql
-- Сверка счётчиков по всем таблицам
SELECT relname, n_live_tup AS rows
FROM pg_stat_user_tables
WHERE schemaname='public'
ORDER BY relname;
```

Сравнить построчно с таким же запросом на источнике.
