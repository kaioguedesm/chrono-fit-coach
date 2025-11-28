-- Fix search_path security issue in check_workout_plan_refresh function
CREATE OR REPLACE FUNCTION check_workout_plan_refresh()
RETURNS TRIGGER AS $$
BEGIN
  -- After completing a workout session, increment the counter
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    UPDATE workout_plans
    SET 
      workouts_completed_count = workouts_completed_count + 1,
      needs_refresh = CASE 
        WHEN (workouts_completed_count + 1) >= max_workouts_before_refresh THEN true
        ELSE needs_refresh
      END
    WHERE id = NEW.workout_plan_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;