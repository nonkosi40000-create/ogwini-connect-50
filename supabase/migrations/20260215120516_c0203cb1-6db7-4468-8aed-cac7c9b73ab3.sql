
-- Add deputy_principal to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'deputy_principal';
