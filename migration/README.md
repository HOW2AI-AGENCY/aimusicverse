# MusicVerse AI — Пакет миграции инфраструктуры

Каталог содержит артефакты, необходимые для переноса приложения с текущего managed-бэкенда (Lovable Cloud / Supabase) на собственную инфраструктуру.

**Дата снимка**: 2026-07-23
**Автор аудита**: Lovable AI agent
**Статус**: подготовка (перенос не выполнен)

## Оглавление

| Файл | Назначение |
|------|------------|
| [`INVENTORY.md`](./INVENTORY.md) | Полный отчёт-снимок текущей системы (что мигрируется) |
| [`RISKS.md`](./RISKS.md) | Специфика Supabase, риски и точки отказа |
| [`schema.md`](./schema.md) | Как выгрузить и применить схему БД |
| [`data-export.md`](./data-export.md) | Экспорт/импорт данных (порядок с FK) |
| [`auth-export.md`](./auth-export.md) | Перенос пользователей и identities с сохранением паролей |
| [`storage-export.md`](./storage-export.md) | Перенос бакетов Storage (~25.5 GB) |
| [`edge-functions.md`](./edge-functions.md) | 135 edge-функций: секреты, `verify_jwt`, план переноса |
| [`client-abstraction.md`](./client-abstraction.md) | Что править в клиентском коде |
| [`env.template`](./env.template) | Шаблон `.env` для нового окружения |

## Порядок выполнения (когда решено, куда переезжаем)

1. Прочитать [`INVENTORY.md`](./INVENTORY.md) и [`RISKS.md`](./RISKS.md).
2. Развернуть целевую БД + расширения (см. [`schema.md`](./schema.md)).
3. Применить схему (extensions → enums → tables → sequences → functions → triggers → indexes → RLS → GRANTs).
4. Перенести `auth.users` + `auth.identities` **до** данных приложения (см. [`auth-export.md`](./auth-export.md)).
5. Перенести данные таблиц в порядке FK (см. [`data-export.md`](./data-export.md)).
6. Перенести Storage-бакеты (см. [`storage-export.md`](./storage-export.md)).
7. Задеплоить edge-функции с секретами (см. [`edge-functions.md`](./edge-functions.md)).
8. Обновить `.env` фронтенда, пересобрать, задеплоить.
9. Переустановить webhook у Telegram, Suno, Tinkoff (см. [`RISKS.md`](./RISKS.md)).
10. Smoke-тест: логин → создание трека → callback → отображение в библиотеке.

## Открытые вопросы (нужны ответы пользователя)

- **Целевая платформа**: Supabase self-hosted / managed Supabase / разделённый стек (Neon + Clerk + S3 + Deno Deploy)?
- **Данные пользователей**: переносить 1077 юзеров и их треки — или чистый старт?
- **Downtime**: допустим ли (несколько часов) или требуется zero-downtime?
- **Storage-стратегия**: 25 GB → тот же S3-совместимый (Supabase Storage) или другое хранилище (R2/S3/B2)?
