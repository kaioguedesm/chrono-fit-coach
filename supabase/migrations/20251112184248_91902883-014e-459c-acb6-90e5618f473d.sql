-- Criar trigger para adicionar role de personal após confirmação de email
-- quando o usuário se cadastra via /personal-login

-- Criar tabela para armazenar solicitações pendentes de personal trainers
CREATE TABLE IF NOT EXISTS public.pending_personal_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.pending_personal_signups ENABLE ROW LEVEL SECURITY;

-- Permitir que qualquer usuário autenticado insira sua própria solicitação
CREATE POLICY "Users can create their own pending signup"
ON public.pending_personal_signups
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Permitir que admins vejam todas as solicitações pendentes
CREATE POLICY "Admins can view all pending signups"
ON public.pending_personal_signups
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar função para processar solicitações pendentes após confirmação de email
CREATE OR REPLACE FUNCTION public.process_pending_personal_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verificar se existe uma solicitação pendente para este usuário
  IF EXISTS (
    SELECT 1 
    FROM public.pending_personal_signups 
    WHERE user_id = NEW.id
  ) THEN
    -- Criar o role de personal trainer
    INSERT INTO public.user_roles (user_id, role, approved)
    VALUES (NEW.id, 'personal'::app_role, false)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Remover da tabela de pendentes
    DELETE FROM public.pending_personal_signups 
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger que é executado após confirmação de email
-- O trigger monitora quando o email_confirmed_at é atualizado
CREATE OR REPLACE TRIGGER on_email_confirmed_create_personal_role
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.process_pending_personal_signup();