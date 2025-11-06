-- Adicionar campos de aprovação em nutrition_plans
ALTER TABLE nutrition_plans
ADD COLUMN approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN approved_by uuid REFERENCES auth.users(id),
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN rejection_reason text;

-- Criar tabela para histórico de revisões de treinos
CREATE TABLE workout_plan_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id uuid REFERENCES workout_plans(id) ON DELETE CASCADE NOT NULL,
  revised_by uuid REFERENCES auth.users(id) NOT NULL,
  revision_notes text,
  previous_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE workout_plan_revisions ENABLE ROW LEVEL SECURITY;

-- Criar tabela para histórico de revisões de dietas
CREATE TABLE nutrition_plan_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nutrition_plan_id uuid REFERENCES nutrition_plans(id) ON DELETE CASCADE NOT NULL,
  revised_by uuid REFERENCES auth.users(id) NOT NULL,
  revision_notes text,
  previous_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE nutrition_plan_revisions ENABLE ROW LEVEL SECURITY;

-- Criar tabela para termos de responsabilidade
CREATE TABLE user_terms_acceptance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  terms_version text NOT NULL,
  accepted_at timestamp with time zone DEFAULT now() NOT NULL,
  ip_address text,
  user_agent text
);

ALTER TABLE user_terms_acceptance ENABLE ROW LEVEL SECURITY;

-- RLS Policies para nutrition_plans (atualizar para incluir aprovação)
DROP POLICY IF EXISTS "Users can view only their own nutrition plans" ON nutrition_plans;

CREATE POLICY "Users can view their approved nutrition plans"
ON nutrition_plans
FOR SELECT
USING (
  (auth.uid() = user_id AND (approval_status = 'approved' OR has_role(auth.uid(), 'personal'::app_role)))
);

CREATE POLICY "Personal trainers can view all nutrition plans"
ON nutrition_plans
FOR SELECT
USING (has_role(auth.uid(), 'personal'::app_role));

CREATE POLICY "Personal trainers can approve nutrition plans"
ON nutrition_plans
FOR UPDATE
USING (has_role(auth.uid(), 'personal'::app_role))
WITH CHECK (has_role(auth.uid(), 'personal'::app_role));

-- RLS Policies para workout_plan_revisions
CREATE POLICY "Personal trainers can manage workout revisions"
ON workout_plan_revisions
FOR ALL
USING (has_role(auth.uid(), 'personal'::app_role))
WITH CHECK (has_role(auth.uid(), 'personal'::app_role));

CREATE POLICY "Users can view revisions of their workouts"
ON workout_plan_revisions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workout_plans
    WHERE workout_plans.id = workout_plan_revisions.workout_plan_id
    AND workout_plans.user_id = auth.uid()
  )
);

-- RLS Policies para nutrition_plan_revisions
CREATE POLICY "Personal trainers can manage nutrition revisions"
ON nutrition_plan_revisions
FOR ALL
USING (has_role(auth.uid(), 'personal'::app_role))
WITH CHECK (has_role(auth.uid(), 'personal'::app_role));

CREATE POLICY "Users can view revisions of their nutrition plans"
ON nutrition_plan_revisions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM nutrition_plans
    WHERE nutrition_plans.id = nutrition_plan_revisions.nutrition_plan_id
    AND nutrition_plans.user_id = auth.uid()
  )
);

-- RLS Policies para user_terms_acceptance
CREATE POLICY "Users can view their own terms acceptance"
ON user_terms_acceptance
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own terms acceptance"
ON user_terms_acceptance
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Personal trainers can view all terms acceptances"
ON user_terms_acceptance
FOR SELECT
USING (has_role(auth.uid(), 'personal'::app_role));

-- Atualizar nutrition_plans existentes para 'approved'
UPDATE nutrition_plans
SET approval_status = 'approved'
WHERE approval_status IS NULL OR approval_status = 'pending';

-- Comentários nas tabelas
COMMENT ON TABLE workout_plan_revisions IS 'Histórico de revisões feitas por instrutores nos treinos';
COMMENT ON TABLE nutrition_plan_revisions IS 'Histórico de revisões feitas por instrutores nas dietas';
COMMENT ON TABLE user_terms_acceptance IS 'Registro de aceitação dos termos de responsabilidade pelos usuários';