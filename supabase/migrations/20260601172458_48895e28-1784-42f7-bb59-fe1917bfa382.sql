
CREATE OR REPLACE FUNCTION public.generate_public_id()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  alphabet text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  candidate text;
  i int;
  exists_count int;
BEGIN
  LOOP
    candidate := 'user_';
    FOR i IN 1..6 LOOP
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    SELECT count(*) INTO exists_count FROM public.profiles WHERE public_id = candidate;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN candidate;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.transfer_funds(text, numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_public_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
