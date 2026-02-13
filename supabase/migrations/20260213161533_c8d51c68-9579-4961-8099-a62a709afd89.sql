
-- Complaints table (learner → Deputy Principal & Principal)
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id UUID NOT NULL,
  grade TEXT NOT NULL,
  subject TEXT,
  complaint_text TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  response TEXT,
  responded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learners can create complaints" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = learner_id);
CREATE POLICY "Learners can view own complaints" ON public.complaints FOR SELECT USING (auth.uid() = learner_id);
CREATE POLICY "Principal/Admin can view all complaints" ON public.complaints FOR SELECT USING (
  has_role(auth.uid(), 'principal'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "Principal/Admin can update complaints" ON public.complaints FOR UPDATE USING (
  has_role(auth.uid(), 'principal'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Homework submissions table
CREATE TABLE public.homework_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id UUID NOT NULL,
  material_id UUID REFERENCES public.learning_materials(id),
  file_url TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  marked_file_url TEXT,
  marks_obtained NUMERIC,
  total_marks NUMERIC,
  teacher_feedback TEXT,
  marked_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learners can submit homework" ON public.homework_submissions FOR INSERT WITH CHECK (auth.uid() = learner_id);
CREATE POLICY "Learners can view own submissions" ON public.homework_submissions FOR SELECT USING (auth.uid() = learner_id);
CREATE POLICY "Teachers can view submissions" ON public.homework_submissions FOR SELECT USING (
  has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'grade_head'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "Teachers can update submissions" ON public.homework_submissions FOR UPDATE USING (
  has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'grade_head'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE TRIGGER update_homework_submissions_updated_at BEFORE UPDATE ON public.homework_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Academic reports (uploaded by teachers, viewable by learner in portal)
CREATE TABLE public.academic_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id UUID NOT NULL,
  title TEXT NOT NULL,
  term TEXT,
  year INTEGER DEFAULT EXTRACT(year FROM now()),
  file_url TEXT NOT NULL,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.academic_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learners can view own reports" ON public.academic_reports FOR SELECT USING (auth.uid() = learner_id);
CREATE POLICY "Staff can manage reports" ON public.academic_reports FOR ALL USING (
  has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'grade_head'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'principal'::app_role)
);

-- Merchandise orders table
CREATE TABLE public.merchandise_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id UUID NOT NULL,
  items JSONB NOT NULL,
  total_amount NUMERIC NOT NULL,
  payment_proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  contact_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.merchandise_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learners can create orders" ON public.merchandise_orders FOR INSERT WITH CHECK (auth.uid() = learner_id);
CREATE POLICY "Learners can view own orders" ON public.merchandise_orders FOR SELECT USING (auth.uid() = learner_id);
CREATE POLICY "Admin can manage orders" ON public.merchandise_orders FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)
);

CREATE TRIGGER update_merchandise_orders_updated_at BEFORE UPDATE ON public.merchandise_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add week column to learning_materials for homework type tracking
ALTER TABLE public.learning_materials ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

-- Enable realtime for notifications flow
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.homework_submissions;
