
-- Add department_id to registrations so teachers can select their department
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id);

-- Add department_id to profiles so we know which dept a teacher belongs to
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id);

-- Create timetables table
CREATE TABLE IF NOT EXISTS public.timetables (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  grade text NOT NULL,
  class text,
  timetable_type text NOT NULL DEFAULT 'class',
  file_url text NOT NULL,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage timetables" ON public.timetables FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Grade heads can manage timetables" ON public.timetables FOR ALL USING (has_role(auth.uid(), 'grade_head'::app_role));
CREATE POLICY "Authenticated users can view timetables" ON public.timetables FOR SELECT USING (true);

CREATE TRIGGER update_timetables_updated_at BEFORE UPDATE ON public.timetables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
