-- Allow admins to insert profiles (needed for approval flow)
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete profiles if needed
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));