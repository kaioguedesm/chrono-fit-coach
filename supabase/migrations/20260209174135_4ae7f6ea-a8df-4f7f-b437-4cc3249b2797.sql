-- Allow personal trainers to create nutrition plans for their students
CREATE POLICY "Personal trainers can create nutrition plans for students"
ON public.nutrition_plans
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'personal'
      AND user_roles.approved = true
  )
  AND EXISTS (
    SELECT 1 FROM personal_students
    WHERE personal_students.personal_id = auth.uid()
      AND personal_students.student_id = nutrition_plans.user_id
      AND personal_students.is_active = true
  )
);

-- Allow personal trainers to insert meals for their students' nutrition plans
CREATE POLICY "Personal trainers can manage meals for their students"
ON public.meals
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM nutrition_plans np
    JOIN personal_students ps ON ps.student_id = np.user_id
    WHERE np.id = meals.nutrition_plan_id
      AND ps.personal_id = auth.uid()
      AND ps.is_active = true
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
          AND user_roles.role = 'personal'
          AND user_roles.approved = true
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM nutrition_plans np
    JOIN personal_students ps ON ps.student_id = np.user_id
    WHERE np.id = meals.nutrition_plan_id
      AND ps.personal_id = auth.uid()
      AND ps.is_active = true
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
          AND user_roles.role = 'personal'
          AND user_roles.approved = true
      )
  )
);