# Перенос Auth (1077 пользователей)

## Цель

Сохранить логины пользователей **с исходными паролями** и связями `auth.users ↔ profiles ↔ user_roles`.

## Что переносим из схемы `auth`

- `auth.users` — id, email, encrypted_password (bcrypt), email_confirmed_at, raw_user_meta_data, raw_app_meta_data, created_at, phone, phone_confirmed_at.
- `auth.identities` — привязки провайдеров (email, google, telegram-custom).

## Порядок

### 1. Экспорт с источника

```sql
-- users
COPY (
  SELECT id, instance_id, email, encrypted_password,
         email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
         created_at, updated_at, phone, phone_confirmed_at,
         role, aud
  FROM auth.users
  ORDER BY created_at
) TO STDOUT WITH CSV HEADER;

-- identities
COPY (
  SELECT id, user_id, provider, provider_id, identity_data,
         created_at, updated_at, last_sign_in_at
  FROM auth.identities
) TO STDOUT WITH CSV HEADER;
```

### 2. Импорт на новую инфру (**до данных приложения**)

```sql
-- Порядок:  auth.users → auth.identities → public.profiles → всё остальное
BEGIN;
\COPY auth.users FROM 'users.csv' WITH CSV HEADER
\COPY auth.identities FROM 'identities.csv' WITH CSV HEADER
COMMIT;
```

**Не забыть `instance_id='00000000-0000-0000-0000-000000000000'`** — если в исходной БД он такой.

### 3. JWT-секрет (опционально)

Если хотите, чтобы **уже выданные access-токены оставались валидными** до истечения — скопируйте JWT secret из исходного проекта в новый. Иначе пользователей просто попросят перелогиниться.

- Lovable Cloud: секрет недоступен через API, обратитесь в поддержку либо пропустите этот шаг.
- Собственный Supabase: `Settings → API → JWT Secret`.

## Провайдеры

Проект использует три пути входа:

| Провайдер             | Как работает                                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Email/password**    | стандарт Supabase, bcrypt-хэши переносимы 1:1 на другой Supabase; НЕ переносимы на Clerk/Firebase/Auth0                             |
| **Google OAuth**      | настраивается заново в новом Auth-сервисе; `auth.identities` для google-провайдера восстанавливаются автоматически при первом входе |
| **Telegram Mini App** | custom edge fn `telegram-auth` — при миграции переехать вместе с функцией, изменить только `SUPABASE_URL` в её конфиге              |

## После миграции

Проверка:

```sql
SELECT count(*) FROM auth.users;               -- должно быть 1077
SELECT count(*) FROM auth.identities;          -- должно совпасть с исходной цифрой
SELECT provider, count(*) FROM auth.identities GROUP BY provider;
```

Тест-логин из UI: возьмите одного пользователя, попросите войти по прежнему email/паролю. Должно работать без сброса.

## Если уходим НЕ на Supabase

Bcrypt-хэши формально совместимы с любой библиотекой bcrypt, но провайдеры типа Clerk/Firebase импортируют пользователей только через свои админ-API. Пути:

1. **Clerk**: `POST /v1/users` с `password_hasher: 'bcrypt'` + `password_digest`. Работает.
2. **Auth.js (self-hosted)**: используйте `credentials` provider — читайте `encrypted_password` из своей таблицы через `bcrypt.compare`.
3. **Firebase Auth**: `firebase auth:import users.json --hash-algo=BCRYPT`. Работает.
4. **Kinde/WorkOS/Ory Kratos**: аналогично, у каждого свой admin-endpoint для импорта bcrypt.

**Telegram-логин** во всех случаях требует переписать `telegram-auth` под новый Auth-провайдер (создание пользователя + выдача сессии его API).
