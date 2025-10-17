-- Create rate limits tracking table
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name text NOT NULL,
  call_count integer NOT NULL DEFAULT 0,
  reset_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, function_name)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_function ON public.api_rate_limits(user_id, function_name);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON public.api_rate_limits(reset_at);

-- Enable RLS
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own rate limits"
  ON public.api_rate_limits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits"
  ON public.api_rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to increment rate limit
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_user_id uuid,
  p_function_name text,
  p_limit integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count integer;
  v_reset_at timestamptz;
  v_limit_exceeded boolean := false;
BEGIN
  -- Get or create rate limit record
  SELECT call_count, reset_at INTO v_current_count, v_reset_at
  FROM api_rate_limits
  WHERE user_id = p_user_id AND function_name = p_function_name;

  -- If no record exists or reset time has passed, create/reset
  IF v_current_count IS NULL OR v_reset_at < now() THEN
    INSERT INTO api_rate_limits (user_id, function_name, call_count, reset_at)
    VALUES (p_user_id, p_function_name, 1, now() + interval '1 day')
    ON CONFLICT (user_id, function_name)
    DO UPDATE SET 
      call_count = 1,
      reset_at = now() + interval '1 day';
    
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', p_limit - 1,
      'reset_at', now() + interval '1 day'
    );
  END IF;

  -- Check if limit exceeded
  IF v_current_count >= p_limit THEN
    v_limit_exceeded := true;
  ELSE
    -- Increment counter
    UPDATE api_rate_limits
    SET call_count = call_count + 1
    WHERE user_id = p_user_id AND function_name = p_function_name;
    v_current_count := v_current_count + 1;
  END IF;

  RETURN jsonb_build_object(
    'allowed', NOT v_limit_exceeded,
    'remaining', GREATEST(0, p_limit - v_current_count),
    'reset_at', v_reset_at
  );
END;
$$;