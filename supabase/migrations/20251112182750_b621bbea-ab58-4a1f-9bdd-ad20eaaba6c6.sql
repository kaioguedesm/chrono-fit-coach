-- Permitir que usuários criem seu próprio role de personal trainer (não aprovado)
-- Isso permite self-signup, mas os personal trainers precisarão de aprovação do admin para fazer login

CREATE POLICY "Users can create their own personal role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'personal' 
  AND approved = false
);