-- Allow Principal to update registrations (for department reassignment)
CREATE POLICY "Principals can update registrations"
ON public.registrations
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'principal'::app_role));

-- Allow Principal to update profiles (sync department changes)
CREATE POLICY "Principals can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'principal'::app_role));
