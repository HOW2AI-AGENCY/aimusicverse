-- Восстановление Data-API доступа после регрессии: 104 таблицы public.* потеряли
-- GRANTs для authenticated и service_role, из-за чего админка возвращала 0 пользователей
-- (frontend authenticated-роль не мог читать public.profiles), а часть запросов
-- падала с 42501 permission denied.
--
-- Логика: для каждой base-таблицы в public, у которой `authenticated` НЕ имеет ни
-- одной из SELECT/INSERT/UPDATE/DELETE привилегий, выдаём полный CRUD-набор; то же
-- для service_role (через GRANT ALL). anon не трогаем — у каждой таблицы свой
-- RLS-контракт, давать публичное чтение всем подряд опасно.

DO $$
DECLARE
    tbl record;
    has_priv boolean;
BEGIN
    FOR tbl IN
        SELECT c.relname AS table_name
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE c.relkind = 'r'
           AND n.nspname = 'public'
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.role_table_grants
             WHERE grantee = 'authenticated'
               AND table_schema = 'public'
               AND table_name = tbl.table_name
               AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
        ) INTO has_priv;
        IF NOT has_priv THEN
            EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl.table_name);
        END IF;

        SELECT EXISTS (
            SELECT 1 FROM information_schema.role_table_grants
             WHERE grantee = 'service_role'
               AND table_schema = 'public'
               AND table_name = tbl.table_name
               AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
        ) INTO has_priv;
        IF NOT has_priv THEN
            EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl.table_name);
        END IF;
    END LOOP;
END;
$$;

-- Восстанавливаем EXECUTE на cleanup_expired_notifications — миграция
-- 20260624173920 ревокнула её для authenticated, и frontend NotificationManager
-- стал постоянно выдавать ошибку 42501 в консоли.
GRANT EXECUTE ON FUNCTION public.cleanup_expired_notifications() TO authenticated;