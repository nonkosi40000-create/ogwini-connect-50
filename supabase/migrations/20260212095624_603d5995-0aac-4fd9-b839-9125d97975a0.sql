
-- Allow anyone (including unauthenticated users) to upload files to registration-docs bucket
-- This is needed because users upload documents BEFORE they have an auth account
CREATE POLICY "Anyone can upload registration documents"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'registration-docs');

-- Allow anyone to read registration documents (bucket is already public)
CREATE POLICY "Anyone can read registration documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'registration-docs');
