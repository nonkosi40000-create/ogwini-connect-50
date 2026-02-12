-- Make registration-docs bucket public so admin can view uploaded documents
UPDATE storage.buckets SET public = true WHERE id = 'registration-docs';

-- Ensure proper storage policies exist for registration-docs
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload registration docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'registration-docs');

-- Allow anyone to view registration docs (public bucket)
CREATE POLICY "Anyone can view registration docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'registration-docs');

-- Allow admin to delete registration docs
CREATE POLICY "Admin can delete registration docs"
ON storage.objects FOR DELETE
USING (bucket_id = 'registration-docs' AND public.has_role(auth.uid(), 'admin'));
