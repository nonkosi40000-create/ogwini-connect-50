-- Add Commerce subjects
INSERT INTO public.subjects (name, code, department_id)
SELECT s.subject_name, s.subject_code, d.id FROM (
  VALUES 
    ('Accounting', 'ACC'),
    ('Pure Mathematics', 'PMATH'),
    ('Business Studies', 'BUS')
) AS s(subject_name, subject_code)
CROSS JOIN public.departments d WHERE d.code = 'COM'
ON CONFLICT (code) DO NOTHING;

-- Move language subjects to Languages department
UPDATE public.subjects SET department_id = (SELECT id FROM public.departments WHERE code = 'LANG')
WHERE code IN ('AFR', 'ISIZ', 'ENG');

-- Create syllabus table for HODs to upload
CREATE TABLE IF NOT EXISTS public.syllabi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  grade TEXT,
  year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on syllabi
ALTER TABLE public.syllabi ENABLE ROW LEVEL SECURITY;

-- HODs can manage syllabi for their department
CREATE POLICY "HODs can manage their department syllabi"
ON public.syllabi FOR ALL
USING (
  has_role(auth.uid(), 'hod') AND 
  EXISTS (
    SELECT 1 FROM department_heads 
    WHERE user_id = auth.uid() AND department_id = syllabi.department_id
  )
);

-- LLCs can manage syllabi for Languages department
CREATE POLICY "LLCs can manage language syllabi"
ON public.syllabi FOR ALL
USING (
  has_role(auth.uid(), 'llc') AND 
  EXISTS (
    SELECT 1 FROM public.departments WHERE id = syllabi.department_id AND code = 'LANG'
  )
);

-- Teachers and staff can view syllabi
CREATE POLICY "Staff can view syllabi"
ON public.syllabi FOR SELECT
USING (
  has_role(auth.uid(), 'teacher') OR 
  has_role(auth.uid(), 'grade_head') OR 
  has_role(auth.uid(), 'principal') OR 
  has_role(auth.uid(), 'admin')
);

-- Create teacher ratings table
CREATE TABLE IF NOT EXISTS public.teacher_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  learner_id UUID NOT NULL,
  subject TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  term TEXT,
  year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, learner_id, subject, term, year)
);

-- Enable RLS on teacher_ratings
ALTER TABLE public.teacher_ratings ENABLE ROW LEVEL SECURITY;

-- Learners can submit ratings
CREATE POLICY "Learners can submit ratings"
ON public.teacher_ratings FOR INSERT
WITH CHECK (auth.uid() = learner_id AND has_role(auth.uid(), 'learner'));

-- Learners can view their own ratings
CREATE POLICY "Learners can view own ratings"
ON public.teacher_ratings FOR SELECT
USING (auth.uid() = learner_id);

-- HODs, Grade Heads, Principal, LLC can view ratings
CREATE POLICY "Staff can view teacher ratings"
ON public.teacher_ratings FOR SELECT
USING (
  has_role(auth.uid(), 'hod') OR 
  has_role(auth.uid(), 'grade_head') OR 
  has_role(auth.uid(), 'principal') OR 
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'llc')
);

-- Create trigger for syllabi updated_at
CREATE TRIGGER update_syllabi_updated_at
BEFORE UPDATE ON public.syllabi
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();