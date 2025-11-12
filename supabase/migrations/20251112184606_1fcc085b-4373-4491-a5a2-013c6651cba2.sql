-- Inserir o role manualmente para o usuário que já se cadastrou
-- Este usuário se cadastrou antes do sistema de trigger ser implementado
INSERT INTO public.user_roles (user_id, role, approved)
VALUES ('2f2f828f-a140-40c5-8125-a8dfe89c5350', 'personal'::app_role, false)
ON CONFLICT (user_id, role) DO NOTHING;