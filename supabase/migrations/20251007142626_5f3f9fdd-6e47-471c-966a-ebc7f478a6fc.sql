-- Phase 1: Strengthen RLS Policies for All Sensitive Tables

-- ============================================================
-- PROFILES TABLE - Explicit policies with anonymous blocking
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can view only their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert only their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Block anonymous access to profiles"
ON profiles FOR ALL
TO anon
USING (false);

-- ============================================================
-- BODY_MEASUREMENTS TABLE - Split broad policy into specific ones
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their own body measurements" ON body_measurements;

CREATE POLICY "Users can view only their own measurements"
ON body_measurements FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert only their own measurements"
ON body_measurements FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own measurements"
ON body_measurements FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own measurements"
ON body_measurements FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Block anonymous access to measurements"
ON body_measurements FOR ALL
TO anon
USING (false);

-- ============================================================
-- PROGRESS_PHOTOS TABLE - Strengthen with explicit policies
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their own progress photos" ON progress_photos;

CREATE POLICY "Users can view only their own photos"
ON progress_photos FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert only their own photos"
ON progress_photos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own photos"
ON progress_photos FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own photos"
ON progress_photos FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Block anonymous access to photos"
ON progress_photos FOR ALL
TO anon
USING (false);

-- ============================================================
-- WORKOUT_SESSIONS TABLE - Strengthen with explicit policies
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their own workout sessions" ON workout_sessions;

CREATE POLICY "Users can view only their own sessions"
ON workout_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert only their own sessions"
ON workout_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own sessions"
ON workout_sessions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own sessions"
ON workout_sessions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Block anonymous access to sessions"
ON workout_sessions FOR ALL
TO anon
USING (false);

-- ============================================================
-- NUTRITION_PLANS TABLE - Strengthen with explicit policies
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their own nutrition plans" ON nutrition_plans;

CREATE POLICY "Users can view only their own nutrition plans"
ON nutrition_plans FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert only their own nutrition plans"
ON nutrition_plans FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own nutrition plans"
ON nutrition_plans FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own nutrition plans"
ON nutrition_plans FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Block anonymous access to nutrition plans"
ON nutrition_plans FOR ALL
TO anon
USING (false);

-- ============================================================
-- WORKOUT_PLANS TABLE - Strengthen with explicit policies
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their own workout plans" ON workout_plans;

CREATE POLICY "Users can view only their own workout plans"
ON workout_plans FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert only their own workout plans"
ON workout_plans FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own workout plans"
ON workout_plans FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own workout plans"
ON workout_plans FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Block anonymous access to workout plans"
ON workout_plans FOR ALL
TO anon
USING (false);

-- ============================================================
-- WORKOUT_SCHEDULE TABLE - Strengthen with explicit policies
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their own workout schedule" ON workout_schedule;

CREATE POLICY "Users can view only their own schedule"
ON workout_schedule FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert only their own schedule"
ON workout_schedule FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own schedule"
ON workout_schedule FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own schedule"
ON workout_schedule FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Block anonymous access to schedule"
ON workout_schedule FOR ALL
TO anon
USING (false);

-- ============================================================
-- USER_CHALLENGES TABLE - Strengthen with explicit policies
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their own challenge participation" ON user_challenges;

CREATE POLICY "Users can view only their own challenges"
ON user_challenges FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert only their own challenges"
ON user_challenges FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own challenges"
ON user_challenges FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own challenges"
ON user_challenges FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Block anonymous access to user challenges"
ON user_challenges FOR ALL
TO anon
USING (false);