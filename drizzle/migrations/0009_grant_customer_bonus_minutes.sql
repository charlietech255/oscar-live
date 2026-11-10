CREATE OR REPLACE FUNCTION public.grant_customer_minutes(_user_id uuid, _minutes integer)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _base timestamptz;
  _ends_at timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Ni msimamizi pekee anaweza kuongeza muda.';
  END IF;

  IF _minutes IS NULL OR _minutes < 1 OR _minutes > 43200 THEN
    RAISE EXCEPTION 'Weka dakika kati ya 1 na 43200.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'::public.app_role
  ) THEN
    RAISE EXCEPTION 'Muda wa ofa unaongezwa kwa wateja, si wasimamizi.';
  END IF;

  SELECT GREATEST(now(), COALESCE(subscription_ends_at, trial_ends_at, now()))
  INTO _base
  FROM public.profiles
  WHERE id = _user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mteja hajapatikana.';
  END IF;

  _ends_at := _base + make_interval(mins => _minutes);

  UPDATE public.profiles
  SET subscription_ends_at = _ends_at
  WHERE id = _user_id;

  INSERT INTO public.admin_audit (actor, target, action, note)
  VALUES (auth.uid(), _user_id, 'grant_customer_minutes', _minutes::text);

  RETURN _ends_at;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_customer_minutes(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_customer_minutes(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_customer_minutes(uuid, integer) TO service_role;