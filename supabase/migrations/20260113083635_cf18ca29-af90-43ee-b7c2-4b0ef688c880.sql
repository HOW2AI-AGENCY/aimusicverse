-- Создать функцию для инициализации user_credits при создании профиля
CREATE OR REPLACE FUNCTION public.handle_new_profile_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (
    user_id, balance, total_earned, total_spent, 
    experience, level, current_streak, longest_streak
  )
  VALUES (
    NEW.user_id, 50, 50, 0, 0, 1, 0, 0
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Удалить старый триггер если существует
DROP TRIGGER IF EXISTS on_profile_created_init_credits ON public.profiles;

-- Создать триггер
CREATE TRIGGER on_profile_created_init_credits
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile_credits();

-- Исправить существующих пользователей без кредитов (добавить им 50 стартовых кредитов)
INSERT INTO user_credits (user_id, balance, total_earned, total_spent, experience, level, current_streak, longest_streak)
SELECT p.user_id, 50, 50, 0, 0, 1, 0, 0
FROM profiles p
LEFT JOIN user_credits uc ON uc.user_id = p.user_id
WHERE uc.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;