
-- Helper function to check if a personal trainer manages a student
CREATE OR REPLACE FUNCTION public.is_personal_of(_personal_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.personal_students
    WHERE personal_id = _personal_id
      AND student_id = _student_id
      AND is_active = true
  )
$$;

-- workout_plans: personal can delete student's plans
CREATE POLICY "Personal can delete student workout plans"
ON public.workout_plans FOR DELETE
TO authenticated
USING (is_personal_of(auth.uid(), user_id));

-- nutrition_plans: personal can delete student's plans
CREATE POLICY "Personal can delete student nutrition plans"
ON public.nutrition_plans FOR DELETE
TO authenticated
USING (is_personal_of(auth.uid(), user_id));

-- exercises: personal can delete exercises from student's plans
CREATE POLICY "Personal can delete student exercises"
ON public.exercises FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workout_plans wp
    WHERE wp.id = workout_plan_id
      AND is_personal_of(auth.uid(), wp.user_id)
  )
);

-- meals: personal can delete meals from student's plans
CREATE POLICY "Personal can delete student meals"
ON public.meals FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.nutrition_plans np
    WHERE np.id = nutrition_plan_id
      AND is_personal_of(auth.uid(), np.user_id)
  )
);

-- workout_sessions: personal can delete student's sessions
CREATE POLICY "Personal can delete student workout sessions"
ON public.workout_sessions FOR DELETE
TO authenticated
USING (is_personal_of(auth.uid(), user_id));

-- exercise_sessions: personal can delete student's exercise sessions
CREATE POLICY "Personal can delete student exercise sessions"
ON public.exercise_sessions FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    WHERE ws.id = workout_session_id
      AND is_personal_of(auth.uid(), ws.user_id)
  )
);

-- workout_schedule: personal can delete student's schedule
CREATE POLICY "Personal can delete student workout schedule"
ON public.workout_schedule FOR DELETE
TO authenticated
USING (is_personal_of(auth.uid(), user_id));

-- workout_shares: personal can delete student's shares
CREATE POLICY "Personal can delete student workout shares"
ON public.workout_shares FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workout_plans wp
    WHERE wp.id = workout_plan_id
      AND is_personal_of(auth.uid(), wp.user_id)
  )
);

-- workout_share_invites: personal can delete invites from student's shares
CREATE POLICY "Personal can delete student share invites"
ON public.workout_share_invites FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workout_shares ws
    JOIN public.workout_plans wp ON wp.id = ws.workout_plan_id
    WHERE ws.id = share_id
      AND is_personal_of(auth.uid(), wp.user_id)
  )
);

-- workout_plan_revisions: personal can delete student's revisions
CREATE POLICY "Personal can delete student workout revisions"
ON public.workout_plan_revisions FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workout_plans wp
    WHERE wp.id = workout_plan_id
      AND is_personal_of(auth.uid(), wp.user_id)
  )
);

-- nutrition_plan_revisions: personal can delete student's nutrition revisions
CREATE POLICY "Personal can delete student nutrition revisions"
ON public.nutrition_plan_revisions FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.nutrition_plans np
    WHERE np.id = nutrition_plan_id
      AND is_personal_of(auth.uid(), np.user_id)
  )
);
