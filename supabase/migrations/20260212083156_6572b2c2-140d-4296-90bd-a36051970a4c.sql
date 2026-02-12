
-- Update handle_new_user to auto-approve admin registrations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _role app_role;
  _is_admin boolean;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'learner');
  _is_admin := (_role = 'admin');

  -- Create a registration entry (auto-approved for admin)
  INSERT INTO public.registrations (user_id, first_name, last_name, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email,
    _role,
    CASE WHEN _is_admin THEN 'approved' ELSE 'pending' END
  );

  -- If admin, also create profile and assign role immediately
  IF _is_admin THEN
    INSERT INTO public.profiles (user_id, first_name, last_name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
      NEW.email
    );

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;

  RETURN NEW;
END;
$$;
