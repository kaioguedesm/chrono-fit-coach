-- Adicionar campo is_private à tabela workout_shares
ALTER TABLE workout_shares 
ADD COLUMN is_private boolean DEFAULT false;

-- Criar tabela para convites/destinatários de treinos compartilhados
CREATE TABLE workout_share_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id uuid REFERENCES workout_shares(id) ON DELETE CASCADE NOT NULL,
  invited_email text NOT NULL,
  invited_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  accepted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(share_id, invited_email)
);

-- Habilitar RLS
ALTER TABLE workout_share_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver convites enviados por eles
CREATE POLICY "Users can view invites they created"
ON workout_share_invites
FOR SELECT
USING (invited_by = auth.uid());

-- Policy: Usuários podem ver convites recebidos por eles (por email ou user_id)
CREATE POLICY "Users can view invites sent to them"
ON workout_share_invites
FOR SELECT
USING (
  invited_user_id = auth.uid() 
  OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Policy: Usuários podem criar convites para seus próprios shares
CREATE POLICY "Users can create invites for their shares"
ON workout_share_invites
FOR INSERT
WITH CHECK (
  invited_by = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM workout_shares 
    WHERE id = share_id AND shared_by = auth.uid()
  )
);

-- Policy: Usuários podem deletar convites que criaram
CREATE POLICY "Users can delete invites they created"
ON workout_share_invites
FOR DELETE
USING (invited_by = auth.uid());

-- Policy: Usuários podem atualizar convites recebidos (para aceitar)
CREATE POLICY "Users can update invites sent to them"
ON workout_share_invites
FOR UPDATE
USING (
  invited_user_id = auth.uid() 
  OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Atualizar policy de visualização de workout_shares para incluir compartilhamentos privados
DROP POLICY IF EXISTS "Anyone can view active workout shares" ON workout_shares;

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
      -- Convidados podem ver
      EXISTS (
        SELECT 1 FROM workout_share_invites
        WHERE share_id = workout_shares.id
        AND (
          invited_user_id = auth.uid()
          OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
      )
    ))
  )
);

-- Criar índices para melhor performance
CREATE INDEX idx_workout_share_invites_share_id ON workout_share_invites(share_id);
CREATE INDEX idx_workout_share_invites_invited_email ON workout_share_invites(invited_email);
CREATE INDEX idx_workout_share_invites_invited_user_id ON workout_share_invites(invited_user_id);