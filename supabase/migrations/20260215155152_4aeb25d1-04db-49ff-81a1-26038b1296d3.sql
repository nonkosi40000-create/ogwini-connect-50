-- Allow HODs to view profiles of users in their departments
CREATE POLICY "HODs can view department profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'hod'::app_role) 
  AND department_id IN (
    SELECT department_id FROM public.department_heads WHERE user_id = auth.uid()
  )
);

-- Allow LLCs to view profiles (needed for teacher oversight)
CREATE POLICY "LLCs can view profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'llc'::app_role));

-- Allow Deputy Principals to view all profiles
CREATE POLICY "Deputy principals can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'deputy_principal'::app_role));