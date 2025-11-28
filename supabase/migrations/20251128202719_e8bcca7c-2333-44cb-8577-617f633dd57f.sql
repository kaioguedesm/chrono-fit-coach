-- Add workout cycle tracking fields to workout_plans
ALTER TABLE workout_plans 
ADD COLUMN workouts_completed_count integer DEFAULT 0,
ADD COLUMN max_workouts_before_refresh integer DEFAULT 35,
ADD COLUMN needs_refresh boolean DEFAULT false,
ADD COLUMN last_refresh_date timestamp with time zone DEFAULT now();

-- Add index for better query performance
CREATE INDEX idx_workout_plans_needs_refresh ON workout_plans(user_id, needs_refresh) WHERE needs_refresh = true;

-- Function to check and update workout plan refresh status
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically track workout completion
CREATE TRIGGER trigger_check_workout_plan_refresh
AFTER UPDATE ON workout_sessions
FOR EACH ROW
EXECUTE FUNCTION check_workout_plan_refresh();

-- Add comments for documentation
COMMENT ON COLUMN workout_plans.workouts_completed_count IS 'Number of workouts completed with this plan';
COMMENT ON COLUMN workout_plans.max_workouts_before_refresh IS 'Maximum workouts before plan needs refresh (default 35)';
COMMENT ON COLUMN workout_plans.needs_refresh IS 'Flag indicating the plan needs to be updated/refreshed';
COMMENT ON COLUMN workout_plans.last_refresh_date IS 'Date when the plan was last refreshed';