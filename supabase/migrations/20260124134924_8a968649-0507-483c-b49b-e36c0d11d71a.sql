-- Create departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subjects table with department mapping
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create department_heads table to assign HODs to departments
CREATE TABLE public.department_heads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(department_id)
);

-- Create curriculum_policies table for HODs to manage
CREATE TABLE public.curriculum_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  policy_document_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_policies ENABLE ROW LEVEL SECURITY;

-- Departments policies (viewable by all authenticated)
CREATE POLICY "Authenticated users can view departments"
ON public.departments FOR SELECT
USING (true);

CREATE POLICY "Admins can manage departments"
ON public.departments FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Subjects policies
CREATE POLICY "Authenticated users can view subjects"
ON public.subjects FOR SELECT
USING (true);

CREATE POLICY "Admins can manage subjects"
ON public.subjects FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Department heads policies
CREATE POLICY "Authenticated users can view department heads"
ON public.department_heads FOR SELECT
USING (true);

CREATE POLICY "Admins can manage department heads"
ON public.department_heads FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Curriculum policies RLS
CREATE POLICY "Authenticated users can view published policies"
ON public.curriculum_policies FOR SELECT
USING (status = 'published' OR has_role(auth.uid(), 'hod') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'principal'));

CREATE POLICY "HODs can manage their department policies"
ON public.curriculum_policies FOR ALL
USING (
  has_role(auth.uid(), 'hod') AND EXISTS (
    SELECT 1 FROM public.department_heads 
    WHERE user_id = auth.uid() AND department_id = curriculum_policies.department_id
  )
);

CREATE POLICY "Admins can manage all policies"
ON public.curriculum_policies FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Insert departments
INSERT INTO public.departments (name, code) VALUES
  ('Mathematics and Science', 'MATH_SCI'),
  ('Technology and Mechanics', 'TECH_MECH'),
  ('Drama and Visual Arts', 'DRAMA_ARTS'),
  ('General', 'GENERAL');

-- Insert subjects with department mappings
INSERT INTO public.subjects (name, code, department_id) VALUES
  ('Technical Mathematics', 'TECH_MATH', (SELECT id FROM departments WHERE code = 'MATH_SCI')),
  ('Technical Physical Sciences', 'TECH_PHYS', (SELECT id FROM departments WHERE code = 'MATH_SCI')),
  ('Mathematics', 'MATH', (SELECT id FROM departments WHERE code = 'MATH_SCI')),
  ('Life Sciences', 'LIFE_SCI', (SELECT id FROM departments WHERE code = 'MATH_SCI')),
  ('Agricultural Sciences', 'AGRI_SCI', (SELECT id FROM departments WHERE code = 'MATH_SCI')),
  ('Geography', 'GEO', (SELECT id FROM departments WHERE code = 'MATH_SCI')),
  ('Computer Applications Technology', 'CAT', (SELECT id FROM departments WHERE code = 'TECH_MECH')),
  ('Information Technology', 'IT', (SELECT id FROM departments WHERE code = 'TECH_MECH')),
  ('Mechanics', 'MECH', (SELECT id FROM departments WHERE code = 'TECH_MECH')),
  ('Dramatic Arts', 'DRAMA', (SELECT id FROM departments WHERE code = 'DRAMA_ARTS')),
  ('Visual Arts', 'VIS_ARTS', (SELECT id FROM departments WHERE code = 'DRAMA_ARTS')),
  ('Music', 'MUSIC', (SELECT id FROM departments WHERE code = 'DRAMA_ARTS')),
  ('Consumer Studies', 'CONS_STUD', (SELECT id FROM departments WHERE code = 'GENERAL')),
  ('Life Orientation', 'LO', (SELECT id FROM departments WHERE code = 'GENERAL')),
  ('Economics', 'ECON', (SELECT id FROM departments WHERE code = 'GENERAL')),
  ('History', 'HIST', (SELECT id FROM departments WHERE code = 'GENERAL')),
  ('IsiZulu (HL)', 'ZULU_HL', (SELECT id FROM departments WHERE code = 'GENERAL')),
  ('English (FAL)', 'ENG_FAL', (SELECT id FROM departments WHERE code = 'GENERAL')),
  ('Afrikaans', 'AFR', (SELECT id FROM departments WHERE code = 'GENERAL'));

-- Trigger for updated_at on curriculum_policies
CREATE TRIGGER update_curriculum_policies_updated_at
BEFORE UPDATE ON public.curriculum_policies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();