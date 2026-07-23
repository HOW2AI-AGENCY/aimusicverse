# Экспорт и применение схемы БД

## Что переносим

- 105 таблиц в `public`
- 9 enum-типов
- 115 функций (`pg_get_functiondef`)
- 279 RLS-политик
- 328 кастомных индексов
- Расширения: `pgcrypto`, `uuid-ossp`, `supabase_vault` (опц.), `pg_stat_statements` (опц.)
- 0 sequences (все `id` через `gen_random_uuid()`)
- 0 кастомных триггеров вне `RI_*`/`pg_*` (уточнить перед миграцией)

## Способ выгрузки

**Не пытайтесь собирать схему по одному SELECT.** На новой инфре доступ к managed Postgres даст:

### Вариант А: pg_dump (нужен прямой доступ к Postgres)

Если у вас есть connection-string от Supabase (обычно нет для Lovable Cloud → см. RISKS §11), запустите:

```bash
# Только схема, без данных
pg_dump \
  --schema=public \
  --schema-only \
  --no-owner \
  --no-privileges \
  --no-security-labels \
  --exclude-schema=auth \
  --exclude-schema=storage \
  --exclude-schema=graphql \
  --exclude-schema=realtime \
  --exclude-schema=supabase_functions \
  --exclude-schema=vault \
  "$SOURCE_DB_URL" > migration/schema.sql

# Плюс auth/storage схемы, но с ключом --if-exists
pg_dump --schema=auth --data-only --no-owner --column-inserts "$SOURCE_DB_URL" > migration/auth-data.sql
```

### Вариант Б: через существующие миграции репозитория

Проект использует Lovable Cloud migration tool. Все накопленные миграции лежат в `supabase/migrations/` в виде timestamp-именованных `.sql` файлов (проверить: `ls supabase/migrations/ | wc -l`). На новой инфре достаточно:

```bash
# Порядок применения — по имени файла (timestamp-lexicographic)
for f in supabase/migrations/*.sql; do
  psql "$NEW_DB_URL" -f "$f"
done
```

Это воспроизведёт всю историю. **Рекомендуемый способ** — исторические миграции уже прошли через codereview.

### Вариант В: Supabase Migration API (self-hosted или собственный managed)

```bash
supabase link --project-ref NEW_REF
supabase db push
```

## Порядок применения (если собираете вручную)

Строго:

1. `CREATE EXTENSION` (pgcrypto, uuid-ossp, supabase_vault, pg_stat_statements)
2. `CREATE TYPE ... AS ENUM` (9 enums)
3. `CREATE TABLE` (в порядке FK — сначала без зависимостей: `profiles`, `music_styles`, `feature_flags`, `task_categories`, ...)
4. `CREATE FUNCTION` (все 115, включая `has_role`, `handle_new_user`, `secure_credit_update`)
5. `CREATE TRIGGER` (если появятся)
6. `CREATE INDEX` (328 кастомных)
7. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
8. `CREATE POLICY` (279 политик)
9. `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated` для каждой user-facing таблицы
10. `GRANT ALL ... TO service_role` (edge functions)

## Проверка после применения

```sql
-- Должно совпасть со значениями из INVENTORY.md
SELECT
  (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE') AS tables,
  (SELECT count(*) FROM pg_type t JOIN pg_namespace n ON t.typnamespace=n.oid WHERE n.nspname='public' AND t.typtype='e') AS enums,
  (SELECT count(*) FROM pg_policies WHERE schemaname='public') AS rls_policies,
  (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public') AS functions,
  (SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname NOT LIKE '%_pkey') AS indexes;
```

Целевые значения: **tables=105, enums=9, rls_policies=279, functions=115, indexes=328**.

## Ловушки

- **`has_role` — security definer**. При переносе через `pg_dump` без `--no-privileges` могут потеряться права владельца. Проверьте `SECURITY DEFINER SET search_path = public` в теле функции.
- **Enum-типы**: если приложение уже писало значения, перед `DROP TYPE` нужен `ALTER TYPE ... ADD VALUE` для новых меток.
- **RLS без GRANT — 401/403 через PostgREST**. Убедиться, что для всех таблиц выдан `GRANT` роли `authenticated`, а публичные — ещё и `anon`.
