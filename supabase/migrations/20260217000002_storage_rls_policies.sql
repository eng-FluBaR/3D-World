-- Enable RLS for storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload files to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'requests'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Allow authenticated users to read their own files
CREATE POLICY "Users can read their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = 'requests'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = 'requests'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = 'requests'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Allow admins to read all files
CREATE POLICY "Admins can read all files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'moderator')
  )
);

-- Policy: Allow public access to uploads bucket (for viewing)
CREATE POLICY "Public can view uploads bucket"
ON storage.buckets
FOR SELECT
TO public
USING (id = 'uploads');
