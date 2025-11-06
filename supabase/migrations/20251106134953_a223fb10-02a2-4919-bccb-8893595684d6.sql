-- Criar tabela de relacionamento entre personal trainers e alunos
CREATE TABLE IF NOT EXISTS public.personal_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id UUID NOT NULL,
  student_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(personal_id, student_id)
);

-- Habilitar RLS
ALTER TABLE public.personal_students ENABLE ROW LEVEL SECURITY;

-- Personal trainers podem ver e gerenciar seus alunos
CREATE POLICY "Personal trainers can view their students"
ON public.personal_students
FOR SELECT
USING (has_role(auth.uid(), 'personal'::app_role) AND personal_id = auth.uid());

CREATE POLICY "Personal trainers can add students"
ON public.personal_students
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'personal'::app_role) AND personal_id = auth.uid());

CREATE POLICY "Personal trainers can update their students"
ON public.personal_students
FOR UPDATE
USING (has_role(auth.uid(), 'personal'::app_role) AND personal_id = auth.uid());

CREATE POLICY "Personal trainers can remove students"
ON public.personal_students
FOR DELETE
USING (has_role(auth.uid(), 'personal'::app_role) AND personal_id = auth.uid());

-- Alunos podem ver quem é seu personal
CREATE POLICY "Students can view their personal trainers"
ON public.personal_students
FOR SELECT
USING (auth.uid() = student_id);

-- Adicionar campo created_by_user_id em workout_plans para identificar o personal que criou
ALTER TABLE public.workout_plans 
ADD COLUMN IF NOT EXISTS created_by_user_id UUID;

-- Personal trainers podem criar treinos para seus alunos
CREATE POLICY "Personal trainers can create workouts for their students"
ON public.workout_plans
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'personal'::app_role) 
  AND created_by_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.personal_students 
    WHERE personal_id = auth.uid() 
    AND student_id = workout_plans.user_id
    AND is_active = true
  )
);

-- Personal trainers podem editar treinos que criaram para seus alunos
CREATE POLICY "Personal trainers can update workouts they created"
ON public.workout_plans
FOR UPDATE
USING (
  has_role(auth.uid(), 'personal'::app_role) 
  AND created_by_user_id = auth.uid()
);

-- Personal trainers podem deletar treinos que criaram
CREATE POLICY "Personal trainers can delete workouts they created"
ON public.workout_plans
FOR DELETE
USING (
  has_role(auth.uid(), 'personal'::app_role) 
  AND created_by_user_id = auth.uid()
);