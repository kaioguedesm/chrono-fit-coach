-- Adicionar colunas de aprovação se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_roles' AND column_name = 'approved') THEN
    ALTER TABLE public.user_roles ADD COLUMN approved BOOLEAN NOT NULL DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_roles' AND column_name = 'approved_by') THEN
    ALTER TABLE public.user_roles ADD COLUMN approved_by UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_roles' AND column_name = 'approved_at') THEN
    ALTER TABLE public.user_roles ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_roles' AND column_name = 'rejection_reason') THEN
    ALTER TABLE public.user_roles ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_user_roles_approved ON public.user_roles(approved);

-- Comentários
COMMENT ON COLUMN public.user_roles.approved IS 'Indica se o personal trainer foi aprovado';
COMMENT ON COLUMN public.user_roles.approved_by IS 'ID de quem aprovou';
COMMENT ON COLUMN public.user_roles.approved_at IS 'Data da aprovação';
COMMENT ON COLUMN public.user_roles.rejection_reason IS 'Motivo da rejeição (opcional)';