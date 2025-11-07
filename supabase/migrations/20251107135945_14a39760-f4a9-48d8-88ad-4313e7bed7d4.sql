-- Permitir que admins aprovem/rejeitem personal trainers
CREATE POLICY "Admins can update user roles"
ON user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Permitir que admins deletem roles rejeitadas
CREATE POLICY "Admins can delete user roles"
ON user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Permitir que admins vejam todas as roles
CREATE POLICY "Admins can view all roles"
ON user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Permitir que admins vejam todos os perfis (para mostrar nomes nas aprovações)
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));