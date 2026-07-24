# Перенос Storage (≈25.6 GB, 8481 объект)

## Инвентарь бакетов

| Bucket              | Public | Objects | Size      | Приоритет                                         |
| ------------------- | ------ | ------- | --------- | ------------------------------------------------- |
| `project-assets`    | ✅     | 8203    | **25 GB** | **P0** — обложки треков/проектов, публичные аудио |
| `reference-audio`   | ❌     | 120     | 344 MB    | P1 — референсы пользователей                      |
| `avatars`           | ✅     | 136     | 226 MB    | P1                                                |
| `audio`             | ❌     | 19      | 8.2 MB    | P2                                                |
| `voice-sources`     | ❌     | 1       | 9 MB      | P2                                                |
| `project-banners`   | ✅     | 2       | 2.4 MB    | P2                                                |
| Остальные 7 бакетов | mix    | 0       | 0         | пропустить                                        |

## Стратегии (по возрастанию сложности)

### A. То же S3-совместимое хранилище (проще всего)

Supabase Storage поверх S3-совместимого backend. Если новая инфра — тоже Supabase (self-hosted или managed), то:

1. Создать бакеты с теми же именами и public/private-настройками.
2. Скопировать объекты через `rclone`:

   ```bash
   # rclone remotes: SRC = source Supabase (S3 API), DST = target
   rclone copy SRC:project-assets DST:project-assets --transfers 16 --progress
   ```

3. RLS-политики на `storage.objects` — перенести отдельной миграцией (см. `schema.md`).

Для 25 GB на нормальном канале — ~30–60 минут.

### B. Переезд на другое хранилище (S3/R2/B2/Wasabi)

1. Развернуть новый bucket (например, Cloudflare R2 — 10 GB free tier).
2. Через `rclone` перекачать все объекты.
3. **Обязательно** заменить хост в URL-колонках БД (см. `data-export.md` → «URL-rewriting»).
4. Обновить логику загрузки в клиенте — вместо `supabase.storage.from(...).upload()` использовать pre-signed URL от вашего сервиса.
5. Публичные бакеты — включить public read.
6. Приватные — signed URL генерирует бэкенд (edge function → S3 SDK → return url).

### C. Через public URL (нехорошо, но работает без креденшелов)

Для публичных бакетов можно скопировать по HTTPS:

```bash
# Получить список объектов
psql -c "\COPY (SELECT bucket_id, name FROM storage.objects WHERE bucket_id='project-assets') TO 'files.csv' WITH CSV"

# Скачать каждый
while IFS=, read bucket name; do
  curl -sL "https://ygmvthybdrqymfsqifmj.supabase.co/storage/v1/object/public/$bucket/$name" \
    -o "downloads/$bucket/$name" --create-dirs
done < files.csv
```

Для приватных нужны signed URL — придётся генерить пачками через edge fn.

## RLS для storage.objects

Проверить и перенести политики отдельно (обычно ~15–20 политик на несколько бакетов):

```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname='storage' AND tablename='objects';
```

Основной паттерн: user может писать в свою «папку» (`(storage.foldername(name))[1] = auth.uid()::text`).

## Проверка

После переноса:

```sql
SELECT bucket_id, count(*)
FROM storage.objects
GROUP BY bucket_id
ORDER BY count(*) DESC;
```

Сверить с таблицей из `INVENTORY.md`.

Smoke: открыть 3–5 случайных публичных URL из `project-assets` и убедиться, что картинки/аудио отдают HTTP 200.
