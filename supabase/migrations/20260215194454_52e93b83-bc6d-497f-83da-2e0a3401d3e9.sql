
-- Allow LLC to upload files to the uploads bucket
CREATE POLICY "LLC can upload to uploads bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads'
  AND has_role(auth.uid(), 'llc'::public.app_role)
);

-- Allow LLC to update their uploads
CREATE POLICY "LLC can update uploads"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'uploads'
  AND has_role(auth.uid(), 'llc'::public.app_role)
);

-- Allow LLC to delete their uploads
CREATE POLICY "LLC can delete uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads'
  AND has_role(auth.uid(), 'llc'::public.app_role)
);
