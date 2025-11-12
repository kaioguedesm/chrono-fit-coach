-- Criar role pendente para o usuário que foi cadastrado antes do sistema de pendentes
INSERT INTO public.user_roles (user_id, role, approved)
VALUES ('2f2f828f-a140-40c5-8125-a8dfe89c5350', 'personal', false)
ON CONFLICT (user_id, role) DO UPDATE SET approved = false;