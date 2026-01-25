-- First add the LLC role to the enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'llc';

-- Add Commerce department
INSERT INTO public.departments (name, code) VALUES ('Commerce', 'COM')
ON CONFLICT (code) DO NOTHING;

-- Add Languages department for LLC role
INSERT INTO public.departments (name, code) VALUES ('Languages', 'LANG')
ON CONFLICT (code) DO NOTHING;