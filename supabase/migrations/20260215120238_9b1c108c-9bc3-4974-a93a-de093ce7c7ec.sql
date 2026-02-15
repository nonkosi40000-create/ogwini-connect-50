
-- Create a security definer function to get all teacher profiles
-- This allows learners to see the teacher list for rating purposes
CREATE OR REPLACE FUNCTION public.get_teacher_profiles()
RETURNS TABLE(user_id uuid, first_name text, last_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.first_name, p.last_name
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE ur.role IN ('teacher', 'hod', 'grade_head', 'llc')
  ORDER BY p.last_name, p.first_name;
$$;
