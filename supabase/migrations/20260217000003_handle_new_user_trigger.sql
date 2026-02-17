-- ============================================================================
-- Автоматично създаване на profile при регистрация на нов потребител
-- ============================================================================
--
-- Този скрипт добавя функция и trigger за автоматично създаване на profile запис
-- когато се регистрира нов потребител.
--
-- Изпълнете този SQL в Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/hvymzhxefbtyrczrpjjv/sql/new
--
-- ============================================================================

-- Функция за създаване на profile при нова регистрация
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    'user'
  );
  RETURN NEW;
END;
$$;

-- Изтриваме стария trigger ако съществува
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Създаваме trigger за автоматично създаване на profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Проверка дали trigger-ът е създаден успешно
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================================================
-- ГОТОВО! ✅
-- ============================================================================
-- Сега при регистрация на нови потребители автоматично ще се създава profile.
-- Ако display_name не е зададено, ще се използва частта преди @ в email адреса.
-- ============================================================================
