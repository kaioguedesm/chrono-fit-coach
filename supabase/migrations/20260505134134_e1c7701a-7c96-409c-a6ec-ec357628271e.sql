CREATE POLICY "Personal can view student exercise sessions"
ON public.exercise_sessions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    WHERE ws.id = exercise_sessions.workout_session_id
      AND public.is_personal_of(auth.uid(), ws.user_id)
  )
);