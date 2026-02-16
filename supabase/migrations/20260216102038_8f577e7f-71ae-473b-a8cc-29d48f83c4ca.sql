-- Allow Principal to view all approved registrations for staff management
CREATE POLICY "Principals can view all registrations"
ON public.registrations
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'principal'::app_role));
