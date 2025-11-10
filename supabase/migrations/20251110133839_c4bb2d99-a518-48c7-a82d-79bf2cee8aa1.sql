-- Criar perfis para todos os usuários existentes que não têm perfil
INSERT INTO public.profiles (user_id, name, experience_level)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  'iniciante'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);

-- Corrigir o trigger para garantir que sempre crie o perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, experience_level)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'iniciante'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error mas não bloqueia o signup
    RAISE WARNING 'Erro ao criar perfil: %', SQLERRM;
    RETURN new;
END;
$$;