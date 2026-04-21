-- Atualizar handle_new_user para também salvar gym_id vindo de raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_gym_id uuid;
BEGIN
  -- Tentar extrair gym_id de raw_user_meta_data (se enviado durante signup)
  BEGIN
    v_gym_id := NULLIF(new.raw_user_meta_data->>'gym_id', '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_gym_id := NULL;
  END;

  INSERT INTO public.profiles (user_id, name, experience_level, gym_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'iniciante',
    v_gym_id
  )
  ON CONFLICT (user_id) DO UPDATE
    SET gym_id = COALESCE(public.profiles.gym_id, EXCLUDED.gym_id);
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar perfil: %', SQLERRM;
    RETURN new;
END;
$function$;