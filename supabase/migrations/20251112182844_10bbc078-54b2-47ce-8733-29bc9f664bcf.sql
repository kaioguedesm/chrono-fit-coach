-- Remover política muito permissiva que permite inserir qualquer role
DROP POLICY IF EXISTS "Users can insert their own role during signup" ON public.user_roles;

-- A política "Users can create their own personal role" já existe e é segura
-- Ela permite apenas criar role 'personal' com approved=false