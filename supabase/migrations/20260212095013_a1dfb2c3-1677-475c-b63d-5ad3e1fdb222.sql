-- Update handle_new_user to handle re-registration for rejected users
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role app_role;
  _is_admin boolean;
  _existing_reg_id uuid;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'learner');
  _is_admin := (_role = 'admin');

  -- Check if there's an existing rejected registration for this user
  SELECT id INTO _existing_reg_id
  FROM public.registrations
  WHERE user_id = NEW.id AND status = 'rejected'
  LIMIT 1;

  IF _existing_reg_id IS NOT NULL THEN
    -- Update the existing rejected registration with new data
    UPDATE public.registrations
    SET 
      first_name = COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
      last_name = COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
      email = NEW.email,
      role = _role,
      status = CASE WHEN _is_admin THEN 'approved' ELSE 'pending' END,
      updated_at = now()
    WHERE id = _existing_reg_id;
  ELSE
    -- Create a new registration entry
    INSERT INTO public.registrations (user_id, first_name, last_name, email, role, status)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
      NEW.email,
      _role,
      CASE WHEN _is_admin THEN 'approved' ELSE 'pending' END
    );
  END IF;

  -- If admin, also create profile and assign role immediately
  IF _is_admin THEN
    INSERT INTO public.profiles (user_id, first_name, last_name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
      NEW.email
    )
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;