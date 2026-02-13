-- Add elective_subjects column to registrations table
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS elective_subjects text[] DEFAULT '{}';

-- Add elective_subjects column to profiles table  
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS elective_subjects text[] DEFAULT '{}';