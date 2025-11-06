-- Adicionar role de personal para o usuário Kaio
INSERT INTO public.user_roles (user_id, role)
VALUES ('c345d391-65c6-4f20-a42a-5ab188bfe85c', 'personal')
ON CONFLICT (user_id, role) DO NOTHING;