-- ============================================================================
-- ВАЖНО: Този SQL скрипт трябва да се изпълни РЪЧНО в Supabase Dashboard
-- ============================================================================
--
-- Стъпки за изпълнение:
-- 1. Отидете на: https://supabase.com/dashboard/project/hvymzhxefbtyrczrpjjv/sql/new
-- 2. Копирайте и поставете този скрипт
-- 3. Кликнете "Run" за да го изпълните
--
-- ============================================================================

-- Първо, изтриваме съществуващите политики ако има такива
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins full access" ON storage.objects;

-- ============================================================================
-- ОСНОВНИ RLS ПОЛИТИКИ ЗА UPLOADS BUCKET
-- ============================================================================

-- 1. UPLOAD (INSERT) - Позволява на регистрирани потребители да качват файлове
-- Файловете трябва да са в структурата: requests/{user_id}/{filename}
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'requests'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 2. READ (SELECT) - Позволява на потребителите да четат собствените си файлове
CREATE POLICY "Allow users to read own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = 'requests'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 3. UPDATE - Позволява актуализация на собствени файлове (за upsert функционалност)
CREATE POLICY "Allow users to update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = 'requests'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 4. DELETE - Позволява изтриване на собствени файлове
CREATE POLICY "Allow users to delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = 'requests'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 5. ADMIN ACCESS - Позволява пълен достъп за администраторите
CREATE POLICY "Allow admins full access"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'uploads'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'moderator')
  )
);

-- ============================================================================
-- ПРОВЕРКА НА РЕЗУЛТАТИТЕ
-- ============================================================================

-- Проверете дали политиките са създадени успешно:
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- Проверете bucket конфигурацията:
SELECT 
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets
WHERE id = 'uploads';

-- ============================================================================
-- ГОТОВО! ✅
-- ============================================================================
-- Сега можете да тествате качването на файлове в приложението.
-- Отидете на: http://localhost:5174/upload.html
-- ============================================================================
