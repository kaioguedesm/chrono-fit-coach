-- Corrigir policies da tabela workout_share_invites para usar auth.email()
DROP POLICY IF EXISTS "Users can view invites sent to them" ON workout_share_invites;
DROP POLICY IF EXISTS "Users can update invites sent to them" ON workout_share_invites;

-- Recriar policy de visualização de convites recebidos (corrigida)
CREATE POLICY "Users can view invites sent to them"
ON workout_share_invites
FOR SELECT
USING (
  invited_user_id = auth.uid() 
  OR invited_email = auth.email()
);

-- Recriar policy de atualização de convites recebidos (corrigida)
CREATE POLICY "Users can update invites sent to them"
ON workout_share_invites
FOR UPDATE
USING (
  invited_user_id = auth.uid() 
  OR invited_email = auth.email()
);

-- Corrigir policy de visualização de workout_shares
DROP POLICY IF EXISTS "Users can view public active shares" ON workout_shares;

CREATE POLICY "Users can view public active shares"
ON workout_shares
FOR SELECT
USING (
  is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
  AND (
    -- Público: qualquer um pode ver
    is_private = false
    OR
    -- Privado: apenas convidados podem ver
    (is_private = true AND (
      -- O dono pode ver
      shared_by = auth.uid()
      OR
      -- Convidados podem ver (corrigido para usar auth.email())
      EXISTS (
        SELECT 1 FROM workout_share_invites
        WHERE share_id = workout_shares.id
        AND (
          invited_user_id = auth.uid()
          OR invited_email = auth.email()
        )
      )
    ))
  )
);