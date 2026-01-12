-- Create past_papers table for teacher uploads
CREATE TABLE public.past_papers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  year INTEGER NOT NULL,
  term TEXT,
  file_url TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.past_papers ENABLE ROW LEVEL SECURITY;

-- Everyone can view past papers (students can download)
CREATE POLICY "Past papers are viewable by authenticated users"
ON public.past_papers
FOR SELECT
TO authenticated
USING (true);

-- Only teachers, grade heads, admins, and principals can insert
CREATE POLICY "Staff can upload past papers"
ON public.past_papers
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'teacher') OR
  public.has_role(auth.uid(), 'grade_head') OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'principal')
);

-- Only the uploader or admin can update
CREATE POLICY "Staff can update their own past papers"
ON public.past_papers
FOR UPDATE
TO authenticated
USING (
  uploaded_by = auth.uid() OR
  public.has_role(auth.uid(), 'admin')
);

-- Only the uploader or admin can delete
CREATE POLICY "Staff can delete their own past papers"
ON public.past_papers
FOR DELETE
TO authenticated
USING (
  uploaded_by = auth.uid() OR
  public.has_role(auth.uid(), 'admin')
);

-- Add trigger for updated_at
CREATE TRIGGER update_past_papers_updated_at
  BEFORE UPDATE ON public.past_papers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure quiz_submissions table has proper RLS for private answers
-- Drop existing policies if they exist to recreate them properly
DO $$
BEGIN
  -- Only proceed if quiz_submissions exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quiz_submissions') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view their own quiz submissions" ON public.quiz_submissions;
    DROP POLICY IF EXISTS "Users can insert their own quiz submissions" ON public.quiz_submissions;
    DROP POLICY IF EXISTS "Staff can view all quiz submissions" ON public.quiz_submissions;
  END IF;
END
$$;

-- Create secure RLS policies for quiz_submissions
-- Users can only view their own submissions
CREATE POLICY "Users can view their own quiz submissions"
ON public.quiz_submissions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  public.has_role(auth.uid(), 'teacher') OR
  public.has_role(auth.uid(), 'grade_head') OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'principal')
);

-- Users can only insert their own submissions
CREATE POLICY "Users can insert their own quiz submissions"
ON public.quiz_submissions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());