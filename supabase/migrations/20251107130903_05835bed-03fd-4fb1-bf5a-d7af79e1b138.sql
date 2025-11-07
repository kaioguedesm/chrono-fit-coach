-- Adicionar campo de aprovação para personal trainers
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_user_roles_approved ON public.user_roles(approved);

-- Atualizar a função has_role para considerar aprovação
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND approved = true
  )
$$;

-- Atualizar políticas de workout_plans para considerar aprovação
DROP POLICY IF EXISTS "Personal trainers can view all workout plans" ON public.workout_plans;
CREATE POLICY "Approved personal trainers can view all workout plans"
ON public.workout_plans
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'personal'
    AND approved = true
  )
);

DROP POLICY IF EXISTS "Personal trainers can approve workouts" ON public.workout_plans;
CREATE POLICY "Approved personal trainers can approve workouts"
ON public.workout_plans
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'personal'
    AND approved = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'personal'
    AND approved = true
  )
);

DROP POLICY IF EXISTS "Personal trainers can create workouts for their students" ON public.workout_plans;
CREATE POLICY "Approved personal trainers can create workouts for their students"
ON public.workout_plans
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'personal'
    AND approved = true
  ) 
  AND created_by_user_id = auth.uid() 
  AND EXISTS (
    SELECT 1
    FROM personal_students
    WHERE personal_id = auth.uid() 
    AND student_id = workout_plans.user_id 
    AND is_active = true
  )
);

-- Atualizar políticas de nutrition_plans
DROP POLICY IF EXISTS "Personal trainers can view all nutrition plans" ON public.nutrition_plans;
CREATE POLICY "Approved personal trainers can view all nutrition plans"
ON public.nutrition_plans
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'personal'
    AND approved = true
  )
);

DROP POLICY IF EXISTS "Personal trainers can approve nutrition plans" ON public.nutrition_plans;
CREATE POLICY "Approved personal trainers can approve nutrition plans"
ON public.nutrition_plans
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'personal'
    AND approved = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'personal'
    AND approved = true
  )
);

-- Atualizar políticas de personal_students
DROP POLICY IF EXISTS "Personal trainers can view their students" ON public.personal_students;
CREATE POLICY "Approved personal trainers can view their students"
ON public.personal_students
FOR SELECT
TO authenticated
USING (
  personal_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'personal'
    AND approved = true
  )
);

DROP POLICY IF EXISTS "Personal trainers can add students" ON public.personal_students;
CREATE POLICY "Approved personal trainers can add students"
ON public.personal_students
FOR INSERT
TO authenticated
WITH CHECK (
  personal_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'personal'
    AND approved = true
  )
);

DROP POLICY IF EXISTS "Personal trainers can update their students" ON public.personal_students;
CREATE POLICY "Approved personal trainers can update their students"
ON public.personal_students
FOR UPDATE
TO authenticated
USING (
  personal_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'personal'
    AND approved = true
  )
);

DROP POLICY IF EXISTS "Personal trainers can remove students" ON public.personal_students;
CREATE POLICY "Approved personal trainers can remove students"
ON public.personal_students
FOR DELETE
TO authenticated
USING (
  personal_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'personal'
    AND approved = true
  )
);

-- Comentários
COMMENT ON COLUMN public.user_roles.approved IS 'Indica se o personal trainer foi aprovado por um administrador';
COMMENT ON COLUMN public.user_roles.approved_by IS 'ID do administrador que aprovou';
COMMENT ON COLUMN public.user_roles.approved_at IS 'Data e hora da aprovação';
COMMENT ON COLUMN public.user_roles.rejection_reason IS 'Motivo da rejeição (opcional)';