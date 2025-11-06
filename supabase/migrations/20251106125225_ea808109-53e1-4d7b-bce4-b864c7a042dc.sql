-- Corrigir policy para usuários visualizarem seus próprios treinos (todos os status)
DROP POLICY IF EXISTS "Users can view their approved workout plans" ON workout_plans;

CREATE POLICY "Users can view their own workout plans"
ON workout_plans
FOR SELECT
USING (auth.uid() = user_id);

-- Manter a policy específica para personal trainers
-- (Eles já têm a policy "Personal trainers can view all workout plans")

-- Comentário: Agora usuários podem ver seus próprios treinos independente do status
COMMENT ON POLICY "Users can view their own workout plans" ON workout_plans IS 
'Permite que usuários vejam todos os seus treinos independente do status de aprovação';