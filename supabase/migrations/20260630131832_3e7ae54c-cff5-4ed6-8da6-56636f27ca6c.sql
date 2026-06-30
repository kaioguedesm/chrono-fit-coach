
-- 1. user_roles: drop self-update privilege escalation
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;

-- 2. user_terms_acceptance: scope personal trainer access to own students
DROP POLICY IF EXISTS "Personal trainers can view all terms acceptances" ON public.user_terms_acceptance;
CREATE POLICY "Personal trainers can view their students terms acceptances"
ON public.user_terms_acceptance
FOR SELECT
TO authenticated
USING (public.is_personal_of(auth.uid(), user_id));

-- 3. profiles: scope personal trainer access to own students
DROP POLICY IF EXISTS "Approved personal trainers can view all profiles" ON public.profiles;
CREATE POLICY "Personal trainers can view their students profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_personal_of(auth.uid(), user_id));

-- 4. nutrition_plans: scope personal trainer view to own students
DROP POLICY IF EXISTS "Approved personal trainers can view all nutrition plans" ON public.nutrition_plans;
CREATE POLICY "Personal trainers can view their students nutrition plans"
ON public.nutrition_plans
FOR SELECT
TO authenticated
USING (public.is_personal_of(auth.uid(), user_id));

-- 5. workout_plans: scope personal trainer view to own students
DROP POLICY IF EXISTS "Approved personal trainers can view all workout plans" ON public.workout_plans;
CREATE POLICY "Personal trainers can view their students workout plans"
ON public.workout_plans
FOR SELECT
TO authenticated
USING (public.is_personal_of(auth.uid(), user_id));

-- 6. nutrition_plan_revisions: scope to plan owner's trainer
DROP POLICY IF EXISTS "Personal trainers can manage nutrition revisions" ON public.nutrition_plan_revisions;
CREATE POLICY "Personal can view student nutrition revisions"
ON public.nutrition_plan_revisions
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.nutrition_plans np WHERE np.id = nutrition_plan_revisions.nutrition_plan_id AND public.is_personal_of(auth.uid(), np.user_id)));
CREATE POLICY "Personal can insert student nutrition revisions"
ON public.nutrition_plan_revisions
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.nutrition_plans np WHERE np.id = nutrition_plan_revisions.nutrition_plan_id AND public.is_personal_of(auth.uid(), np.user_id)));
CREATE POLICY "Personal can update student nutrition revisions"
ON public.nutrition_plan_revisions
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.nutrition_plans np WHERE np.id = nutrition_plan_revisions.nutrition_plan_id AND public.is_personal_of(auth.uid(), np.user_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.nutrition_plans np WHERE np.id = nutrition_plan_revisions.nutrition_plan_id AND public.is_personal_of(auth.uid(), np.user_id)));

-- 7. workout_plan_revisions
DROP POLICY IF EXISTS "Personal trainers can manage workout revisions" ON public.workout_plan_revisions;
CREATE POLICY "Personal can view student workout revisions"
ON public.workout_plan_revisions
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.workout_plans wp WHERE wp.id = workout_plan_revisions.workout_plan_id AND public.is_personal_of(auth.uid(), wp.user_id)));
CREATE POLICY "Personal can insert student workout revisions"
ON public.workout_plan_revisions
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.workout_plans wp WHERE wp.id = workout_plan_revisions.workout_plan_id AND public.is_personal_of(auth.uid(), wp.user_id)));
CREATE POLICY "Personal can update student workout revisions"
ON public.workout_plan_revisions
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.workout_plans wp WHERE wp.id = workout_plan_revisions.workout_plan_id AND public.is_personal_of(auth.uid(), wp.user_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.workout_plans wp WHERE wp.id = workout_plan_revisions.workout_plan_id AND public.is_personal_of(auth.uid(), wp.user_id)));

-- 8. Storage: drop public access to progress-photos bucket
DROP POLICY IF EXISTS "Progress photos are publicly accessible" ON storage.objects;

-- 9. Storage: restrict public-documents listing to known terms file
DROP POLICY IF EXISTS "Public documents are publicly accessible" ON storage.objects;
CREATE POLICY "Public terms document is publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'public-documents' AND name = 'Termo_de_Uso_Profissional_App_Fitnes.pdf');

-- 10. Revoke EXECUTE on internal SECURITY DEFINER helpers from regular users
REVOKE EXECUTE ON FUNCTION public.generate_share_token() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_pending_personal_signups() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_profile() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_pending_personal_signup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_workout_plan_refresh() FROM PUBLIC, anon, authenticated;

-- 11. Replace cron job to remove hardcoded anon key from runtime config
SELECT cron.unschedule('update-daily-recipes');
SELECT cron.schedule(
  'update-daily-recipes',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gztjiknpddlkcxuavoeg.supabase.co/functions/v1/update-daily-recipes',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
