-- Fix security issue: set search_path for generate_share_token function
DROP FUNCTION IF EXISTS generate_share_token();

CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  token text := '';
  i integer;
BEGIN
  FOR i IN 1..12 LOOP
    token := token || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN token;
END;
$$;