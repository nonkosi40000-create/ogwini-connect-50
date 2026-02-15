
-- Create meetings table for leadership/governance meeting coordination
CREATE TABLE public.meetings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  meeting_type text NOT NULL DEFAULT 'staff',
  meeting_date timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  location text,
  agenda text,
  minutes text,
  status text NOT NULL DEFAULT 'scheduled',
  created_by uuid NOT NULL,
  attendees text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Principal and admin can manage meetings
CREATE POLICY "Principal/Admin can manage meetings"
ON public.meetings FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'principal'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'deputy_principal'::app_role)
);

-- Staff can view meetings they're invited to
CREATE POLICY "Staff can view meetings"
ON public.meetings FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role)
  OR has_role(auth.uid(), 'hod'::app_role)
  OR has_role(auth.uid(), 'grade_head'::app_role)
  OR has_role(auth.uid(), 'llc'::app_role)
  OR has_role(auth.uid(), 'finance'::app_role)
);

-- Trigger for updated_at
CREATE TRIGGER update_meetings_updated_at
BEFORE UPDATE ON public.meetings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
