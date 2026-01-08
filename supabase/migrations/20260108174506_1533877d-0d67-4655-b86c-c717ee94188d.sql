-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can manage rate limits" ON api_rate_limits;

-- Service role can manage all (for increment_rate_limit function which uses SECURITY DEFINER)
-- Note: Service role bypasses RLS by default, but this policy is explicit for documentation
CREATE POLICY "Service role manages rate limits"
  ON public.api_rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can only view their own rate limits
CREATE POLICY "Users view own rate limits"
  ON public.api_rate_limits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);